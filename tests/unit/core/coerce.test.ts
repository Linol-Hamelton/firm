/**
 * Coerce Tests
 *
 * Tests for type coercion functionality.
 */

import { s } from '../../../src/app/firm';

describe('Coerce', () => {
  describe('s.coerce.string()', () => {
    it('should coerce numbers to strings', () => {
      const schema = s.coerce.string();
      expect(schema.validate(42)).toEqual({ ok: true, data: '42' });
      expect(schema.validate(3.14)).toEqual({ ok: true, data: '3.14' });
      expect(schema.validate(0)).toEqual({ ok: true, data: '0' });
    });

    it('should coerce booleans to strings', () => {
      const schema = s.coerce.string();
      expect(schema.validate(true)).toEqual({ ok: true, data: 'true' });
      expect(schema.validate(false)).toEqual({ ok: true, data: 'false' });
    });

    it('should pass through strings', () => {
      const schema = s.coerce.string();
      expect(schema.validate('hello')).toEqual({ ok: true, data: 'hello' });
    });

    it('should handle null and undefined with wrapping', () => {
      // Coerced schemas return Schema<T>, so use with s.optional/s.nullable
      const optionalSchema = s.optional(s.coerce.string());
      expect(optionalSchema.validate(undefined).ok).toBe(true);

      const nullableSchema = s.nullable(s.coerce.string());
      expect(nullableSchema.validate(null).ok).toBe(true);
    });

    it('should work with chained validators', () => {
      // For coerced schemas, use refine for additional validation
      const schema = s.coerce.string().refine(
        (val) => val.length >= 2,
        'Must be at least 2 characters'
      );
      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(1).ok).toBe(false); // '1' is too short
    });
  });

  describe('s.coerce.number()', () => {
    it('should coerce string numbers', () => {
      const schema = s.coerce.number();
      expect(schema.validate('42')).toEqual({ ok: true, data: 42 });
      expect(schema.validate('3.14')).toEqual({ ok: true, data: 3.14 });
      expect(schema.validate('-10')).toEqual({ ok: true, data: -10 });
    });

    it('should coerce booleans to numbers', () => {
      const schema = s.coerce.number();
      expect(schema.validate(true)).toEqual({ ok: true, data: 1 });
      expect(schema.validate(false)).toEqual({ ok: true, data: 0 });
    });

    it('should pass through numbers', () => {
      const schema = s.coerce.number();
      expect(schema.validate(42)).toEqual({ ok: true, data: 42 });
    });

    it('should fail on non-numeric strings', () => {
      const schema = s.coerce.number();
      const result = schema.validate('not-a-number');
      expect(result.ok).toBe(false);
    });

    it('should work with chained validators', () => {
      // For coerced schemas, use refine for additional validation
      const schema = s.coerce.number().refine(
        (val) => Number.isInteger(val) && val >= 0,
        'Must be a non-negative integer'
      );
      expect(schema.validate('42').ok).toBe(true);
      expect(schema.validate('3.14').ok).toBe(false); // not an integer
      expect(schema.validate('-5').ok).toBe(false); // negative
    });
  });

  describe('s.coerce.boolean()', () => {
    it('should coerce string "true" values', () => {
      const schema = s.coerce.boolean();
      expect(schema.validate('true')).toEqual({ ok: true, data: true });
      expect(schema.validate('TRUE')).toEqual({ ok: true, data: true });
      expect(schema.validate('1')).toEqual({ ok: true, data: true });
      expect(schema.validate('yes')).toEqual({ ok: true, data: true });
      expect(schema.validate('on')).toEqual({ ok: true, data: true });
    });

    it('should coerce string "false" values', () => {
      const schema = s.coerce.boolean();
      expect(schema.validate('false')).toEqual({ ok: true, data: false });
      expect(schema.validate('FALSE')).toEqual({ ok: true, data: false });
      expect(schema.validate('0')).toEqual({ ok: true, data: false });
      expect(schema.validate('no')).toEqual({ ok: true, data: false });
      expect(schema.validate('off')).toEqual({ ok: true, data: false });
    });

    it('should coerce numbers to booleans', () => {
      const schema = s.coerce.boolean();
      expect(schema.validate(1)).toEqual({ ok: true, data: true });
      expect(schema.validate(0)).toEqual({ ok: true, data: false });
      expect(schema.validate(42)).toEqual({ ok: true, data: true });
      expect(schema.validate(-1)).toEqual({ ok: true, data: true });
    });

    it('should pass through booleans', () => {
      const schema = s.coerce.boolean();
      expect(schema.validate(true)).toEqual({ ok: true, data: true });
      expect(schema.validate(false)).toEqual({ ok: true, data: false });
    });

    it('should fail on non-coercible values', () => {
      const schema = s.coerce.boolean();
      const result = schema.validate('maybe');
      expect(result.ok).toBe(false);
    });
  });

  describe('s.coerce.date()', () => {
    it('should coerce ISO date strings', () => {
      const schema = s.coerce.date();
      const result = schema.validate('2024-01-15');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeInstanceOf(Date);
        expect(result.data.getFullYear()).toBe(2024);
        expect(result.data.getMonth()).toBe(0); // January
        expect(result.data.getDate()).toBe(15);
      }
    });

    it('should coerce ISO datetime strings', () => {
      const schema = s.coerce.date();
      const result = schema.validate('2024-01-15T10:30:00Z');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeInstanceOf(Date);
      }
    });

    it('should coerce timestamps (numbers)', () => {
      const schema = s.coerce.date();
      const timestamp = Date.now();
      const result = schema.validate(timestamp);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeInstanceOf(Date);
        expect(result.data.getTime()).toBe(timestamp);
      }
    });

    it('should pass through Date objects', () => {
      const schema = s.coerce.date();
      const date = new Date('2024-01-15');
      const result = schema.validate(date);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(date);
      }
    });

    it('should fail on invalid date strings', () => {
      const schema = s.coerce.date();
      const result = schema.validate('not-a-date');
      expect(result.ok).toBe(false);
    });
  });

  describe('Real-world coerce scenarios', () => {
    it('should parse form data (all strings)', () => {
      const formSchema = s.object({
        name: s.coerce.string().refine((v) => v.length >= 1, 'Required'),
        age: s.coerce.number().refine((v) => Number.isInteger(v) && v >= 0, 'Must be non-negative integer'),
        isAdmin: s.coerce.boolean(),
        birthDate: s.coerce.date(),
      });

      const formData = {
        name: 'John Doe',
        age: '30',
        isAdmin: 'false',
        birthDate: '1990-05-15',
      };

      const result = formSchema.validate(formData);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.name).toBe('John Doe');
        expect(result.data.age).toBe(30);
        expect(result.data.isAdmin).toBe(false);
        expect(result.data.birthDate).toBeInstanceOf(Date);
      }
    });

    it('should parse query parameters', () => {
      const querySchema = s.object({
        page: s.coerce.number().refine((v) => Number.isInteger(v) && v >= 1, 'Must be positive integer'),
        limit: s.coerce.number().refine((v) => Number.isInteger(v) && v >= 1 && v <= 100, 'Must be 1-100'),
        active: s.optional(s.coerce.boolean()),
      });

      const query1 = { page: '2', limit: '20' };
      const result1 = querySchema.validate(query1);
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.data.page).toBe(2);
        expect(result1.data.limit).toBe(20);
      }

      const query2 = { page: '1', limit: '50', active: 'true' };
      const result2 = querySchema.validate(query2);
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.data.active).toBe(true);
      }
    });

    it('should parse environment variables', () => {
      const envSchema = s.object({
        PORT: s.coerce.number().refine(
          (v) => Number.isInteger(v) && v >= 1 && v <= 65535,
          'Must be valid port'
        ),
        DEBUG: s.coerce.boolean(),
        TIMEOUT_MS: s.coerce.number().refine(
          (v) => Number.isInteger(v) && v > 0,
          'Must be positive integer'
        ),
        APP_NAME: s.coerce.string(),
      });

      const env = {
        PORT: '3000',
        DEBUG: '1',
        TIMEOUT_MS: '5000',
        APP_NAME: 123, // numeric app name (edge case)
      };

      const result = envSchema.validate(env);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.PORT).toBe(3000);
        expect(result.data.DEBUG).toBe(true);
        expect(result.data.TIMEOUT_MS).toBe(5000);
        expect(result.data.APP_NAME).toBe('123');
      }
    });
  });
});
