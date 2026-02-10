import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { protect } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { validateFileType } from '../middleware/sanitize';
import { uploadDocumentSchema } from '../lib/validators';
import {
  getDocuments,
  getDocument,
  uploadDocument,
  deleteDocument,
  handleFileUpload,
} from '../controllers/documentController';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

const router = Router();

// All routes require authentication
router.use(protect);

// GET /api/documents - Get all documents
router.get('/', getDocuments);

// GET /api/documents/:id - Get single document
router.get('/:id', getDocument);

// POST /api/documents - Create document (URL-based)
router.post('/', validate(uploadDocumentSchema), uploadDocument);

// POST /api/documents/upload - Upload file
router.post('/upload', upload.single('file'), validateFileType, handleFileUpload);

// DELETE /api/documents/:id - Delete document
router.delete('/:id', deleteDocument);

export default router;
