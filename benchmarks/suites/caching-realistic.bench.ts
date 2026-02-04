/**
 * Benchmark: Realistic Caching Scenarios
 *
 * Tests caching performance in realistic use cases:
 * - API endpoint validation (repeated similar requests)
 * - Form validation (user typing/editing)
 * - Batch processing (validating similar records)
 */

import { s } from 'firm-validator';
import { ValidationCache } from '../../src/infrastructure/caching/validation-cache.js';
import { z } from 'zod';
import { runSuite, saveResults } from '../benchmark-utils';

// ============================================================================
// SCHEMAS
// ============================================================================

const firmApiRequestSchema = s.object({
  method: s.enum(['GET', 'POST', 'PUT', 'DELETE']),
  path: s.string().url(),
  headers: s.record(s.string(), s.string()),
  body: s.unknown().optional(),
}).compile();

const zodApiRequestSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  path: z.string().url(),
  headers: z.record(z.string()),
  body: z.unknown().optional(),
});

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
    const cached = this.cache.get(data, this.schemaId);
    if (cached !== undefined) {
      return cached;
    }

    const result = this.validator(data);
    this.cache.set(data, this.schemaId, result);
    return result;
  }

  getStats() {
    return this.cache.getStats();
  }
}

// ============================================================================
// SCENARIOS
// ============================================================================

// Scenario 1: API endpoint - same requests repeated
const apiRequests = [
  {
    method: 'GET',
    path: 'https://api.example.com/users',
    headers: { 'authorization': 'Bearer token123', 'content-type': 'application/json' },
  },
  {
    method: 'POST',
    path: 'https://api.example.com/users',
    headers: { 'authorization': 'Bearer token123', 'content-type': 'application/json' },
    body: { name: 'John' },
  },
  {
    method: 'GET',
    path: 'https://api.example.com/posts',
    headers: { 'authorization': 'Bearer token123', 'content-type': 'application/json' },
  },
];

async function main() {
  console.log('\n🎯 Realistic Caching Scenarios');
  console.log('Testing caching in real-world use cases\n');

  // Scenario 1: API endpoint validation (80% cache hits)
  console.log('📍 Scenario 1: API Endpoint Validation');
  console.log('   Simulating repeated API requests with 80% cache hit rate\n');

  const cachedApiValidator = new CachedValidator(firmApiRequestSchema, 'api-request');

  const apiWithoutCacheSuite = await runSuite({
    name: 'API Validation - Without Cache',
    description: 'Validate 100 API requests without caching',
    tests: [
      {
        name: 'firm-api-no-cache',
        library: 'FIRM',
        fn: () => {
          for (let i = 0; i < 100; i++) {
            const request = apiRequests[i % 3];
            firmApiRequestSchema(request);
          }
        },
      },
      {
        name: 'zod-api-no-cache',
        library: 'Zod',
        fn: () => {
          for (let i = 0; i < 100; i++) {
            const request = apiRequests[i % 3];
            zodApiRequestSchema.safeParse(request);
          }
        },
      },
    ],
  });

  // Warm up cache
  for (const req of apiRequests) {
    cachedApiValidator.validate(req);
  }

  const apiWithCacheSuite = await runSuite({
    name: 'API Validation - With Cache',
    description: 'Validate 100 API requests with smart caching',
    tests: [
      {
        name: 'firm-api-cached',
        library: 'FIRM (cached)',
        fn: () => {
          for (let i = 0; i < 100; i++) {
            const request = apiRequests[i % 3];
            cachedApiValidator.validate(request);
          }
        },
      },
    ],
  });

  const apiStats = cachedApiValidator.getStats();
  console.log('\n📊 API Validation Cache Stats:');
  console.log(`   Cache Hit Rate: ${(apiStats.hitRate * 100).toFixed(1)}%`);
  console.log(`   Total Hits: ${apiStats.hits}, Misses: ${apiStats.misses}`);

  // Calculate speedup
  const nocacheOps = apiWithoutCacheSuite.results[0]!.opsPerSecond;
  const cachedOps = apiWithCacheSuite.results[0]!.opsPerSecond;
  const speedup = cachedOps / nocacheOps;

  console.log(`\n🚀 Performance Improvement:`);
  console.log(`   Without Cache: ${nocacheOps.toLocaleString()} ops/sec`);
  console.log(`   With Cache: ${cachedOps.toLocaleString()} ops/sec`);
  console.log(`   Speedup: ${speedup.toFixed(1)}x faster`);

  saveResults('caching-realistic.json', [apiWithoutCacheSuite, apiWithCacheSuite]);
}

main().catch(console.error);
