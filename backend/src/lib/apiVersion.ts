import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * API Version: Current latest = v1
 * 
 * Middleware to handle API versioning via:
 * - URL prefix: /api/v1/customers
 * - Header: X-API-Version: 1
 * 
 * Currently all routes are v1. When v2 is introduced, 
 * this middleware can route to different controllers.
 */

export const API_VERSIONS = ['v1'] as const;
export type ApiVersion = (typeof API_VERSIONS)[number];
export const CURRENT_VERSION: ApiVersion = 'v1';

/**
 * Middleware to extract API version from request
 */
export const apiVersionMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  // Check header first
  const headerVersion = req.headers['x-api-version'];
  if (headerVersion) {
    (req as any).apiVersion = `v${headerVersion}`;
  }

  // Check URL path (e.g., /api/v1/customers)
  const pathMatch = req.path.match(/^\/v(\d+)\//);
  if (pathMatch) {
    (req as any).apiVersion = `v${pathMatch[1]}`;
  }

  // Default to current version
  if (!(req as any).apiVersion) {
    (req as any).apiVersion = CURRENT_VERSION;
  }

  next();
};

/**
 * Middleware to add version info to response headers
 */
export const apiVersionResponseHeader = (_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-API-Version', CURRENT_VERSION);
  res.setHeader('X-API-Deprecation', 'false');
  next();
};

/**
 * Health check endpoint with version info
 */
export const apiInfo = (_req: Request, res: Response) => {
  res.json({
    name: 'Nexus CRM API',
    version: CURRENT_VERSION,
    supportedVersions: API_VERSIONS,
    documentation: '/api/docs',
    status: 'operational',
  });
};
