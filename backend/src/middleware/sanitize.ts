import { Request, Response, NextFunction } from 'express';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize middleware - strips XSS from all string fields in req.body
 * Runs AFTER JSON body parser but BEFORE route handlers.
 */
function sanitizeValue(value: any): any {
  if (typeof value === 'string') {
    return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim();
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      cleaned[k] = sanitizeValue(v);
    }
    return cleaned;
  }
  return value;
}

/**
 * Sanitize HTML in email body fields - allows basic formatting but strips scripts
 */
function sanitizeHtml(value: string): string {
  return DOMPurify.sanitize(value, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'br', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'pre', 'code', 'span', 'div'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
  });
}

export const sanitizeBody = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    // Special handling for email body - allow HTML
    const emailBody = req.body.body;
    req.body = sanitizeValue(req.body);
    // Restore HTML-safe email body if this is an email endpoint
    if (emailBody && req.path.includes('/emails/')) {
      req.body.body = sanitizeHtml(emailBody);
    }
  }
  next();
};

/**
 * Allowed file types for document uploads
 */
export const ALLOWED_FILE_TYPES = new Set([
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  // SVG removed: can contain embedded JavaScript (XSS risk)
  // Archives
  'application/zip',
  'application/x-rar-compressed',
]);

export const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv',
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  // .svg removed: can contain embedded JavaScript (XSS risk)
  '.zip', '.rar',
]);

export const validateFileType = (req: Request, res: Response, next: NextFunction) => {
  if (!req.file) return next();

  const ext = '.' + (req.file.originalname.split('.').pop()?.toLowerCase() || '');
  const mime = req.file.mimetype;

  if (!ALLOWED_FILE_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
    res.status(400).json({
      success: false,
      message: `File type not allowed. Allowed types: PDF, Word, Excel, PowerPoint, images, text, CSV, ZIP`,
    });
    return;
  }

  // Max size check (10MB)
  if (req.file.size > 10 * 1024 * 1024) {
    res.status(400).json({
      success: false,
      message: 'File too large. Maximum size is 10MB.',
    });
    return;
  }

  next();
};
