/**
 * REST API Integration for FIRM Validator
 *
 * Provides generic helpers for validating REST API requests and responses.
 *
 * @example
 * ```typescript
 * import { s } from 'firm-validator';
 * import { createRestValidator, validateRequest } from 'firm-validator/integrations/rest';
 *
 * const userEndpoint = createRestValidator({
 *   POST: {
 *     body: s.object({
 *       name: s.string().min(1),
 *       email: s.string().email(),
 *     }),
 *     response: s.object({
 *       id: s.number(),
 *       name: s.string(),
 *       email: s.string(),
 *     }),
 *   },
 * });
 *
 * // Use with any framework
 * const result = userEndpoint.POST.body.validate(requestBody);
 * ```
 */

import type { Schema } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';

// ============================================================================
// TYPES
// ============================================================================

export interface RestEndpointSchema<T = any> {
  body?: Schema<T>;
  query?: Schema<any>;
  params?: Schema<any>;
  headers?: Schema<any>;
  response?: Schema<any>;
}

export interface RestValidator {
  [method: string]: RestEndpointSchema;
}

export interface ValidationOptions {
  /** Throw error on validation failure (default: false) */
  throwOnError?: boolean;
  /** Custom error handler */
  onError?: (errors: readonly any[]) => void;
}

// ============================================================================
// REST VALIDATOR
// ============================================================================

/**
 * Create REST API validator with schemas for each HTTP method.
 *
 * @param schemas - Schemas for each HTTP method
 *
 * @example
 * ```typescript
 * const userValidator = createRestValidator({
 *   GET: {
 *     params: s.object({ id: s.string().uuid() }),
 *     query: s.object({ include: s.string().optional() }),
 *     response: s.object({
 *       id: s.string(),
 *       name: s.string(),
 *       email: s.string(),
 *     }),
 *   },
 *   POST: {
 *     body: s.object({
 *       name: s.string().min(1),
 *       email: s.string().email(),
 *     }),
 *     response: s.object({
 *       id: s.string(),
 *       name: s.string(),
 *       email: s.string(),
 *     }),
 *   },
 * });
 * ```
 */
export function createRestValidator<T extends RestValidator>(
  schemas: T
): T {
  return schemas;
}

/**
 * Validate REST request.
 *
 * @param request - Request data
 * @param schemas - Validation schemas
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const result = validateRequest(
 *   {
 *     body: { name: 'John', email: 'john@example.com' },
 *     query: { page: '1' },
 *     params: { id: '123' },
 *   },
 *   {
 *     body: userSchema,
 *     query: paginationSchema,
 *     params: idSchema,
 *   }
 * );
 *
 * if (result.ok) {
 *   console.log('Valid:', result.data);
 * } else {
 *   console.error('Errors:', result.errors);
 * }
 * ```
 */
export function validateRequest<T extends Record<string, any>>(
  request: {
    body?: unknown;
    query?: unknown;
    params?: unknown;
    headers?: unknown;
  },
  schemas: RestEndpointSchema<T>,
  options: ValidationOptions = {}
): ValidationResult<{
  body?: T;
  query?: any;
  params?: any;
  headers?: any;
}> {
  const errors: any[] = [];
  const data: any = {};

  // Validate body
  if (schemas.body && request.body !== undefined) {
    const result = schemas.body.validate(request.body);
    if (result.ok) {
      data.body = result.data;
    } else {
      errors.push(
        ...result.errors.map((err) => ({
          location: 'body',
          ...err,
        }))
      );
    }
  }

  // Validate query
  if (schemas.query && request.query !== undefined) {
    const result = schemas.query.validate(request.query);
    if (result.ok) {
      data.query = result.data;
    } else {
      errors.push(
        ...result.errors.map((err) => ({
          location: 'query',
          ...err,
        }))
      );
    }
  }

  // Validate params
  if (schemas.params && request.params !== undefined) {
    const result = schemas.params.validate(request.params);
    if (result.ok) {
      data.params = result.data;
    } else {
      errors.push(
        ...result.errors.map((err) => ({
          location: 'params',
          ...err,
        }))
      );
    }
  }

  // Validate headers
  if (schemas.headers && request.headers !== undefined) {
    const result = schemas.headers.validate(request.headers);
    if (result.ok) {
      data.headers = result.data;
    } else {
      errors.push(
        ...result.errors.map((err) => ({
          location: 'headers',
          ...err,
        }))
      );
    }
  }

  if (errors.length > 0) {
    if (options.onError) {
      options.onError(errors);
    }

    if (options.throwOnError) {
      throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
    }

    return { ok: false, errors };
  }

  return { ok: true, data };
}

