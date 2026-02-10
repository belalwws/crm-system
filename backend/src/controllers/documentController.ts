import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logFileUploaded } from './activityController';
import { createAuditLog } from '../lib/auditLog';
import { AuthRequest } from '../types';
import fs from 'fs';
import path from 'path';
import logger from '../lib/logger';

// Upload directory
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Validate that a file path is within the uploads directory (prevents path traversal)
 */
function isPathSafe(filePath: string): boolean {
  const resolved = path.resolve(filePath);
  return resolved.startsWith(UPLOAD_DIR);
}

// Get documents for a customer or deal (with pagination)
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId, page = '1', limit = '20' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

    const where: any = { ownerId: userId, deletedAt: null };
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          customer: { select: { id: true, name: true } },
          deal: { select: { id: true, title: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    res.json({ success: true, data: documents, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

// Get a single document
export const getDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    res.json({ success: true, data: document });
  } catch (error) {
    logger.error('Error fetching document:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch document' });
  }
};

// Upload a document
export const uploadDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, type, size, url, customerId, dealId } = req.body;

    if (!name || !type || !url) {
      return res.status(400).json({ success: false, message: 'name, type, and url are required' });
    }

    // Validate URL path safety
    if (url.startsWith('/') || url.startsWith('..')) {
      if (!isPathSafe(path.join(UPLOAD_DIR, url))) {
        return res.status(400).json({ success: false, message: 'Invalid file path' });
      }
    }

    const document = await prisma.document.create({
      data: {
        ownerId: userId,
        name,
        type,
        size: size || 0,
        url,
        customerId: customerId || null,
        dealId: dealId || null,
      },
    });

    // Log activity
    if (customerId) {
      await logFileUploaded(userId, 'customer', customerId, name);
    } else if (dealId) {
      await logFileUploaded(userId, 'deal', dealId, name);
    }

    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'Document',
      entityId: document.id,
      entityName: name,
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

// Soft delete a document
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    await prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await createAuditLog({
      userId,
      action: 'DELETE',
      entityType: 'Document',
      entityId: id,
      entityName: document.name,
    });

    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ success: false, message: 'Failed to delete document' });
  }
};

// Handle file upload with multer
export const handleFileUpload = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const file = req.file;
    const { customerId, dealId } = req.body;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    const document = await prisma.document.create({
      data: {
        ownerId: userId,
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
        url: `/uploads/${file.filename}`,
        customerId: customerId || null,
        dealId: dealId || null,
      },
    });

    // Log activity
    if (customerId) {
      await logFileUploaded(userId, 'customer', customerId, file.originalname);
    } else if (dealId) {
      await logFileUploaded(userId, 'deal', dealId, file.originalname);
    }

    await createAuditLog({
      userId,
      action: 'CREATE',
      entityType: 'Document',
      entityId: document.id,
      entityName: file.originalname,
    });

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    logger.error('Error handling file upload:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};
