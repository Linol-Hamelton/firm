/**
 * LAYER 1: Array Validator
 *
 * Array schema validation with support for:
 * - Element type validation
 * - Length constraints
 * - Uniqueness
 *
 * Target: 5M+ ops/sec for arrays of 10 items
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { Schema, ArraySchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../../common/types/result.js';
import { ok, err, errs, createError, ErrorCode } from '../../../common/types/result.js';

// ============================================================================
// ARRAY VALIDATOR
// ============================================================================

interface ArrayConfig<T> extends ArraySchemaConfig {
  element: Schema<T>;
  parallel?: boolean;
  abortEarly?: boolean;
}

export class ArrayValidator<T> extends BaseSchema<T[], ArrayConfig<T>> {
  readonly _type = 'array' as const;

  constructor(element: Schema<T>, config: ArraySchemaConfig = {}) {
    super({ ...config, element });
  }

  // ==========================================================================
  // CORE VALIDATION
  // ==========================================================================

  protected _validate(value: unknown, path: string): ValidationResult<T[]> {
    // Type check
    if (!Array.isArray(value)) {
      return err(
        createError(
          ErrorCode.NOT_ARRAY,
          this.config.errorMessage ?? 'Expected array',
          path,
          { received: typeof value }
        )
      );
    }

    // Length validation (early exit for performance)
    if (this.config.minLength !== undefined && value.length < this.config.minLength) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_SHORT,
          `Array must have at least ${this.config.minLength} items`,
          path,
          { min: this.config.minLength, received: value.length }
        )
      );
    }

    if (this.config.maxLength !== undefined && value.length > this.config.maxLength) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_LONG,
          `Array must have at most ${this.config.maxLength} items`,
          path,
          { max: this.config.maxLength, received: value.length }
        )
      );
    }

    // Uniqueness check (before element validation for performance)
    if (this.config.unique) {
      const seen = new Set();
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const key = typeof item === 'object' ? JSON.stringify(item) : item;
        if (seen.has(key)) {
          return err(
            createError(
              ErrorCode.ARRAY_NOT_UNIQUE,
              'Array must have unique items',
              `${path}[${i}]`
            )
          );
        }
        seen.add(key);
      }
    }

    // Validate elements
    const result: T[] = [];
    const errors: ValidationError[] = [];

    for (let i = 0; i < value.length; i++) {
      const elementPath = `${path}[${i}]`;
      const elementResult = this.config.element.validate(value[i]);

      if (!elementResult.ok) {
        // Collect all element errors
        for (const error of elementResult.errors) {
          errors.push({
            ...error,
            path: error.path ? `${elementPath}.${error.path}` : elementPath,
          });
        }
      } else {
        result.push(elementResult.data);
      }
    }

    if (errors.length > 0) {
      return errs(errors);
    }

    return ok(result);
  }

  protected override _check(value: unknown): boolean {
    if (!Array.isArray(value)) return false;

    if (this.config.minLength !== undefined && value.length < this.config.minLength) {
      return false;
    }
    if (this.config.maxLength !== undefined && value.length > this.config.maxLength) {
      return false;
    }

    if (this.config.unique) {
      const seen = new Set();
      for (const item of value) {
        const key = typeof item === 'object' ? JSON.stringify(item) : item;
        if (seen.has(key)) return false;
        seen.add(key);
      }
    }

    for (const item of value) {
      if (!this.config.element.is(item)) return false;
    }

    return true;
  }

  protected override async _validateAsync(value: unknown, path: string): Promise<ValidationResult<T[]>> {
    // Type check
    if (!Array.isArray(value)) {
      return err(
        createError(
          ErrorCode.NOT_ARRAY,
          this.config.errorMessage ?? 'Expected array',
          path,
          { received: typeof value }
        )
      );
    }

    // Length validation (early exit for performance)
    if (this.config.minLength !== undefined && value.length < this.config.minLength) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_SHORT,
          `Array must have at least ${this.config.minLength} items`,
          path,
          { min: this.config.minLength, received: value.length }
        )
      );
    }

    if (this.config.maxLength !== undefined && value.length > this.config.maxLength) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_LONG,
          `Array must have at most ${this.config.maxLength} items`,
          path,
          { max: this.config.maxLength, received: value.length }
        )
      );
    }

    // Uniqueness check (before element validation for performance)
    if (this.config.unique) {
      const seen = new Set();
      for (let i = 0; i < value.length; i++) {
        const item = value[i];
        const key = typeof item === 'object' ? JSON.stringify(item) : item;
        if (seen.has(key)) {
          return err(
            createError(
              ErrorCode.ARRAY_NOT_UNIQUE,
              'Array must have unique items',
              `${path}[${i}]`
            )
          );
        }
        seen.add(key);
      }
    }

    // Validate elements - parallel or sequential based on config
    if (this.config.parallel) {
      // Parallel validation using Promise.all
      const elementPromises = value.map((item, _i) => {
        // Error path tracking would be implemented here if needed
        const elementSchema = this.config.element as BaseSchema<T>;
        return typeof elementSchema.validateAsync === 'function'
          ? elementSchema.validateAsync(item)
          : Promise.resolve(elementSchema.validate(item));
      });

      try {
        const results = await Promise.all(elementPromises);
        const validated: T[] = [];
        const errors: ValidationError[] = [];

        for (let i = 0; i < results.length; i++) {
          const result = results[i];
          if (!result) continue; // Skip undefined results (shouldn't happen)
          if (!result.ok) {
            // Type guard ensures result is ValidationFailure
            errors.push(...(result as any).errors);
          } else {
            // Type guard ensures result is ValidationSuccess<T>
            validated.push((result as any).data);
          }
        }

        if (errors.length > 0) {
          return errs(errors);
        }

        return ok(validated);
      } catch (error) {
        // Should not happen, but handle just in case
        return err(
          createError(
            ErrorCode.UNKNOWN_ERROR,
            error instanceof Error ? error.message : 'Parallel validation failed',
            path
          )
        );
      }
    } else {
      // Sequential validation (default)
      const validated: T[] = [];
      const errors: ValidationError[] = [];

      for (let i = 0; i < value.length; i++) {
        // Error path tracking would be implemented here if needed
        const elementSchema = this.config.element as BaseSchema<T>;
        const elementResult = typeof elementSchema.validateAsync === 'function'
          ? await elementSchema.validateAsync(value[i])
          : elementSchema.validate(value[i]);

        if (!elementResult.ok) {
          errors.push(...(elementResult as any).errors);
          if (this.config.abortEarly) {
            return errs(errors);
          }
        } else {
          validated.push((elementResult as any).data);
        }
      }

      if (errors.length > 0) {
        return errs(errors);
      }

      return ok(validated);
    }
  }

  protected _clone(config: Partial<ArrayConfig<T>>): this {
    return new ArrayValidator(
      config.element ?? this.config.element,
      { ...this.config, ...config }
    ) as this;
  }

  // ==========================================================================
  // LENGTH CONSTRAINTS
  // ==========================================================================

  /**
   * Minimum array length.
   */
  min(length: number): ArrayValidator<T> {
    return this._clone({ minLength: length });
  }

  /**
   * Maximum array length.
   */
  max(length: number): ArrayValidator<T> {
    return this._clone({ maxLength: length });
  }

  /**
   * Exact array length.
   */
  length(length: number): ArrayValidator<T> {
    return this._clone({ minLength: length, maxLength: length });
  }

  /**
   * Non-empty array (at least 1 item).
   */
  nonempty(): ArrayValidator<T> {
    return this._clone({ minLength: 1 });
  }

  // ==========================================================================
  // OTHER CONSTRAINTS
  // ==========================================================================

  /**
   * Unique items only.
   */
  unique(): ArrayValidator<T> {
    return this._clone({ unique: true });
  }

  /**
   * Enable parallel validation for array elements.
   * Uses Promise.all for concurrent validation of array items.
   * Only affects async validation (validateAsync).
   */
  parallel(): ArrayValidator<T> {
    return this._clone({ parallel: true });
  }

  /**
   * Stop validation on first error.
   * Improves performance when only first error matters.
   */
  abortEarly(): ArrayValidator<T> {
    return this._clone({ abortEarly: true });
  }

  /**
   * Get the element schema.
   */
  get element(): Schema<T> {
    return this.config.element;
  }
}

