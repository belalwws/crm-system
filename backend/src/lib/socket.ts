import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt, { Secret } from 'jsonwebtoken';
import logger from './logger';

let io: Server | null = null;

// Map userId -> Set of socket IDs
const userSockets = new Map<string, Set<string>>();

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (httpServer: HTTPServer): Server => {
  const envOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
  const PRODUCTION_FRONTEND = 'https://crm-system-weld.vercel.app';
  const allowedOrigins = [...new Set([...envOrigins, PRODUCTION_FRONTEND])];

  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 10000,
  });

  // Authenticate socket connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error('Server configuration error'));
      }
      const decoded = jwt.verify(token as string, secret as Secret) as { id: string; email: string };
      (socket as any).userId = decoded.id;
      (socket as any).userEmail = decoded.email;
      next();
    } catch {
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

    // Handle joining entity-specific rooms
    socket.on('join:deal', (dealId: string) => {
      socket.join(`deal:${dealId}`);
    });

    socket.on('leave:deal', (dealId: string) => {
      socket.leave(`deal:${dealId}`);
    });

    socket.on('join:customer', (customerId: string) => {
      socket.join(`customer:${customerId}`);
    });

    socket.on('leave:customer', (customerId: string) => {
      socket.leave(`customer:${customerId}`);
    });

    // Handle typing indicators
    socket.on('typing:start', (data: { entityType: string; entityId: string }) => {
      socket.to(`${data.entityType}:${data.entityId}`).emit('typing:update', {
        userId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', (data: { entityType: string; entityId: string }) => {
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
