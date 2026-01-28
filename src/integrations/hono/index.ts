/**
 * Hono Integration for FIRM Validator
 *
 * Provides middleware for validating requests in Hono (edge runtime framework).
 *
 * @example
 * ```typescript
 * import { Hono } from 'hono';
 * import { s } from 'firm-validator';
 * import { validator } from 'firm-validator/integrations/hono';
 *
 * const app = new Hono();
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 * });
 *
 * app.post('/users',
 *   validator('json', userSchema),
 *   (c) => {
 *     const user = c.req.valid('json');
 *     return c.json({ success: true, user });
 *   }
 * );
 * ```
 */

import type { Context, MiddlewareHandler } from 'hono';
import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export type ValidationTarget = 'json' | 'form' | 'query' | 'param' | 'header';

export interface ValidationError {
  success: false;
  errors: Array<{
    target: string;
    path: string;
    code: string;
    message: string;
  }>;
}

// ============================================================================
// VALIDATOR MIDDLEWARE
// ============================================================================

/**
 * Hono middleware for validating requests.
 *
 * @param target - Where to validate: 'json', 'form', 'query', 'param', 'header'
 * @param schema - FIRM schema for validation
 *
 * @example
 * ```typescript
 * app.post('/users',
 *   validator('json', userSchema),
 *   (c) => {
 *     const user = c.req.valid('json');
 *     return c.json({ success: true, user });
 *   }
 * );
 * ```
 */
export function validator<T>(
  target: ValidationTarget,
  schema: Schema<T>
): MiddlewareHandler {
  return async (c: Context, next) => {
    let data: unknown;

    try {
      // Extract data based on target
      switch (target) {
        case 'json':
          data = await c.req.json();
          break;
        case 'form':
          data = await c.req.parseBody();
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'param':
          data = c.req.param();
          break;
        case 'header':
          data = c.req.header();
          break;
        default:
          throw new Error(`Unknown validation target: ${target}`);
      }

      // Validate
      const result = schema.validate(data);

      if (!result.ok) {
        const errorResponse: ValidationError = {
          success: false,
          errors: result.errors.map((err) => ({
            target,
            path: err.path,
            code: err.code,
            message: err.message,
          })),
        };

        return c.json(errorResponse, 400);
      }

      // Store validated data
      // Hono will make it available via c.req.valid(target)
      c.req.addValidatedData(target, result.data);

      await next();
    } catch (error) {
      return c.json(
        {
          success: false,
          errors: [
            {
              target,
              path: '',
              code: 'PARSE_ERROR',
              message: error instanceof Error ? error.message : 'Failed to parse request',
            },
          ],
        },
        400
      );
    }
  };
}

/**
 * Validate JSON body.
 * Shorthand for validator('json', schema).
 *
 * @example
 * ```typescript
 * app.post('/users',
 *   validateJson(userSchema),
 *   (c) => { ... }
 * );
 * ```
 */
export function validateJson<T>(schema: Schema<T>) {
  return validator('json', schema);
}

/**
 * Validate form data.
 * Shorthand for validator('form', schema).
 *
 * @example
 * ```typescript
 * app.post('/upload',
 *   validateForm(formSchema),
 *   (c) => { ... }
 * );
 * ```
 */
export function validateForm<T>(schema: Schema<T>) {
  return validator('form', schema);
}

/**
 * Validate query parameters.
 * Shorthand for validator('query', schema).
 *
 * @example
 * ```typescript
 * app.get('/users',
 *   validateQuery(s.object({ page: s.coerce.number() })),
 *   (c) => { ... }
 * );
 * ```
 */
export function validateQuery<T>(schema: Schema<T>) {
  return validator('query', schema);
}

/**
 * Validate route parameters.
 * Shorthand for validator('param', schema).
 *
 * @example
 * ```typescript
 * app.get('/users/:id',
 *   validateParam(s.object({ id: s.string().uuid() })),
 *   (c) => { ... }
 * );
 * ```
 */
export function validateParam<T>(schema: Schema<T>) {
  return validator('param', schema);
}

/**
 * Validate headers.
 * Shorthand for validator('header', schema).
 *
 * @example
 * ```typescript
 * app.get('/api',
 *   validateHeader(s.object({ authorization: s.string() })),
 *   (c) => { ... }
 * );
 * ```
 */
export function validateHeader<T>(schema: Schema<T>) {
  return validator('header', schema);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  validator,
  validateJson,
  validateForm,
  validateQuery,
  validateParam,
  validateHeader,
};
