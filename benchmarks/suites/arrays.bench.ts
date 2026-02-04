/**
 * Benchmark: Array Validation
 *
 * Tests validation of arrays with different sizes and element types.
 * Important for bulk operations and list processing.
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
const firmItemSchema = s.object({
  id: s.number().int().positive(),
  name: s.string().min(1).max(100),
  price: s.number().positive(),
  inStock: s.boolean(),
});

const firmSmallArraySchema = s.array(firmItemSchema).min(1).max(100).compile();
const firmLargeArraySchema = s.array(firmItemSchema).min(1).max(1000).compile();

// Zod
const zodItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  price: z.number().positive(),
  inStock: z.boolean(),
});

const zodSmallArraySchema = z.array(zodItemSchema).min(1).max(100);
const zodLargeArraySchema = z.array(zodItemSchema).min(1).max(1000);

// Valibot
const valibotItemSchema = v.object({
  id: v.pipe(v.number(), v.integer(), v.minValue(1)),
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  price: v.pipe(v.number(), v.minValue(0)),
  inStock: v.boolean(),
});

const valibotSmallArraySchema = v.pipe(
  v.array(valibotItemSchema),
  v.minLength(1),
  v.maxLength(100)
);

const valibotLargeArraySchema = v.pipe(
  v.array(valibotItemSchema),
  v.minLength(1),
  v.maxLength(1000)
);

// Yup
const yupItemSchema = yup.object({
  id: yup.number().integer().positive().required(),
  name: yup.string().min(1).max(100).required(),
  price: yup.number().positive().required(),
  inStock: yup.boolean().required(),
});

const yupSmallArraySchema = yup.array(yupItemSchema.required()).min(1).max(100).required();
const yupLargeArraySchema = yup.array(yupItemSchema.required()).min(1).max(1000).required();

// ============================================================================
// TEST DATA
// ============================================================================

function generateItems(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    price: Math.random() * 100,
    inStock: Math.random() > 0.5,
  }));
}

const smallArray = generateItems(10);
const mediumArray = generateItems(50);
const largeArray = generateItems(100);

// ============================================================================
// BENCHMARKS
// ============================================================================

async function main() {
  console.log('\n🎯 Array Validation Benchmarks');
  console.log('Testing arrays of different sizes with object elements\n');

  // Small array (10 items)
  const smallSuite = await runSuite({
    name: 'Array Validation - 10 Items',
    description: 'Small array with 10 objects',
    tests: [
      {
        name: 'array-10-firm',
        library: 'FIRM',
        fn: () => firmSmallArraySchema(smallArray),
      },
      {
        name: 'array-10-zod',
        library: 'Zod',
        fn: () => zodSmallArraySchema.safeParse(smallArray),
      },
      {
        name: 'array-10-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotSmallArraySchema, smallArray),
      },
      {
        name: 'array-10-yup',
        library: 'Yup',
        fn: () => yupSmallArraySchema.validateSync(smallArray, { abortEarly: false }),
      },
    ],
  });

  // Medium array (50 items)
  const mediumSuite = await runSuite({
    name: 'Array Validation - 50 Items',
    description: 'Medium array with 50 objects',
    tests: [
      {
        name: 'array-50-firm',
        library: 'FIRM',
        fn: () => firmSmallArraySchema(mediumArray),
      },
      {
        name: 'array-50-zod',
        library: 'Zod',
        fn: () => zodSmallArraySchema.safeParse(mediumArray),
      },
      {
        name: 'array-50-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotSmallArraySchema, mediumArray),
      },
      {
        name: 'array-50-yup',
        library: 'Yup',
        fn: () => yupSmallArraySchema.validateSync(mediumArray, { abortEarly: false }),
      },
    ],
  });

  // Large array (100 items)
  const largeSuite = await runSuite({
    name: 'Array Validation - 100 Items',
    description: 'Large array with 100 objects',
    tests: [
      {
        name: 'array-100-firm',
        library: 'FIRM',
        fn: () => firmLargeArraySchema(largeArray),
      },
      {
        name: 'array-100-zod',
        library: 'Zod',
        fn: () => zodLargeArraySchema.safeParse(largeArray),
      },
      {
        name: 'array-100-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotLargeArraySchema, largeArray),
      },
      {
        name: 'array-100-yup',
        library: 'Yup',
        fn: () => yupLargeArraySchema.validateSync(largeArray, { abortEarly: false }),
      },
    ],
  });

  saveResults('arrays.json', [smallSuite, mediumSuite, largeSuite]);
}

main().catch(console.error);
