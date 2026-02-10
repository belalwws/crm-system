import Redis from 'ioredis';
import logger from './logger';

// Redis connection - falls back gracefully if unavailable
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let redisAvailable = false;

/**
 * Initialize Redis connection
 */
export const initRedis = (): Redis | null => {
  try {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn('Redis: max retries reached, operating without cache');
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on('connect', () => {
      redisAvailable = true;
      logger.info('Redis connected successfully');
    });

    redis.on('error', (err) => {
      redisAvailable = false;
      if (err.message?.includes('ECONNREFUSED')) {
        logger.debug('Redis not available, using in-memory fallback');
      } else {
        logger.warn('Redis error:', err.message);
      }
    });

    redis.on('close', () => {
      redisAvailable = false;
    });

    // Attempt connection
    redis.connect().catch(() => {
      logger.debug('Redis connection failed, cache disabled');
    });

    return redis;
  } catch {
    logger.debug('Redis init failed, cache disabled');
    return null;
  }
};

// In-memory fallback cache
const memoryCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * Get value from cache (Redis or in-memory fallback)
 */
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    if (redisAvailable && redis) {
      return await redis.get(key);
    }
    // Fallback to memory
    const item = memoryCache.get(key);
    if (item && item.expiresAt > Date.now()) {
      return item.value;
    }
    memoryCache.delete(key);
    return null;
  } catch {
    return null;
  }
};

/**
 * Set value in cache with TTL in seconds
 */
export const cacheSet = async (key: string, value: string, ttlSeconds: number = 300): Promise<void> => {
  try {
    if (redisAvailable && redis) {
      await redis.set(key, value, 'EX', ttlSeconds);
    } else {
      // Fallback to memory
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    }
  } catch {
    // silent
  }
};

/**
 * Delete cache key(s) matching pattern
 */
export const cacheDel = async (pattern: string): Promise<void> => {
  try {
    if (redisAvailable && redis) {
      if (pattern.includes('*')) {
        // Use SCAN instead of KEYS for production safety
        let cursor = '0';
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        } while (cursor !== '0');
      } else {
        await redis.del(pattern);
      }
    } else {
      // Fallback to memory
      if (pattern.includes('*')) {
        const prefix = pattern.replace('*', '');
        for (const key of memoryCache.keys()) {
          if (key.startsWith(prefix)) {
            memoryCache.delete(key);
          }
        }
      } else {
        memoryCache.delete(pattern);
      }
    }
  } catch {
    // silent
  }
};

/**
 * Cache middleware factory — caches GET endpoint response
 */
export const cacheMiddleware = (keyPrefix: string, ttlSeconds: number = 120) => {
  return async (req: any, res: any, next: any) => {
    if (req.method !== 'GET') return next();

    const userId = req.user?.id;
    if (!userId) return next();

    const cacheKey = `${keyPrefix}:${userId}:${req.originalUrl}`;

    try {
      const cached = await cacheGet(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.json(parsed);
      }
    } catch {
      // Continue without cache
    }

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 200) {
        cacheSet(cacheKey, JSON.stringify(body), ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
};

export const isRedisAvailable = () => redisAvailable;

export default redis;
