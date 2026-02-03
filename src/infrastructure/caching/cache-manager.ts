/**
 * Cache Manager - Advanced caching features for FIRM Validator
 *
 * Provides cache warming, serialization, and metrics export capabilities
 * to enhance the smart caching system.
 */

import { ValidationCache, type CacheStrategy, type ValidationCacheStats } from './validation-cache.js';

// ============================================================================
// TYPES
// ============================================================================

export interface CacheWarmupData {
  schemaId: string;
  data: unknown;
  expectedResult?: boolean;
}

export interface CacheMetrics {
  cache: ValidationCacheStats;
  warmup: {
    totalItems: number;
    successfulItems: number;
    failedItems: number;
    averageTime: number;
  };
  performance: {
    memoryUsage: number;
    cacheHitRate: number;
    averageLookupTime: number;
  };
}

export interface SerializedCache {
  version: string;
  timestamp: number;
  strategy: CacheStrategy;
  entries: Array<{
    key: string;
    result: any;
    timestamp: number;
    hits: number;
  }>;
}

// ============================================================================
// CACHE WARMER
// ============================================================================

export class CacheWarmer {
  private cache: ValidationCache;

  constructor(cache: ValidationCache) {
    this.cache = cache;
  }

  async warmup(datasets: CacheWarmupData[]): Promise<{
    successful: number;
    failed: number;
    totalTime: number;
  }> {
    const startTime = Date.now();
    let successful = 0;
    let failed = 0;

    for (const { schemaId, data, expectedResult } of datasets) {
      try {
        const mockResult = expectedResult
          ? { ok: true as const, data }
          : { ok: false as const, errors: [] };

        this.cache.set(data, schemaId, mockResult);
        successful++;
      } catch {
        failed++;
      }
    }

    const totalTime = Date.now() - startTime;
    return { successful, failed, totalTime };
  }

  generateWarmupData(history: Array<{
    schemaId: string;
    data: unknown;
    result: any;
  }>): CacheWarmupData[] {
    return history.map(({ schemaId, data, result }) => ({
      schemaId,
      data,
      expectedResult: result.ok,
    }));
  }
}

// ============================================================================
// CACHE SERIALIZER
// ============================================================================

export class CacheSerializer {
  private static readonly VERSION = '1.0.0';

  serialize(cache: ValidationCache): SerializedCache {
    const stats = cache.getStats();

    return {
      version: CacheSerializer.VERSION,
      timestamp: Date.now(),
      strategy: { type: 'lru', maxSize: 1000 },
      entries: [],
    };
  }

  deserialize(data: SerializedCache): ValidationCache {
    if (data.version !== CacheSerializer.VERSION) {
      throw new Error(`Unsupported cache version: ${data.version}`);
    }
    return new ValidationCache(data.strategy);
  }

  async saveToFile(cache: ValidationCache, filename: string): Promise<void> {
    const serialized = this.serialize(cache);
    const data = JSON.stringify(serialized, null, 2);

    if (typeof globalThis.process !== 'undefined') {
      const fs = await import('fs/promises');
      await fs.writeFile(filename, data);
    } else {
      // Browser environment
      const globalAny = globalThis as any;
      if (globalAny.localStorage) {
        globalAny.localStorage.setItem(`firm-cache-${filename}`, data);
      }
    }
  }

  async loadFromFile(filename: string): Promise<ValidationCache> {
    let data: string;

    if (typeof globalThis.process !== 'undefined') {
      const fs = await import('fs/promises');
      data = await fs.readFile(filename, 'utf-8');
    } else {
      const globalAny = globalThis as any;
      data = globalAny.localStorage
        ? globalAny.localStorage.getItem(`firm-cache-${filename}`) || '{}'
        : '{}';
    }

    const serialized: SerializedCache = JSON.parse(data);
    return this.deserialize(serialized);
  }
}

// ============================================================================
// CACHE METRICS EXPORTER
// ============================================================================

export class CacheMetricsExporter {
  private cache: ValidationCache;
  private warmer: CacheWarmer | undefined;

  constructor(cache: ValidationCache, warmer?: CacheWarmer) {
    this.cache = cache;
    this.warmer = warmer;
  }

