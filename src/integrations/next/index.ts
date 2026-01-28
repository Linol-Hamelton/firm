/**
 * Next.js Integration for FIRM Validator
 *
 * Provides helpers for validating requests in Next.js API Routes (Pages Router and App Router).
 *
 * @example Pages Router
 * ```typescript
 * import { s } from 'firm-validator';
 * import { withValidation } from 'firm-validator/integrations/next';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 * });
 *
 * export default withValidation({
 *   POST: {
 *     body: userSchema,
 *     handler: async (req, res) => {
 *       // req.body is validated
 *       res.json({ success: true, user: req.body });
 *     }
 *   }
 * });
 * ```
 *
 * @example App Router
 * ```typescript
 * import { NextRequest } from 'next/server';
 * import { s } from 'firm-validator';
 * import { validateRequest } from 'firm-validator/integrations/next';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 * });
 *
 * export async function POST(req: NextRequest) {
 *   const validation = await validateRequest(req, { body: userSchema });
 *
 *   if (!validation.ok) {
 *     return Response.json(validation.errors, { status: 400 });
 *   }
 *
 *   return Response.json({ success: true, user: validation.data.body });
 * }
 * ```
 */

import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationSchemas {
  body?: Schema<any>;
  query?: Schema<any>;
  headers?: Schema<any>;
}

export interface ValidationError {
  success: false;
  errors: Array<{
    location: string;
    path: string;
    code: string;
    message: string;
  }>;
}

export interface ValidationSuccess<T> {
  ok: true;
  data: T;
}

export interface ValidationFailure {
  ok: false;
  errors: ValidationError;
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================================================
// PAGES ROUTER (app/pages/api/*)
// ============================================================================

/**
 * Wrap Next.js API route handler with validation.
 *
 * Supports Pages Router (/pages/api/*).
 *
 * @example
 * ```typescript
 * export default withValidation({
 *   POST: {
 *     body: userSchema,
 *     handler: async (req, res) => {
 *       res.json({ user: req.body });
 *     }
 *   },
 *   GET: {
 *     query: querySchema,
 *     handler: async (req, res) => {
 *       res.json({ data: req.query });
 *     }
 *   }
 * });
 * ```
 */
export function withValidation(routes: {
  [method: string]: {
    body?: Schema<any>;
    query?: Schema<any>;
    headers?: Schema<any>;
    handler: (req: any, res: any) => void | Promise<void>;
  };
}) {
  return async (req: any, res: any) => {
    const method = req.method?.toUpperCase();

    if (!method || !routes[method]) {
      res.status(405).json({
        success: false,
        error: 'Method not allowed',
      });
      return;
    }

    const route = routes[method];
    const errors: any[] = [];

    // Validate body
    if (route.body) {
      const result = route.body.validate(req.body);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => ({
            location: 'body',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        req.body = result.data;
      }
    }

    // Validate query
    if (route.query) {
      const result = route.query.validate(req.query);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => ({
            location: 'query',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        req.query = result.data;
      }
    }

    // Validate headers
    if (route.headers) {
      const result = route.headers.validate(req.headers);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => ({
            location: 'headers',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        req.headers = result.data;
      }
    }

    // Handle errors
    if (errors.length > 0) {
      res.status(400).json({
        success: false,
        errors,
      });
      return;
    }

    // Call handler
    await route.handler(req, res);
  };
}

// ============================================================================
// APP ROUTER (app/*)
// ============================================================================

/**
 * Validate Next.js App Router request.
 *
 * Use in route handlers (app/*\/route.ts).
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const validation = await validateRequest(req, {
 *     body: userSchema
 *   });
 *
 *   if (!validation.ok) {
 *     return Response.json(validation.errors, { status: 400 });
 *   }
 *
 *   const user = validation.data.body;
 *   return Response.json({ success: true, user });
 * }
 * ```
 */
export async function validateRequest<
  TBody = any,
  TQuery = any,
  THeaders = any
>(
  req: any, // NextRequest
  schemas: ValidationSchemas
): Promise<
  ValidationResult<{
    body?: TBody;
    query?: TQuery;
    headers?: THeaders;
  }>
> {
  const errors: any[] = [];
  const data: any = {};

  // Validate body
  if (schemas.body) {
    try {
      const bodyData = await req.json();
      const result = schemas.body.validate(bodyData);

      if (!result.ok) {
        errors.push(
          ...result.errors.map((err: any) => ({
            location: 'body',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        data.body = result.data;
      }
    } catch (error) {
      errors.push({
        location: 'body',
        path: '',
        code: 'PARSE_ERROR',
        message: 'Failed to parse JSON body',
      });
    }
  }

  // Validate query
  if (schemas.query) {
    const searchParams = req.nextUrl?.searchParams;
    const queryData: any = {};

    if (searchParams) {
      for (const [key, value] of searchParams.entries()) {
        queryData[key] = value;
      }
    }

    const result = schemas.query.validate(queryData);

    if (!result.ok) {
      errors.push(
        ...result.errors.map((err: any) => ({
          location: 'query',
          path: err.path,
          code: err.code,
          message: err.message,
        }))
      );
    } else {
      data.query = result.data;
    }
  }

  // Validate headers
  if (schemas.headers) {
    const headersData: any = {};

    req.headers.forEach((value: string, key: string) => {
      headersData[key] = value;
    });

    const result = schemas.headers.validate(headersData);

    if (!result.ok) {
      errors.push(
        ...result.errors.map((err: any) => ({
          location: 'headers',
          path: err.path,
          code: err.code,
          message: err.message,
        }))
      );
    } else {
      data.headers = result.data;
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors: {
        success: false,
        errors,
      },
    };
  }

  return {
    ok: true,
    data,
  };
}

/**
 * Validate JSON body only.
 * Shorthand for validateRequest with body schema.
 *
 * @example
 * ```typescript
 * export async function POST(req: NextRequest) {
 *   const validation = await validateBody(req, userSchema);
 *
 *   if (!validation.ok) {
 *     return Response.json(validation.errors, { status: 400 });
 *   }
 *
 *   return Response.json({ user: validation.data });
 * }
 * ```
 */
export async function validateBody<T>(
  req: any,
  schema: Schema<T>
): Promise<ValidationResult<T>> {
  try {
    const bodyData = await req.json();
    const result = schema.validate(bodyData);

    if (!result.ok) {
      return {
        ok: false,
        errors: {
          success: false,
          errors: result.errors.map((err) => ({
            location: 'body',
            path: err.path,
            code: err.code,
            message: err.message,
          })),
        },
      };
    }

    return {
      ok: true,
      data: result.data,
    };
  } catch (error) {
    return {
      ok: false,
      errors: {
        success: false,
        errors: [
          {
            location: 'body',
            path: '',
            code: 'PARSE_ERROR',
            message: 'Failed to parse JSON body',
          },
        ],
      },
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  withValidation,
  validateRequest,
  validateBody,
};
