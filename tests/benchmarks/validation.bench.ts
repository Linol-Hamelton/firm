/**
 * FIRM Validation Benchmarks
 *
 * Run with: npm run bench
 */

import { describe, bench } from 'vitest';
import { s, compile } from '../../src/index.js';

describe('Primitive Validation Benchmarks', () => {
  // String benchmarks
  describe('String Validation', () => {
    const stringSchema = s.string();
    const compiledString = compile(stringSchema);

    bench('string - simple (uncompiled)', () => {
      stringSchema.validate('hello world');
    });

    bench('string - simple (compiled)', () => {
      compiledString('hello world');
    });

    const emailSchema = s.string().email();
    const compiledEmail = compile(emailSchema);

    bench('string - email (uncompiled)', () => {
      emailSchema.validate('test@example.com');
    });

    bench('string - email (compiled)', () => {
      compiledEmail('test@example.com');
    });
  });

  // Number benchmarks
  describe('Number Validation', () => {
    const numberSchema = s.number();
    const compiledNumber = compile(numberSchema);

    bench('number - simple (uncompiled)', () => {
      numberSchema.validate(42);
    });

    bench('number - simple (compiled)', () => {
      compiledNumber(42);
    });

    const intSchema = s.number().int().min(0).max(100);
    const compiledInt = compile(intSchema);

    bench('number - int with range (uncompiled)', () => {
      intSchema.validate(50);
    });

    bench('number - int with range (compiled)', () => {
      compiledInt(50);
    });
  });

  // Boolean benchmarks
  describe('Boolean Validation', () => {
    const boolSchema = s.boolean();
    const compiledBool = compile(boolSchema);

    bench('boolean - simple (uncompiled)', () => {
      boolSchema.validate(true);
    });

    bench('boolean - simple (compiled)', () => {
      compiledBool(true);
    });
  });
});

describe('Object Validation Benchmarks', () => {
  // Simple object
  const simpleObjectSchema = s.object({
    name: s.string(),
    age: s.number(),
    active: s.boolean(),
  });
  const compiledSimpleObject = compile(simpleObjectSchema);

  const simpleData = { name: 'John', age: 30, active: true };

  bench('object - simple 3 fields (uncompiled)', () => {
    simpleObjectSchema.validate(simpleData);
  });

  bench('object - simple 3 fields (compiled)', () => {
    compiledSimpleObject(simpleData);
  });

  // Complex object
  const complexObjectSchema = s.object({
    id: s.string().uuid(),
    user: s.object({
      name: s.string().min(1).max(100),
      email: s.string().email(),
      age: s.number().int().min(0).max(150),
    }),
    tags: s.array(s.string()),
    metadata: s.object({
      createdAt: s.string(),
      updatedAt: s.string(),
    }),
  });
  const compiledComplexObject = compile(complexObjectSchema);

  const complexData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    },
    tags: ['admin', 'user'],
    metadata: {
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02',
    },
  };

  bench('object - complex nested (uncompiled)', () => {
    complexObjectSchema.validate(complexData);
  });

  bench('object - complex nested (compiled)', () => {
    compiledComplexObject(complexData);
  });
});

describe('Array Validation Benchmarks', () => {
  const arraySchema = s.array(s.number());
  const compiledArray = compile(arraySchema);

  const smallArray = [1, 2, 3, 4, 5];
  const largeArray = Array.from({ length: 100 }, (_, i) => i);

  bench('array - 5 items (uncompiled)', () => {
    arraySchema.validate(smallArray);
  });

  bench('array - 5 items (compiled)', () => {
    compiledArray(smallArray);
  });

  bench('array - 100 items (uncompiled)', () => {
    arraySchema.validate(largeArray);
  });

  bench('array - 100 items (compiled)', () => {
    compiledArray(largeArray);
  });
});

describe('is() Check Benchmarks', () => {
  const schema = s.object({
    name: s.string(),
    age: s.number(),
  });

  const validData = { name: 'John', age: 30 };
  const invalidData = { name: 'John', age: 'thirty' };

  bench('is() - valid data', () => {
    schema.is(validData);
  });

  bench('is() - invalid data (fast fail)', () => {
    schema.is(invalidData);
  });
});
