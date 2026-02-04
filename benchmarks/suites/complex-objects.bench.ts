/**
 * Benchmark: Complex Nested Object Validation
 *
 * Tests validation of deeply nested objects with arrays and optional fields.
 * Represents real-world API payloads and complex data structures.
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
const firmAddressSchema = s.object({
  street: s.string().min(1),
  city: s.string().min(1),
  state: s.string().length(2),
  zipCode: s.string().regex(/^\d{5}$/),
});

const firmSchema = s.object({
  id: s.string().uuid(),
  user: s.object({
    name: s.string().min(1).max(100),
    email: s.string().email(),
    age: s.number().int().min(0).optional(),
    roles: s.array(s.string()).min(1).max(10),
  }),
  address: firmAddressSchema,
  metadata: s.object({
    createdAt: s.string().datetime(),
    updatedAt: s.string().datetime(),
    tags: s.array(s.string()).optional(),
  }),
  settings: s.object({
    notifications: s.boolean().default(true),
    theme: s.enum(['light', 'dark', 'auto']).default('auto'),
  }).optional(),
}).compile();

// Zod
const zodAddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}$/),
});

const zodSchema = z.object({
  id: z.string().uuid(),
  user: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().int().min(0).optional(),
    roles: z.array(z.string()).min(1).max(10),
  }),
  address: zodAddressSchema,
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    tags: z.array(z.string()).optional(),
  }),
  settings: z.object({
    notifications: z.boolean().default(true),
    theme: z.enum(['light', 'dark', 'auto']).default('auto'),
  }).optional(),
});

// Valibot
const valibotAddressSchema = v.object({
  street: v.pipe(v.string(), v.minLength(1)),
  city: v.pipe(v.string(), v.minLength(1)),
  state: v.pipe(v.string(), v.length(2)),
  zipCode: v.pipe(v.string(), v.regex(/^\d{5}$/)),
});

const valibotSchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  user: v.object({
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
    email: v.pipe(v.string(), v.email()),
    age: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
    roles: v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(10)),
  }),
  address: valibotAddressSchema,
  metadata: v.object({
    createdAt: v.pipe(v.string(), v.isoDateTime()),
    updatedAt: v.pipe(v.string(), v.isoDateTime()),
    tags: v.optional(v.array(v.string())),
  }),
  settings: v.optional(v.object({
    notifications: v.optional(v.boolean(), true),
    theme: v.optional(v.picklist(['light', 'dark', 'auto']), 'auto'),
  })),
});

// Yup
const yupAddressSchema = yup.object({
  street: yup.string().min(1).required(),
  city: yup.string().min(1).required(),
  state: yup.string().length(2).required(),
  zipCode: yup.string().matches(/^\d{5}$/).required(),
});

const yupSchema = yup.object({
  id: yup.string().uuid().required(),
  user: yup.object({
    name: yup.string().min(1).max(100).required(),
    email: yup.string().email().required(),
    age: yup.number().integer().min(0),
    roles: yup.array(yup.string().required()).min(1).max(10).required(),
  }).required(),
  address: yupAddressSchema.required(),
  metadata: yup.object({
    createdAt: yup.string().required(),
    updatedAt: yup.string().required(),
    tags: yup.array(yup.string().required()),
  }).required(),
  settings: yup.object({
    notifications: yup.boolean().default(true),
    theme: yup.string().oneOf(['light', 'dark', 'auto']).default('auto'),
  }),
});

// ============================================================================
// TEST DATA
// ============================================================================

const validData = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  user: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    roles: ['user', 'admin'],
  },
  address: {
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:30:00Z',
    tags: ['vip', 'premium'],
  },
  settings: {
    notifications: true,
    theme: 'dark' as const,
  },
};

// ============================================================================
// BENCHMARKS
// ============================================================================

async function main() {
  console.log('\n🎯 Complex Nested Object Validation Benchmarks');
  console.log('Testing deeply nested object with arrays and optional fields\n');

  const suite = await runSuite({
    name: 'Complex Nested Object - Valid Data',
    description: 'Validation of complex nested structures',
    tests: [
      {
        name: 'complex-firm',
        library: 'FIRM',
        fn: () => firmSchema(validData),
      },
      {
        name: 'complex-zod',
        library: 'Zod',
        fn: () => zodSchema.safeParse(validData),
      },
      {
        name: 'complex-valibot',
        library: 'Valibot',
        fn: () => v.safeParse(valibotSchema, validData),
      },
      {
        name: 'complex-yup',
        library: 'Yup',
        fn: () => yupSchema.validateSync(validData, { abortEarly: false }),
      },
    ],
  });

  saveResults('complex-objects.json', [suite]);
}

main().catch(console.error);
