/**
 * LAYER 1: Base Schema (Legacy Export)
 *
 * This file is now a re-export for backward compatibility.
 * The actual implementation has been split into smaller files:
 * - base-schema-core.ts: Main BaseSchema class
 * - schema-modifiers.ts: Refinement, transform, and preprocess classes
 *
 * PERFORMANCE CRITICAL:
 * - All methods must be pure (no I/O)
 * - Minimize object allocations
 * - Use early returns for fast paths
 */

export { BaseSchema } from './base-schema-core.js';
export type { SchemaConfig } from '../../common/types/schema.js';

// Export modifier classes
export {
  RefinedSchema,
  AsyncRefinedSchema,
  SuperRefinedSchema,
  TransformSchema,
  AsyncTransformSchema,
  PreprocessSchema,
  AsyncPreprocessSchema,
  PipeSchema,
  type RefinementContext,
} from './schema-modifiers.js';
