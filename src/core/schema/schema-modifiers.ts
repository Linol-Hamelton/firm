/**
 * LAYER 1: Schema Modifiers
 *
 * Specialized schema classes for refinement, transformation, and preprocessing.
 * These are used by the fluent API methods on BaseSchema.
 */

import type { Schema, SchemaConfig } from '../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../common/types/result.js';
import { ok, err, createError, ErrorCode } from '../../common/types/result.js';
import { BaseSchema } from './base-schema-core.js';

// ============================================================================
// REFINEMENT CONTEXT
// ============================================================================

export interface RefinementContext {
  addError(error: ValidationError): void;
  path: string;
}

// ============================================================================
// REFINED SCHEMA (FOR CUSTOM VALIDATIONS)
// ============================================================================

export class RefinedSchema<T> extends BaseSchema<T> {
  readonly _type = 'custom' as const;

  constructor(
    private readonly inner: Schema<T>,
    private readonly check: (value: T) => boolean,
    private readonly message: string
  ) {
    super({});
  }

  protected _validate(value: unknown, path: string): ValidationResult<T> {
    const result = this.inner.validate(value);
    if (!result.ok) return result;

    if (!this.check(result.data)) {
      return err(createError(ErrorCode.REFINEMENT_FAILED, this.message, path));
    }

    return result;
  }

  protected _clone(): this {
    return new RefinedSchema(this.inner, this.check, this.message) as this;
  }
}

// ============================================================================
// SUPER REFINED SCHEMA (WITH CONTEXT)
// ============================================================================

export class SuperRefinedSchema<T, U extends T> extends BaseSchema<U> {
  readonly _type = 'custom' as const;

  constructor(
    private readonly inner: Schema<T>,
    private readonly refiner: (value: T, ctx: RefinementContext) => value is U
  ) {
    super({});
  }

  protected _validate(value: unknown, path: string): ValidationResult<U> {
    const result = this.inner.validate(value);
    if (!result.ok) return result;

    const errors: ValidationError[] = [];
    const ctx: RefinementContext = {
      addError: (error) => errors.push(error),
      path,
    };

    if (!this.refiner(result.data, ctx)) {
      if (errors.length === 0) {
        errors.push(createError(ErrorCode.REFINEMENT_FAILED, 'Refinement failed', path));
      }
      return { ok: false, errors };
    }

    return ok(result.data as U);
  }

  protected _clone(): this {
    return new SuperRefinedSchema(this.inner, this.refiner) as this;
  }
}

// ============================================================================
// ASYNC REFINED SCHEMA
// ============================================================================

export class AsyncRefinedSchema<T> extends BaseSchema<T> {
  readonly _type = 'custom' as const;

  constructor(
    private readonly inner: Schema<T>,
    private readonly check: (value: T) => Promise<boolean>,
    private readonly message: string
  ) {
    super({});
  }

  protected _validate(value: unknown, _path: string): ValidationResult<T> {
    // Sync validation just validates the inner schema
    // Async check is only run via validateAsync
    return this.inner.validate(value);
  }

  protected override async _validateAsync(value: unknown, path: string): Promise<ValidationResult<T>> {
    // First validate with inner schema (async if available)
    const innerSchema = this.inner as BaseSchema<T>;
    const innerResult = typeof innerSchema.validateAsync === 'function'
      ? await innerSchema.validateAsync(value)
      : this.inner.validate(value);

    if (!innerResult.ok) return innerResult;

    // Then run async check
    try {
      const isValid = await this.check(innerResult.data);
      if (!isValid) {
        return err(createError(ErrorCode.REFINEMENT_FAILED, this.message, path));
      }
      return innerResult;
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : this.message;
      return err(createError(ErrorCode.REFINEMENT_FAILED, errorMsg, path));
    }
  }

  protected _clone(): this {
    return new AsyncRefinedSchema(this.inner, this.check, this.message) as this;
  }
}

// ============================================================================
// TRANSFORM SCHEMA
// ============================================================================

export class TransformSchema<T, U> extends BaseSchema<U> {
  readonly _type = 'pipeline' as const;

  constructor(
    private readonly inner: Schema<T>,
    private readonly transformer: (value: T) => U
  ) {
    super({});
  }

  protected _validate(value: unknown, path: string): ValidationResult<U> {
    const result = this.inner.validate(value);
    if (!result.ok) return result;

    try {
      const transformed = this.transformer(result.data);
      return ok(transformed);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Transform failed';
      return err(createError(ErrorCode.TRANSFORM_FAILED, message, path));
    }
  }

  protected _clone(): this {
    return new TransformSchema(this.inner, this.transformer) as this;
  }
}

