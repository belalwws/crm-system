import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  contact: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

import * as contactController from '../../controllers/contactController';

describe('Contact Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      user: { id: 'test-user-id', email: 'test@test.com' },
      query: {},
      params: {},
      body: {},
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe('getContacts', () => {
    it('should return contacts for the user', async () => {
      const mockContacts = [
        { id: '1', firstName: 'John', lastName: 'Doe', email: 'john@test.com', customer: {} },
        { id: '2', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com', customer: {} },
      ];

      mockPrisma.contact.findMany.mockResolvedValue(mockContacts);

      await contactController.getContacts(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.contact.findMany).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('getContact', () => {
    it('should return a single contact', async () => {
      mockRequest.params = { id: 'contact-1' };
      const mockContact = { id: 'contact-1', firstName: 'John', lastName: 'Doe', ownerId: 'test-user-id', customer: {} };
      mockPrisma.contact.findFirst.mockResolvedValue(mockContact);

      await contactController.getContact(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 404 if contact not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await contactController.getContact(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createContact', () => {
    it('should create a new contact', async () => {
      mockRequest.body = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@test.com',
        customerId: 'cust-1',
      };
      const mockContact = {
        id: 'contact-1',
        ...mockRequest.body,
        ownerId: 'test-user-id',
        customer: { id: 'cust-1', name: 'Test Customer' },
      };
      mockPrisma.contact.create.mockResolvedValue(mockContact);

      await contactController.createContact(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.contact.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateContact', () => {
    it('should update an existing contact', async () => {
      mockRequest.params = { id: 'contact-1' };
      mockRequest.body = { firstName: 'Updated' };
      const existing = { id: 'contact-1', ownerId: 'test-user-id', firstName: 'John' };
      mockPrisma.contact.findFirst.mockResolvedValue(existing);
      mockPrisma.contact.update.mockResolvedValue({ ...existing, firstName: 'Updated', customer: {} });

      await contactController.updateContact(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.contact.update).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('should return 404 if contact not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { firstName: 'Updated' };
      mockPrisma.contact.findFirst.mockResolvedValue(null);

      await contactController.updateContact(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteContact', () => {
    it('should delete a contact', async () => {
      mockRequest.params = { id: 'contact-1' };
      const existing = { id: 'contact-1', ownerId: 'test-user-id' };
      mockPrisma.contact.findFirst.mockResolvedValue(existing);
      mockPrisma.contact.delete.mockResolvedValue(existing);

      await contactController.deleteContact(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.contact.delete).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });
});
