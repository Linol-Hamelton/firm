/**
 * Benchmark: Simple Object Validation
 *
 * Tests basic object validation with common field types.
 * This represents the most common use case for validators.
 */

import { s } from 'firm-validator';
import { z } from 'zod';
import * as v from 'valibot';
import * as yup from 'yup';
import { runSuite, saveResults } from '../benchmark-utils';

// ============================================================================
// SCHEMAS
// ============================================================================

// FIRM (compiled)
const firmSchema = s.object({
  id: s.number().int().positive(),
  email: s.string().email(),
  name: s.string().min(1).max(100),
  age: s.number().int().min(18).max(120),
  isActive: s.boolean(),
}).compile();

// Zod
const zodSchema = z.object({
  id: z.number().int().positive(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().min(18).max(120),
  isActive: z.boolean(),
});

// Valibot
const valibotSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  email: v.pipe(v.string(), v.email()),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  age: v.pipe(v.number(), v.integer(), v.minValue(18), v.maxValue(120)),
  isActive: v.boolean(),
});

// Yup
const yupSchema = yup.object({
  id: yup.number().integer().positive().required(),
  email: yup.string().email().required(),
  name: yup.string().min(1).max(100).required(),
  age: yup.number().integer().min(18).max(120).required(),
  isActive: yup.boolean().required(),
});

// ============================================================================
// TEST DATA
// ============================================================================

const validData = {
  id: 123,
  email: 'user@example.com',
  name: 'John Doe',
  age: 30,
  isActive: true,
};

const invalidData = {
  id: -1,
  email: 'not-an-email',
  name: '',
  age: 10,
  isActive: 'yes',
};

// ============================================================================
// BENCHMARKS
// ============================================================================

async function main() {
  console.log('\n🎯 Simple Object Validation Benchmarks');
  console.log('Testing basic object with 5 fields (id, email, name, age, isActive)\n');

  // Valid data benchmark
  const validSuite = await runSuite({
    name: 'Simple Object - Valid Data',
    description: 'Validation of valid data (success path)',
    tests: [
      {
        name: 'valid-firm',
        library: 'FIRM',
        fn: () => firmSchema(validData),
      },
      {
        name: 'valid-zod',
        library: 'Zod',
        fn: () => zodSchema.safeParse(validData),
      },
      {
        name: 'valid-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotSchema, validData),
      },
      {
        name: 'valid-yup',
        library: 'Yup',
        fn: () => yupSchema.validateSync(validData, { abortEarly: false }),
      },
    ],
  });

  // Invalid data benchmark
  const invalidSuite = await runSuite({
    name: 'Simple Object - Invalid Data',
    description: 'Validation of invalid data (error path)',
    tests: [
      {
        name: 'invalid-firm',
        library: 'FIRM',
        fn: () => firmSchema(invalidData),
      },
      {
        name: 'invalid-zod',
        library: 'Zod',
        fn: () => zodSchema.safeParse(invalidData),
      },
      {
        name: 'invalid-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotSchema, invalidData),
      },
      {
        name: 'invalid-yup',
        library: 'Yup',
        fn: () => {
          try {
            yupSchema.validateSync(invalidData, { abortEarly: false });
          } catch (e) {
            // Yup throws on invalid data
          }
        },
      },
    ],
  });

  // Save results
  saveResults('simple-objects.json', [validSuite, invalidSuite]);
}

main().catch(console.error);
