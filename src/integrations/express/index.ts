/**
 * Express.js Integration for FIRM Validator
 *
 * Provides middleware for validating request bodies, params, query strings, and headers.
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { s } from 'firm-validator';
 * import { validate } from 'firm-validator/integrations/express';
 *
 * const app = express();
 * app.use(express.json());
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(18)
 * });
 *
 * app.post('/users', validate({ body: userSchema }), (req, res) => {
 *   // req.body is now typed and validated
 *   res.json({ success: true, user: req.body });
 * });
 * ```
 */

import type { Request, Response, NextFunction } from 'express';
import type { Schema } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidateOptions<
  TBody = any,
  TParams = any,
  TQuery = any,
  THeaders = any
> {
  /** Schema for request body */
  body?: Schema<TBody>;
  /** Schema for route params */
  params?: Schema<TParams>;
  /** Schema for query string */
  query?: Schema<TQuery>;
  /** Schema for headers */
  headers?: Schema<THeaders>;
  /** Abort on first error (default: true) */
  abortEarly?: boolean;
  /** Custom error handler */
  onError?: (
    errors: ValidationResult<any>,
    req: Request,
    res: Response
  ) => void;
}

export interface ValidationError {
  success: false;
  errors: Array<{
    path: string;
    code: string;
    message: string;
  }>;
}

// ============================================================================
// MIDDLEWARE
// ============================================================================

/**
 * Express middleware for validating requests.
 *
 * @example
 * ```typescript
 * app.post('/users',
 *   validate({
 *     body: s.object({
 *       name: s.string(),
 *       email: s.string().email()
 *     }),
 *     params: s.object({
 *       id: s.string().uuid()
 *     })
 *   }),
 *   (req, res) => {
 *     // Validated request
 *   }
 * );
 * ```
 */
export function validate<TBody = any, TParams = any, TQuery = any, THeaders = any>(
  options: ValidateOptions<TBody, TParams, TQuery, THeaders>
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const errors: Array<{ location: string; errors: any[] }> = [];

      // Validate body
      if (options.body) {
        const result = options.body.validate(req.body);
        if (!result.ok) {
          errors.push({
            location: 'body',
            errors: result.errors,
          });
        } else {
          req.body = result.data;
        }
      }

      // Validate params
      if (options.params) {
        const result = options.params.validate(req.params);
        if (!result.ok) {
          errors.push({
            location: 'params',
            errors: result.errors,
          });
        } else {
          req.params = result.data;
        }
      }

      // Validate query
      if (options.query) {
        const result = options.query.validate(req.query);
        if (!result.ok) {
          errors.push({
            location: 'query',
            errors: result.errors,
          });
        } else {
          req.query = result.data;
        }
      }

      // Validate headers
      if (options.headers) {
        const result = options.headers.validate(req.headers);
        if (!result.ok) {
          errors.push({
            location: 'headers',
            errors: result.errors,
          });
        } else {
          req.headers = result.data as any;
        }
      }

      // Handle validation errors
      if (errors.length > 0) {
        const flatErrors = errors.flatMap((e) =>
          e.errors.map((err) => ({
            location: e.location,
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );

        const errorResponse: ValidationError = {
          success: false,
          errors: flatErrors,
        };

        if (options.onError) {
          options.onError(errorResponse as any, req, res);
        } else {
          res.status(400).json(errorResponse);
        }
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Validate request body only.
 * Shorthand for validate({ body: schema }).
 *
 * @example
 * ```typescript
 * app.post('/users',
 *   validateBody(userSchema),
 *   (req, res) => { ... }
 * );
 * ```
 */
export function validateBody<T>(schema: Schema<T>) {
  return validate({ body: schema });
}

/**
 * Validate route params only.
 * Shorthand for validate({ params: schema }).
 *
 * @example
 * ```typescript
 * app.get('/users/:id',
 *   validateParams(s.object({ id: s.string().uuid() })),
 *   (req, res) => { ... }
 * );
 * ```
 */
export function validateParams<T>(schema: Schema<T>) {
  return validate({ params: schema });
}

/**
 * Validate query string only.
 * Shorthand for validate({ query: schema }).
 *
 * @example
 * ```typescript
 * app.get('/users',
 *   validateQuery(s.object({ page: s.coerce.number() })),
 *   (req, res) => { ... }
 * );
 * ```
 */
export function validateQuery<T>(schema: Schema<T>) {
  return validate({ query: schema });
}

/**
 * Validate headers only.
 * Shorthand for validate({ headers: schema }).
 *
 * @example
 * ```typescript
 * app.get('/api/data',
 *   validateHeaders(s.object({ authorization: s.string() })),
 *   (req, res) => { ... }
 * );
 * ```
 */
export function validateHeaders<T>(schema: Schema<T>) {
  return validate({ headers: schema });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validate,
  validateBody,
  validateParams,
  validateQuery,
  validateHeaders,
};
