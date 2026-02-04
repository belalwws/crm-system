import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import prisma from './lib/prisma';

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

// Load environment variables
dotenv.config();

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

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// Parse request bodies
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check route
app.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'CRM API is running',
    version: '1.0.0',
    database: 'PostgreSQL',
  });
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

// 404 Error handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Start server
const PORT = process.env.PORT || 5000;

// Test database connection and start server
prisma.$connect()
  .then(() => {
    console.log('✅ PostgreSQL Connected Successfully');
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 API URL: http://localhost:${PORT}`);
      console.log(`🗄️  Database: PostgreSQL (Neon)`);
      console.log('=================================');
    });
  })
  .catch((error) => {
    console.error('❌ PostgreSQL Connection Error:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
