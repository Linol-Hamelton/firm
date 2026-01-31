/**
 * LAYER 3: AI-Powered Error Messages
 *
 * Enhance validation error messages with contextual suggestions,
 * examples, and actionable fixes.
 *
 * Target: Reduce developer debugging time by 50%.
 */

export * from './ai-error-enhancer.js';

/**
 * AI-powered error enhancement utilities for FIRM validator.
 */
export default {
  ...require('./ai-error-enhancer.js'),
};