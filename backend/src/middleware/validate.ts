import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Validation Middleware using Zod
 * Validates request body/query/params against a Zod schema
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = schema.parse(req[source]);
      // Replace with parsed/cleaned data
      (req as any)[source] = data;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
        return;
      }
      next(error);
    }
  };
}

/**
 * Validate query params (coerces types automatically)
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Validate URL params
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}
