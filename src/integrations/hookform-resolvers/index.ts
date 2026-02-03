/**
 * @hookform/resolvers Compatible Resolver for FIRM Validator
 *
 * This module provides a resolver that is fully compatible with @hookform/resolvers API,
 * allowing FIRM to work seamlessly with React Hook Form without requiring additional packages.
 *
 * @example
 * ```typescript
 * import { useForm } from 'react-hook-form';
 * import { firmResolver } from 'firm-validator/integrations/hookform-resolvers';
 * import { s } from 'firm-validator';
 *
 * const schema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(18)
 * });
 *
 * function MyForm() {
 *   const { register, handleSubmit, formState: { errors } } = useForm({
 *     resolver: firmResolver(schema)
 *   });
 *
 *   return (
 *     <form onSubmit={handleSubmit(onValid)}>
 *       <input {...register('name')} />
 *       {errors.name && <span>{errors.name.message}</span>}
 *     </form>
 *   );
 * }
 * ```
 */

// Type definitions compatible with @hookform/resolvers
// These match the expected interface without requiring react-hook-form as dependency
export interface FieldError {
  type: string;
  message?: string;
}

export interface FieldErrors<T = any> {
  [key: string]: FieldError | FieldErrors<T> | undefined;
}

export interface Resolver<T = any, TContext = any> {
  (values: T, context?: TContext, options?: any): Promise<{
    values: T;
    errors: FieldErrors<T>;
  }> | {
    values: T;
    errors: FieldErrors<T>;
  };
}

import type { Schema } from '../../common/types/schema.js';
import type { ValidationError } from '../../common/types/result.js';

// ============================================================================
// TYPES
// ============================================================================

export interface FirmResolverOptions {
  /** Transform error messages */
  errorMap?: (error: ValidationError) => string;
  /** Additional validation context */
  context?: Record<string, any>;
}

// ============================================================================
// RESOLVER
// ============================================================================

/**
 * Create a @hookform/resolvers compatible resolver from FIRM schema.
 *
 * This resolver is designed to be a drop-in replacement for any @hookform/resolvers resolver,
 * providing the same API and behavior while using FIRM's validation engine.
 *
 * @param schema - FIRM validation schema
 * @param resolverOptions - Resolver configuration options
 *
 * @example
 * ```typescript
 * import { useForm } from 'react-hook-form';
 * import { firmResolver } from 'firm-validator/integrations/hookform-resolvers';
 *
 * const schema = s.object({
 *   email: s.string().email(),
 *   password: s.string().min(8)
 * });
 *
 * const { register, handleSubmit, formState: { errors } } = useForm({
 *   resolver: firmResolver(schema)
 * });
 * ```
 */
export function firmResolver<T extends Record<string, any>>(
  schema: Schema<T>,
  resolverOptions: FirmResolverOptions = {}
): Resolver<T, any> {
  return async (values, _context, _options) => {
    try {
      // Validate with FIRM
      const result = schema.validate(values);

      if (result.ok) {
        return {
          values: result.data,
          errors: {},
        };
      }

      // Convert FIRM errors to React Hook Form format
      const errors: FieldErrors<T> = {};

      for (const error of result.errors) {
        const path = error.path ? error.path.split('.') : [];
        const message = resolverOptions.errorMap
          ? resolverOptions.errorMap(error)
          : error.message;

        // Set nested error path
        setNestedError(errors, path, {
          type: error.code,
          message,
        });
      }

      return {
        values,
        errors,
      };
    } catch (error) {
      // Handle unexpected errors
      console.error('FIRM resolver error:', error);
      return {
        values,
        errors: {
          root: {
            type: 'validation_error',
            message: 'An unexpected validation error occurred',
          },
        } as FieldErrors<T>,
      };
    }
  };
}

/**
 * Set nested error in React Hook Form errors object.
 * Handles array indices and dot notation paths.
 */
function setNestedError(
  errors: FieldErrors<any>,
  path: (string | number)[],
  error: FieldError
): void {
  if (path.length === 0) {
    (errors as any).root = error;
    return;
  }

  let current: any = errors;

  for (let i = 0; i < path.length - 1; i++) {
    const part = path[i];

    if (part === undefined) continue;

    if (typeof part === 'number') {
      // Array index
      if (!current || !Array.isArray(current)) {
        current = {};
        current[part] = [];
        current = current[part];
      } else {
        if (!Object.prototype.hasOwnProperty.call(current, part)) {
          current[part] = {};
        }
        current = current[part];
      }
    } else {
      // Object property
      if (!current || typeof current !== 'object') {
        current = {};
      }
      if (!Object.prototype.hasOwnProperty.call(current, part)) {
        current[part] = {};
      }
      current = current[part];
    }
  }

  const lastPart = path[path.length - 1];
  if (lastPart === undefined) return;

  if (typeof lastPart === 'number') {
    if (!current || !Array.isArray(current)) {
      current = {};
      const parent = current;
      current = [];
      parent[lastPart] = current;
    }
    current[lastPart] = error;
  } else {
    if (!current || typeof current !== 'object') {
      current = {};
    }
    current[lastPart] = error;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Get error message from field path.
 * Compatible with @hookform/resolvers error handling patterns.
 */
export function getErrorMessage(
  errors: FieldErrors<any>,
  path: string
): string | undefined {
  const parts = path.split(/[\.\[\]]/).filter(Boolean);
  let current: any = errors;

  for (const part of parts) {
    if (current == null) return undefined;

    // Handle array indices
    const index = parseInt(part);
    if (!isNaN(index)) {
      current = current[index];
    } else {
      current = current[part];
    }
  }

  return current?.message;
}

/**
 * Check if field has validation error.
 */
export function hasError(
  errors: FieldErrors<any>,
  path: string
): boolean {
  return getErrorMessage(errors, path) !== undefined;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  firmResolver,
  getErrorMessage,
  hasError,
};