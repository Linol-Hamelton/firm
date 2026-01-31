/**
 * Record, Map, and Set Validator Tests
 */

import { describe, it, expect } from 'vitest';
import { s } from '../../../src/index';

describe('RecordValidator', () => {
  describe('basic validation', () => {
    it('should validate record with string values', () => {
      const schema = s.record(s.string());

      expect(schema.validate({ a: 'one', b: 'two' }).ok).toBe(true);
      expect(schema.validate({}).ok).toBe(true);
    });

    it('should validate record with number values', () => {
      const schema = s.record(s.number());

      expect(schema.validate({ a: 1, b: 2 }).ok).toBe(true);
      expect(schema.validate({ a: 'one' }).ok).toBe(false);
    });

    it('should reject non-objects', () => {
      const schema = s.record(s.string());

      expect(schema.validate('not object').ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
      expect(schema.validate(123).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.record(s.number());

      expect(schema.is({ a: 1, b: 2 })).toBe(true);
      expect(schema.is({ a: 'one' })).toBe(false);
    });
  });

  describe('nested records', () => {
    it('should validate record of objects', () => {
      const schema = s.record(s.object({
        name: s.string(),
        value: s.number(),
      }));

      expect(schema.validate({
        item1: { name: 'one', value: 1 },
        item2: { name: 'two', value: 2 },
      }).ok).toBe(true);

      expect(schema.validate({
        item1: { name: 'one', value: 'not number' },
      }).ok).toBe(false);
    });

    it('should validate record of arrays', () => {
      const schema = s.record(s.array(s.number()));

      expect(schema.validate({
        a: [1, 2, 3],
        b: [4, 5, 6],
      }).ok).toBe(true);
    });
  });

  describe('error reporting', () => {
    it('should report errors with key path', () => {
      const schema = s.record(s.number());
      const result = schema.validate({ a: 1, b: 'not number', c: 3 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.path).toBe('b');
      }
    });

    it('should report multiple value errors', () => {
      const schema = s.record(s.number());
      const result = schema.validate({ a: 'x', b: 'y' });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBe(2);
      }
    });
  });

  describe('optional and nullable', () => {
    it('should allow undefined when optional', () => {
      const schema = s.record(s.string()).optional();

      expect(schema.validate({ a: 'test' }).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
    });

    it('should allow null when nullable', () => {
      const schema = s.record(s.string()).nullable();

      expect(schema.validate({ a: 'test' }).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
    });
  });
});

describe('MapValidator', () => {
  describe('basic validation', () => {
    it('should validate Map instances', () => {
      const schema = s.map(s.string(), s.number());

      const validMap = new Map([
        ['a', 1],
        ['b', 2],
      ]);

      expect(schema.validate(validMap).ok).toBe(true);
    });

    it('should validate empty Map', () => {
      const schema = s.map(s.string(), s.number());

      expect(schema.validate(new Map()).ok).toBe(true);
    });

    it('should reject non-Map values', () => {
      const schema = s.map(s.string(), s.number());

      expect(schema.validate({}).ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should validate key types', () => {
      const schema = s.map(s.number(), s.string());

      const validMap = new Map([[1, 'one']]);
      const invalidMap = new Map([['one', 'value']]);

      expect(schema.validate(validMap).ok).toBe(true);
      expect(schema.validate(invalidMap).ok).toBe(false);
    });

    it('should validate value types', () => {
      const schema = s.map(s.string(), s.number());

      const validMap = new Map([['a', 1]]);
      const invalidMap = new Map([['a', 'not number']]);

      expect(schema.validate(validMap).ok).toBe(true);
      expect(schema.validate(invalidMap).ok).toBe(false);
    });
  });

  describe('complex maps', () => {
    it('should validate Map with object values', () => {
      const schema = s.map(
        s.string(),
        s.object({ id: s.number(), name: s.string() })
      );

      const validMap = new Map([
        ['user1', { id: 1, name: 'John' }],
        ['user2', { id: 2, name: 'Jane' }],
      ]);

      expect(schema.validate(validMap).ok).toBe(true);
    });
  });
});

describe('SetValidator', () => {
  describe('basic validation', () => {
    it('should validate Set instances', () => {
      const schema = s.set(s.number());

      const validSet = new Set([1, 2, 3]);

      expect(schema.validate(validSet).ok).toBe(true);
    });

    it('should validate empty Set', () => {
      const schema = s.set(s.string());

      expect(schema.validate(new Set()).ok).toBe(true);
    });

    it('should reject non-Set values', () => {
      const schema = s.set(s.number());

      expect(schema.validate([1, 2, 3]).ok).toBe(false);
      expect(schema.validate({}).ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should validate element types', () => {
      const schema = s.set(s.string());

      const validSet = new Set(['a', 'b', 'c']);
      const invalidSet = new Set([1, 2, 3]);

      expect(schema.validate(validSet).ok).toBe(true);
      expect(schema.validate(invalidSet as any).ok).toBe(false);
    });
  });

  describe('size constraints', () => {
    it('should validate min size', () => {
      const schema = s.set(s.number()).min(2);

      expect(schema.validate(new Set([1, 2])).ok).toBe(true);
      expect(schema.validate(new Set([1, 2, 3])).ok).toBe(true);
      expect(schema.validate(new Set([1])).ok).toBe(false);
    });

    it('should validate max size', () => {
      const schema = s.set(s.number()).max(3);

      expect(schema.validate(new Set([1, 2, 3])).ok).toBe(true);
      expect(schema.validate(new Set([1, 2, 3, 4])).ok).toBe(false);
    });

    it('should validate exact size', () => {
      const schema = s.set(s.number()).size(3);

      expect(schema.validate(new Set([1, 2, 3])).ok).toBe(true);
      expect(schema.validate(new Set([1, 2])).ok).toBe(false);
      expect(schema.validate(new Set([1, 2, 3, 4])).ok).toBe(false);
    });

    it('should validate nonempty', () => {
      const schema = s.set(s.string()).nonempty();

      expect(schema.validate(new Set(['a'])).ok).toBe(true);
      expect(schema.validate(new Set()).ok).toBe(false);
    });
  });

  describe('complex sets', () => {
    it('should validate Set of objects', () => {
      const schema = s.set(s.object({
        id: s.number(),
      }));

      const validSet = new Set([{ id: 1 }, { id: 2 }]);

      expect(schema.validate(validSet).ok).toBe(true);
    });
  });
});
