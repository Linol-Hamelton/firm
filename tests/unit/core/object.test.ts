/**
 * Object Validator Tests
 */

import { s } from '../../../src/index.ts';

describe('ObjectValidator', () => {
  describe('basic validation', () => {
    it('should validate objects', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
      });

      const result = schema.validate({ name: 'John', age: 30 });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('John');
        expect(result.data.age).toBe(30);
      }
    });

    it('should reject non-objects', () => {
      const schema = s.object({ name: s.string() });

      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate(undefined).ok).toBe(false);
      expect(schema.validate('string').ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
    });

    it('should validate nested objects', () => {
      const schema = s.object({
        user: s.object({
          name: s.string(),
          address: s.object({
            city: s.string(),
          }),
        }),
      });

      const result = schema.validate({
        user: {
          name: 'John',
          address: { city: 'NYC' },
        },
      });

      expect(result.ok).toBe(true);
    });
  });

  describe('unknown keys', () => {
    it('should strip unknown keys by default', () => {
      const schema = s.object({ name: s.string() });
      const result = schema.validate({ name: 'John', extra: 'value' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({ name: 'John' });
        expect((result.data as any).extra).toBeUndefined();
      }
    });

    it('should reject unknown keys in strict mode', () => {
      const schema = s.object({ name: s.string() }).strict();
      const result = schema.validate({ name: 'John', extra: 'value' });

      expect(result.ok).toBe(false);
    });

    it('should pass through unknown keys in passthrough mode', () => {
      const schema = s.object({ name: s.string() }).passthrough();
      const result = schema.validate({ name: 'John', extra: 'value' });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect((result.data as any).extra).toBe('value');
      }
    });
  });

  describe('modifiers', () => {
    it('should make all fields optional with partial()', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
      }).partial();

      expect(schema.validate({}).ok).toBe(true);
      expect(schema.validate({ name: 'John' }).ok).toBe(true);
    });

    it('should pick specific fields', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
        email: s.string(),
      }).pick(['name', 'email']);

      const result = schema.validate({ name: 'John', email: 'john@example.com' });
      expect(result.ok).toBe(true);
    });

    it('should omit specific fields', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
        password: s.string(),
      }).omit(['password']);

      const result = schema.validate({ name: 'John', age: 30 });
      expect(result.ok).toBe(true);
    });

    it('should extend with additional fields', () => {
      const baseSchema = s.object({ name: s.string() });
      const extendedSchema = baseSchema.extend({ age: s.number() });

      const result = extendedSchema.validate({ name: 'John', age: 30 });
      expect(result.ok).toBe(true);
    });
  });

  describe('error reporting', () => {
    it('should report errors with correct paths', () => {
      const schema = s.object({
        user: s.object({
          name: s.string(),
          age: s.number(),
        }),
      });

      const result = schema.validate({
        user: { name: 'John', age: 'invalid' },
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.path).toBe('user.age');
      }
    });
  });
});
