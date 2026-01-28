/**
 * LAYER 3: Caching Module
 *
 * Smart caching system for validation results.
 * Revolutionary Feature #8: Smart Caching
 */

export {
  ValidationCache,
  globalCache,
  createCache,
  configureGlobalCache,
  type CacheStrategy,
  type ValidationCacheStats,
} from './validation-cache.js';

export {
  withCache,
  withCacheConfig,
  clearSchemaCache,
} from './schema-cache-wrapper.js';
