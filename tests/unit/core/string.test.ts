/**
 * String Validator Tests
 */

import { s } from '../../../src/index.ts';

describe('StringValidator', () => {
  describe('basic validation', () => {
    // @ts-ignore
    it('should validate strings', () => {
      const schema = s.string();

      // @ts-ignore
      expect(schema.validate('hello').ok).toBe(true);
      // @ts-ignore
      expect(schema.validate('').ok).toBe(true);
      // @ts-ignore
      expect(schema.validate('123').ok).toBe(true);
    });

    it('should reject non-strings', () => {
      const schema = s.string();

      expect(schema.validate(123).ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate(undefined).ok).toBe(false);
      expect(schema.validate({}).ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.string();

      expect(schema.is('hello')).toBe(true);
      expect(schema.is(123)).toBe(false);
    });
  });

  describe('length constraints', () => {
    it('should validate min length', () => {
      const schema = s.string().min(3);

      expect(schema.validate('abc').ok).toBe(true);
      expect(schema.validate('abcd').ok).toBe(true);
      expect(schema.validate('ab').ok).toBe(false);
    });

    it('should validate max length', () => {
      const schema = s.string().max(5);

      expect(schema.validate('abc').ok).toBe(true);
      expect(schema.validate('abcde').ok).toBe(true);
      expect(schema.validate('abcdef').ok).toBe(false);
    });

    it('should validate exact length', () => {
      const schema = s.string().length(4);

      expect(schema.validate('abcd').ok).toBe(true);
      expect(schema.validate('abc').ok).toBe(false);
      expect(schema.validate('abcde').ok).toBe(false);
    });

    it('should validate nonempty', () => {
      const schema = s.string().nonempty();

      expect(schema.validate('a').ok).toBe(true);
      expect(schema.validate('').ok).toBe(false);
    });
  });

  describe('format validators', () => {
    it('should validate email', () => {
      const schema = s.string().email();

      expect(schema.validate('test@example.com').ok).toBe(true);
      expect(schema.validate('user.name@domain.org').ok).toBe(true);
      expect(schema.validate('invalid').ok).toBe(false);
      expect(schema.validate('no@domain').ok).toBe(false);
    });

    it('should validate url', () => {
      const schema = s.string().url();

      expect(schema.validate('https://example.com').ok).toBe(true);
      expect(schema.validate('http://localhost:3000').ok).toBe(true);
      expect(schema.validate('not-a-url').ok).toBe(false);
    });

    it('should validate uuid', () => {
      const schema = s.string().uuid();

      expect(schema.validate('550e8400-e29b-41d4-a716-446655440000').ok).toBe(true);
      expect(schema.validate('not-a-uuid').ok).toBe(false);
    });
  });

  describe('transforms', () => {
    it('should trim whitespace', () => {
      const schema = s.string().trim();
      const result = schema.validate('  hello  ');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hello');
      }
    });

    it('should convert to lowercase', () => {
      const schema = s.string().toLowerCase();
      const result = schema.validate('HELLO');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hello');
      }
    });

    it('should convert to uppercase', () => {
      const schema = s.string().toUpperCase();
      const result = schema.validate('hello');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('HELLO');
      }
    });

    it('should chain transforms', () => {
      const schema = s.string().trim().toLowerCase();
      const result = schema.validate('  HELLO  ');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hello');
      }
    });
  });

  describe('pattern matching', () => {
    it('should validate regex pattern', () => {
      const schema = s.string().regex(/^[a-z]+$/);

      expect(schema.validate('abc').ok).toBe(true);
      expect(schema.validate('ABC').ok).toBe(false);
      expect(schema.validate('123').ok).toBe(false);
    });
  });

  describe('optional and nullable', () => {
    it('should allow undefined when optional', () => {
      const schema = s.string().optional();

      expect(schema.validate('hello').ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should allow null when nullable', () => {
      const schema = s.string().nullable();

      expect(schema.validate('hello').ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(false);
    });

    it('should use default value', () => {
      const schema = s.string().default('default');
      const result = schema.validate(undefined);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('default');
      }
    });
  });
});

export {};
