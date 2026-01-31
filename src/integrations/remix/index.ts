/**
 * Remix Integration
 * 
 * Provides Remix-specific validation for loaders, actions, and forms.
 */

import type { Schema } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';

/**
 * Validate Remix loader data
 */
export function validateLoaderData<T>(schema: Schema<T>, data: unknown): T {
  const result = schema.validate(data);
  if (!result.ok) {
    throw new Response(JSON.stringify({
      errors: result.errors
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  return result.data;
}

/**
 * Validate Remix action data
 */
export function validateActionData<T>(schema: Schema<T>, data: unknown): T {
  return validateLoaderData(schema, data);
}

/**
 * Form validation for Remix forms
 */
export function createFormValidator<T>(schema: Schema<T>) {
  return {
    validate(formData: FormData): T {
      const data = Object.fromEntries(formData);
      const result = schema.validate(data);
      if (!result.ok) {
        const errors = result.errors.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {} as Record<string, string>);
        
        throw new Error(JSON.stringify({
          errors,
          formData: data
        }));
      }
      return result.data;
    }
  };
}

/**
 * Zod-like API for Remix
 */
export function remixSchema<T>(schema: Schema<T>) {
  return {
    parse(data: unknown): T {
      return validateLoaderData(schema, data);
    },
    
    safeParse(data: unknown): ValidationResult<T> {
      return schema.validate(data);
    },
    
    async parseAsync(data: unknown): Promise<T> {
      // Check if validateAsync exists, fallback to validate
      const result = 'validateAsync' in schema && typeof schema.validateAsync === 'function'
        ? await (schema as any).validateAsync(data)
        : schema.validate(data);
      
      if (!result.ok) {
        throw new Response(JSON.stringify({
          errors: result.errors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      return result.data;
    }
  };
}

/**
 * Integration with Remix's useActionData/useLoaderData
 */
export function useValidatedLoaderData<T>(schema: Schema<T>, data: unknown): T {
  const result = schema.validate(data);
  if (!result.ok) {
    console.error('Loader data validation failed:', result.errors);
    // In a real implementation, you might want to handle this differently
    throw new Error('Invalid loader data');
  }
  return result.data;
}

export function useValidatedActionData<T>(schema: Schema<T>, data: unknown): T | null {
  if (!data) return null;
  return useValidatedLoaderData(schema, data);
}

export default {
  validateLoaderData,
  validateActionData,
  createFormValidator,
  remixSchema,
  useValidatedLoaderData,
  useValidatedActionData
};