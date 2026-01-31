/**
 * LAYER 1: Schema Modifiers Factory
 *
 * Factory functions to create modifier schemas without circular dependencies.
 * This file should be imported by base-schema-core.ts instead of importing the classes directly.
 */

import type { Schema, SchemaConfig } from '../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../common/types/result.js';
import { ok, err, createError, ErrorCode } from '../../common/types/result.js';
import { BaseSchema } from './base-schema-core.js';

// Re-export types
export interface RefinementContext {
  addError(error: ValidationError): void;
  path: string;
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function createRefinedSchema<T>(
  inner: Schema<T>,
  check: (value: T) => boolean,
  message: string
): Schema<T> {
  return new (class RefinedSchema extends BaseSchema<T> {
    readonly _type = 'custom' as const;

    constructor() {
      super({});
    }

    protected _validate(value: unknown, path: string): ValidationResult<T> {
      const result = inner.validate(value);
      if (!result.ok) return result;

      if (!check(result.data)) {
        return err(createError(ErrorCode.REFINEMENT_FAILED, message, path));
      }

      return result;
    }

    protected _clone(): this {
      return createRefinedSchema(inner, check, message) as this;
    }
  })();
}

export function createAsyncRefinedSchema<T>(
  inner: Schema<T>,
  check: (value: T) => Promise<boolean>,
  message: string
): Schema<T> {
  return new (class AsyncRefinedSchema extends BaseSchema<T> {
    readonly _type = 'custom' as const;

    constructor() {
      super({});
    }

    protected _validate(value: unknown, _path: string): ValidationResult<T> {
      // Sync validation just validates the inner schema
      // Async check is only run via validateAsync
      return inner.validate(value);
    }

    protected override async _validateAsync(value: unknown, path: string): Promise<ValidationResult<T>> {
      // First validate with inner schema (async if available)
      const innerSchema = inner as BaseSchema<T>;
      const innerResult = typeof innerSchema.validateAsync === 'function'
        ? await innerSchema.validateAsync(value)
        : inner.validate(value);

      if (!innerResult.ok) return innerResult;

      // Then run async check
      try {
        const isValid = await check(innerResult.data);
        if (!isValid) {
          return err(createError(ErrorCode.REFINEMENT_FAILED, message, path));
        }
        return innerResult;
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : message;
        return err(createError(ErrorCode.REFINEMENT_FAILED, errorMsg, path));
      }
    }

    protected _clone(): this {
      return createAsyncRefinedSchema(inner, check, message) as this;
    }
  })();
}

export function createSuperRefinedSchema<T, U extends T>(
  inner: Schema<T>,
  refiner: (value: T, ctx: RefinementContext) => value is U
): Schema<U> {
  return new (class SuperRefinedSchema extends BaseSchema<U> {
    readonly _type = 'custom' as const;

    constructor() {
      super({});
    }

    protected _validate(value: unknown, path: string): ValidationResult<U> {
      const result = inner.validate(value);
      if (!result.ok) return result;

      const errors: ValidationError[] = [];
      const ctx: RefinementContext = {
        addError: (error) => errors.push(error),
        path,
      };

      if (!refiner(result.data, ctx)) {
        if (errors.length === 0) {
          errors.push(createError(ErrorCode.REFINEMENT_FAILED, 'Refinement failed', path));
        }
        return { ok: false, errors };
      }

      return ok(result.data as U);
    }

    protected _clone(): this {
      return createSuperRefinedSchema(inner, refiner) as this;
    }
  })();
}

export function createTransformSchema<T, U>(
  inner: Schema<T>,
  transformer: (value: T) => U
): Schema<U> {
  return new (class TransformSchema extends BaseSchema<U> {
    readonly _type = 'pipeline' as const;

    constructor() {
      super({});
    }

    protected _validate(value: unknown, path: string): ValidationResult<U> {
      const result = inner.validate(value);
      if (!result.ok) return result;

      try {
        const transformed = transformer(result.data);
        return ok(transformed);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Transform failed';
        return err(createError(ErrorCode.TRANSFORM_FAILED, msg, path));
      }
    }

    protected _clone(): this {
      return createTransformSchema(inner, transformer) as this;
    }
  })();
}

export function createAsyncTransformSchema<T, U>(
  inner: Schema<T>,
  transformer: (value: T) => Promise<U>
): Schema<U> {
  return new (class AsyncTransformSchema extends BaseSchema<U> {
    readonly _type = 'pipeline' as const;

    constructor() {
      super({});
    }

    protected _validate(value: unknown, _path: string): ValidationResult<U> {
      // Sync validation just validates the inner schema
      // Transform is only run via validateAsync
      const result = inner.validate(value);
      if (!result.ok) return result as ValidationResult<U>;
      // For sync, we can't run async transform, return inner result
      // Users should use validateAsync for async transforms
      return result as unknown as ValidationResult<U>;
    }

    protected override async _validateAsync(value: unknown, path: string): Promise<ValidationResult<U>> {
      // First validate with inner schema (async if available)
      const innerSchema = inner as BaseSchema<T>;
      const innerResult = typeof innerSchema.validateAsync === 'function'
        ? await innerSchema.validateAsync(value)
        : inner.validate(value);

      if (!innerResult.ok) return innerResult as ValidationResult<U>;

      // Then run async transform
      try {
        const transformed = await transformer(innerResult.data);
        return ok(transformed);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : 'Transform failed';
        return err(createError(ErrorCode.TRANSFORM_FAILED, errorMsg, path));
      }
    }

    protected _clone(): this {
      return createAsyncTransformSchema(inner, transformer) as this;
    }
  })();
}

export function createPreprocessSchema<T>(
  inner: Schema<T>,
  preprocessor: (value: unknown) => unknown,
  config: SchemaConfig = {}
): Schema<T> {
  return new (class PreprocessSchema extends BaseSchema<T> {
    readonly _type = 'pipeline' as const;

    constructor() {
      super(config);
    }

    protected _validate(value: unknown, _path: string): ValidationResult<T> {
      // Preprocess the value first
      const preprocessed = preprocessor(value);
      // Then validate with inner schema
      return inner.validate(preprocessed);
    }

    protected override async _validateAsync(value: unknown, _path: string): Promise<ValidationResult<T>> {
      // Preprocess the value first
      const preprocessed = preprocessor(value);
      // Then validate with inner schema (async if available)
      const innerSchema = inner as BaseSchema<T>;
      return typeof innerSchema.validateAsync === 'function'
        ? await innerSchema.validateAsync(preprocessed)
        : inner.validate(preprocessed);
    }

    protected _clone(configUpdate: Partial<SchemaConfig> = {}): this {
      const newConfig = { ...this.config, ...configUpdate };
      return createPreprocessSchema(inner, preprocessor, newConfig) as this;
    }
  })();
}

export function createAsyncPreprocessSchema<T>(
  inner: Schema<T>,
  preprocessor: (value: unknown) => Promise<unknown>,
  config: SchemaConfig = {}
): Schema<T> {
  return new (class AsyncPreprocessSchema extends BaseSchema<T> {
    readonly _type = 'pipeline' as const;

    constructor() {
      super(config);
    }

    protected _validate(value: unknown, _path: string): ValidationResult<T> {
      // For sync validation, we can't run async preprocessor
      // Just validate the original value with inner schema
      return inner.validate(value);
    }

    protected override async _validateAsync(value: unknown, _path: string): Promise<ValidationResult<T>> {
      // Preprocess the value first (async)
      const preprocessed = await preprocessor(value);
      // Then validate with inner schema (async if available)
      const innerSchema = inner as BaseSchema<T>;
      return typeof innerSchema.validateAsync === 'function'
        ? await innerSchema.validateAsync(preprocessed)
        : inner.validate(preprocessed);
    }

    protected _clone(configUpdate: Partial<SchemaConfig> = {}): this {
      const newConfig = { ...this.config, ...configUpdate };
      return createAsyncPreprocessSchema(inner, preprocessor, newConfig) as this;
    }
  })();
}

export function createPipeSchema<T, U>(
  first: Schema<T>,
  second: Schema<U>
): Schema<U> {
  return new (class PipeSchema extends BaseSchema<U> {
    readonly _type = 'pipeline' as const;

    constructor() {
      super({});
    }

    protected _validate(value: unknown, _path: string): ValidationResult<U> {
      const firstResult = first.validate(value);
      if (!firstResult.ok) return firstResult;

      return second.validate(firstResult.data);
    }

    protected _clone(): this {
      return createPipeSchema(first, second) as this;
    }
  })();
}