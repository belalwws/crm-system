import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { Secret } from 'jsonwebtoken';
import { verifyToken } from '@clerk/backend';
import logger from './logger';
import prisma from './prisma';

let io: Server | null = null;

// Map userId -> Set of socket IDs
const userSockets = new Map<string, Set<string>>();

// Rate limiting for WebSocket connections
const connectionAttempts = new Map<string, { count: number; resetAt: number }>();
const WS_RATE_LIMIT = { maxConnections: 10, windowMs: 60000 }; // 10 connections per minute per IP

// Rate limiting for socket events
const eventCounts = new Map<string, { count: number; resetAt: number }>();
const WS_EVENT_LIMIT = { maxEvents: 60, windowMs: 60000 }; // 60 events per minute per user

function checkConnectionRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = connectionAttempts.get(ip);
  if (!record || now > record.resetAt) {
    connectionAttempts.set(ip, { count: 1, resetAt: now + WS_RATE_LIMIT.windowMs });
    return true;
  }
  record.count++;
  return record.count <= WS_RATE_LIMIT.maxConnections;
}

function checkEventRateLimit(userId: string): boolean {
  const now = Date.now();
  const record = eventCounts.get(userId);
  if (!record || now > record.resetAt) {
    eventCounts.set(userId, { count: 1, resetAt: now + WS_EVENT_LIMIT.windowMs });
    return true;
  }
  record.count++;
  return record.count <= WS_EVENT_LIMIT.maxEvents;
}

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (httpServer: HTTPServer): Server => {
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 10000,
  });

  // Rate limit connection attempts
  io.use(async (socket: Socket, next) => {
    const ip = socket.handshake.address || 'unknown';
    if (!checkConnectionRateLimit(ip)) {
      return next(new Error('Too many connection attempts. Please try again later.'));
    }
    next();
  });

  // Authenticate socket connections (supports both Clerk and local JWT)
  io.use(async (socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      // Peek at token to determine type
      const decoded = jwt.decode(token as string, { complete: true }) as any;
      if (!decoded || !decoded.payload) {
        return next(new Error('Invalid token format'));
      }

      const payload = decoded.payload;
      const isClerkToken = payload.sub && (payload.azp || payload.iss?.includes('clerk'));

      if (isClerkToken) {
        // Clerk token verification
        const clerkSecretKey = process.env.CLERK_SECRET_KEY;
        if (!clerkSecretKey) {
          return next(new Error('Server configuration error'));
        }
        const verifiedPayload = await verifyToken(token as string, { secretKey: clerkSecretKey });
        const clerkUserId = verifiedPayload.sub;

        // Look up or auto-create user
        let user = await prisma.user.findFirst({
          where: { id: clerkUserId },
          select: { id: true, email: true },
        });

        if (!user) {
          // Try by email from Clerk payload
          const email = (verifiedPayload as any).email ||
            (verifiedPayload as any).primary_email_address ||
            `${clerkUserId}@clerk.user`;
          user = await prisma.user.findFirst({
            where: { email },
            select: { id: true, email: true },
          });
        }

        (socket as any).userId = user?.id || clerkUserId;
        (socket as any).userEmail = user?.email || 'unknown';
        next();
      } else {
        // Local JWT verification
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          return next(new Error('Server configuration error'));
        }
        const verified = jwt.verify(token as string, secret as Secret) as { id: string; email: string };
        (socket as any).userId = verified.id;
        (socket as any).userEmail = verified.email;
        next();
      }
    } catch (err: any) {
      logger.warn(`Socket auth failed: ${err.message}`);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId as string;
    logger.info(`WebSocket connected: user=${userId}, socket=${socket.id}`);

    // Track user's sockets
    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle joining entity-specific rooms — verify ownership first
    socket.on('join:deal', async (dealId: string) => {
      if (!checkEventRateLimit(userId)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: dealId, ownerId: userId, deletedAt: null },
          select: { id: true },
        });
        if (deal) {
          socket.join(`deal:${dealId}`);
        } else {
          socket.emit('error', { message: 'Access denied to this deal' });
        }
      } catch {
        socket.emit('error', { message: 'Failed to verify deal access' });
      }
    });

    socket.on('leave:deal', (dealId: string) => {
      socket.leave(`deal:${dealId}`);
    });

    socket.on('join:customer', async (customerId: string) => {
      if (!checkEventRateLimit(userId)) {
        socket.emit('error', { message: 'Rate limit exceeded' });
        return;
      }
      try {
        const customer = await prisma.customer.findFirst({
          where: { id: customerId, ownerId: userId, deletedAt: null },
          select: { id: true },
        });
        if (customer) {
          socket.join(`customer:${customerId}`);
        } else {
          socket.emit('error', { message: 'Access denied to this customer' });
        }
      } catch {
        socket.emit('error', { message: 'Failed to verify customer access' });
      }
    });

    socket.on('leave:customer', (customerId: string) => {
      socket.leave(`customer:${customerId}`);
    });

    // Handle typing indicators (rate limited)
    socket.on('typing:start', (data: { entityType: string; entityId: string }) => {
      if (!checkEventRateLimit(userId)) return;
      socket.to(`${data.entityType}:${data.entityId}`).emit('typing:update', {
        userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (data: { entityType: string; entityId: string }) => {
      if (!checkEventRateLimit(userId)) return;
      socket.to(`${data.entityType}:${data.entityId}`).emit('typing:update', {
        userId,
        isTyping: false,
      });
    });

    socket.on('disconnect', () => {
      logger.info(`WebSocket disconnected: user=${userId}, socket=${socket.id}`);
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
        }
      }
    });
  });

  logger.info('WebSocket server initialized');
  return io;
};

/**
 * Get the Socket.IO server instance
 */
export const getIO = (): Server | null => io;

/**
 * Emit to a specific user (all their connected sockets)
 */
export const emitToUser = (userId: string, event: string, data: any): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit to all users watching a deal
 */
export const emitToDeal = (dealId: string, event: string, data: any): void => {
  if (io) {
    io.to(`deal:${dealId}`).emit(event, data);
  }
};

/**
 * Emit to all users watching a customer
 */
export const emitToCustomer = (customerId: string, event: string, data: any): void => {
  if (io) {
    io.to(`customer:${customerId}`).emit(event, data);
  }
};

/**
 * Broadcast to all connected users
 */
export const broadcast = (event: string, data: any): void => {
  if (io) {
    io.emit(event, data);
  }
};

/**
 * Get count of online users
 */
export const getOnlineUsers = (): string[] => {
  return Array.from(userSockets.keys());
};

export default { initializeSocket, getIO, emitToUser, emitToDeal, emitToCustomer, broadcast, getOnlineUsers };
