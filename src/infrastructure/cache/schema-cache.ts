/**
 * LAYER 3: Schema Cache Implementation
 *
 * Cache for compiled validators and schema metadata.
 * Improves performance for repeated validations.
 */

import type { CachePort } from '../../ports/output/formatter-port.js';

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

/**
 * LRU (Least Recently Used) cache implementation.
 * Automatically evicts least recently used items when capacity is reached.
 */
export class LRUCache<T> implements CachePort<T> {
  private readonly cache: Map<string, T>;
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);

    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }

    return value;
  }

  set(key: string, value: T): void {
    // Remove if exists (to update position)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys (for debugging).
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache stats.
   */
  stats(): CacheStats {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: this.cache.size / this.maxSize,
    };
  }
}

export interface CacheStats {
  size: number;
  maxSize: number;
  utilization: number;
}

// ============================================================================
// TTL CACHE IMPLEMENTATION
// ============================================================================

interface TTLEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Cache with TTL (Time To Live) support.
 * Items automatically expire after specified duration.
 */
export class TTLCache<T> implements CachePort<T> {
  private readonly cache: Map<string, TTLEntry<T>>;
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(options: TTLCacheOptions = {}) {
    this.cache = new Map();
    this.ttlMs = options.ttlMs ?? 60000; // 1 minute default
    this.maxSize = options.maxSize ?? 1000;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: string, value: T): void {
    // Cleanup expired entries periodically
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    // If still at capacity, remove oldest
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  /**
   * Remove expired entries.
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

export interface TTLCacheOptions {
  /** TTL in milliseconds */
  ttlMs?: number;
  /** Maximum cache size */
  maxSize?: number;
}

// ============================================================================
// NO-OP CACHE (FOR TESTING/DISABLING)
// ============================================================================

/**
 * No-operation cache that doesn't store anything.
 * Useful for testing or when caching should be disabled.
 */
export class NoOpCache<T> implements CachePort<T> {
  get(_key: string): T | undefined {
    return undefined;
  }

  set(_key: string, _value: T): void {
    // No-op
  }

  has(_key: string): boolean {
    return false;
  }

  delete(_key: string): boolean {
    return false;
  }

  clear(): void {
    // No-op
  }

  size(): number {
    return 0;
  }
}

// ============================================================================
// SCHEMA CACHE MANAGER
// ============================================================================

/**
 * Specialized cache manager for schema-related caching.
 */
export class SchemaCacheManager {
  private readonly compiledValidators: LRUCache<unknown>;
  private readonly schemaHashes: LRUCache<string>;

  constructor(options: SchemaCacheOptions = {}) {
    this.compiledValidators = new LRUCache(options.maxCompiledValidators ?? 500);
    this.schemaHashes = new LRUCache(options.maxSchemaHashes ?? 1000);
  }

  /**
   * Get cached compiled validator.
   */
  getCompiledValidator<T>(schemaHash: string): T | undefined {
    return this.compiledValidators.get(schemaHash) as T | undefined;
  }

  /**
   * Cache compiled validator.
   */
  setCompiledValidator<T>(schemaHash: string, validator: T): void {
    this.compiledValidators.set(schemaHash, validator);
  }

  /**
   * Generate hash for schema (simple implementation).
   */
  hashSchema(schema: unknown): string {
    // Use JSON.stringify for simple hashing
    // In production, use a proper hashing algorithm
    const key = JSON.stringify(schema);
    const cached = this.schemaHashes.get(key);

    if (cached) {
      return cached;
    }

    const hash = this.simpleHash(key);
    this.schemaHashes.set(key, hash);
    return hash;
  }

  /**
   * Simple string hash function.
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `schema_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Clear all caches.
   */
  clear(): void {
    this.compiledValidators.clear();
    this.schemaHashes.clear();
  }

  /**
   * Get cache statistics.
   */
  stats(): { validators: CacheStats; hashes: CacheStats } {
    return {
      validators: this.compiledValidators.stats(),
      hashes: this.schemaHashes.stats(),
    };
  }
}

export interface SchemaCacheOptions {
  maxCompiledValidators?: number;
  maxSchemaHashes?: number;
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create cache with specified type.
 */
export function createCache<T>(
  type: 'lru' | 'ttl' | 'noop' = 'lru',
  options?: { maxSize?: number; ttlMs?: number }
): CachePort<T> {
  switch (type) {
    case 'ttl':
      return new TTLCache<T>(options);
    case 'noop':
      return new NoOpCache<T>();
    default:
      return new LRUCache<T>(options?.maxSize);
  }
}
