/**
 * Schema Compiler Tests
 */

import { s, compile } from '../../../src/index';

describe('SchemaCompiler', () => {
  describe('compile() function', () => {
    it('should compile string schema', () => {
      const schema = s.string();
      const validator = compile(schema);

      expect(validator('hello').ok).toBe(true);
      expect(validator(123).ok).toBe(false);
    });

    it('should compile number schema', () => {
      const schema = s.number();
      const validator = compile(schema);

      expect(validator(42).ok).toBe(true);
      expect(validator('42').ok).toBe(false);
    });

    it('should compile boolean schema', () => {
      const schema = s.boolean();
      const validator = compile(schema);

      expect(validator(true).ok).toBe(true);
      expect(validator(false).ok).toBe(true);
      expect(validator('true').ok).toBe(false);
    });

    it('should compile object schema', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
      });
      const validator = compile(schema);

      expect(validator({ name: 'John', age: 30 }).ok).toBe(true);
      expect(validator({ name: 'John', age: 'thirty' }).ok).toBe(false);
    });

    it('should compile array schema', () => {
      const schema = s.array(s.number());
      const validator = compile(schema);

      expect(validator([1, 2, 3]).ok).toBe(true);
      expect(validator(['a', 'b']).ok).toBe(false);
    });
  });

  describe('compiled validator.is()', () => {
    it('should provide is() method on compiled validator', () => {
      const schema = s.string();
      const validator = compile(schema);

      expect(validator.is('hello')).toBe(true);
      expect(validator.is(123)).toBe(false);
    });

    it('should work with complex schemas', () => {
      const schema = s.object({
        items: s.array(s.number()),
      });
      const validator = compile(schema);

      expect(validator.is({ items: [1, 2, 3] })).toBe(true);
      expect(validator.is({ items: ['a'] })).toBe(false);
    });
  });

  describe('s.compile() method', () => {
    it('should compile via s.compile()', () => {
      const schema = s.string().min(3);
      const validator = s.compile(schema);

      expect(validator('hello').ok).toBe(true);
      expect(validator('hi').ok).toBe(false);
    });
  });

  describe('schema.compile() method', () => {
    it('should compile via schema.compile()', () => {
      const schema = s.number().min(0).max(100);
      const validator = schema.compile();

      expect(validator(50).ok).toBe(true);
      expect(validator(150).ok).toBe(false);
    });
  });

  describe('compiled string constraints', () => {
    it('should validate minLength', () => {
      const schema = s.string().min(5);
      const validator = compile(schema);

      expect(validator('hello').ok).toBe(true);
      expect(validator('hi').ok).toBe(false);
    });

    it('should validate maxLength', () => {
      const schema = s.string().max(5);
      const validator = compile(schema);

      expect(validator('hello').ok).toBe(true);
      expect(validator('hello world').ok).toBe(false);
    });

    it('should validate pattern', () => {
      const schema = s.string().regex(/^[a-z]+$/);
      const validator = compile(schema);

      expect(validator('abc').ok).toBe(true);
      expect(validator('ABC').ok).toBe(false);
    });

    it('should apply transforms', () => {
      const schema = s.string().trim().toLowerCase();
      const validator = compile(schema);

      const result = validator('  HELLO  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hello');
      }
    });
  });

  describe('compiled number constraints', () => {
    it('should validate min', () => {
      const schema = s.number().min(10);
      const validator = compile(schema);

      expect(validator(10).ok).toBe(true);
      expect(validator(5).ok).toBe(false);
    });

    it('should validate max', () => {
      const schema = s.number().max(10);
      const validator = compile(schema);

      expect(validator(10).ok).toBe(true);
      expect(validator(15).ok).toBe(false);
    });

    it('should validate int', () => {
      const schema = s.number().int();
      const validator = compile(schema);

      expect(validator(42).ok).toBe(true);
      expect(validator(3.14).ok).toBe(false);
    });

    it('should validate positive', () => {
      const schema = s.number().positive();
      const validator = compile(schema);

      expect(validator(1).ok).toBe(true);
      expect(validator(0).ok).toBe(false);
      expect(validator(-1).ok).toBe(false);
    });
  });

  describe('compiled nested objects', () => {
    it('should compile deeply nested objects', () => {
      const schema = s.object({
        level1: s.object({
          level2: s.object({
            level3: s.object({
              value: s.number(),
            }),
          }),
        }),
      });
      const validator = compile(schema);

      expect(validator({
        level1: {
          level2: {
            level3: {
              value: 42,
            },
          },
        },
      }).ok).toBe(true);

      expect(validator({
        level1: {
          level2: {
            level3: {
              value: 'not number',
            },
          },
        },
      }).ok).toBe(false);
    });
  });

  describe('compiled arrays', () => {
    it('should compile array length constraints', () => {
      const schema = s.array(s.string()).min(2).max(5);
      const validator = compile(schema);

      expect(validator(['a', 'b']).ok).toBe(true);
      expect(validator(['a']).ok).toBe(false);
      expect(validator(['a', 'b', 'c', 'd', 'e', 'f']).ok).toBe(false);
    });
  });

  describe('compiled error reporting', () => {
    it('should return errors with paths', () => {
      const schema = s.object({
        user: s.object({
          name: s.string(),
        }),
      });
      const validator = compile(schema);

      const result = validator({ user: { name: 123 } });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.path).toContain('user');
        expect(result.errors[0]?.path).toContain('name');
      }
    });
  });

  describe('compiled literal validator', () => {
    it('should validate exact string literals', () => {
      const schema = s.literal('active');
      const validator = compile(schema);

      expect(validator('active').ok).toBe(true);
      expect(validator('inactive').ok).toBe(false);
    });

    it('should validate exact number literals', () => {
      const schema = s.literal(42);
      const validator = compile(schema);

      expect(validator(42).ok).toBe(true);
      expect(validator(43).ok).toBe(false);
    });

    it('should validate boolean literals', () => {
      const schema = s.literal(true);
      const validator = compile(schema);

      expect(validator(true).ok).toBe(true);
      expect(validator(false).ok).toBe(false);
    });
  });

  describe('compiled enum validator', () => {
    it('should validate enum values', () => {
      const schema = s.enum(['pending', 'active', 'completed']);
      const validator = compile(schema);

      expect(validator('pending').ok).toBe(true);
      expect(validator('active').ok).toBe(true);
      expect(validator('completed').ok).toBe(true);
      expect(validator('invalid').ok).toBe(false);
    });
  });

  describe('compiled union validator', () => {
    it('should validate union of primitives', () => {
      const schema = s.union([s.string(), s.number()]);
      const validator = compile(schema);

      expect(validator('hello').ok).toBe(true);
      expect(validator(42).ok).toBe(true);
      expect(validator(true).ok).toBe(false);
    });

    it('should validate union of objects', () => {
      const schema = s.union([
        s.object({ type: s.literal('a'), value: s.string() }),
        s.object({ type: s.literal('b'), value: s.number() }),
      ]);
      const validator = compile(schema);

      expect(validator({ type: 'a', value: 'hello' }).ok).toBe(true);
      expect(validator({ type: 'b', value: 42 }).ok).toBe(true);
      expect(validator({ type: 'c', value: true }).ok).toBe(false);
    });
  });

  describe('compiled record validator', () => {
    it('should validate record with string keys', () => {
      const schema = s.record(s.number());
      const validator = compile(schema);

      expect(validator({ a: 1, b: 2 }).ok).toBe(true);
      expect(validator({ a: 'not number' }).ok).toBe(false);
    });

    it('should validate nested records', () => {
      const schema = s.record(s.object({ value: s.string() }));
      const validator = compile(schema);

      expect(validator({ key1: { value: 'hello' } }).ok).toBe(true);
      expect(validator({ key1: { value: 123 } }).ok).toBe(false);
    });
  });

  describe('compiled optional/nullable', () => {
    it('should handle optional strings', () => {
      const schema = s.string().optional();
      const validator = compile(schema);

      expect(validator('hello').ok).toBe(true);
      expect(validator(undefined).ok).toBe(true);
      expect(validator(null).ok).toBe(false);
    });

    it('should handle nullable numbers', () => {
      const schema = s.number().nullable();
      const validator = compile(schema);

      expect(validator(42).ok).toBe(true);
      expect(validator(null).ok).toBe(true);
      expect(validator(undefined).ok).toBe(false);
    });

    it('should handle default values', () => {
      const schema = s.string().default('fallback');
      const validator = compile(schema);

      const result = validator(undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('fallback');
      }
    });

    it('should handle optional in objects', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number().optional(),
      });
      const validator = compile(schema);

      expect(validator({ name: 'John' }).ok).toBe(true);
      expect(validator({ name: 'John', age: 30 }).ok).toBe(true);
      expect(validator({ name: 'John', age: 'thirty' }).ok).toBe(false);
    });
  });

  describe('compiled date validator', () => {
    it('should validate Date instances', () => {
      const schema = s.date();
      const validator = compile(schema);

      expect(validator(new Date()).ok).toBe(true);
      expect(validator('2024-01-01').ok).toBe(false);
      expect(validator(123).ok).toBe(false);
    });

    it('should validate date constraints', () => {
      const minDate = new Date('2024-01-01');
      const maxDate = new Date('2024-12-31');
      const schema = s.date().min(minDate).max(maxDate);
      const validator = compile(schema);

      expect(validator(new Date('2024-06-15')).ok).toBe(true);
      expect(validator(new Date('2023-01-01')).ok).toBe(false);
      expect(validator(new Date('2025-01-01')).ok).toBe(false);
    });
  });

  describe('performance: compiled vs non-compiled', () => {
    it('should produce same results as non-compiled', () => {
      const schema = s.object({
        name: s.string().min(1),
        age: s.number().int().min(0),
        email: s.string().email(),
        tags: s.array(s.string()),
      });

      const validator = compile(schema);

      const validData = {
        name: 'John',
        age: 30,
        email: 'john@example.com',
        tags: ['admin', 'user'],
      };

      const invalidData = {
        name: '',
        age: -5,
        email: 'invalid-email',
        tags: 123,
      };

      // Both should produce same results
      expect(validator(validData).ok).toBe(schema.validate(validData).ok);
      expect(validator(invalidData).ok).toBe(schema.validate(invalidData).ok);
    });
  });
});
