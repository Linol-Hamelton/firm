/**
 * React Hook Form Integration for FIRM Validator
 *
 * Provides resolver for validating forms with React Hook Form.
 *
 * @example
 * ```typescript
 * import { useForm } from 'react-hook-form';
 * import { s } from 'firm-validator';
 * import { firmResolver } from 'firm-validator/integrations/react-hook-form';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(18)
 * });
 *
 * function MyForm() {
 *   const { register, handleSubmit, formState: { errors } } = useForm({
 *     resolver: firmResolver(userSchema)
 *   });
 *
 *   const onSubmit = (data) => {
 *     console.log(data); // Validated data
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('name')} />
 *       {errors.name && <span>{errors.name.message}</span>}
 *
 *       <input {...register('email')} />
 *       {errors.email && <span>{errors.email.message}</span>}
 *
 *       <button type="submit">Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */

import type { FieldError, FieldErrors, Resolver } from 'react-hook-form';
import type { Schema } from '../../common/types/schema.js';
import type { ValidationError } from '../../common/types/result.js';

// ============================================================================
// TYPES
// ============================================================================

export interface FirmResolverOptions {
  /** Abort on first error (default: false for form UX) */
  abortEarly?: boolean;
  /** Transform error messages */
  errorMap?: (error: ValidationError) => string;
}

// ============================================================================
// RESOLVER
// ============================================================================

/**
 * Create a React Hook Form resolver from FIRM schema.
 *
 * @param schema - FIRM validation schema
 * @param options - Resolver options
 *
 * @example
 * ```typescript
 * const userSchema = s.object({
 *   name: s.string().min(1, 'Name is required'),
 *   email: s.string().email('Invalid email'),
 *   age: s.number().int().min(18, 'Must be 18+')
 * });
 *
 * const { register, handleSubmit, formState: { errors } } = useForm({
 *   resolver: firmResolver(userSchema)
 * });
 * ```
 */
export function firmResolver<T extends Record<string, any>>(
  schema: Schema<T>,
  options: FirmResolverOptions = {}
): Resolver<T> {
  return async (values, context, resolverOptions) => {
    // Validate with FIRM
    const result = schema.validate(values, {
      abortEarly: options.abortEarly ?? false, // Show all errors by default
    });

    if (result.ok) {
      return {
        values: result.data,
        errors: {},
      };
    }

    // Convert FIRM errors to React Hook Form format
    const errors: FieldErrors<T> = {};

    for (const error of result.errors) {
      const path = error.path || 'root';
      const message = options.errorMap
        ? options.errorMap(error)
        : error.message;

      // Set error for this field
      setNestedError(errors, path, {
        type: error.code,
        message,
      });
    }

    return {
      values: {},
      errors,
    };
  };
}

/**
 * Set nested error in errors object.
 * Handles dot notation paths like "address.street".
 */
function setNestedError(
  errors: FieldErrors<any>,
  path: string,
  error: FieldError
): void {
  if (!path || path === 'root') {
    (errors as any).root = error;
    return;
  }

  const parts = path.split('.');
  let current: any = errors;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;

    if (!current[part]) {
      current[part] = {};
    }
    current = current[part];
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    current[lastPart] = error;
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Custom hook for validated form with FIRM.
 *
 * @example
 * ```typescript
 * function MyForm() {
 *   const { register, handleSubmit, errors } = useFirmForm(userSchema);
 *
 *   const onSubmit = (data) => {
 *     console.log(data); // Validated
 *   };
 *
 *   return (
 *     <form onSubmit={handleSubmit(onSubmit)}>
 *       <input {...register('name')} />
 *       {errors.name && <span>{errors.name.message}</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function useFirmForm<T extends Record<string, any>>(
  schema: Schema<T>,
  options: FirmResolverOptions & { defaultValues?: Partial<T> } = {}
) {
  // This is a helper that would wrap useForm
  // In actual implementation, this would import from 'react-hook-form'
  // For now, we just provide the resolver

  const { defaultValues, ...resolverOptions } = options;

  return {
    resolver: firmResolver(schema, resolverOptions),
    defaultValues,
  };
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Get error message from React Hook Form errors object.
 *
 * @example
 * ```typescript
 * const { formState: { errors } } = useForm({ ... });
 *
 * <input {...register('email')} />
 * {getErrorMessage(errors, 'email')}
 * ```
 */
export function getErrorMessage(
  errors: FieldErrors<any>,
  field: string
): string | undefined {
  const parts = field.split('.');
  let current: any = errors;

  for (const part of parts) {
    if (!current || !current[part]) {
      return undefined;
    }
    current = current[part];
  }

  return current?.message;
}

/**
 * Check if field has error.
 *
 * @example
 * ```typescript
 * const { formState: { errors } } = useForm({ ... });
 *
 * <input
 *   {...register('email')}
 *   className={hasError(errors, 'email') ? 'error' : ''}
 * />
 * ```
 */
export function hasError(errors: FieldErrors<any>, field: string): boolean {
  return getErrorMessage(errors, field) !== undefined;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  firmResolver,
  useFirmForm,
  getErrorMessage,
  hasError,
};