/**
 * Validate REST response.
 *
 * @param response - Response data
 * @param schema - Response schema
 * @param options - Validation options
 *
 * @example
 * ```typescript
 * const responseSchema = s.object({
 *   id: s.number(),
 *   name: s.string(),
 *   email: s.string().email(),
 * });
 *
 * const result = validateResponse(apiResponse, responseSchema);
 *
 * if (result.ok) {
 *   console.log('Valid response:', result.data);
 * }
 * ```
 */
export function validateResponse<T>(
  response: unknown,
  schema: Schema<T>,
  options: ValidationOptions = {}
): ValidationResult<T> {
  const result = schema.validate(response);

  if (!result.ok) {
    if (options.onError) {
      options.onError(result.errors);
    }

    if (options.throwOnError) {
      throw new Error(
        `Response validation failed: ${JSON.stringify(result.errors)}`
      );
    }
  }

  return result;
}

// ============================================================================
// HTTP CLIENT WRAPPER
// ============================================================================

/**
 * Create typed HTTP client with automatic validation.
 *
 * @example
 * ```typescript
 * const api = createRestClient({
 *   baseURL: 'https://api.example.com',
 *   endpoints: {
 *     getUser: {
 *       method: 'GET',
 *       path: '/users/:id',
 *       params: s.object({ id: s.string() }),
 *       response: userSchema,
 *     },
 *     createUser: {
 *       method: 'POST',
 *       path: '/users',
 *       body: createUserSchema,
 *       response: userSchema,
 *     },
 *   },
 * });
 *
 * // Type-safe API calls
 * const user = await api.getUser({ id: '123' });
 * const newUser = await api.createUser({ name: 'John', email: 'john@example.com' });
 * ```
 */
export function createRestClient<T extends Record<string, EndpointConfig>>(
  config: {
    baseURL: string;
    endpoints: T;
    headers?: Record<string, string>;
  }
) {
  const client: any = {};

  for (const [name, endpoint] of Object.entries(config.endpoints)) {
    client[name] = async (data?: any) => {
      let url = config.baseURL + endpoint.path;

      // Replace path params
      if (endpoint.params && data) {
        const paramsResult = endpoint.params.validate(data);
        if (paramsResult.ok) {
          for (const [key, value] of Object.entries(paramsResult.data)) {
            url = url.replace(`:${key}`, String(value));
          }
        }
      }

      // Prepare request
      const requestInit: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        },
      };

      // Validate and add body
      if (endpoint.body && data) {
        const bodyResult = endpoint.body.validate(data);
        if (!bodyResult.ok) {
          throw new Error(`Request validation failed: ${JSON.stringify(bodyResult.errors)}`);
        }
        requestInit.body = JSON.stringify(bodyResult.data);
      }

      // Make request
      const response = await fetch(url, requestInit);
      const responseData = await response.json();

      // Validate response
      if (endpoint.response) {
        const responseResult = endpoint.response.validate(responseData);
        if (!responseResult.ok) {
          throw new Error(`Response validation failed: ${JSON.stringify(responseResult.errors)}`);
        }
        return responseResult.data;
      }

      return responseData;
    };
  }

  return client as RestClient<T>;
}

interface EndpointConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: Schema<any>;
  query?: Schema<any>;
  body?: Schema<any>;
  response?: Schema<any>;
}

type RestClient<T extends Record<string, EndpointConfig>> = {
  [K in keyof T]: (data?: any) => Promise<any>;
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Format validation errors for REST API responses.
 *
 * @example
 * ```typescript
 * const formatted = formatRestError(validationErrors);
 * res.status(400).json(formatted);
 * ```
 */
export function formatRestError(errors: readonly any[]): {
  error: string;
  message: string;
  details: any[];
} {
  return {
    error: 'Validation Error',
    message: 'Request validation failed',
    details: errors.map((err) => ({
      location: err.location || 'unknown',
      field: err.path,
      code: err.code,
      message: err.message,
    })),
  };
}

/**
 * Create standard REST error response.
 *
 * @example
 * ```typescript
 * const error = createRestError(400, 'Validation failed', validationErrors);
 * res.status(error.status).json(error);
 * ```
 */
export function createRestError(
  status: number,
  message: string,
  errors?: readonly any[]
): {
  status: number;
  error: string;
  message: string;
  errors?: readonly any[];
} {
  const result: {
    status: number;
    error: string;
    message: string;
    errors?: readonly any[];
  } = {
    status,
    error: getErrorName(status),
    message,
  };

  if (errors !== undefined) {
    result.errors = errors;
  }

  return result;
}

function getErrorName(status: number): string {
  const names: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    422: 'Unprocessable Entity',
    500: 'Internal Server Error',
  };
  return names[status] || 'Error';
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createRestValidator,
  validateRequest,
  validateResponse,
  createRestClient,
  formatRestError,
  createRestError,
};
