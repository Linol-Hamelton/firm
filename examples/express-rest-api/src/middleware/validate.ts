import { Request, Response, NextFunction } from 'express';
import { Schema } from 'firm-validator';

/**
 * Validation middleware factory
 */

export interface ValidationOptions {
  abortEarly?: boolean;
}

/**
 * Validate request body
 */
export function validateBody<T>(
  schema: Schema<T>,
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.validate(req.body, {
      abortEarly: options.abortEarly ?? false,
    });

    if (!result.ok) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Request body validation failed',
        issues: result.errors.map((err) => ({
          path: err.path,
          message: err.message,
          code: err.code,
        })),
      });
    }

    // Attach validated data to request
    (req as any).validatedBody = result.data;
    next();
  };
}

/**
 * Validate query parameters
 */
export function validateQuery<T>(
  schema: Schema<T>,
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.validate(req.query, {
      abortEarly: options.abortEarly ?? false,
    });

    if (!result.ok) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Query parameters validation failed',
        issues: result.errors.map((err) => ({
          path: err.path,
          message: err.message,
          code: err.code,
        })),
      });
    }

    (req as any).validatedQuery = result.data;
    next();
  };
}

/**
 * Validate URL parameters
 */
export function validateParams<T>(
  schema: Schema<T>,
  options: ValidationOptions = {}
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.validate(req.params, {
      abortEarly: options.abortEarly ?? false,
    });

    if (!result.ok) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'URL parameters validation failed',
        issues: result.errors.map((err) => ({
          path: err.path,
          message: err.message,
          code: err.code,
        })),
      });
    }

    (req as any).validatedParams = result.data;
    next();
  };
}

/**
 * Augment Express Request type with validated data
 */
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedQuery?: any;
      validatedParams?: any;
    }
  }
}
