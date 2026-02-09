import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { logFileUploaded } from './activityController';
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

// Get documents for a customer or deal
export const getDocuments = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { customerId, dealId } = req.query;

    const where: any = { ownerId: userId };
    if (customerId) where.customerId = customerId;
    if (dealId) where.dealId = dealId;

    const documents = await prisma.document.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    });

    res.json({ success: true, data: documents });
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
      where: { id, ownerId: userId },
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

    res.status(201).json({ success: true, data: document });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ success: false, message: 'Failed to upload document' });
  }
};

// Delete a document
export const deleteDocument = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const document = await prisma.document.findFirst({
      where: { id, ownerId: userId },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from disk if it's a local file
    if (document.url.startsWith('/uploads/')) {
      const filePath = path.resolve(UPLOAD_DIR, path.basename(document.url));
      if (isPathSafe(filePath) && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await prisma.document.delete({
      where: { id },
    });

    res.json({ success: true });
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

    res.status(201).json(document);
  } catch (error) {
    logger.error('Error handling file upload:', error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
};
