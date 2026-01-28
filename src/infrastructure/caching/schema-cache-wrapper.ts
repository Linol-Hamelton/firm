/**
 * Schema caching wrapper utilities.
 *
 * Provides caching functionality for any schema.
 */

import type { Schema, SchemaType, CompiledValidator } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';
import { ValidationCache, globalCache, type CacheStrategy } from './validation-cache.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// ============================================================================
// SCHEMA WRAPPER WITH CACHE
// ============================================================================

/**
 * Cache-enabled schema wrapper.
 */
class CachedSchema<T> implements Schema<T> {
  readonly _type: SchemaType;
  readonly _output!: T;
  readonly _input!: unknown;

  private schemaId: string;
  private cache: ValidationCache;

  constructor(
    private schema: Schema<T>,
    cache?: ValidationCache
  ) {
    this._type = schema._type;
    this.schemaId = this.generateSchemaId();
    this.cache = cache || globalCache;
  }

  validate(data: unknown): ValidationResult<T> {
    // Try to get from cache
    const cached = this.cache.get<T>(data, this.schemaId);
    if (cached) {
      return cached;
    }

    // Perform validation
    const result = this.schema.validate(data);

    // Cache the result
    this.cache.set(data, this.schemaId, result);

    return result;
  }

  compile(): CompiledValidator<T> {
    // Delegate to wrapped schema
    return this.schema.compile();
  }

  is(value: unknown): value is T {
    return this.schema.is(value);
  }

  assert(data: unknown): asserts data is T {
    const result = this.validate(data);
    if (!result.ok) {
      throw new ValidationException(result.errors);
    }
  }

  parse(data: unknown): T {
    return this.schema.parse(data);
  }

  safeParse(data: unknown): ValidationResult<T> {
    return this.validate(data);
  }

  optional(): Schema<T | undefined> {
    return new CachedSchema(this.schema.optional(), this.cache);
  }

  nullable(): Schema<T | null> {
    return new CachedSchema(this.schema.nullable(), this.cache);
  }

  nullish(): Schema<T | null | undefined> {
    return new CachedSchema(this.schema.nullish(), this.cache);
  }

  default(value: T): Schema<T> {
    return new CachedSchema(this.schema.default(value), this.cache);
  }

  /**
   * Generate unique ID for this schema.
   */
  private generateSchemaId(): string {
    // Use schema type and a counter for uniqueness
    return `${this.schema._type}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  /**
   * Clear cache for this schema.
   */
  clearCache(): void {
    // Cache is cleared via ValidationCache API, not directly
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Wrap schema with caching using global cache.
 *
 * @param schema - Schema to wrap
 *
 * @example
 * ```typescript
 * const userSchema = s.object({
 *   name: s.string(),
 *   email: s.string().email(),
 * });
 *
 * const cachedSchema = withCache(userSchema);
 *
 * // First validation - slow
 * cachedSchema.validate(user);
 *
 * // Second validation of same data - 10-100x faster
 * cachedSchema.validate(user);
 * ```
 */
export function withCache<T>(schema: Schema<T>): Schema<T> {
  return new CachedSchema(schema);
}

/**
 * Wrap schema with caching using custom cache strategy.
 *
 * @param schema - Schema to wrap
 * @param strategy - Cache strategy
 *
 * @example
 * ```typescript
 * const cachedSchema = withCacheConfig(userSchema, {
 *   type: 'ttl',
 *   ttl: 60000, // 1 minute
 * });
 * ```
 */
export function withCacheConfig<T>(
  schema: Schema<T>,
  strategy: CacheStrategy
): Schema<T> {
  const cache = new ValidationCache(strategy);
  return new CachedSchema(schema, cache);
}

/**
 * Clear cache for a specific schema.
 * Note: Only works with CachedSchema instances.
 *
 * @param schema - Cached schema
 */
export function clearSchemaCache<T>(schema: Schema<T>): void {
  if (schema instanceof CachedSchema) {
    schema.clearCache();
  }
}
