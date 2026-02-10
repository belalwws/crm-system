import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Simple APM/Monitoring module
 * Tracks request metrics, error rates, and performance
 */

interface RequestMetrics {
  totalRequests: number;
  totalErrors: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  requestsPerMinute: number;
  statusCodes: Record<number, number>;
  slowEndpoints: Array<{ path: string; avgMs: number; count: number }>;
  startedAt: Date;
}

// In-memory metrics storage
const responseTimes: number[] = [];
const endpointTimes: Map<string, number[]> = new Map();
const statusCounts: Record<number, number> = {};
let totalRequests = 0;
let totalErrors = 0;
const startedAt = new Date();

// Keep last 1000 response times for percentile calculations
const MAX_SAMPLES = 1000;

const MAX_ENDPOINTS = 200;

/**
 * Middleware to track request performance
 */
export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    const routePath = req.route?.path;
    // Only track known routes to prevent unbounded memory growth from bot/scanner paths
    if (!routePath) {
      totalRequests++;
      responseTimes.push(durationMs);
      if (responseTimes.length > MAX_SAMPLES) responseTimes.shift();
      statusCounts[res.statusCode] = (statusCounts[res.statusCode] || 0) + 1;
      if (res.statusCode >= 500) totalErrors++;
      return;
    }
    const path = `${req.method} ${routePath}`;

    totalRequests++;

    // Track response times
    responseTimes.push(durationMs);
    if (responseTimes.length > MAX_SAMPLES) responseTimes.shift();

    // Track per-endpoint
    if (!endpointTimes.has(path)) endpointTimes.set(path, []);
    const times = endpointTimes.get(path)!;
    times.push(durationMs);
    if (times.length > 100) times.shift();

    // Track status codes
    statusCounts[res.statusCode] = (statusCounts[res.statusCode] || 0) + 1;

    // Track errors
    if (res.statusCode >= 500) {
      totalErrors++;
    }

    // Log slow requests (> 2s)
    if (durationMs > 2000) {
      logger.warn(`Slow request: ${path} took ${durationMs.toFixed(0)}ms`);
    }
  });

  next();
};

/**
 * Calculate percentile from sorted array
 */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

/**
 * Get current metrics
 */
export const getMetrics = (): RequestMetrics => {
  const sorted = [...responseTimes].sort((a, b) => a - b);
  const avgResponseTime = sorted.length > 0
    ? sorted.reduce((a, b) => a + b, 0) / sorted.length
    : 0;

  const uptimeMs = Date.now() - startedAt.getTime();
  const uptimeMinutes = uptimeMs / 60000;
  const requestsPerMinute = uptimeMinutes > 0 ? totalRequests / uptimeMinutes : 0;

  // Get slowest endpoints
  const slowEndpoints: Array<{ path: string; avgMs: number; count: number }> = [];
  endpointTimes.forEach((times, path) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    slowEndpoints.push({ path, avgMs: Math.round(avg), count: times.length });
  });
  slowEndpoints.sort((a, b) => b.avgMs - a.avgMs);

  return {
    totalRequests,
    totalErrors,
    avgResponseTime: Math.round(avgResponseTime),
    p95ResponseTime: Math.round(percentile(sorted, 95)),
    requestsPerMinute: Math.round(requestsPerMinute * 10) / 10,
    statusCodes: { ...statusCounts },
    slowEndpoints: slowEndpoints.slice(0, 10),
    startedAt,
  };
};

/**
 * Metrics endpoint handler
 */
export const metricsHandler = (req: Request, res: Response) => {
  const metrics = getMetrics();
  const uptimeMs = Date.now() - startedAt.getTime();

  res.json({
    success: true,
    data: {
      ...metrics,
      uptime: {
        ms: uptimeMs,
        hours: Math.round(uptimeMs / 3600000 * 10) / 10,
        formatted: formatUptime(uptimeMs),
      },
      memory: {
        rss: formatBytes(process.memoryUsage().rss),
        heapUsed: formatBytes(process.memoryUsage().heapUsed),
        heapTotal: formatBytes(process.memoryUsage().heapTotal),
        external: formatBytes(process.memoryUsage().external),
      },
      errorRate: totalRequests > 0
        ? `${((totalErrors / totalRequests) * 100).toFixed(2)}%`
        : '0%',
    },
  });
};

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return `${val.toFixed(1)} ${units[idx]}`;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h ${m % 60}m`;
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m ${s % 60}s`;
}
