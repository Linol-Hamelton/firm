/**
 * Union, Intersection, and Discriminated Union Validator Tests
 */

import { describe, it, expect } from 'vitest';
import { s } from '../../../src/index.js';

describe('UnionValidator', () => {
  describe('basic validation', () => {
    it('should validate string | number union', () => {
      const schema = s.union([s.string(), s.number()]);

      expect(schema.validate('hello').ok).toBe(true);
      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(true).ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should validate with multiple types', () => {
      const schema = s.union([s.string(), s.number(), s.boolean()]);

      expect(schema.validate('test').ok).toBe(true);
      expect(schema.validate(123).ok).toBe(true);
      expect(schema.validate(true).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.union([s.string(), s.number()]);

      expect(schema.is('test')).toBe(true);
      expect(schema.is(42)).toBe(true);
      expect(schema.is(true)).toBe(false);
    });
  });

  describe('union of literals', () => {
    it('should validate union of string literals', () => {
      const schema = s.union([
        s.literal('pending'),
        s.literal('active'),
        s.literal('completed'),
      ]);

      expect(schema.validate('pending').ok).toBe(true);
      expect(schema.validate('active').ok).toBe(true);
      expect(schema.validate('completed').ok).toBe(true);
      expect(schema.validate('unknown').ok).toBe(false);
    });
  });

  describe('union of objects', () => {
    it('should validate union of different object shapes', () => {
      const schema = s.union([
        s.object({ type: s.literal('user'), name: s.string() }),
        s.object({ type: s.literal('admin'), role: s.string() }),
      ]);

      expect(schema.validate({ type: 'user', name: 'John' }).ok).toBe(true);
      expect(schema.validate({ type: 'admin', role: 'superuser' }).ok).toBe(true);
      expect(schema.validate({ type: 'guest' }).ok).toBe(false);
    });
  });

  describe('error handling', () => {
    it('should return UNION_NO_MATCH error code', () => {
      const schema = s.union([s.string(), s.number()]);
      const result = schema.validate(true);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('UNION_NO_MATCH');
      }
    });
  });

  describe('optional and nullable', () => {
    it('should allow undefined when optional', () => {
      const schema = s.union([s.string(), s.number()]).optional();

      expect(schema.validate('test').ok).toBe(true);
      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
    });

    it('should allow null when nullable', () => {
      const schema = s.union([s.string(), s.number()]).nullable();

      expect(schema.validate('test').ok).toBe(true);
      expect(schema.validate(42).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
    });
  });
});

describe('IntersectionValidator', () => {
  describe('basic validation', () => {
    it('should validate intersection of objects', () => {
      const schema = s.intersection([
        s.object({ name: s.string() }),
        s.object({ age: s.number() }),
      ]);

      expect(schema.validate({ name: 'John', age: 30 }).ok).toBe(true);
    });

    it('should reject if any part fails', () => {
      const schema = s.intersection([
        s.object({ name: s.string() }),
        s.object({ age: s.number() }),
      ]);

      expect(schema.validate({ name: 'John' }).ok).toBe(false);
      expect(schema.validate({ age: 30 }).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.intersection([
        s.object({ a: s.string() }),
        s.object({ b: s.number() }),
      ]);

      expect(schema.is({ a: 'test', b: 42 })).toBe(true);
      expect(schema.is({ a: 'test' })).toBe(false);
    });
  });

  describe('complex intersections', () => {
    it('should validate nested object intersections', () => {
      const schema = s.intersection([
        s.object({
          user: s.object({ id: s.number() }),
        }),
        s.object({
          user: s.object({ name: s.string() }),
        }),
      ]);

      // Note: This tests the intersection merge behavior
      const result = schema.validate({
        user: { id: 1, name: 'John' },
      });

      expect(result.ok).toBe(true);
    });
  });
});

describe('DiscriminatedUnionValidator', () => {
  describe('basic validation', () => {
    it('should validate discriminated union', () => {
      const schema = s.discriminatedUnion('type', [
        s.object({ type: s.literal('user'), name: s.string() }),
        s.object({ type: s.literal('admin'), permissions: s.array(s.string()) }),
      ]);

      expect(schema.validate({
        type: 'user',
        name: 'John',
      }).ok).toBe(true);

      expect(schema.validate({
        type: 'admin',
        permissions: ['read', 'write'],
      }).ok).toBe(true);
    });

    it('should reject invalid discriminator value', () => {
      const schema = s.discriminatedUnion('type', [
        s.object({ type: s.literal('a'), value: s.string() }),
        s.object({ type: s.literal('b'), value: s.number() }),
      ]);

      const result = schema.validate({ type: 'c', value: 'test' });
      expect(result.ok).toBe(false);
    });

    it('should reject missing discriminator', () => {
      const schema = s.discriminatedUnion('type', [
        s.object({ type: s.literal('a'), value: s.string() }),
      ]);

      const result = schema.validate({ value: 'test' });
      expect(result.ok).toBe(false);
    });

    it('should reject non-object values', () => {
      const schema = s.discriminatedUnion('type', [
        s.object({ type: s.literal('a') }),
      ]);

      expect(schema.validate('not object').ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
    });
  });

  describe('complex discriminated unions', () => {
    it('should validate API response types', () => {
      const schema = s.discriminatedUnion('status', [
        s.object({
          status: s.literal('success'),
          data: s.object({ id: s.number(), name: s.string() }),
        }),
        s.object({
          status: s.literal('error'),
          error: s.object({ code: s.number(), message: s.string() }),
        }),
      ]);

      expect(schema.validate({
        status: 'success',
        data: { id: 1, name: 'Test' },
      }).ok).toBe(true);

      expect(schema.validate({
        status: 'error',
        error: { code: 404, message: 'Not found' },
      }).ok).toBe(true);
    });
  });
});
