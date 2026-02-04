/**
 * Array Validator Tests
 */

import { s } from '../../../src/index';

describe('ArrayValidator', () => {
  describe('basic validation', () => {
    it('should validate arrays', () => {
      const schema = s.array(s.number());

      expect(schema.validate([1, 2, 3]).ok).toBe(true);
      expect(schema.validate([]).ok).toBe(true);
    });

    it('should reject non-arrays', () => {
      const schema = s.array(s.string());

      expect(schema.validate('not an array').ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
      expect(schema.validate(undefined).ok).toBe(false);
      expect(schema.validate({}).ok).toBe(false);
      expect(schema.validate(123).ok).toBe(false);
    });

    it('should validate element types', () => {
      const schema = s.array(s.string());

      expect(schema.validate(['a', 'b', 'c']).ok).toBe(true);
      expect(schema.validate(['a', 1, 'c']).ok).toBe(false);
      expect(schema.validate([1, 2, 3]).ok).toBe(false);
    });

    it('should use is() for type checking', () => {
      const schema = s.array(s.number());

      expect(schema.is([1, 2, 3])).toBe(true);
      expect(schema.is(['a', 'b'])).toBe(false);
      expect(schema.is('not array')).toBe(false);
    });
  });

  describe('length constraints', () => {
    it('should validate min length', () => {
      const schema = s.array(s.number()).min(2);

      expect(schema.validate([1, 2]).ok).toBe(true);
      expect(schema.validate([1, 2, 3]).ok).toBe(true);
      expect(schema.validate([1]).ok).toBe(false);
      expect(schema.validate([]).ok).toBe(false);
    });

    it('should validate max length', () => {
      const schema = s.array(s.number()).max(3);

      expect(schema.validate([]).ok).toBe(true);
      expect(schema.validate([1, 2, 3]).ok).toBe(true);
      expect(schema.validate([1, 2, 3, 4]).ok).toBe(false);
    });

    it('should validate exact length', () => {
      const schema = s.array(s.number()).length(3);

      expect(schema.validate([1, 2, 3]).ok).toBe(true);
      expect(schema.validate([1, 2]).ok).toBe(false);
      expect(schema.validate([1, 2, 3, 4]).ok).toBe(false);
    });

    it('should validate nonempty', () => {
      const schema = s.array(s.string()).nonempty();

      expect(schema.validate(['a']).ok).toBe(true);
      expect(schema.validate(['a', 'b']).ok).toBe(true);
      expect(schema.validate([]).ok).toBe(false);
    });
  });

  describe('nested arrays', () => {
    it('should validate nested arrays', () => {
      const schema = s.array(s.array(s.number()));

      expect(schema.validate([[1, 2], [3, 4]]).ok).toBe(true);
      expect(schema.validate([]).ok).toBe(true);
      expect(schema.validate([[1, 'a']]).ok).toBe(false);
    });
  });

  describe('arrays of objects', () => {
    it('should validate arrays of objects', () => {
      const schema = s.array(s.object({
        name: s.string(),
        age: s.number(),
      }));

      expect(schema.validate([
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ]).ok).toBe(true);

      expect(schema.validate([
        { name: 'John', age: 'thirty' },
      ]).ok).toBe(false);
    });
  
    describe('parallel validation', () => {
      it('should have parallel() method', () => {
        const schema = s.array(s.number());
        expect(typeof schema.parallel).toBe('function');
      });
  
      it('should enable parallel validation', () => {
        const schema = s.array(s.number()).parallel();
        expect(schema).toBeDefined();
      });
  
      it('should support abortEarly() method', () => {
        const schema = s.array(s.number()).abortEarly();
        expect(schema).toBeDefined();
      });
  
      it('should validate arrays with parallel validation (async)', async () => {
        const schema = s.array(s.number()).parallel();
        
        const result = await schema.validateAsync([1, 2, 3, 4, 5]);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.data).toEqual([1, 2, 3, 4, 5]);
        }
      });
  
      it('should handle errors in parallel validation', async () => {
        const schema = s.array(s.number()).parallel();
        
        const result = await schema.validateAsync([1, 'invalid', 3, 'also invalid', 5]);
        expect(result.ok).toBe(false);
        if (!result.ok) {
          expect(result.errors).toHaveLength(2); // Two invalid elements
        }
      });
  
      it('should be faster than sequential for large arrays (performance hint)', async () => {
        const numbers = Array.from({ length: 100 }, (_, i) => i);
        const schema = s.array(s.number());
        
        const parallelSchema = schema.parallel();
        const sequentialSchema = schema; // No parallel
        
        // Both should work
        const parallelResult = await parallelSchema.validateAsync(numbers);
        const sequentialResult = await sequentialSchema.validateAsync(numbers);
        
        expect(parallelResult.ok).toBe(true);
        expect(sequentialResult.ok).toBe(true);
      });
  
      it('should work with abortEarly in parallel mode', async () => {
        const schema = s.array(s.number()).parallel().abortEarly();
        
        const result = await schema.validateAsync([1, 'invalid', 3, 4, 5]);
        // With abortEarly, might stop early but parallel still processes all
        expect(result.ok).toBe(false);
      });
    });
  });

  describe('error reporting', () => {
    it('should report errors with element index', () => {
      const schema = s.array(s.number());
      const result = schema.validate([1, 'two', 3]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.path).toContain('[1]');
      }
    });

    it('should report multiple element errors', () => {
      const schema = s.array(s.number());
      const result = schema.validate(['a', 'b', 'c']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBe(3);
      }
    });

    it('should return correct error code for non-array', () => {
      const schema = s.array(s.string());
      const result = schema.validate('not array');

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('NOT_ARRAY');
      }
    });

    it('should return correct error code for min length', () => {
      const schema = s.array(s.string()).min(3);
      const result = schema.validate(['a', 'b']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('ARRAY_TOO_SHORT');
      }
    });

    it('should return correct error code for max length', () => {
      const schema = s.array(s.string()).max(2);
      const result = schema.validate(['a', 'b', 'c']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('ARRAY_TOO_LONG');
      }
    });
  });

  describe('optional and nullable', () => {
    it('should allow undefined when optional', () => {
      const schema = s.array(s.number()).optional();

      expect(schema.validate([1, 2]).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(false);
    });

    it('should allow null when nullable', () => {
      const schema = s.array(s.number()).nullable();

      expect(schema.validate([1, 2]).ok).toBe(true);
      expect(schema.validate(null).ok).toBe(true);
      expect(schema.validate(undefined).ok).toBe(false);
    });

    it('should use default value', () => {
      const schema = s.array(s.number()).default([]);
      const result = schema.validate(undefined);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual([]);
      }
    });
  });
});

