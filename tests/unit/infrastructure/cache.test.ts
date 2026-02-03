/**
 * Cache Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LRUCache,
  TTLCache,
  NoOpCache,
  SchemaCacheManager,
  createCache,
} from '../../../src/infrastructure/cache/schema-cache';

describe('LRUCache', () => {
  let cache: LRUCache<string>;

  beforeEach(() => {
    cache = new LRUCache<string>(3);
  });

  describe('basic operations', () => {
    it('should set and get values', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('missing')).toBe(false);
    });

    it('should delete keys', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeUndefined();
      expect(cache.delete('missing')).toBe(false);
    });

    it('should clear all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should report correct size', () => {
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used when at capacity', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');
      cache.set('key4', 'value4'); // Should evict key1

      expect(cache.get('key1')).toBeUndefined();
      expect(cache.get('key2')).toBe('value2');
      expect(cache.get('key3')).toBe('value3');
      expect(cache.get('key4')).toBe('value4');
    });

    it('should update LRU order on get', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Access key1 to make it most recently used
      cache.get('key1');

      // Add key4, should evict key2 (now least recently used)
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('value1');
      expect(cache.get('key2')).toBeUndefined();
    });

    it('should update LRU order on set', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      // Update key1
      cache.set('key1', 'updated');

      // Add key4, should evict key2
      cache.set('key4', 'value4');

      expect(cache.get('key1')).toBe('updated');
      expect(cache.get('key2')).toBeUndefined();
    });
  });

  describe('stats', () => {
    it('should return cache stats', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const stats = cache.stats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(3);
      expect(stats.utilization).toBeCloseTo(0.667, 2);
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      const keys = cache.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });
});

describe('TTLCache', () => {
  describe('basic operations', () => {
    it('should set and get values', () => {
      const cache = new TTLCache<string>({ ttlMs: 1000 });
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return undefined for missing keys', () => {
      const cache = new TTLCache<string>();
      expect(cache.get('missing')).toBeUndefined();
    });
  });

  describe('TTL expiration', () => {
    it('should expire entries after TTL', async () => {
      const cache = new TTLCache<string>({ ttlMs: 50 });
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.get('key1')).toBeUndefined();
    });

    it('should not return expired entries on has()', async () => {
      const cache = new TTLCache<string>({ ttlMs: 50 });
      cache.set('key1', 'value1');

      expect(cache.has('key1')).toBe(true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('max size', () => {
    it('should evict when at max size', () => {
      const cache = new TTLCache<string>({ maxSize: 2, ttlMs: 10000 });

      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      expect(cache.size()).toBeLessThanOrEqual(2);
    });
  });
});

describe('NoOpCache', () => {
  let cache: NoOpCache<string>;

  beforeEach(() => {
    cache = new NoOpCache<string>();
  });

  it('should always return undefined for get', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should always return false for has', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(false);
  });

  it('should always return false for delete', () => {
    expect(cache.delete('key1')).toBe(false);
  });

  it('should always return 0 for size', () => {
    cache.set('key1', 'value1');
    expect(cache.size()).toBe(0);
  });
});

describe('SchemaCacheManager', () => {
  let manager: SchemaCacheManager;

  beforeEach(() => {
    manager = new SchemaCacheManager();
  });

  describe('compiled validators', () => {
    it('should cache compiled validators', () => {
      const validator = () => ({ ok: true, data: 'test' });
      manager.setCompiledValidator('hash1', validator);

      expect(manager.getCompiledValidator('hash1')).toBe(validator);
    });

    it('should return undefined for missing validators', () => {
      expect(manager.getCompiledValidator('missing')).toBeUndefined();
    });
  });

  describe('schema hashing', () => {
    it('should generate consistent hashes', () => {
      const hash1 = manager.hashSchema({ type: 'string' });
      const hash2 = manager.hashSchema({ type: 'string' });

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different schemas', () => {
      const hash1 = manager.hashSchema({ type: 'string' });
      const hash2 = manager.hashSchema({ type: 'number' });

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('clear', () => {
    it('should clear all caches', () => {
      manager.setCompiledValidator('hash1', () => {});
      manager.hashSchema({ type: 'string' });

      manager.clear();

      expect(manager.getCompiledValidator('hash1')).toBeUndefined();
    });
  });

  describe('stats', () => {
    it('should return cache stats', () => {
      const stats = manager.stats();

      expect(stats).toHaveProperty('validators');
      expect(stats).toHaveProperty('hashes');
      expect(stats.validators).toHaveProperty('size');
      expect(stats.validators).toHaveProperty('maxSize');
    });
  });
});

describe('createCache', () => {
  it('should create LRU cache by default', () => {
    const cache = createCache();
    expect(cache).toBeInstanceOf(LRUCache);
  });

  it('should create TTL cache', () => {
    const cache = createCache('ttl');
    expect(cache).toBeInstanceOf(TTLCache);
  });

  it('should create NoOp cache', () => {
    const cache = createCache('noop');
    expect(cache).toBeInstanceOf(NoOpCache);
  });

  it('should pass options to cache', () => {
    const cache = createCache('lru', { maxSize: 5 }) as LRUCache<any>;
    const stats = cache.stats();
    expect(stats.maxSize).toBe(5);
  });
});
