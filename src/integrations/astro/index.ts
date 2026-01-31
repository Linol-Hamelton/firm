/**
 * Astro Integration
 * 
 * Provides Astro-specific validation for API routes, endpoints, and forms.
 */

import type { Schema } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';

/**
 * Validate Astro API route request data
 */
export function validateRequest<T>(schema: Schema<T>, request: Request): Promise<T> {
  return request.json().then(data => {
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
  });
}

/**
 * Validate Astro endpoint data
 */
export function validateEndpointData<T>(schema: Schema<T>, data: unknown): T {
  const result = schema.validate(data);
  if (!result.ok) {
    throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
  }
  return result.data;
}

/**
 * Form validation for Astro forms
 */
export function createAstroFormValidator<T>(schema: Schema<T>) {
  return {
    validate(formData: FormData): T {
      const data = Object.fromEntries(formData);
      const result = schema.validate(data);
      if (!result.ok) {
        const errors = result.errors.reduce((acc, error) => {
          acc[error.path] = error.message;
          return acc;
        }, {} as Record<string, string>);
        
        return {
          success: false,
          errors,
          data
        } as any;
      }
      return {
        success: true,
        data: result.data
      } as any;
    }
  };
}

/**
 * Middleware for Astro API routes
 */
export function withValidation<T>(schema: Schema<T>) {
  return {
    async post(request: Request) {
      try {
        const data = await validateRequest(schema, request);
        return new Response(JSON.stringify({ success: true, data }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        if (error instanceof Response) {
          return error;
        }
        return new Response(JSON.stringify({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    },
    
    async get(params: Record<string, string>) {
      const result = schema.validate(params);
      if (!result.ok) {
        return new Response(JSON.stringify({
          errors: result.errors
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
      return new Response(JSON.stringify({ success: true, data: result.data }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

/**
 * Astro component props validation
 */
export function validateProps<T>(schema: Schema<T>, props: any): T {
  const result = schema.validate(props);
  if (!result.ok) {
    console.warn('Component props validation failed:', result.errors);
    // In development, you might want to throw an error
    if (typeof process !== 'undefined' && process.env && process.env['NODE_ENV'] === 'development') {
      throw new Error(`Invalid props: ${result.errors.map(e => e.message).join(', ')}`);
    }
  }
  return result.ok ? result.data : props;
}

/**
 * Integration with Astro's Content Collections
 */
export function createContentSchema<T>(schema: Schema<T>) {
  return {
    async parseFrontmatter(data: any): Promise<T> {
      const result = schema.validate(data);
      if (!result.ok) {
        throw new Error(`Invalid frontmatter: ${result.errors.map(e => e.message).join(', ')}`);
      }
      return result.data;
    },
    
    validateFrontmatter(data: any): ValidationResult<T> {
      return schema.validate(data);
    }
  };
}

export default {
  validateRequest,
  validateEndpointData,
  createAstroFormValidator,
  withValidation,
  validateProps,
  createContentSchema
};