// ============================================================================
// TUPLE VALIDATOR
// ============================================================================

type InferTupleType<T extends readonly Schema<unknown>[]> = {
  [K in keyof T]: T[K] extends Schema<infer U> ? U : never;
};

interface TupleConfig<T extends readonly Schema<unknown>[]> extends ArraySchemaConfig {
  items: T;
  rest?: Schema<unknown>;
}

export class TupleValidator<T extends readonly Schema<unknown>[]> extends BaseSchema<
  InferTupleType<T>,
  TupleConfig<T>
> {
  readonly _type = 'tuple' as const;

  constructor(items: T, config?: { rest?: Schema<unknown> }) {
    const baseConfig: TupleConfig<T> = { items };
    if (config?.rest !== undefined) {
      baseConfig.rest = config.rest;
    }
    super(baseConfig);
  }

  protected _validate(value: unknown, path: string): ValidationResult<InferTupleType<T>> {
    if (!Array.isArray(value)) {
      return err(
        createError(
          ErrorCode.NOT_ARRAY,
          this.config.errorMessage ?? 'Expected tuple (array)',
          path
        )
      );
    }

    const items = this.config.items;
    const minLength = items.length;

    // Check minimum length
    if (value.length < minLength) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_SHORT,
          `Tuple must have at least ${minLength} items`,
          path
        )
      );
    }

    // Check maximum length (if no rest schema)
    if (!this.config.rest && value.length > minLength) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_LONG,
          `Tuple must have exactly ${minLength} items`,
          path
        )
      );
    }

    const result: unknown[] = [];
    const errors: ValidationError[] = [];

    // Validate fixed items
    for (let i = 0; i < items.length; i++) {
      const schema = items[i]!;
      const itemPath = `${path}[${i}]`;
      const itemResult = schema.validate(value[i]);

      if (!itemResult.ok) {
        for (const error of itemResult.errors) {
          errors.push({
            ...error,
            path: error.path ? `${itemPath}.${error.path}` : itemPath,
          });
        }
      } else {
        result.push(itemResult.data);
      }
    }

    // Validate rest items
    if (this.config.rest) {
      for (let i = items.length; i < value.length; i++) {
        const itemPath = `${path}[${i}]`;
        const itemResult = this.config.rest.validate(value[i]);

        if (!itemResult.ok) {
          for (const error of itemResult.errors) {
            errors.push({
              ...error,
              path: error.path ? `${itemPath}.${error.path}` : itemPath,
            });
          }
        } else {
          result.push(itemResult.data);
        }
      }
    }

    if (errors.length > 0) {
      return errs(errors);
    }

    return ok(result as InferTupleType<T>);
  }

  protected override _check(value: unknown): boolean {
    if (!Array.isArray(value)) return false;

    const items = this.config.items;
    if (value.length < items.length) return false;
    if (!this.config.rest && value.length > items.length) return false;

    for (let i = 0; i < items.length; i++) {
      if (!items[i]!.is(value[i])) return false;
    }

    if (this.config.rest) {
      for (let i = items.length; i < value.length; i++) {
        if (!this.config.rest.is(value[i])) return false;
      }
    }

    return true;
  }

  protected _clone(config: Partial<TupleConfig<T>>): this {
    const restSchema = config.rest !== undefined ? config.rest : this.config.rest;
    const tupleConfig = restSchema !== undefined ? { rest: restSchema } : undefined;
    return new TupleValidator(
      config.items ?? this.config.items,
      tupleConfig
    ) as this;
  }

  /**
   * Add rest element schema.
   */
  rest<R>(schema: Schema<R>): TupleValidator<T> {
    return this._clone({ rest: schema as Schema<unknown> });
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a new array validator.
 */
export function array<T>(element: Schema<T>, config?: ArraySchemaConfig): ArrayValidator<T> {
  return new ArrayValidator(element, config);
}

/**
 * Create a new tuple validator.
 */
export function tuple<T extends readonly Schema<unknown>[]>(
  items: T,
  config?: { rest?: Schema<unknown> }
): TupleValidator<T> {
  return new TupleValidator(items, config);
}