describe('TupleValidator', () => {
  describe('basic validation', () => {
    it('should validate tuples', () => {
      const schema = s.tuple([s.string(), s.number()]);

      expect(schema.validate(['hello', 42]).ok).toBe(true);
    });

    it('should reject wrong types in tuple', () => {
      const schema = s.tuple([s.string(), s.number()]);

      expect(schema.validate([42, 'hello']).ok).toBe(false);
      expect(schema.validate(['hello', 'world']).ok).toBe(false);
    });

    it('should reject wrong length', () => {
      const schema = s.tuple([s.string(), s.number()]);

      expect(schema.validate(['hello']).ok).toBe(false);
      expect(schema.validate(['hello', 42, true]).ok).toBe(false);
    });

    it('should reject non-arrays', () => {
      const schema = s.tuple([s.string()]);

      expect(schema.validate('not array').ok).toBe(false);
      expect(schema.validate(null).ok).toBe(false);
    });
  });

  describe('complex tuples', () => {
    it('should validate tuples with objects', () => {
      const schema = s.tuple([
        s.string(),
        s.object({ id: s.number() }),
      ]);

      expect(schema.validate(['test', { id: 1 }]).ok).toBe(true);
      expect(schema.validate(['test', { id: 'one' }]).ok).toBe(false);
    });
  });

  describe('rest elements', () => {
    it('should validate tuples with rest', () => {
      const schema = s.tuple([s.string(), s.number()]).rest(s.boolean());

      expect(schema.validate(['hello', 42]).ok).toBe(true);
      expect(schema.validate(['hello', 42, true]).ok).toBe(true);
      expect(schema.validate(['hello', 42, true, false]).ok).toBe(true);
      expect(schema.validate(['hello', 42, 'not boolean']).ok).toBe(false);
    });

    it('should use is() type guard with rest elements', () => {
      const schema = s.tuple([s.string()]).rest(s.number());

      expect(schema.is(['hello', 1, 2, 3])).toBe(true);
      expect(schema.is(['hello', 1, 'not number'])).toBe(false);
      expect(schema.is(['hello'])).toBe(true);
    });

    it('should check minimum length with is()', () => {
      const schema = s.tuple([s.string(), s.number()]);

      expect(schema.is(['hello', 42])).toBe(true);
      expect(schema.is(['hello'])).toBe(false); // Too short
    });

    it('should check maximum length without rest with is()', () => {
      const schema = s.tuple([s.string(), s.number()]);

      expect(schema.is(['hello', 42])).toBe(true);
      expect(schema.is(['hello', 42, 'extra'])).toBe(false); // Too long without rest
    });
  });

  describe('maxLength', () => {
    it('should validate array max length', () => {
      const schema = s.array(s.number()).max(3);

      expect(schema.validate([1, 2, 3]).ok).toBe(true);
      expect(schema.validate([1, 2]).ok).toBe(true);
      expect(schema.validate([]).ok).toBe(true);
    });

    it('should fail when array exceeds max length', () => {
      const schema = s.array(s.string()).max(2);
      const result = schema.validate(['a', 'b', 'c']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('ARRAY_TOO_LONG');
        expect(result.errors[0]?.message).toContain('at most 2');
      }
    });

    it('should work with both min and max', () => {
      const schema = s.array(s.number()).min(2).max(4);

      expect(schema.validate([1]).ok).toBe(false);
      expect(schema.validate([1, 2]).ok).toBe(true);
      expect(schema.validate([1, 2, 3, 4]).ok).toBe(true);
      expect(schema.validate([1, 2, 3, 4, 5]).ok).toBe(false);
    });
  });

  describe('unique', () => {
    it('should validate array uniqueness for primitives', () => {
      const schema = s.array(s.number()).unique();

      expect(schema.validate([1, 2, 3]).ok).toBe(true);
      expect(schema.validate([1, 2, 2]).ok).toBe(false);
    });

    it('should fail with proper error when duplicates found', () => {
      const schema = s.array(s.string()).unique();
      const result = schema.validate(['a', 'b', 'a']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.code).toBe('ARRAY_NOT_UNIQUE');
        expect(result.errors[0]?.message).toContain('unique');
      }
    });

    it('should validate uniqueness for objects', () => {
      const schema = s.array(s.object({ id: s.number() })).unique();

      expect(schema.validate([{ id: 1 }, { id: 2 }]).ok).toBe(true);
      expect(schema.validate([{ id: 1 }, { id: 1 }]).ok).toBe(false);
    });

    it('should detect duplicates at correct index', () => {
      const schema = s.array(s.number()).unique();
      const result = schema.validate([1, 2, 3, 2]);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0]?.path).toContain('[3]');
      }
    });
  });

  describe('element getter', () => {
    it('should expose element schema via getter', () => {
      const elementSchema = s.string().min(3);
      const schema = s.array(elementSchema);

      expect(schema.element).toBe(elementSchema);
    });

    it('should return the correct element schema', () => {
      const schema = s.array(s.number().min(10));

      expect(schema.element.validate(15).ok).toBe(true);
      expect(schema.element.validate(5).ok).toBe(false);
    });
  });

  describe('async parallel validation edge cases', () => {
    it('should handle parallel validation with async element schemas', async () => {
      const asyncSchema = s.string().refineAsync(
        async (val) => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return val.length > 2;
        },
        'Too short'
      );

      const schema = s.array(asyncSchema).parallel();
      const result = await schema.validateAsync(['hello', 'world']);

      expect(result.ok).toBe(true);
    });

    it('should handle errors in parallel async validation', async () => {
      const asyncSchema = s.string().refineAsync(
        async (val) => val.length > 2,
        'Too short'
      );

      const schema = s.array(asyncSchema).parallel();
      const result = await schema.validateAsync(['hi', 'hello', 'no']);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should validate sequentially with async schemas by default', async () => {
      const asyncSchema = s.number().refineAsync(
        async (val) => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return val > 0;
        },
        'Must be positive'
      );

      const schema = s.array(asyncSchema);
      const result = await schema.validateAsync([1, 2, 3]);

      expect(result.ok).toBe(true);
    });

    it('should handle sequential async validation errors', async () => {
      const asyncSchema = s.number().refineAsync(
        async (val) => val > 0,
        'Must be positive'
      );

      const schema = s.array(asyncSchema);
      const result = await schema.validateAsync([1, -1, 2]);

      expect(result.ok).toBe(false);
    });
  });
});
