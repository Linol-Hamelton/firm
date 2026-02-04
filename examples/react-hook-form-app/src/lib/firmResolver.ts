import type { FieldValues, Resolver } from 'react-hook-form';
import type { Schema } from 'firm-validator';

/**
 * FIRM resolver for React Hook Form
 * Integrates FIRM validation with React Hook Form
 */
export function firmResolver<T extends FieldValues>(
  schema: Schema<T>
): Resolver<T> {
  return async (values) => {
    const result = schema.validate(values);

    if (result.ok) {
      return {
        values: result.data as T,
        errors: {},
      };
    }

    // Convert FIRM errors to React Hook Form format
    const errors: Record<string, any> = {};

    for (const error of result.errors) {
      const path = error.path.join('.');

      if (!errors[path]) {
        errors[path] = {
          type: error.code,
          message: error.message,
        };
      }
    }

    return {
      values: {},
      errors,
    };
  };
}
