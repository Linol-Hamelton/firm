/**
 * LAYER 3: Infrastructure
 *
 * Implementations of output ports.
 * Contains all I/O and side-effect code.
 *
 * This layer can be slow - it's not performance critical.
 * Core validation logic is in core/ layer.
 */

export * from './formatting/index.js';
export * from './cache/index.js';
export * from './logging/index.js';

// Revolutionary Features - Smart Caching (#8)
export {
  ValidationCache,
  globalCache as globalValidationCache,
  createCache as createValidationCache,
  configureGlobalCache,
  withCache,
  withCacheConfig,
  clearSchemaCache,
  type CacheStrategy,
  type ValidationCacheStats,
} from './caching/index.js';

// Revolutionary Features - Auto-Fix Mode (#10)
export * from './auto-fix/index.js';
