/**
 * Number Validator Tests
 */

import { s } from '../../../src/index';

describe('NumberValidator', () => {
  describe('basic validation', () => {
    it('should validate numbers', () => {
      const schema = s.number();

      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(-10).ok).toBe(true);
      expect(schema.validate(3.14).ok).toBe(true);
    });

    it('should reject non-numbers', () => {
      const schema = s.number();

      expect(schema.validate('42').ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate(undefined).ok).toBe(false);
      expect(schema.validate({}).ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
      expect(schema.validate(true).ok).toBe(false);
    });

    it('should reject NaN', () => {
      const schema = s.number();

      expect(schema.validate(NaN).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.number();

      expect(schema.is(42)).toBe(true);
      expect(schema.is('42')).toBe(false);
      expect(schema.is(NaN)).toBe(false);
    });
  });

  describe('range constraints', () => {
    it('should validate min', () => {
      const schema = s.number().min(5);

      expect(schema.validate(5).ok).toBe(true);
      expect(schema.validate(10).ok).toBe(true);
      expect(schema.validate(4).ok).toBe(false);
    });

    it('should validate max', () => {
      const schema = s.number().max(10);

      expect(schema.validate(10).ok).toBe(true);
      expect(schema.validate(5).ok).toBe(true);
      expect(schema.validate(11).ok).toBe(false);
    });

    it('should validate min and max together', () => {
      const schema = s.number().min(0).max(100);

      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(50).ok).toBe(true);
      expect(schema.validate(100).ok).toBe(true);
      expect(schema.validate(-1).ok).toBe(false);
      expect(schema.validate(101).ok).toBe(false);
    });

    it('should validate gt (exclusive)', () => {
      const schema = s.number().gt(5);

      expect(schema.validate(6).ok).toBe(true);
      expect(schema.validate(5.01).ok).toBe(true);
      // Note: gt uses epsilon, so 5 should fail
    });

    it('should validate lt (exclusive)', () => {
      const schema = s.number().lt(10);

      expect(schema.validate(9).ok).toBe(true);
      expect(schema.validate(9.99).ok).toBe(true);
    });

    it('should validate gte (inclusive)', () => {
      const schema = s.number().gte(5);

      expect(schema.validate(5).ok).toBe(true);
      expect(schema.validate(6).ok).toBe(true);
      expect(schema.validate(4).ok).toBe(false);
    });

    it('should validate lte (inclusive)', () => {
      const schema = s.number().lte(10);

      expect(schema.validate(10).ok).toBe(true);
      expect(schema.validate(9).ok).toBe(true);
      expect(schema.validate(11).ok).toBe(false);
    });
  });

  describe('type constraints', () => {
    it('should validate integers', () => {
      const schema = s.number().int();

      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(-10).ok).toBe(true);
      expect(schema.validate(3.14).ok).toBe(false);
      expect(schema.validate(1.5).ok).toBe(false);
    });

    it('should validate positive numbers', () => {
      const schema = s.number().positive();

      expect(schema.validate(1).ok).toBe(true);
      expect(schema.validate(0.001).ok).toBe(true);
      expect(schema.validate(0).ok).toBe(false);
      expect(schema.validate(-1).ok).toBe(false);
    });

    it('should validate negative numbers', () => {
      const schema = s.number().negative();

      expect(schema.validate(-1).ok).toBe(true);
      expect(schema.validate(-0.001).ok).toBe(true);
      expect(schema.validate(0).ok).toBe(false);
      expect(schema.validate(1).ok).toBe(false);
    });

    it('should validate nonnegative numbers', () => {
      const schema = s.number().nonnegative();

      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(1).ok).toBe(true);
      expect(schema.validate(-1).ok).toBe(false);
    });

    it('should validate nonpositive numbers', () => {
      const schema = s.number().nonpositive();

      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(-1).ok).toBe(true);
      expect(schema.validate(1).ok).toBe(false);
    });

    it('should validate finite numbers', () => {
      const schema = s.number().finite();

      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(Infinity).ok).toBe(false);
      expect(schema.validate(-Infinity).ok).toBe(false);
    });

    it('should validate safe integers', () => {
      const schema = s.number().safe();

      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(Number.MAX_SAFE_INTEGER).ok).toBe(true);
      expect(schema.validate(Number.MAX_SAFE_INTEGER + 1).ok).toBe(false);
    });
  });

  describe('multipleOf constraint', () => {
    it('should validate multipleOf', () => {
      const schema = s.number().multipleOf(5);

      expect(schema.validate(0).ok).toBe(true);
      expect(schema.validate(5).ok).toBe(true);
      expect(schema.validate(10).ok).toBe(true);
      expect(schema.validate(15).ok).toBe(true);
      expect(schema.validate(3).ok).toBe(false);
      expect(schema.validate(7).ok).toBe(false);
    });

    it('should validate multipleOf with decimals', () => {
      const schema = s.number().multipleOf(0.1);

      expect(schema.validate(0.1).ok).toBe(true);
      expect(schema.validate(0.2).ok).toBe(true);
      expect(schema.validate(1.0).ok).toBe(true);
    });
  });

  describe('chained constraints', () => {
    it('should validate int().positive().max()', () => {
      const schema = s.number().int().positive().max(100);

      expect(schema.validate(1).ok).toBe(true);
      expect(schema.validate(50).ok).toBe(true);
      expect(schema.validate(100).ok).toBe(true);
      expect(schema.validate(0).ok).toBe(false);
      expect(schema.validate(-1).ok).toBe(false);
      expect(schema.validate(101).ok).toBe(false);
      expect(schema.validate(50.5).ok).toBe(false);
    });
  });

  describe('optional and nullable', () => {
    it('should allow undefined when optional', () => {
      const schema = s.number().optional();

      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should allow null when nullable', () => {
      const schema = s.number().nullable();

      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(false);
    });

    it('should use default value', () => {
      const schema = s.number().default(0);
      const result = schema.validate(undefined);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(0);
      }
    });
  });

  describe('error messages', () => {
    it('should return correct error code for type mismatch', () => {
      const schema = s.number();
      const result = schema.validate('not a number');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('NOT_NUMBER');
      }
    });

    it('should return correct error code for min violation', () => {
      const schema = s.number().min(10);
      const result = schema.validate(5);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('NUMBER_TOO_SMALL');
      }
    });

    it('should return correct error code for max violation', () => {
      const schema = s.number().max(10);
      const result = schema.validate(15);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('NUMBER_TOO_BIG');
      }
    });
  });
});
