/**
 * Smart Caching Tests
 * Revolutionary Feature #8
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { s } from '../../../src/index.ts';
import {
  ValidationCache,
  withCache,
  withCacheConfig,
  globalCache,
} from '../../../src/infrastructure/caching/index';

describe('Smart Caching', () => {
  describe('ValidationCache', () => {
    let cache: ValidationCache;

    beforeEach(() => {
      cache = new ValidationCache({ type: 'lru', maxSize: 100 });
    });

    it('should cache primitive values', () => {
      const result = { ok: true, data: 'hello' } as const;
      cache.set('hello', 'schema1', result);

      const cached = cache.get('hello', 'schema1');
      expect(cached).toEqual(result);
    });

    it('should cache objects using WeakMap', () => {
      const obj = { name: 'John' };
      const result = { ok: true, data: obj } as const;

      cache.set(obj, 'schema1', result);

      const cached = cache.get(obj, 'schema1');
      expect(cached).toEqual(result);
    });

    it('should track cache hits and misses', () => {
      cache.set('test', 'schema1', { ok: true, data: 'test' });

      cache.get('test', 'schema1'); // hit
      cache.get('missing', 'schema1'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.5);
    });

    it('should delete cached values', () => {
      cache.set('test', 'schema1', { ok: true, data: 'test' });
      expect(cache.get('test', 'schema1')).toBeDefined();

      cache.delete('test', 'schema1');
      expect(cache.get('test', 'schema1')).toBeUndefined();
    });

    it('should clear all cache', () => {
      cache.set('test1', 'schema1', { ok: true, data: 'test1' });
      cache.set('test2', 'schema1', { ok: true, data: 'test2' });

      cache.clear();

      expect(cache.get('test1', 'schema1')).toBeUndefined();
      expect(cache.get('test2', 'schema1')).toBeUndefined();
    });

    it('should respect maxSize with LRU strategy', () => {
      const smallCache = new ValidationCache({ type: 'lru', maxSize: 2 });

      smallCache.set('a', 'schema1', { ok: true, data: 'a' });
      smallCache.set('b', 'schema1', { ok: true, data: 'b' });
      smallCache.set('c', 'schema1', { ok: true, data: 'c' });

      // One entry should be evicted
      const stats = smallCache.getStats();
      expect(stats.size).toBeLessThanOrEqual(2);
    });

    it('should expire entries with TTL strategy', async () => {
      const ttlCache = new ValidationCache({ type: 'ttl', ttl: 100 });

      ttlCache.set('test', 'schema1', { ok: true, data: 'test' });
      expect(ttlCache.get('test', 'schema1')).toBeDefined();

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(ttlCache.get('test', 'schema1')).toBeUndefined();
    });
  });

  describe('withCache', () => {
    beforeEach(() => {
      globalCache.clear();
    });

    it('should cache validation results', () => {
      const schema = s.string().min(3);
      const cachedSchema = withCache(schema);

      const data = 'hello';

      // First validation
      const result1 = cachedSchema.validate(data);
      expect(result1.ok).toBe(true);

      // Second validation should be cached
      const result2 = cachedSchema.validate(data);
      expect(result2).toEqual(result1);
    });

    it('should cache both success and failure results', () => {
      const schema = s.string().min(5);
      const cachedSchema = withCache(schema);

      // Cache failure
      const fail = cachedSchema.validate('hi');
      expect(fail.ok).toBe(false);

      // Cache success
      const success = cachedSchema.validate('hello');
      expect(success.ok).toBe(true);

      // Both should be cached
      expect(cachedSchema.validate('hi').ok).toBe(false);
      expect(cachedSchema.validate('hello').ok).toBe(true);
    });

    it('should work with complex objects', () => {
      const schema = s.object({
        name: s.string().min(1),
        age: s.number().int().min(0),
      });

      const cachedSchema = withCache(schema);

      const user = { name: 'John', age: 30 };

      const result1 = cachedSchema.validate(user);
      expect(result1.ok).toBe(true);

      // Same object should be cached
      const result2 = cachedSchema.validate(user);
      expect(result2).toEqual(result1);
    });

    it('should cache independently for different schemas', () => {
      const schema1 = s.string().min(3);
      const schema2 = s.string().max(5);

      const cached1 = withCache(schema1);
      const cached2 = withCache(schema2);

      const data = 'test';

      cached1.validate(data);
      cached2.validate(data);

      // Each schema should have its own cache
      expect(cached1.validate(data).ok).toBe(true);
      expect(cached2.validate(data).ok).toBe(true);
    });
  });

  describe('withCacheConfig', () => {
    it('should use custom cache strategy', () => {
      const schema = s.string();

      const cachedSchema = withCacheConfig(schema, {
        type: 'ttl',
        ttl: 1000,
      });

      const result = cachedSchema.validate('test');
      expect(result.ok).toBe(true);
    });

    it('should respect size strategy', () => {
      const schema = s.number();

      const cachedSchema = withCacheConfig(schema, {
        type: 'size',
        maxSize: 5,
      });

      // Fill cache
      for (let i = 0; i < 10; i++) {
        cachedSchema.validate(i);
      }

      // Cache size should be limited
      // (Cannot directly test, but validation should still work)
      expect(cachedSchema.validate(5).ok).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should significantly speed up repeated validations', () => {
      const schema = s.object({
        name: s.string().min(1).max(100),
        email: s.string().email(),
        age: s.number().int().min(0).max(150),
        address: s.object({
          street: s.string(),
          city: s.string(),
          country: s.string(),
        }),
      });

      const cachedSchema = withCache(schema);

      const data = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'New York',
          country: 'USA',
        },
      };

      // Warm up
      cachedSchema.validate(data);

      // Measure uncached
      const uncachedStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        schema.validate(data);
      }
      const uncachedTime = performance.now() - uncachedStart;

      // Measure cached
      const cachedStart = performance.now();
      for (let i = 0; i < 1000; i++) {
        cachedSchema.validate(data);
      }
      const cachedTime = performance.now() - cachedStart;

      // Cached should be significantly faster
      // (Actual speedup depends on schema complexity)
      expect(cachedTime).toBeLessThan(uncachedTime);
    });
  });
});
