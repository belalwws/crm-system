import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  document: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/auditLog', () => ({
  createAuditLog: jest.fn(),
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn() },
}));

jest.mock('../../controllers/activityController', () => ({
  logFileUploaded: jest.fn(),
}));

import { getDocuments, getDocument, uploadDocument } from '../../controllers/documentController';

describe('Document Controller', () => {
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

  describe('getDocuments', () => {
    it('should return documents for owner', async () => {
      const docs = [{ id: 'd1', name: 'Contract.pdf' }];
      mockPrisma.document.findMany.mockResolvedValue(docs);
      mockPrisma.document.count.mockResolvedValue(1);

      await getDocuments(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, data: docs, total: 1 }),
      );
    });

    it('should filter by customerId', async () => {
      req.query = { customerId: 'c1' };
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.document.count.mockResolvedValue(0);

      await getDocuments(req as AuthRequest, res as Response);
      expect(mockPrisma.document.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ customerId: 'c1' }),
        }),
      );
    });
  });

  describe('getDocument', () => {
    it('should return a single document', async () => {
      req.params = { id: 'd1' };
      mockPrisma.document.findFirst.mockResolvedValue({ id: 'd1', name: 'Contract.pdf' });

      await getDocument(req as AuthRequest, res as Response);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 404 if not found', async () => {
      req.params = { id: 'missing' };
      mockPrisma.document.findFirst.mockResolvedValue(null);

      await getDocument(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('uploadDocument', () => {
    it('should create a document with valid data', async () => {
      req.body = { name: 'File.pdf', type: 'application/pdf', url: 'https://cdn.example.com/file.pdf' };
      mockPrisma.document.create.mockResolvedValue({ id: 'd1', name: 'File.pdf' });

      await uploadDocument(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should reject without required fields', async () => {
      req.body = { name: 'File.pdf' };
      await uploadDocument(req as AuthRequest, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