// ============================================================================
// ASYNC TRANSFORM SCHEMA
// ============================================================================

export class AsyncTransformSchema<T, U> extends BaseSchema<U> {
  readonly _type = 'pipeline' as const;

  constructor(
    private readonly inner: Schema<T>,
    private readonly transformer: (value: T) => Promise<U>
  ) {
    super({});
  }

  protected _validate(value: unknown, _path: string): ValidationResult<U> {
    // Sync validation just validates the inner schema
    // Transform is only run via validateAsync
    const result = this.inner.validate(value);
    if (!result.ok) return result as ValidationResult<U>;
    // For sync, we can't run async transform, return inner result
    // Users should use validateAsync for async transforms
    return result as unknown as ValidationResult<U>;
  }

  protected override async _validateAsync(value: unknown, path: string): Promise<ValidationResult<U>> {
    // First validate with inner schema (async if available)
    const innerSchema = this.inner as BaseSchema<T>;
    const innerResult = typeof innerSchema.validateAsync === 'function'
      ? await innerSchema.validateAsync(value)
      : this.inner.validate(value);

    if (!innerResult.ok) return innerResult as ValidationResult<U>;

    // Then run async transform
    try {
      const transformed = await this.transformer(innerResult.data);
      return ok(transformed);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'Transform failed';
      return err(createError(ErrorCode.TRANSFORM_FAILED, errorMsg, path));
    }
  }

  protected _clone(): this {
    return new AsyncTransformSchema(this.inner, this.transformer) as this;
  }
}

// ============================================================================
// PREPROCESS SCHEMA
// ============================================================================

export class PreprocessSchema<T> extends BaseSchema<T> {
  readonly _type = 'pipeline' as const;

  constructor(
    private readonly inner: Schema<T>,
    private readonly preprocessor: (value: unknown) => unknown,
    config: SchemaConfig = {}
  ) {
    super(config);
  }

  protected _validate(value: unknown, _path: string): ValidationResult<T> {
    // Preprocess the value first
    const preprocessed = this.preprocessor(value);
    // Then validate with inner schema
    return this.inner.validate(preprocessed);
  }

  protected override async _validateAsync(value: unknown, _path: string): Promise<ValidationResult<T>> {
    // Preprocess the value first
    const preprocessed = this.preprocessor(value);
    // Then validate with inner schema (async if available)
    const innerSchema = this.inner as BaseSchema<T>;
    return typeof innerSchema.validateAsync === 'function'
      ? await innerSchema.validateAsync(preprocessed)
      : this.inner.validate(preprocessed);
  }

  protected _clone(configUpdate: Partial<SchemaConfig> = {}): this {
    const newConfig = { ...this.config, ...configUpdate };
    return new PreprocessSchema(this.inner, this.preprocessor, newConfig) as this;
  }
}

// ============================================================================
// ASYNC PREPROCESS SCHEMA
// ============================================================================

export class AsyncPreprocessSchema<T> extends BaseSchema<T> {
  readonly _type = 'pipeline' as const;

  constructor(
    private readonly inner: Schema<T>,
    private readonly preprocessor: (value: unknown) => Promise<unknown>,
    config: SchemaConfig = {}
  ) {
    super(config);
  }

  protected _validate(value: unknown, _path: string): ValidationResult<T> {
    // For sync validation, we can't run async preprocessor
    // Just validate the original value with inner schema
    return this.inner.validate(value);
  }

  protected override async _validateAsync(value: unknown, _path: string): Promise<ValidationResult<T>> {
    // Preprocess the value first (async)
    const preprocessed = await this.preprocessor(value);
    // Then validate with inner schema (async if available)
    const innerSchema = this.inner as BaseSchema<T>;
    return typeof innerSchema.validateAsync === 'function'
      ? await innerSchema.validateAsync(preprocessed)
      : this.inner.validate(preprocessed);
  }

  protected _clone(configUpdate: Partial<SchemaConfig> = {}): this {
    const newConfig = { ...this.config, ...configUpdate };
    return new AsyncPreprocessSchema(this.inner, this.preprocessor, newConfig) as this;
  }
}

// ============================================================================
// PIPE SCHEMA
// ============================================================================

export class PipeSchema<T, U> extends BaseSchema<U> {
  readonly _type = 'pipeline' as const;

  constructor(
    private readonly first: Schema<T>,
    private readonly second: Schema<U>
  ) {
    super({});
  }

  protected _validate(value: unknown, _path: string): ValidationResult<U> {
    const firstResult = this.first.validate(value);
    if (!firstResult.ok) return firstResult;

    return this.second.validate(firstResult.data);
  }

  protected _clone(): this {
    return new PipeSchema(this.first, this.second) as this;
  }
}