/**
 * Auto-Fix Mode Tests
 * Revolutionary Feature #10
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { s } from '../../../src/index';
import {
  AutoFixer,
  withAutoFix,
  withAutoFixConfig,
  enableAutoFix,
  disableAutoFix,
} from '../../../src/infrastructure/auto-fix/index.js';

describe('Auto-Fix Mode', () => {
  describe('AutoFixer', () => {
    let fixer: AutoFixer;

    beforeEach(() => {
      fixer = new AutoFixer({
        enabled: true,
        strategies: ['all'],
      });
    });

    it('should trim strings', () => {
      const result = fixer.fix('  hello  ', {
        errorCode: 'STRING_TOO_SHORT',
        path: 'name',
        originalValue: '  hello  ',
      });

      expect(result.fixed).toBe(true);
      expect(result.value).toBe('hello');
    });

    it('should normalize whitespace', () => {
      const result = fixer.fix('hello    world', {
        errorCode: 'STRING_TOO_LONG',
        path: 'text',
        originalValue: 'hello    world',
      });

      expect(result.fixed).toBe(true);
      expect(result.value).toBe('hello world');
    });

    it('should parse numbers from strings', () => {
      const result = fixer.fix('42', {
        errorCode: 'NOT_NUMBER',
        path: 'age',
        originalValue: '42',
      });

      expect(result.fixed).toBe(true);
      expect(result.value).toBe(42);
    });

    it('should round numbers to integers', () => {
      const result = fixer.fix(42.7, {
        errorCode: 'NUMBER_NOT_INTEGER',
        path: 'count',
        originalValue: 42.7,
      });

      expect(result.fixed).toBe(true);
      expect(result.value).toBe(43);
    });

    it('should parse booleans from strings', () => {
      expect(fixer.fix('true', {
        errorCode: 'NOT_BOOLEAN',
        path: 'active',
        originalValue: 'true',
      }).value).toBe(true);

      expect(fixer.fix('false', {
        errorCode: 'NOT_BOOLEAN',
        path: 'active',
        originalValue: 'false',
      }).value).toBe(false);

      expect(fixer.fix('1', {
        errorCode: 'NOT_BOOLEAN',
        path: 'active',
        originalValue: '1',
      }).value).toBe(true);

      expect(fixer.fix('0', {
        errorCode: 'NOT_BOOLEAN',
        path: 'active',
        originalValue: '0',
      }).value).toBe(false);
    });

    it('should parse dates from strings', () => {
      const result = fixer.fix('2024-01-01', {
        errorCode: 'NOT_DATE',
        path: 'createdAt',
        originalValue: '2024-01-01',
      });

      expect(result.fixed).toBe(true);
      expect(result.value).toBeInstanceOf(Date);
    });

    it('should fix URLs by adding protocol', () => {
      const result = fixer.fix('example.com', {
        errorCode: 'STRING_INVALID_URL',
        path: 'website',
        originalValue: 'example.com',
      });

      expect(result.fixed).toBe(true);
      expect(result.value).toBe('https://example.com');
    });

    it('should fix email format', () => {
      const result = fixer.fix('  JOHN@EXAMPLE.COM  ', {
        errorCode: 'STRING_INVALID_EMAIL',
        path: 'email',
        originalValue: '  JOHN@EXAMPLE.COM  ',
      });

      expect(result.fixed).toBe(true);
      expect(result.value).toBe('john@example.com');
    });

    it('should not fix when disabled', () => {
      fixer.disable();

      const result = fixer.fix('  hello  ', {
        errorCode: 'STRING_TOO_SHORT',
        path: 'name',
        originalValue: '  hello  ',
      });

      expect(result.fixed).toBe(false);
      expect(result.value).toBe('  hello  ');
    });
  });

  describe('withAutoFix', () => {
    beforeEach(() => {
      enableAutoFix();
    });

    afterEach(() => {
      disableAutoFix();
    });

    it('should auto-fix string validation', () => {
      const schema = s.string().min(5);
      const autoFixSchema = withAutoFix(schema);

      // Without auto-fix, this would fail
      const result = autoFixSchema.validate('  hello  ');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hello');
      }
    });

    it('should auto-fix number coercion', () => {
      const schema = s.number().int();
      const autoFixSchema = withAutoFix(schema);

      const result = autoFixSchema.validate('42');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(42);
      }
    });

    it('should auto-fix boolean coercion', () => {
      const schema = s.boolean();
      const autoFixSchema = withAutoFix(schema);

      const result1 = autoFixSchema.validate('true');
      expect(result1.ok).toBe(true);
      if (result1.ok) {
        expect(result1.data).toBe(true);
      }

      const result2 = autoFixSchema.validate('false');
      expect(result2.ok).toBe(true);
      if (result2.ok) {
        expect(result2.data).toBe(false);
      }
    });

    it('should auto-fix date parsing', () => {
      const schema = s.date();
      const autoFixSchema = withAutoFix(schema);

      const result = autoFixSchema.validate('2024-01-01');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeInstanceOf(Date);
      }
    });

    it('should auto-fix email format', () => {
      const schema = s.string().email();
      const autoFixSchema = withAutoFix(schema);

      const result = autoFixSchema.validate('  JOHN@EXAMPLE.COM  ');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('john@example.com');
      }
    });

    it('should auto-fix complex objects', () => {
      const schema = s.object({
        name: s.string().min(1),
        email: s.string().email(),
        age: s.number().int(),
        active: s.boolean(),
      });

      const autoFixSchema = withAutoFix(schema);

      const result = autoFixSchema.validate({
        name: '  John  ',
        email: 'JOHN@EXAMPLE.COM',
        age: '30',
        active: 'true',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({
          name: 'John',
          email: 'john@example.com',
          age: 30,
          active: true,
        });
      }
    });

    it('should work with nested objects', () => {
      const schema = s.object({
        user: s.object({
          name: s.string().min(1),
          email: s.string().email(),
        }),
        count: s.number().int(),
      });

      const autoFixSchema = withAutoFix(schema);

      const result = autoFixSchema.validate({
        user: {
          name: '  Jane  ',
          email: 'JANE@EXAMPLE.COM',
        },
        count: '42',
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.user.name).toBe('Jane');
        expect(result.data.user.email).toBe('jane@example.com');
        expect(result.data.count).toBe(42);
      }
    });
  });

  describe('withAutoFixConfig', () => {
    it('should use specific strategies', () => {
      const schema = s.string().min(5);

      const autoFixSchema = withAutoFixConfig(schema, {
        enabled: true,
        strategies: ['trim'],
      });

      const result = autoFixSchema.validate('  hello  ');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hello');
      }
    });

    it('should not apply disabled strategies', () => {
      const schema = s.number();

      // Only trim strategy, no coerce
      const autoFixSchema = withAutoFixConfig(schema, {
        enabled: true,
        strategies: ['trim'],
      });

      const result = autoFixSchema.validate('42');

      // Should fail because coerce is not enabled
      expect(result.ok).toBe(false);
    });

    it('should support custom fix functions', () => {
      const schema = s.string().min(5);

      const autoFixSchema = withAutoFixConfig(schema, {
        enabled: true,
        strategies: [],
        customFixes: {
          STRING_TOO_SHORT: (value) => {
            if (typeof value === 'string') {
              return value + '!!!';
            }
            return value;
          },
        },
      });

      const result = autoFixSchema.validate('hi');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hi!!!');
      }
    });
  });

  describe('Combined with caching', () => {
    it('should work together with cache', () => {
      enableAutoFix();

      const schema = s.object({
        name: s.string().min(1),
        age: s.number().int(),
      });

      // Apply both auto-fix and caching
      // Note: Order matters - apply auto-fix first, then cache
      const { withCache } = require('../../../src/infrastructure/caching/index.js');
      const autoFixSchema = withAutoFix(schema);
      const cachedSchema = withCache(autoFixSchema);

      const data = {
        name: '  John  ',
        age: '30',
      };

      // First call - auto-fix and cache
      const result1 = cachedSchema.validate(data);
      expect(result1.ok).toBe(true);

      // Second call - from cache
      const result2 = cachedSchema.validate(data);
      expect(result2).toEqual(result1);

      disableAutoFix();
    });
  });
});
