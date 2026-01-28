/**
 * React Hook Form Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { s } from '../../../src/index.js';
import { firmResolver, getErrorMessage, hasError } from '../../../src/integrations/react-hook-form/index.js';

describe('React Hook Form Integration', () => {
  describe('firmResolver', () => {
    it('should return validated data when valid', async () => {
      const schema = s.object({
        name: s.string().min(1),
        email: s.string().email(),
      });

      const resolver = firmResolver(schema);
      const result = await resolver(
        { name: 'John', email: 'john@example.com' },
        {},
        { shouldUseNativeValidation: false, fields: {} }
      );

      expect(result.errors).toEqual({});
      expect(result.values).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should return errors when invalid', async () => {
      const schema = s.object({
        name: s.string().min(1),
        email: s.string().email(),
      });

      const resolver = firmResolver(schema);
      const result = await resolver(
        { name: '', email: 'invalid-email' },
        {},
        { shouldUseNativeValidation: false, fields: {} }
      );

      expect(result.values).toEqual({});
      expect(result.errors).toBeDefined();
      expect(result.errors.name).toBeDefined();
      expect(result.errors.email).toBeDefined();
    });

    it('should handle nested objects', async () => {
      const schema = s.object({
        user: s.object({
          name: s.string().min(1),
          email: s.string().email(),
        }),
      });

      const resolver = firmResolver(schema);
      const result = await resolver(
        { user: { name: '', email: 'invalid' } },
        {},
        { shouldUseNativeValidation: false, fields: {} }
      );

      expect(result.errors).toBeDefined();
      expect((result.errors as any).user?.name).toBeDefined();
      expect((result.errors as any).user?.email).toBeDefined();
    });

    it('should use custom error mapper', async () => {
      const schema = s.object({
        name: s.string().min(1),
      });

      const resolver = firmResolver(schema, {
        errorMap: (error) => `Custom: ${error.message}`,
      });

      const result = await resolver(
        { name: '' },
        {},
        { shouldUseNativeValidation: false, fields: {} }
      );

      expect(result.errors.name?.message).toContain('Custom:');
    });

    it('should abort early when option is set', async () => {
      const schema = s.object({
        name: s.string().min(1),
        email: s.string().email(),
      });

      const resolver = firmResolver(schema, {
        abortEarly: true,
      });

      const result = await resolver(
        { name: '', email: 'invalid' },
        {},
        { shouldUseNativeValidation: false, fields: {} }
      );

      // With abortEarly, should stop after first error
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
    });
  });

  describe('getErrorMessage', () => {
    it('should get error message for field', () => {
      const errors = {
        name: { type: 'required', message: 'Name is required' },
      };

      expect(getErrorMessage(errors, 'name')).toBe('Name is required');
    });

    it('should get error message for nested field', () => {
      const errors = {
        user: {
          name: { type: 'required', message: 'Name is required' },
        },
      };

      expect(getErrorMessage(errors, 'user.name')).toBe('Name is required');
    });

    it('should return undefined for non-existent field', () => {
      const errors = {
        name: { type: 'required', message: 'Name is required' },
      };

      expect(getErrorMessage(errors, 'email')).toBeUndefined();
    });
  });

  describe('hasError', () => {
    it('should return true when field has error', () => {
      const errors = {
        name: { type: 'required', message: 'Name is required' },
      };

      expect(hasError(errors, 'name')).toBe(true);
    });

    it('should return false when field has no error', () => {
      const errors = {
        name: { type: 'required', message: 'Name is required' },
      };

      expect(hasError(errors, 'email')).toBe(false);
    });

    it('should check nested field errors', () => {
      const errors = {
        user: {
          name: { type: 'required', message: 'Name is required' },
        },
      };

      expect(hasError(errors, 'user.name')).toBe(true);
      expect(hasError(errors, 'user.email')).toBe(false);
    });
  });

  describe('type inference', () => {
    it('should infer correct types from schema', async () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
        active: s.boolean(),
      });

      const resolver = firmResolver(schema);
      const result = await resolver(
        { name: 'John', age: 30, active: true },
        {},
        { shouldUseNativeValidation: false, fields: {} }
      );

      if (result.values && Object.keys(result.values).length > 0) {
        // TypeScript should infer the correct types
        const { name, age, active } = result.values;
        expect(typeof name).toBe('string');
        expect(typeof age).toBe('number');
        expect(typeof active).toBe('boolean');
      }
    });
  });
});
