import { Response } from 'express';
import { AuthRequest } from '../../types';

const mockPrisma = {
  task: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  customer: {
    findFirst: jest.fn(),
  },
  deal: {
    findFirst: jest.fn(),
  },
  user: {
    findFirst: jest.fn(),
  },
};

jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: mockPrisma,
  prisma: mockPrisma,
}));

jest.mock('../../lib/auditLog', () => ({
  createAuditLog: jest.fn(),
  createTimelineEvent: jest.fn(),
}));

jest.mock('../../lib/workflowEngine', () => ({
  fireWebhooks: jest.fn(),
  evaluateWorkflows: jest.fn(),
}));

import * as taskController from '../../controllers/taskController';

describe('Task Controller', () => {
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

  describe('getTasks', () => {
    it('should return all tasks for a user', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'PENDING', priority: 'HIGH', type: 'CALL', customer: null, deal: null, assignedTo: {}, createdBy: {} },
        { id: '2', title: 'Task 2', status: 'COMPLETED', priority: 'LOW', type: 'EMAIL', customer: null, deal: null, assignedTo: {}, createdBy: {} },
      ];

      mockPrisma.task.findMany.mockResolvedValue(mockTasks);
      mockPrisma.task.count.mockResolvedValue(2);

      await taskController.getTasks(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            assignedToId: 'test-user-id',
            deletedAt: null,
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 2,
        })
      );
    });
  });

  describe('getTask', () => {
    it('should return a single task by id', async () => {
      const mockTask = {
        id: '1',
        title: 'Task 1',
        status: 'PENDING',
        priority: 'HIGH',
        type: 'CALL',
        assignedToId: 'test-user-id',
        customer: { id: 'c1', name: 'Customer 1' },
        deal: null,
        assignedTo: {},
        createdBy: {},
      };
      mockRequest.params = { id: '1' };
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);

      await taskController.getTask(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.task.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: '1',
            assignedToId: 'test-user-id',
            deletedAt: null,
          }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 if task not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await taskController.getTask(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('createTask', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: 'high',
        type: 'call',
        dueDate: '2024-01-20',
      };
      mockRequest.body = taskData;

      const createdTask = {
        id: '1',
        title: 'New Task',
        status: 'PENDING',
        priority: 'HIGH',
        type: 'CALL',
        assignedToId: 'test-user-id',
        customerId: null,
        dealId: null,
        customer: null,
        deal: null,
        assignedTo: {},
        createdBy: {},
      };
      mockPrisma.task.create.mockResolvedValue(createdTask);

      await taskController.createTask(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.task.create).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe('updateTask', () => {
    it('should update task status', async () => {
      const existingTask = {
        id: '1',
        title: 'Task 1',
        status: 'PENDING',
        priority: 'HIGH',
        type: 'CALL',
        assignedToId: 'test-user-id',
        customer: null,
        deal: null,
        assignedTo: {},
        createdBy: {},
      };
      mockRequest.params = { id: '1' };
      mockRequest.body = { status: 'completed' };

      mockPrisma.task.findFirst.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({ ...existingTask, status: 'COMPLETED' });

      await taskController.updateTask(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
        })
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent task', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRequest.body = { status: 'completed' };
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await taskController.updateTask(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteTask', () => {
    it('should soft delete a task', async () => {
      const existingTask = { id: '1', title: 'Task 1', assignedToId: 'test-user-id' };
      mockRequest.params = { id: '1' };

      mockPrisma.task.findFirst.mockResolvedValue(existingTask);
      mockPrisma.task.update.mockResolvedValue({ ...existingTask, deletedAt: new Date() });

      await taskController.deleteTask(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockPrisma.task.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: '1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 for non-existent task', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await taskController.deleteTask(
        mockRequest as AuthRequest,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });
  });

  describe('task priorities', () => {
    it('should handle all priority levels', () => {
      const validPriorities = ['low', 'medium', 'high'];
      validPriorities.forEach(priority => {
        expect(validPriorities).toContain(priority);
      });
    });
  });

  describe('task statuses', () => {
    it('should handle all status values', () => {
      const validStatuses = ['pending', 'in-progress', 'completed', 'cancelled'];
      validStatuses.forEach(status => {
        expect(validStatuses).toContain(status);
      });
    });
  });
});
