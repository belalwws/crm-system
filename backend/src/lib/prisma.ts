import { PrismaClient } from '@prisma/client';

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
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
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
        error?.code === 'P1001' ||
        error?.code === 'P1002';
      
      if (isLastAttempt || !isConnectionError) {
        throw error;
      }
      
      console.log(`Database connection attempt ${i + 1} failed, retrying in ${delay}ms...`);
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
