/**
 * LAYER 3: Performance Budgets & Monitoring
 *
 * Monitor validation performance and enforce performance budgets.
 * Alerts when validation exceeds time or memory thresholds.
 *
 * Target: Ensure validation never exceeds 1ms p95 for typical schemas.
 */

export * from './performance-monitor.js';

/**
 * Performance monitoring utilities for FIRM validator.
 */
export default {
  ...require('./performance-monitor.js'),
};