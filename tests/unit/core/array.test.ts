/**
 * Array Validator Tests
 */

import { s } from '../../../src/index.ts';

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
  });
});
