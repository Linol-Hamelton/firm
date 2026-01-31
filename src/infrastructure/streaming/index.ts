/**
 * LAYER 3: Streaming Validation
 *
 * Validate large data streams without loading everything into memory.
 * Supports async iterators, Node.js streams, and chunk-based validation.
 *
 * Target: Handle 1GB+ JSON streams with constant memory usage.
 */

export * from './streaming-validator.js';

/**
 * Streaming validation utilities for FIRM validator.
 */
export default {
  ...require('./streaming-validator.js'),
};