/**
 * Boolean Validator Tests
 */

import { s } from '../../../src/index';

describe('BooleanValidator', () => {
  describe('basic validation', () => {
    it('should validate true', () => {
      const schema = s.boolean();

      expect(schema.validate(true).ok).toBe(true);
      const result = schema.validate(true);
      if (result.ok) {
        expect(result.data).toBe(true);
      }
    });

    it('should validate false', () => {
      const schema = s.boolean();

      expect(schema.validate(false).ok).toBe(true);
      const result = schema.validate(false);
      if (result.ok) {
        expect(result.data).toBe(false);
      }
    });

    it('should reject non-booleans', () => {
      const schema = s.boolean();

      expect(schema.validate(1).ok).toBe(false);
      expect(schema.validate(0).ok).toBe(false);
      expect(schema.validate('true').ok).toBe(false);
      expect(schema.validate('false').ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate(undefined).ok).toBe(false);
      expect(schema.validate({}).ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.boolean();

      expect(schema.is(true)).toBe(true);
      expect(schema.is(false)).toBe(true);
      expect(schema.is(1)).toBe(false);
      expect(schema.is('true')).toBe(false);
    });
  });

  describe('optional and nullable', () => {
    it('should allow undefined when optional', () => {
      const schema = s.boolean().optional();

      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(false).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should allow null when nullable', () => {
      const schema = s.boolean().nullable();

      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(false).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(false);
    });

    it('should allow both null and undefined when nullish', () => {
      const schema = s.boolean().nullish();

      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(false).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
    });

    it('should use default value for undefined', () => {
      const schema = s.boolean().default(false);
      const result = schema.validate(undefined);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(false);
      }
    });

    it('should use default value true', () => {
      const schema = s.boolean().default(true);
      const result = schema.validate(undefined);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(true);
      }
    });
  });

  describe('parse and assert', () => {
    it('should parse valid boolean', () => {
      const schema = s.boolean();

      expect(schema.parse(true)).toBe(true);
      expect(schema.parse(false)).toBe(false);
    });

    it('should throw on parse invalid value', () => {
      const schema = s.boolean();

      expect(() => schema.parse('true')).toThrow();
      expect(() => schema.parse(1)).toThrow();
    });

    it('should assert valid boolean', () => {
      const schema = s.boolean();

      expect(() => schema.assert(true)).not.toThrow();
      expect(() => schema.assert(false)).not.toThrow();
    });

    it('should throw on assert invalid value', () => {
      const schema = s.boolean();

      expect(() => schema.assert('true')).toThrow();
      expect(() => schema.assert(null)).toThrow();
    });
  });

  describe('error messages', () => {
    it('should return correct error code', () => {
      const schema = s.boolean();
      const result = schema.validate('not a boolean');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('NOT_BOOLEAN');
      }
    });

    it('should support custom error message', () => {
      const schema = s.boolean().errorMessage('Must be a boolean value');
      const result = schema.validate('invalid');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.message).toBe('Must be a boolean value');
      }
    });
  });

  describe('description', () => {
    it('should support describe()', () => {
      const schema = s.boolean().describe('Is active flag');

      // Schema should still work normally
      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(false).ok).toBe(true);
    });
  });

  describe('true() refinement', () => {
    it('should only accept true', () => {
      const schema = s.boolean().true();

      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(false).ok).toBe(false);
    });

    it('should fail with proper error message', () => {
      const schema = s.boolean().true();
      const result = schema.validate(false);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.message).toContain('must be true');
      }
    });
  });

  describe('false() refinement', () => {
    it('should only accept false', () => {
      const schema = s.boolean().false();

      expect(schema.validate(false).ok).toBe(true);
      expect(schema.validate(true).ok).toBe(false);
    });

    it('should fail with proper error message', () => {
      const schema = s.boolean().false();
      const result = schema.validate(true);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.message).toContain('must be false');
      }
    });

    it('should reject non-boolean values', () => {
      const schema = s.boolean().false();

      expect(schema.validate('false').ok).toBe(false);
      expect(schema.validate(0).ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should work with is() type guard', () => {
      const trueSchema = s.boolean().true();
      const falseSchema = s.boolean().false();

      expect(trueSchema.is(true)).toBe(true);
      expect(trueSchema.is(false)).toBe(false);

      expect(falseSchema.is(false)).toBe(true);
      expect(falseSchema.is(true)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle type coercion explicitly', () => {
      const schema = s.boolean();

      // These should fail - no automatic coercion
      expect(schema.validate(1).ok).toBe(false);
      expect(schema.validate('true').ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
    });

    it('should chain modifiers correctly', () => {
      const schema = s.boolean().optional().nullable();

      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(false).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
    });
  });
});
