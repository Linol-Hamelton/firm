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

// Revolutionary Features - Streaming Validation (#3)
export * from './streaming/index.js';

// Revolutionary Features - AI-Powered Error Messages (#4)
export * from './ai-errors/index.js';

// Revolutionary Features - Performance Budgets & Monitoring (#7)
export * from './monitoring/index.js';

// Revolutionary Features - Visual Schema Inspector (#5)
export * from './inspector/index.js';
