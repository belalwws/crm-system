/**
 * Environment Configuration Validator
 * Validates all required environment variables at startup
 */
import logger from './logger';

interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  FRONTEND_URL: string;
  PORT: number;
  NODE_ENV: string;
  // Optional
  CLERK_SECRET_KEY?: string;
  CLERK_PUBLISHABLE_KEY?: string;
  RESEND_API_KEY?: string;
  NVIDIA_API_KEY?: string;
}

export function validateEnv(): EnvConfig {
  const required: Record<string, string | undefined> = {
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  // Warn about insecure defaults
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is too short. Use at least 32 characters for production.');
  }

  // Warn about optional but recommended vars
  const optional = ['CLERK_SECRET_KEY', 'RESEND_API_KEY', 'NVIDIA_API_KEY'];
  for (const key of optional) {
    if (!process.env[key]) {
      logger.warn(`Optional env var ${key} not set. Related features will be disabled.`);
    }
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NVIDIA_API_KEY: process.env.NVIDIA_API_KEY,
  };
}
