import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  product: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

import { getProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../../controllers/productController';

describe('Product Controller', () => {
  let req: Partial<AuthRequest>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-1', email: 'test@test.com' },
      query: {},
      params: {},
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getProducts', () => {
    it('should return products for owner', async () => {
      const products = [{ id: 'p1', name: 'Widget', ownerId: 'user-1' }];
      mockPrisma.product.findMany.mockResolvedValue(products);

      await getProducts(req as AuthRequest, res as Response);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ ownerId: 'user-1' }) }),
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, data: products, total: 1 });
    });

    it('should filter by search query', async () => {
      req.query = { search: 'Widget' };
      mockPrisma.product.findMany.mockResolvedValue([]);

      await getProducts(req as AuthRequest, res as Response);
      expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ OR: expect.any(Array) }) }),
      );
    });

    it('should handle errors', async () => {
      mockPrisma.product.findMany.mockRejectedValue(new Error('DB error'));
      await getProducts(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getProduct', () => {
    it('should return a single product', async () => {
      req.params = { id: 'p1' };
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'p1', name: 'Widget' });

      await getProduct(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 'p1', name: 'Widget' } });
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await getProduct(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createProduct', () => {
    it('should create product with required fields', async () => {
      req.body = { name: 'New Widget', unitPrice: 9.99 };
      mockPrisma.product.create.mockResolvedValue({ id: 'p2', name: 'New Widget' });

      await createProduct(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject without name', async () => {
      req.body = {};
      await createProduct(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', async () => {
      req.params = { id: 'p1' };
      req.body = { name: 'Updated' };
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.product.update.mockResolvedValue({ id: 'p1', name: 'Updated' });

      await updateProduct(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if product not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await updateProduct(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteProduct', () => {
    it('should delete an existing product', async () => {
      req.params = { id: 'p1' };
      mockPrisma.product.findFirst.mockResolvedValue({ id: 'p1' });
      mockPrisma.product.delete.mockResolvedValue({});

      await deleteProduct(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.product.findFirst.mockResolvedValue(null);

      await deleteProduct(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
