/**
 * LAYER 1: Lazy Validator
 *
 * Lazy evaluation for recursive schemas.
 * Useful for defining recursive data structures like trees, linked lists, etc.
 *
 * @example
 * ```ts
 * interface TreeNode {
 *   value: number;
 *   children: TreeNode[];
 * }
 *
 * const treeSchema: Schema<TreeNode> = s.lazy(() =>
 *   s.object({
 *     value: s.number(),
 *     children: s.array(treeSchema),
 *   })
 * );
 * ```
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { Schema, SchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult } from '../../../common/types/result.js';

// ============================================================================
// LAZY VALIDATOR
// ============================================================================

interface LazyConfig<T> extends SchemaConfig {
  getter: () => Schema<T>;
}

export class LazyValidator<T> extends BaseSchema<T, LazyConfig<T>> {
  readonly _type = 'lazy' as const;
  private cachedSchema: Schema<T> | null = null;

  constructor(getter: () => Schema<T>, config: SchemaConfig = {}) {
    super({ ...config, getter });
  }

  private get schema(): Schema<T> {
    if (!this.cachedSchema) {
      this.cachedSchema = this.config.getter();
    }
    return this.cachedSchema;
  }

  protected _validate(value: unknown, _path: string): ValidationResult<T> {
    return this.schema.validate(value);
  }

  protected override _check(value: unknown): boolean {
    return this.schema.is(value);
  }

  protected _clone(config: Partial<LazyConfig<T>>): this {
    const merged = { ...this.config, ...config };
    return new LazyValidator(merged.getter!, merged) as this;
  }

  /**
   * Get the inner schema (forces evaluation).
   */
  getSchema(): Schema<T> {
    return this.schema;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a lazy schema for recursive definitions.
 *
 * @example
 * ```ts
 * const treeSchema = s.lazy(() =>
 *   s.object({
 *     value: s.number(),
 *     children: s.array(treeSchema),
 *   })
 * );
 * ```
 */
export function lazy<T>(getter: () => Schema<T>): LazyValidator<T> {
  return new LazyValidator(getter);
}

/**
 * Alias for `lazy` (for compatibility with other libraries).
 */
export function recursive<T>(getter: () => Schema<T>): LazyValidator<T> {
  return lazy(getter);
}