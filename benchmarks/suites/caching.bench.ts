/**
 * Benchmark: Smart Caching Performance
 *
 * Tests the performance improvement from smart caching on repeated validations.
 * Expected: 10-100x speedup for cached validations.
 */

import { s } from 'firm-validator';
import { ValidationCache } from '../../src/infrastructure/caching/validation-cache.js';
import { z } from 'zod';
import { runSuite, saveResults } from '../benchmark-utils';

// ============================================================================
// SCHEMAS
// ============================================================================

// FIRM schema (compiled)
const firmUserSchema = s.object({
  id: s.string().uuid(),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150),
  roles: s.array(s.string()).min(1).max(10),
  metadata: s.object({
    createdAt: s.string().datetime(),
    updatedAt: s.string().datetime(),
    premium: s.boolean(),
  }),
}).compile();

// Zod schema (for comparison - no built-in caching)
const zodUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(0).max(150),
  roles: z.array(z.string()).min(1).max(10),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    premium: z.boolean(),
  }),
});

// ============================================================================
// TEST DATA
// ============================================================================

const testUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  roles: ['user', 'admin'],
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-15T12:30:00Z',
    premium: true,
  },
};

// ============================================================================
// CACHING WRAPPER
// ============================================================================

class CachedValidator<T> {
  private cache: ValidationCache;
  private schemaId: string;
  private validator: (data: unknown) => any;

  constructor(validator: (data: unknown) => any, schemaId: string) {
    this.cache = new ValidationCache({ type: 'lru', maxSize: 10000 });
    this.schemaId = schemaId;
    this.validator = validator;
  }

  validate(data: unknown) {
    // Check cache first
    const cached = this.cache.get(data, this.schemaId);
    if (cached !== undefined) {
      return cached;
    }

    // Validate and cache result
    const result = this.validator(data);
    this.cache.set(data, this.schemaId, result);
    return result;
  }

  getStats() {
    return this.cache.getStats();
  }
}

// ============================================================================
// BENCHMARKS
// ============================================================================

async function main() {
  console.log('\n🎯 Smart Caching Performance Benchmarks');
  console.log('Testing performance improvement from caching\n');

  // Test 1: Without caching (baseline)
  const withoutCacheSuite = await runSuite({
    name: 'Repeated Validation - WITHOUT Caching',
    description: 'Baseline: validate same data 1000 times without cache',
    tests: [
      {
        name: 'firm-no-cache',
        library: 'FIRM (no cache)',
        fn: () => {
          for (let i = 0; i < 1000; i++) {
            firmUserSchema(testUser);
          }
        },
      },
      {
        name: 'zod-no-cache',
        library: 'Zod (no cache)',
        fn: () => {
          for (let i = 0; i < 1000; i++) {
            zodUserSchema.safeParse(testUser);
          }
        },
      },
    ],
  });

  // Test 2: With caching (should be 10-100x faster)
  const cachedValidator = new CachedValidator(firmUserSchema, 'user-schema');

  // Warm up cache
  cachedValidator.validate(testUser);

  const withCacheSuite = await runSuite({
    name: 'Repeated Validation - WITH Caching',
    description: 'Smart cache: validate same data 1000 times with cache',
    tests: [
      {
        name: 'firm-with-cache',
        library: 'FIRM (cached)',
        fn: () => {
          for (let i = 0; i < 1000; i++) {
            cachedValidator.validate(testUser);
          }
        },
      },
    ],
  });

  // Print cache stats
  const stats = cachedValidator.getStats();
  console.log('\n📊 Cache Statistics:');
  console.log(`   Hits: ${stats.hits}`);
  console.log(`   Misses: ${stats.misses}`);
  console.log(`   Hit Rate: ${(stats.hitRate * 100).toFixed(2)}%`);
  console.log(`   Cache Size: ${stats.size}`);

  saveResults('caching.json', [withoutCacheSuite, withCacheSuite]);
}

main().catch(console.error);
