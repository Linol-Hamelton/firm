/**
 * Benchmark: Type Coercion
 *
 * Tests automatic type coercion for common scenarios like parsing
 * query parameters or form data where everything comes as strings.
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
  page: s.coerce.number().int().min(1),
  limit: s.coerce.number().int().min(1).max(100),
  active: s.coerce.boolean(),
  price: s.coerce.number().positive(),
  date: s.coerce.date(),
}).compile();

// Zod
const zodSchema = z.object({
  page: z.coerce.number().int().min(1),
  limit: z.coerce.number().int().min(1).max(100),
  active: z.coerce.boolean(),
  price: z.coerce.number().positive(),
  date: z.coerce.date(),
});

// Valibot
const valibotSchema = v.object({
  page: v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
  limit: v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(1), v.maxValue(100)),
  active: v.pipe(v.unknown(), v.transform(Boolean), v.boolean()),
  price: v.pipe(v.unknown(), v.transform(Number), v.number(), v.minValue(0)),
  date: v.pipe(v.unknown(), v.transform((val) => new Date(val as string)), v.date()),
});

// Yup (has built-in coercion)
const yupSchema = yup.object({
  page: yup.number().integer().min(1).required(),
  limit: yup.number().integer().min(1).max(100).required(),
  active: yup.boolean().required(),
  price: yup.number().positive().required(),
  date: yup.date().required(),
});

// ============================================================================
// TEST DATA
// ============================================================================

// Query parameter style data (all strings)
const queryData = {
  page: '1',
  limit: '10',
  active: 'true',
  price: '99.99',
  date: '2024-01-15',
};

// ============================================================================
// BENCHMARKS
// ============================================================================

async function main() {
  console.log('\n🎯 Type Coercion Benchmarks');
  console.log('Testing automatic type conversion for query parameters\n');

  const suite = await runSuite({
    name: 'Type Coercion - Query Parameters',
    description: 'Converting string inputs to proper types',
    tests: [
      {
        name: 'coercion-firm',
        library: 'FIRM',
        fn: () => firmSchema(queryData),
      },
      {
        name: 'coercion-zod',
        library: 'Zod',
        fn: () => zodSchema.safeParse(queryData),
      },
      {
        name: 'coercion-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotSchema, queryData),
      },
      {
        name: 'coercion-yup',
        library: 'Yup',
        fn: () => yupSchema.validateSync(queryData, { abortEarly: false }),
      },
    ],
  });

  saveResults('coercion.json', [suite]);
}

main().catch(console.error);
