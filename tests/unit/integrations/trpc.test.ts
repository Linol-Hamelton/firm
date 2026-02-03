/**
 * tRPC Integration Tests
 */

import { s } from '../../../src/index';
import { firmInput, firmOutput } from '../../../src/integrations/trpc/index';
import { ValidationError } from '../../../src/common/errors/validation-error';

describe('tRPC Integration', () => {
  describe('firmInput', () => {
    it('should validate valid input', () => {
      const schema = s.object({
        name: s.string().min(1),
        email: s.string().email(),
      });

      const validator = firmInput(schema);
      const result = validator({ name: 'John', email: 'john@example.com' });

      expect(result).toEqual({
        name: 'John',
        email: 'john@example.com',
      });
    });

    it('should throw on invalid input', () => {
      const schema = s.object({
        name: s.string().min(1),
        email: s.string().email(),
      });

      const validator = firmInput(schema);

      expect(() => {
        validator({ name: '', email: 'invalid' });
      }).toThrow(ValidationError);
    });

    it('should use custom error transformer', () => {
      const schema = s.object({
        name: s.string().min(1),
      });

      const validator = firmInput(schema, {
        errorTransformer: (errors) => {
          return new Error(`Custom: ${errors.length} errors`);
        },
      });

      expect(() => {
        validator({ name: '' });
      }).toThrow('Custom: 1 errors');
    });

    it('should coerce types', () => {
      const schema = s.object({
        page: s.coerce.number(),
        active: s.coerce.boolean(),
      });

      const validator = firmInput(schema);
      const result = validator({ page: '5', active: 'true' });

      expect(result.page).toBe(5);
      expect(result.active).toBe(true);
    });

    it('should handle nested objects', () => {
      const schema = s.object({
        user: s.object({
          name: s.string(),
          address: s.object({
            city: s.string(),
          }),
        }),
      });

      const validator = firmInput(schema);
      const result = validator({
        user: {
          name: 'John',
          address: { city: 'NYC' },
        },
      });

      expect(result.user.address.city).toBe('NYC');
    });
  });

  describe('firmOutput', () => {
    it('should validate valid output', () => {
      const schema = s.object({
        id: s.number(),
        name: s.string(),
      });

      const validator = firmOutput(schema);
      const result = validator({ id: 1, name: 'John' });

      expect(result).toEqual({ id: 1, name: 'John' });
    });

    it('should throw on invalid output', () => {
      const schema = s.object({
        id: s.number(),
        name: s.string(),
      });

      const validator = firmOutput(schema);

      expect(() => {
        validator({ id: 'not-a-number', name: 'John' });
      }).toThrow(ValidationError);
    });

    it('should enforce output contract', () => {
      const schema = s.object({
        id: s.number(),
        email: s.string().email(),
      });

      const validator = firmOutput(schema);

      // This would catch bugs where output doesn't match schema
      expect(() => {
        validator({ id: 1, email: 'invalid-email' });
      }).toThrow();
    });
  });

  describe('type safety', () => {
    it('should infer correct types', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
      });

      const validator = firmInput(schema);
      const result = validator({ name: 'John', age: 30 });

      // TypeScript should know the types
      const name: string = result.name;
      const age: number = result.age;

      expect(name).toBe('John');
      expect(age).toBe(30);
    });
  });

  describe('optional fields', () => {
    it('should handle optional input fields', () => {
      const schema = s.object({
        name: s.string(),
        email: s.string().optional(),
      });

      const validator = firmInput(schema);

      // With email
      const result1 = validator({ name: 'John', email: 'john@example.com' });
      expect(result1.email).toBe('john@example.com');

      // Without email
      const result2 = validator({ name: 'John' });
      expect(result2.email).toBeUndefined();
    });
  });

  describe('arrays', () => {
    it('should validate array inputs', () => {
      const schema = s.object({
        tags: s.array(s.string().min(1)),
      });

      const validator = firmInput(schema);
      const result = validator({ tags: ['typescript', 'validation'] });

      expect(result.tags).toHaveLength(2);
    });

    it('should reject invalid array items', () => {
      const schema = s.object({
        tags: s.array(s.string().min(1)),
      });

      const validator = firmInput(schema);

      expect(() => {
        validator({ tags: ['valid', ''] });
      }).toThrow();
    });
  });
});
