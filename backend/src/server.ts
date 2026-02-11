import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors'; // Must be imported before routes
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { createServer } from 'http';
import path from 'path';
import prisma from './lib/prisma';
import logger from './lib/logger';
import { validateEnv } from './lib/validateEnv';
import { protect } from './middleware/auth';
import { sanitizeBody } from './middleware/sanitize';
import { initializeSocket } from './lib/socket';
import { initRedis } from './lib/redis';
import { initWorkers, shutdownWorkers } from './lib/queue';
import { apiVersionResponseHeader, apiInfo } from './lib/apiVersion';
import { metricsMiddleware, metricsHandler } from './lib/monitoring';

// Load environment variables
dotenv.config();

// Validate required environment variables
const env = validateEnv();

// Import routes
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import dealRoutes from './routes/dealRoutes';
import taskRoutes from './routes/taskRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import notificationRoutes from './routes/notificationRoutes';
import activityRoutes from './routes/activityRoutes';
import emailRoutes from './routes/emailRoutes';
import documentRoutes from './routes/documentRoutes';
import noteRoutes from './routes/noteRoutes';
import meetingRoutes from './routes/meetingRoutes';
import aiRoutes from './routes/aiRoutes';
import timelineRoutes from './routes/timelineRoutes';
import searchRoutes from './routes/searchRoutes';
import reportRoutes from './routes/reportRoutes';
import workflowRoutes from './routes/workflowRoutes';
import auditLogRoutes from './routes/auditLogRoutes';
import webhookRoutes from './routes/webhookRoutes';
import adminRoutes from './routes/adminRoutes';
import profileRoutes from './routes/profileRoutes';
import bulkRoutes from './routes/bulkRoutes';
import exportRoutes from './routes/exportRoutes';
import importRoutes from './routes/importRoutes';
import contactRoutes from './routes/contactRoutes';
import productRoutes from './routes/productRoutes';
import quoteRoutes from './routes/quoteRoutes';
import teamRoutes from './routes/teamRoutes';
import customFieldRoutes from './routes/customFieldRoutes';

// Initialize express app
const app = express();

// Security: Helmet for HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for uploads
}));

// Gzip/Brotli compression for all responses
app.use(compression());

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Strict rate limiter for auth endpoints (brute force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: { success: false, message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Separate rate limiter for AI endpoints (lower limit)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many AI requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/ai/', aiLimiter);

// Strict rate limiter for sensitive endpoints
const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/profile/change-password', sensitiveLimiter);
app.use('/api/bulk/', sensitiveLimiter);
app.use('/api/admin/', sensitiveLimiter);

// CORS configuration - supports comma-separated origins in FRONTEND_URL
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map(o => o.trim());

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
};
app.use(cors(corsOptions));

// Cookie parser (required for CSRF)
const csrfSecret = process.env.CSRF_SECRET || process.env.JWT_SECRET;
if (!csrfSecret && process.env.NODE_ENV === 'production') {
  throw new Error('CSRF_SECRET or JWT_SECRET must be set in production');
}
app.use(cookieParser(csrfSecret || 'csrf-secret-dev-only'));

// CSRF Protection (double-submit cookie pattern)
const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
  getSecret: () => csrfSecret || 'csrf-secret-dev-only',
  getSessionIdentifier: (req: Request) => req.headers['authorization'] as string || 'anonymous',
  cookieName: '__csrf',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  getCsrfTokenFromRequest: (req: Request) => req.headers['x-csrf-token'] as string,
});

// CSRF token endpoint (GET requests are safe, return token for SPAs)
app.get('/api/csrf-token', (req: Request, res: Response) => {
  const token = generateCsrfToken(req, res);
  res.json({ success: true, token });
});

// Apply CSRF protection to state-changing routes only
// Skip for Bearer-token-only APIs (mobile clients / service-to-service)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET, HEAD, OPTIONS (safe methods)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  // Skip CSRF for API requests that use Bearer tokens (SPA clients)
  // CSRF is mainly needed for cookie-based auth; Bearer tokens are immune to CSRF
  if (req.headers.authorization?.startsWith('Bearer')) {
    return next();
  }
  // Apply CSRF for cookie-based auth
  doubleCsrfProtection(req, res, next);
});

// Body size limits (1mb default; uploads use multer with own limits)
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// XSS Sanitization - strip malicious HTML from all request bodies
app.use(sanitizeBody);

// API Version header on all responses
app.use(apiVersionResponseHeader);

// Performance monitoring
app.use(metricsMiddleware);

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/' && !req.path.includes('favicon')) {
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// Serve uploaded files (authenticated)
app.use('/uploads', protect, express.static(path.join(__dirname, '../uploads')));

// Health check route (includes DB check)
app.get('/', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'CRM API is running',
      version: '4.0.0',
      database: 'PostgreSQL (connected)',
    });
  } catch {
    res.status(503).json({
      success: false,
      message: 'CRM API is degraded',
      version: '4.0.0',
      database: 'PostgreSQL (disconnected)',
    });
  }
});

// API Routes
app.get('/api/info', apiInfo);
app.get('/api/metrics', protect, metricsHandler);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/import', importRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/custom-fields', customFieldRoutes);

// 404 Error handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler (must have 4 params)
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack, path: req.path, method: req.method });
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// Start server
const PORT = env.PORT;

// Test database connection and start server
prisma.$connect()
  .then(() => {
    logger.info('PostgreSQL Connected Successfully');

    // Initialize Redis cache (optional — graceful fallback)
    initRedis();

    // Initialize job queue workers (optional — graceful fallback)
    initWorkers();

    // Create HTTP server and attach Socket.IO
    const httpServer = createServer(app);
    const io = initializeSocket(httpServer);

    const server = httpServer.listen(PORT, () => {
      logger.info('=================================');
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API URL: http://localhost:${PORT}`);
      logger.info(`WebSocket: ws://localhost:${PORT}`);
      logger.info(`Database: PostgreSQL (Neon)`);
      logger.info('=================================');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      io.close();
      await shutdownWorkers();
      server.close(async () => {
        logger.info('HTTP server closed');
        await prisma.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      });
      // Force exit after 10s
      setTimeout(() => {
        logger.error('Forced exit after 10s timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  })
  .catch((error) => {
    logger.error('PostgreSQL Connection Error:', error);
    process.exit(1);
  });

export default app;
