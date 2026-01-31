/**
 * LAYER 3: Visual Schema Inspector
 *
 * Inspect schema structure for debugging and documentation.
 * Provides human-readable representation of schema hierarchy.
 *
 * Target: Help developers understand complex schemas at a glance.
 */

export * from './schema-inspector.js';

/**
 * Schema inspection utilities for FIRM validator.
 */
export default {
  ...require('./schema-inspector.js'),
};