import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  note: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
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

// Mock activity and audit log
jest.mock('../../controllers/activityController', () => ({
  logNoteAdded: jest.fn(),
}));
jest.mock('../../lib/auditLog', () => ({
  createAuditLog: jest.fn(),
}));

import * as noteController from '../../controllers/noteController';

describe('Note Controller', () => {
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

  describe('getNotes', () => {
    it('should return notes for an entity', async () => {
      mockRequest.query = { entityType: 'customer', entityId: 'cust-1' };
      const mockNotes = [
        { id: '1', content: 'Follow up needed', pinned: false, createdBy: { name: 'User 1' } },
        { id: '2', content: 'VIP customer', pinned: true, createdBy: { name: 'User 1' } },
      ];

      mockPrisma.note.findMany.mockResolvedValue(mockNotes);

      await noteController.getNotes(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.note.findMany).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });
  });

  describe('createNote', () => {
    it('should create a new note', async () => {
      mockRequest.body = {
        content: 'Important note',
        entityType: 'customer',
        entityId: 'cust-1',
      };
      const mockNote = {
        id: 'note-1',
        content: 'Important note',
        entityType: 'customer',
        entityId: 'cust-1',
        createdById: 'test-user-id',
      };

      mockPrisma.note.create.mockResolvedValue(mockNote);

      await noteController.createNote(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.note.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            content: 'Important note',
            createdById: 'test-user-id',
          }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if content missing', async () => {
      mockRequest.body = { entityType: 'customer', entityId: 'cust-1' };

      await noteController.createNote(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateNote', () => {
    it('should update an existing note', async () => {
      mockRequest.params = { id: 'note-1' };
      mockRequest.body = { content: 'Updated content' };
      const existingNote = { id: 'note-1', createdById: 'test-user-id', content: 'Old content' };
      mockPrisma.note.findFirst.mockResolvedValue(existingNote);
      mockPrisma.note.update.mockResolvedValue({ ...existingNote, content: 'Updated content' });

      await noteController.updateNote(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'note-1' },
          data: expect.objectContaining({ content: 'Updated content' }),
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if note not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { content: 'Updated content' };
      mockPrisma.note.findFirst.mockResolvedValue(null);

      await noteController.updateNote(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteNote', () => {
    it('should delete a note', async () => {
      mockRequest.params = { id: 'note-1' };
      const existingNote = { id: 'note-1', createdById: 'test-user-id' };
      mockPrisma.note.findFirst.mockResolvedValue(existingNote);
      mockPrisma.note.delete.mockResolvedValue(existingNote);

      await noteController.deleteNote(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.note.delete).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'note-1' } })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe('togglePinNote', () => {
    it('should toggle note pin status', async () => {
      mockRequest.params = { id: 'note-1' };
      const existingNote = { id: 'note-1', createdById: 'test-user-id', pinned: false };
      mockPrisma.note.findFirst.mockResolvedValue(existingNote);
      mockPrisma.note.update.mockResolvedValue({ ...existingNote, pinned: true });

      await noteController.togglePinNote(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.note.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'note-1' },
          data: { pinned: true },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});