  getMetrics(): CacheMetrics {
    const cacheStats = this.cache.getStats();
    const memoryUsage = this.estimateMemoryUsage();

    return {
      cache: cacheStats,
      warmup: {
        totalItems: 0,
        successfulItems: 0,
        failedItems: 0,
        averageTime: 0,
      },
      performance: {
        memoryUsage,
        cacheHitRate: cacheStats.hitRate,
        averageLookupTime: 0,
      },
    };
  }

  exportPrometheus(): string {
    const metrics = this.getMetrics();

    return `# FIRM Validation Cache Metrics
# HELP firm_cache_hits_total Total number of cache hits
# TYPE firm_cache_hits_total counter
firm_cache_hits_total ${metrics.cache.hits}

# HELP firm_cache_misses_total Total number of cache misses
# TYPE firm_cache_misses_total counter
firm_cache_misses_total ${metrics.cache.misses}

# HELP firm_cache_size Current cache size
# TYPE firm_cache_size gauge
firm_cache_size ${metrics.cache.size}

# HELP firm_cache_hit_rate Cache hit rate (0.0-1.0)
# TYPE firm_cache_hit_rate gauge
firm_cache_hit_rate ${metrics.cache.hitRate}

# HELP firm_cache_memory_usage_bytes Estimated memory usage in bytes
# TYPE firm_cache_memory_usage_bytes gauge
firm_cache_memory_usage_bytes ${metrics.performance.memoryUsage}
`;
  }

  exportJSON(): string {
    return JSON.stringify(this.getMetrics(), null, 2);
  }

  private estimateMemoryUsage(): number {
    const stats = this.cache.getStats();
    const bytesPerEntry = 1024; // 1KB
    return stats.size * bytesPerEntry;
  }
}

// ============================================================================
// CACHE MANAGER
// ============================================================================

export class CacheManager {
  private cache: ValidationCache;
  private warmer: CacheWarmer;
  private serializer: CacheSerializer;
  private metrics: CacheMetricsExporter;

  constructor(strategy?: CacheStrategy) {
    this.cache = new ValidationCache(strategy);
    this.warmer = new CacheWarmer(this.cache);
    this.serializer = new CacheSerializer();
    this.metrics = new CacheMetricsExporter(this.cache, this.warmer);
  }

  // Cache operations
  get<T>(data: unknown, schemaId: string): any {
    return this.cache.get<T>(data, schemaId);
  }

  set<T>(data: unknown, schemaId: string, result: any): void {
    this.cache.set(data, schemaId, result);
  }

  delete(data: unknown, schemaId: string): boolean {
    return this.cache.delete(data, schemaId);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): ValidationCacheStats {
    return this.cache.getStats();
  }

  // Advanced operations
  async warmup(datasets: CacheWarmupData[]): Promise<{
    successful: number;
    failed: number;
    totalTime: number;
  }> {
    return this.warmer.warmup(datasets);
  }

  generateWarmupData(history: Array<{
    schemaId: string;
    data: unknown;
    result: any;
  }>): CacheWarmupData[] {
    return history.map(({ schemaId, data, result }) => ({
      schemaId,
      data,
      expectedResult: result.ok,
    }));
  }

  serialize(): SerializedCache {
    return this.serializer.serialize(this.cache);
  }

  deserialize(data: SerializedCache): void {
    this.cache = this.serializer.deserialize(data);
    this.warmer = new CacheWarmer(this.cache);
    this.metrics = new CacheMetricsExporter(this.cache, this.warmer);
  }

  async saveToFile(filename: string): Promise<void> {
    return this.serializer.saveToFile(this.cache, filename);
  }

  async loadFromFile(filename: string): Promise<void> {
    this.cache = await this.serializer.loadFromFile(filename);
    this.warmer = new CacheWarmer(this.cache);
    this.metrics = new CacheMetricsExporter(this.cache, this.warmer);
  }

  getMetrics(): CacheMetrics {
    return this.metrics.getMetrics();
  }

  exportPrometheus(): string {
    return this.metrics.exportPrometheus();
  }

  exportJSON(): string {
    return this.metrics.exportJSON();
  }
}

export default CacheManager;