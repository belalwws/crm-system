import { PrismaClient } from '@prisma/client';
import logger from './logger';

/**
 * Prisma Client Singleton with Retry Logic for Neon
 * يتعامل مع حالات قطع الاتصال وإعادة المحاولة
 */

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL,
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// --- Keepalive: prevent Neon from closing idle connections ---
const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
let keepaliveTimer: ReturnType<typeof setInterval> | null = null;

export function startKeepAlive() {
  if (keepaliveTimer) return;
  keepaliveTimer = setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch (err) {
      logger.warn('Keepalive ping failed, attempting reconnect...', err);
      try {
        await prisma.$disconnect();
        await prisma.$connect();
        logger.info('Prisma reconnected after keepalive failure');
      } catch {
        logger.error('Prisma reconnect failed during keepalive');
      }
    }
  }, KEEPALIVE_INTERVAL_MS);
}

export function stopKeepAlive() {
  if (keepaliveTimer) {
    clearInterval(keepaliveTimer);
    keepaliveTimer = null;
  }
}

/**
 * Helper function to execute Prisma queries with retry
 * للتعامل مع Neon database cold starts
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      const isLastAttempt = i === retries - 1;
      const isConnectionError = 
        error?.message?.includes("Can't reach database") ||
        error?.message?.includes("Connection") ||
        error?.message?.includes("Closed") ||
        error?.code === 'P1001' ||
        error?.code === 'P1002' ||
        error?.code === 'P1017' ||
        error?.code === 'P2024';
      
      if (isLastAttempt || !isConnectionError) {
        throw error;
      }
      
      logger.warn(`Database connection attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Try to reconnect
      try {
        await prisma.$disconnect();
        await prisma.$connect();
      } catch {
        // Ignore reconnection errors
      }
    }
  }
  throw new Error('Max retries reached');
}

export default prisma;
