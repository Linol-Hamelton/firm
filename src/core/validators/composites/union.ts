/**
 * LAYER 1: Union & Intersection Validators
 *
 * Algebraic type validators:
 * - Union (A | B | C)
 * - Discriminated Union (tagged unions)
 * - Intersection (A & B)
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { Schema, SchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../../common/types/result.js';
import { ok, err, errs, createError, ErrorCode } from '../../../common/types/result.js';

// ============================================================================
// TYPE HELPERS
// ============================================================================

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

type InferUnionType<T extends readonly Schema<unknown>[]> = T[number]['_output'];

type InferIntersectionType<T extends readonly Schema<unknown>[]> = UnionToIntersection<
  T[number]['_output']
>;

// ============================================================================
// UNION VALIDATOR
// ============================================================================

interface UnionConfig<T extends readonly Schema<unknown>[]> extends SchemaConfig {
  options: T;
}

export class UnionValidator<T extends readonly Schema<unknown>[]> extends BaseSchema<
  InferUnionType<T>,
  UnionConfig<T>
> {
  readonly _type = 'union' as const;

  constructor(options: T, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, options });
  }

  protected _validate(value: unknown, path: string): ValidationResult<InferUnionType<T>> {
    const allErrors: ValidationError[][] = [];

    // Try each option
    for (const schema of this.config.options) {
      const result = schema.validate(value);
      if (result.ok) {
        return result as ValidationResult<InferUnionType<T>>;
      }
      allErrors.push([...result.errors]);
    }

    // None matched - return combined error
    return err(
      createError(
        ErrorCode.UNION_NO_MATCH,
        this.config.errorMessage ?? 'Value does not match any union member',
        path,
        {
          options: this.config.options.length,
          errors: allErrors,
        }
      )
    );
  }

  protected override _check(value: unknown): boolean {
    for (const schema of this.config.options) {
      if (schema.is(value)) return true;
    }
    return false;
  }

  protected _clone(config: Partial<UnionConfig<T>>): this {
    const merged = { ...this.config, ...config };
    return new UnionValidator(merged.options, merged) as this;
  }

  /**
   * Get union options.
   */
  get options(): T {
    return this.config.options;
  }
}

// ============================================================================
// DISCRIMINATED UNION VALIDATOR
// ============================================================================

interface DiscriminatedUnionConfig<K extends string, T extends readonly Schema<unknown>[]>
  extends SchemaConfig {
  discriminator: K;
  options: T;
}

type DiscriminatedOption<K extends string> = Schema<{ [P in K]: string | number }>;

export class DiscriminatedUnionValidator<
  K extends string,
  T extends readonly DiscriminatedOption<K>[]
> extends BaseSchema<InferUnionType<T>, DiscriminatedUnionConfig<K, T>> {
  readonly _type = 'discriminated_union' as const;
  private readonly optionMap: Map<unknown, Schema<unknown>>;

  constructor(discriminator: K, options: T, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, discriminator, options });

    // Build lookup map for O(1) access
    this.optionMap = new Map();
    for (const schema of options) {
      // Extract discriminator value from schema
      // This assumes schemas have a way to get their expected discriminator value
      const value = this.getDiscriminatorValue(schema);
      if (value !== undefined) {
        this.optionMap.set(value, schema as Schema<unknown>);
      }
    }
  }

  private getDiscriminatorValue(schema: Schema<unknown>): unknown {
    // For object schemas with literal discriminator
    if ('shape' in schema && typeof schema.shape === 'object') {
      const shape = schema.shape as Record<string, Schema<unknown>>;
      const discSchema = shape[this.config.discriminator];
      if (discSchema && 'value' in discSchema) {
        return (discSchema as { value: unknown }).value;
      }
    }
    return undefined;
  }

  protected _validate(value: unknown, path: string): ValidationResult<InferUnionType<T>> {
    // Must be an object
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return err(
        createError(
          ErrorCode.NOT_OBJECT,
          'Expected object for discriminated union',
          path
        )
      );
    }

    const obj = value as Record<string, unknown>;
    const discriminatorValue = obj[this.config.discriminator];

    // Check if discriminator exists
    if (discriminatorValue === undefined) {
      return err(
        createError(
          ErrorCode.OBJECT_MISSING_KEY,
          `Missing discriminator key: ${this.config.discriminator}`,
          path,
          { expected: this.config.discriminator }
        )
      );
    }

    // Lookup schema by discriminator value
    const schema = this.optionMap.get(discriminatorValue);

    if (!schema) {
      return err(
        createError(
          ErrorCode.UNION_NO_MATCH,
          `Invalid discriminator value: ${String(discriminatorValue)}`,
          `${path}.${this.config.discriminator}`,
          { received: discriminatorValue }
        )
      );
    }

    return schema.validate(value) as ValidationResult<InferUnionType<T>>;
  }

  protected override _check(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const obj = value as Record<string, unknown>;
    const discriminatorValue = obj[this.config.discriminator];
    const schema = this.optionMap.get(discriminatorValue);

    return schema ? schema.is(value) : false;
  }

  protected _clone(config: Partial<DiscriminatedUnionConfig<K, T>>): this {
    const merged = { ...this.config, ...config };
    return new DiscriminatedUnionValidator(
      merged.discriminator,
      merged.options,
      merged
    ) as this;
  }
}

// ============================================================================
// INTERSECTION VALIDATOR
// ============================================================================

interface IntersectionConfig<T extends readonly Schema<unknown>[]> extends SchemaConfig {
  schemas: T;
}

export class IntersectionValidator<T extends readonly [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]]> extends BaseSchema<
  InferIntersectionType<T>,
  IntersectionConfig<T>
> {
  readonly _type = 'intersection' as const;

  constructor(schemas: T, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, schemas });
  }

  protected _validate(
    value: unknown,
    _path: string
  ): ValidationResult<InferIntersectionType<T>> {
    const allErrors: ValidationError[] = [];
    let merged: Record<string, unknown> = {};

    for (const schema of this.config.schemas) {
      const result = schema.validate(value);

      if (!result.ok) {
        allErrors.push(...result.errors);
      } else if (typeof result.data === 'object' && result.data !== null) {
        merged = { ...merged, ...result.data };
      }
    }

    if (allErrors.length > 0) {
      return errs(allErrors);
    }

    // Return merged result for objects, original value for primitives
    const finalResult =
      typeof value === 'object' && value !== null ? merged : value;

    return ok(finalResult as InferIntersectionType<T>);
  }

  protected override _check(value: unknown): boolean {
    for (const schema of this.config.schemas) {
      if (!schema.is(value)) return false;
    }
    return true;
  }

  protected _clone(config: Partial<IntersectionConfig<T>>): this {
    const merged = { ...this.config, ...config };
    return new IntersectionValidator(merged.schemas, merged) as this;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a union validator (A | B | C).
 */
export function union<T extends readonly [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]]>(
  options: T
): UnionValidator<T> {
  return new UnionValidator(options);
}

/**
 * Create a discriminated union validator.
 */
export function discriminatedUnion<
  K extends string,
  T extends readonly [DiscriminatedOption<K>, ...DiscriminatedOption<K>[]]
>(discriminator: K, options: T): DiscriminatedUnionValidator<K, T> {
  return new DiscriminatedUnionValidator(discriminator, options);
}

/**
 * Create an intersection validator (A & B).
 */
export function intersection<T extends readonly [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]]>(
  schemas: T
): IntersectionValidator<T> {
  return new IntersectionValidator(schemas);
}
