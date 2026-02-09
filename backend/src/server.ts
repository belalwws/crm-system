import express, { Request, Response, NextFunction } from 'express';
import 'express-async-errors'; // Must be imported before routes
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import prisma from './lib/prisma';
import logger from './lib/logger';
import { validateEnv } from './lib/validateEnv';
import { protect } from './middleware/auth';

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

// Initialize express app
const app = express();

// Security: Helmet for HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for uploads
}));

// Rate limiting: 100 requests per minute per IP
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Separate rate limiter for AI endpoints (lower limit)
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20, // 20 AI requests per minute
  message: { success: false, message: 'Too many AI requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/ai/', aiLimiter);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Body size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
      version: '3.0.0',
      database: 'PostgreSQL (connected)',
    });
  } catch {
    res.status(503).json({
      success: true,
      message: 'CRM API is running',
      version: '3.0.0',
      database: 'PostgreSQL (disconnected)',
    });
  }
});

// API Routes
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
    const server = app.listen(PORT, () => {
      logger.info('=================================');
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`API URL: http://localhost:${PORT}`);
      logger.info(`Database: PostgreSQL (Neon)`);
      logger.info('=================================');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
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
