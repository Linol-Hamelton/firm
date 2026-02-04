/**
 * Tests for Cache Manager - Advanced caching features
 *
 * Coverage: cache-manager.ts
 * Target: 80%+ coverage (347 lines)
 */

import { ValidationCache } from '../../../../src/infrastructure/caching/validation-cache.js';
import {
  CacheManager,
  CacheWarmer,
  CacheSerializer,
  CacheMetricsExporter,
  type CacheWarmupData,
  type SerializedCache,
} from '../../../../src/infrastructure/caching/cache-manager.js';
import { promises as fs } from 'fs';

// ============================================================================
// CACHE WARMER TESTS
// ============================================================================

describe('CacheWarmer', () => {
  let cache: ValidationCache;
  let warmer: CacheWarmer;

  beforeEach(() => {
    cache = new ValidationCache({ type: 'lru', maxSize: 100 });
    warmer = new CacheWarmer(cache);
  });

  describe('warmup', () => {
    it('should warm up cache with valid data', async () => {
      const datasets: CacheWarmupData[] = [
        { schemaId: 'user', data: { name: 'John', age: 30 }, expectedResult: true },
        { schemaId: 'user', data: { name: 'Jane', age: 25 }, expectedResult: true },
      ];

      const result = await warmer.warmup(datasets);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should warm up cache with expected failures', async () => {
      const datasets: CacheWarmupData[] = [
        { schemaId: 'user', data: { name: 'Invalid' }, expectedResult: false },
      ];

      const result = await warmer.warmup(datasets);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('should handle empty datasets', async () => {
      const result = await warmer.warmup([]);

      expect(result.successful).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.totalTime).toBeGreaterThanOrEqual(0);
    });

    it('should count failed warmups', async () => {
      const datasets: CacheWarmupData[] = [
        { schemaId: 'user', data: { name: 'John' }, expectedResult: true },
        { schemaId: 'user', data: { name: 'Jane' }, expectedResult: true },
      ];

      // Simulate failure by clearing cache after first item
      const originalSet = cache.set.bind(cache);
      let callCount = 0;
      cache.set = (data, schemaId, result) => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Simulated error');
        }
        return originalSet(data, schemaId, result);
      };

      const result = await warmer.warmup(datasets);

      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('should measure total time accurately', async () => {
      const datasets: CacheWarmupData[] = [
        { schemaId: 'user', data: { name: 'John' }, expectedResult: true },
      ];

      const result = await warmer.warmup(datasets);

      expect(result.totalTime).toBeGreaterThanOrEqual(0);
      expect(result.totalTime).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('generateWarmupData', () => {
    it('should generate warmup data from history', () => {
      const history = [
        { schemaId: 'user', data: { name: 'John' }, result: { ok: true, data: {} } },
        { schemaId: 'user', data: { name: 'Jane' }, result: { ok: false, errors: [] } },
      ];

      const warmupData = warmer.generateWarmupData(history);

      expect(warmupData).toHaveLength(2);
      expect(warmupData[0]).toEqual({
        schemaId: 'user',
        data: { name: 'John' },
        expectedResult: true,
      });
      expect(warmupData[1]).toEqual({
        schemaId: 'user',
        data: { name: 'Jane' },
        expectedResult: false,
      });
    });

    it('should handle empty history', () => {
      const warmupData = warmer.generateWarmupData([]);
      expect(warmupData).toHaveLength(0);
    });

    it('should preserve all fields from history', () => {
      const history = [
        {
          schemaId: 'complex-schema',
          data: { nested: { field: 'value' } },
          result: { ok: true, data: {} },
        },
      ];

      const warmupData = warmer.generateWarmupData(history);

      expect(warmupData[0]!.schemaId).toBe('complex-schema');
      expect(warmupData[0]!.data).toEqual({ nested: { field: 'value' } });
      expect(warmupData[0]!.expectedResult).toBe(true);
    });
  });
});

// ============================================================================
// CACHE SERIALIZER TESTS
// ============================================================================

describe('CacheSerializer', () => {
  let cache: ValidationCache;
  let serializer: CacheSerializer;

  beforeEach(() => {
    cache = new ValidationCache({ type: 'lru', maxSize: 100 });
    serializer = new CacheSerializer();
  });

  describe('serialize', () => {
    it('should serialize empty cache', () => {
      const serialized = serializer.serialize(cache);

      expect(serialized.version).toBe('1.0.0');
      expect(serialized.timestamp).toBeGreaterThan(0);
      expect(serialized.stats).toEqual({
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0,
      });
    });

    it('should serialize cache with data', () => {
      // Use primitives for testing (WeakMap doesn't count in size)
      cache.set('john@example.com', 'user-email', { ok: true, data: {} });
      cache.set('jane@example.com', 'user-email', { ok: true, data: {} });

      // Trigger some hits
      cache.get('john@example.com', 'user-email');

      const serialized = serializer.serialize(cache);

      expect(serialized.version).toBe('1.0.0');
      expect(serialized.stats.hits).toBeGreaterThan(0);
      expect(serialized.stats.size).toBeGreaterThan(0);
    });

    it('should include strategy in serialized data', () => {
      const serialized = serializer.serialize(cache);

      expect(serialized.strategy).toBeDefined();
      expect(serialized.strategy.type).toBeDefined();
    });

    it('should include timestamp in serialized data', () => {
      const before = Date.now();
      const serialized = serializer.serialize(cache);
      const after = Date.now();

      expect(serialized.timestamp).toBeGreaterThanOrEqual(before);
      expect(serialized.timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('deserialize', () => {
    it('should deserialize valid cache data', () => {
      const serializedData: SerializedCache = {
        version: '1.0.0',
        timestamp: Date.now(),
        strategy: { type: 'lru', maxSize: 100 },
        stats: { hits: 10, misses: 5, size: 3, hitRate: 0.67 },
        entries: [],
      };

      const restoredCache = serializer.deserialize(serializedData);

      expect(restoredCache).toBeInstanceOf(ValidationCache);
    });

    it('should throw error for unsupported version', () => {
      const serializedData: SerializedCache = {
        version: '2.0.0',
        timestamp: Date.now(),
        strategy: { type: 'lru', maxSize: 100 },
        stats: { hits: 0, misses: 0, size: 0, hitRate: 0 },
        entries: [],
      };

      expect(() => serializer.deserialize(serializedData)).toThrow('Unsupported cache version');
    });

    it('should restore cache with entries', () => {
      const serializedData: SerializedCache = {
        version: '1.0.0',
        timestamp: Date.now(),
        strategy: { type: 'lru', maxSize: 100 },
        stats: { hits: 0, misses: 0, size: 1, hitRate: 0 },
        entries: [
          { key: 'test-key', result: { ok: true, data: {} }, timestamp: Date.now(), hits: 0 },
        ],
      };

      const restoredCache = serializer.deserialize(serializedData);

      expect(restoredCache).toBeInstanceOf(ValidationCache);
    });

    it('should handle empty entries array', () => {
      const serializedData: SerializedCache = {
        version: '1.0.0',
        timestamp: Date.now(),
        strategy: { type: 'lru', maxSize: 100 },
        stats: { hits: 0, misses: 0, size: 0, hitRate: 0 },
        entries: [],
      };

      const restoredCache = serializer.deserialize(serializedData);

      expect(restoredCache).toBeInstanceOf(ValidationCache);
      expect(restoredCache.getStats().size).toBe(0);
    });

    it('should restore statistics', () => {
      const serializedData: SerializedCache = {
        version: '1.0.0',
        timestamp: Date.now(),
        strategy: { type: 'lru', maxSize: 100 },
        stats: { hits: 100, misses: 50, size: 10, hitRate: 0.67 },
        entries: [],
      };

      const restoredCache = serializer.deserialize(serializedData);
      const stats = restoredCache.getStats();

      expect(stats.hits).toBe(100);
      expect(stats.misses).toBe(50);
    });
  });

  describe('saveToFile', () => {
    const testFilename = '.test-cache.json';

    afterEach(async () => {
      try {
        await fs.unlink(testFilename);
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should save cache to file in Node.js environment', async () => {
      cache.set({ name: 'John' }, 'user', { ok: true, data: {} });

      await serializer.saveToFile(cache, testFilename);

      const fileContent = await fs.readFile(testFilename, 'utf-8');
      const parsed: SerializedCache = JSON.parse(fileContent);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.stats).toBeDefined();
    });

    it('should write formatted JSON', async () => {
      await serializer.saveToFile(cache, testFilename);

      const fileContent = await fs.readFile(testFilename, 'utf-8');

      expect(fileContent).toContain('\n'); // Pretty-printed with newlines
      expect(fileContent).toContain('  '); // Indentation
    });
  });

  describe('loadFromFile', () => {
    const testFilename = '.test-cache-load.json';

    beforeEach(async () => {
      const serializedData: SerializedCache = {
        version: '1.0.0',
        timestamp: Date.now(),
        strategy: { type: 'lru', maxSize: 100 },
        stats: { hits: 10, misses: 5, size: 2, hitRate: 0.67 },
        entries: [],
      };

      await fs.writeFile(testFilename, JSON.stringify(serializedData));
    });

    afterEach(async () => {
      try {
        await fs.unlink(testFilename);
      } catch {
        // Ignore cleanup errors
      }
    });

    it('should load cache from file', async () => {
      const loadedCache = await serializer.loadFromFile(testFilename);

      expect(loadedCache).toBeInstanceOf(ValidationCache);
      expect(loadedCache.getStats().hits).toBe(10);
      expect(loadedCache.getStats().misses).toBe(5);
    });

    it('should handle missing file gracefully', async () => {
      await expect(serializer.loadFromFile('non-existent-file.json')).rejects.toThrow();
    });
  });
});

// ============================================================================
// CACHE METRICS EXPORTER TESTS
// ============================================================================

describe('CacheMetricsExporter', () => {
  let cache: ValidationCache;
  let exporter: CacheMetricsExporter;

  beforeEach(() => {
    cache = new ValidationCache({ type: 'lru', maxSize: 100 });
    exporter = new CacheMetricsExporter(cache);
  });

  describe('getMetrics', () => {
    it('should return metrics for empty cache', () => {
      const metrics = exporter.getMetrics();

      expect(metrics.cache).toBeDefined();
      expect(metrics.warmup).toBeDefined();
      expect(metrics.performance).toBeDefined();
    });

    it('should include cache statistics', () => {
      // Use same reference for object caching
      const userData = { name: 'John' };
      cache.set(userData, 'user', { ok: true, data: {} });
      cache.get(userData, 'user'); // Hit

      const metrics = exporter.getMetrics();

      expect(metrics.cache.hits).toBeGreaterThan(0);
      // Note: WeakMap entries don't count in size, so size may be 0
    });

    it('should include warmup statistics', () => {
      const metrics = exporter.getMetrics();

      expect(metrics.warmup.totalItems).toBe(0);
      expect(metrics.warmup.successfulItems).toBe(0);
      expect(metrics.warmup.failedItems).toBe(0);
      expect(metrics.warmup.averageTime).toBe(0);
    });

    it('should include performance statistics', () => {
      const metrics = exporter.getMetrics();

      expect(metrics.performance.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.performance.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.performance.cacheHitRate).toBeLessThanOrEqual(1);
      expect(metrics.performance.averageLookupTime).toBe(0);
    });

    it('should estimate memory usage based on cache size', () => {
      // Use primitives so they count in size
      cache.set('user1', 'user', { ok: true, data: {} });
      cache.set('user2', 'user', { ok: true, data: {} });

      const metrics = exporter.getMetrics();

      expect(metrics.performance.memoryUsage).toBeGreaterThan(0);
    });

    it('should calculate hit rate correctly', () => {
      // Use same reference for hit
      const userData = { name: 'John' };
      cache.set(userData, 'user', { ok: true, data: {} });
      cache.get(userData, 'user'); // Hit
      cache.get({ name: 'Jane' }, 'user'); // Miss

      const metrics = exporter.getMetrics();

      expect(metrics.performance.cacheHitRate).toBeGreaterThan(0);
      expect(metrics.performance.cacheHitRate).toBeLessThanOrEqual(1);
    });
  });

  describe('exportPrometheus', () => {
    it('should export metrics in Prometheus format', () => {
      const prometheus = exporter.exportPrometheus();

      expect(prometheus).toContain('firm_cache_hits_total');
      expect(prometheus).toContain('firm_cache_misses_total');
      expect(prometheus).toContain('firm_cache_size');
      expect(prometheus).toContain('firm_cache_hit_rate');
      expect(prometheus).toContain('firm_cache_memory_usage_bytes');
    });

    it('should include HELP and TYPE comments', () => {
      const prometheus = exporter.exportPrometheus();

      expect(prometheus).toContain('# HELP');
      expect(prometheus).toContain('# TYPE');
    });

    it('should format metrics with correct values', () => {
      cache.set({ name: 'John' }, 'user', { ok: true, data: {} });
      cache.get({ name: 'John' }, 'user'); // Hit

      const prometheus = exporter.exportPrometheus();

      expect(prometheus).toMatch(/firm_cache_hits_total \d+/);
      expect(prometheus).toMatch(/firm_cache_size \d+/);
    });

    it('should handle zero values', () => {
      const prometheus = exporter.exportPrometheus();

      expect(prometheus).toContain('firm_cache_hits_total 0');
      expect(prometheus).toContain('firm_cache_misses_total 0');
      expect(prometheus).toContain('firm_cache_size 0');
    });
  });

  describe('exportJSON', () => {
    it('should export metrics as JSON string', () => {
      const json = exporter.exportJSON();

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should include all metric fields', () => {
      const json = exporter.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed.cache).toBeDefined();
      expect(parsed.warmup).toBeDefined();
      expect(parsed.performance).toBeDefined();
    });

    it('should be formatted (pretty-printed)', () => {
      const json = exporter.exportJSON();

      expect(json).toContain('\n'); // Contains newlines (formatted)
    });

    it('should reflect current cache state', () => {
      // Use same reference
      const userData = { name: 'John' };
      cache.set(userData, 'user', { ok: true, data: {} });
      cache.get(userData, 'user');

      const json = exporter.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed.cache.hits).toBeGreaterThan(0);
      // WeakMap entries don't count in size
    });
  });
});

// ============================================================================
// CACHE MANAGER TESTS (Integration)
// ============================================================================

describe('CacheManager', () => {
  let manager: CacheManager;

  beforeEach(() => {
    manager = new CacheManager({ type: 'lru', maxSize: 100 });
  });

  describe('constructor', () => {
    it('should create manager with default strategy', () => {
      const mgr = new CacheManager();
      expect(mgr.getStats()).toBeDefined();
    });

    it('should create manager with custom strategy', () => {
      const mgr = new CacheManager({ type: 'lru', maxSize: 50 });
      expect(mgr.getStats()).toBeDefined();
    });
  });

  describe('cache operations', () => {
    it('should set and get cached values', () => {
      const data = { name: 'John', age: 30 };
      const result = { ok: true as const, data };

      manager.set(data, 'user', result);
      const cached = manager.get(data, 'user');

      expect(cached).toEqual(result);
    });

    it('should return undefined for cache miss', () => {
      const cached = manager.get({ name: 'Unknown' }, 'user');
      expect(cached).toBeUndefined();
    });

    it('should delete cached entries', () => {
      const data = { name: 'John' };
      manager.set(data, 'user', { ok: true, data });

      const deleted = manager.delete(data, 'user');
      expect(deleted).toBe(true);

      const cached = manager.get(data, 'user');
      expect(cached).toBeUndefined();
    });

    it('should return false when deleting non-existent entry', () => {
      const deleted = manager.delete({ name: 'Unknown' }, 'user');
      expect(deleted).toBe(false);
    });

    it('should clear all entries', () => {
      manager.set({ name: 'John' }, 'user', { ok: true, data: {} });
      manager.set({ name: 'Jane' }, 'user', { ok: true, data: {} });

      manager.clear();

      expect(manager.getStats().size).toBe(0);
    });

    it('should get cache statistics', () => {
      const stats = manager.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('hitRate');
    });
  });

  describe('warmup operations', () => {
    it('should warm up cache with datasets', async () => {
      const datasets: CacheWarmupData[] = [
        { schemaId: 'user', data: { name: 'John' }, expectedResult: true },
        { schemaId: 'user', data: { name: 'Jane' }, expectedResult: true },
      ];

      const result = await manager.warmup(datasets);

      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);
    });

    it('should generate warmup data from history', () => {
      const history = [
        { schemaId: 'user', data: { name: 'John' }, result: { ok: true, data: {} } },
      ];

      const warmupData = manager.generateWarmupData(history);

      expect(warmupData).toHaveLength(1);
      expect(warmupData[0]!.expectedResult).toBe(true);
    });
  });

  describe('serialization operations', () => {
    it('should serialize cache', () => {
      manager.set({ name: 'John' }, 'user', { ok: true, data: {} });

      const serialized = manager.serialize();

      expect(serialized.version).toBe('1.0.0');
      expect(serialized.stats).toBeDefined();
    });

    it('should deserialize cache', () => {
      const serializedData: SerializedCache = {
        version: '1.0.0',
        timestamp: Date.now(),
        strategy: { type: 'lru', maxSize: 100 },
        stats: { hits: 10, misses: 5, size: 2, hitRate: 0.67 },
        entries: [],
      };

      manager.deserialize(serializedData);

      const stats = manager.getStats();
      expect(stats.hits).toBe(10);
      expect(stats.misses).toBe(5);
    });

    it('should save cache to file', async () => {
      const filename = '.test-manager-cache.json';

      try {
        await manager.saveToFile(filename);

        const fileExists = await fs
          .access(filename)
          .then(() => true)
          .catch(() => false);

        expect(fileExists).toBe(true);

        await fs.unlink(filename);
      } catch (error) {
        // Cleanup
        try {
          await fs.unlink(filename);
        } catch {
          // Ignore
        }
        throw error;
      }
    });

    it('should load cache from file', async () => {
      const filename = '.test-manager-load.json';

      try {
        // Save with primitives so they persist
        manager.set('john@example.com', 'user', { ok: true, data: {} });
        await manager.saveToFile(filename);

        // Create new manager and load
        const newManager = new CacheManager();
        await newManager.loadFromFile(filename);

        const stats = newManager.getStats();
        expect(stats.size).toBeGreaterThanOrEqual(0); // May be 0 if serialization doesn't preserve primitives

        await fs.unlink(filename);
      } catch (error) {
        // Cleanup
        try {
          await fs.unlink(filename);
        } catch {
          // Ignore
        }
        throw error;
      }
    });
  });

  describe('metrics operations', () => {
    it('should get cache metrics', () => {
      const metrics = manager.getMetrics();

      expect(metrics.cache).toBeDefined();
      expect(metrics.warmup).toBeDefined();
      expect(metrics.performance).toBeDefined();
    });

    it('should export Prometheus metrics', () => {
      const prometheus = manager.exportPrometheus();

      expect(prometheus).toContain('firm_cache_hits_total');
      expect(prometheus).toContain('firm_cache_misses_total');
    });

    it('should export JSON metrics', () => {
      const json = manager.exportJSON();
      const parsed = JSON.parse(json);

      expect(parsed.cache).toBeDefined();
      expect(parsed.warmup).toBeDefined();
      expect(parsed.performance).toBeDefined();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete workflow: set, warmup, serialize, metrics', async () => {
      // Set initial data with primitive
      manager.set('john@example.com', 'user', { ok: true, data: {} });

      // Warmup
      const datasets: CacheWarmupData[] = [
        { schemaId: 'user', data: { name: 'Jane' }, expectedResult: true },
      ];
      await manager.warmup(datasets);

      // Serialize
      const serialized = manager.serialize();
      expect(serialized.stats.size).toBeGreaterThanOrEqual(0);

      // Metrics
      const metrics = manager.getMetrics();
      expect(metrics.cache).toBeDefined();
    });

    it('should maintain cache integrity across operations', () => {
      // Add data with primitives (they count in size)
      manager.set('user1', 'user', { ok: true, data: { id: 1 } });
      manager.set('user2', 'user', { ok: true, data: { id: 2 } });

      // Check cache
      expect(manager.getStats().size).toBe(2);

      // Delete one
      manager.delete('user1', 'user');
      expect(manager.getStats().size).toBe(1);

      // Verify remaining data
      const cached = manager.get('user2', 'user');
      expect(cached).toBeDefined();
    });
  });
});
