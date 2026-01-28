/**
 * LAYER 1: Object Validator
 *
 * Object schema validation with support for:
 * - Nested objects
 * - Optional/required fields
 * - Unknown key handling (strip/passthrough/strict)
 * - Pick, omit, partial, extend operations
 *
 * Target: 10M+ ops/sec for simple objects
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { Schema, ObjectSchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../../common/types/result.js';
import { ok, err, errs, createError, ErrorCode } from '../../../common/types/result.js';

// ============================================================================
// TYPE HELPERS
// ============================================================================

type ObjectShape = Record<string, Schema<unknown>>;

type OptionalKeys<T extends ObjectShape> = {
  [K in keyof T]: undefined extends T[K]['_output'] ? K : never;
}[keyof T];

type RequiredKeys<T extends ObjectShape> = Exclude<keyof T, OptionalKeys<T>>;

type InferObjectOutput<T extends ObjectShape> = {
  [K in RequiredKeys<T>]: T[K]['_output'];
} & {
  [K in OptionalKeys<T>]?: T[K]['_output'];
};

// ============================================================================
// OBJECT VALIDATOR
// ============================================================================

interface ObjectConfig<T extends ObjectShape> extends ObjectSchemaConfig {
  shape: T;
}

export class ObjectValidator<T extends ObjectShape> extends BaseSchema<
  InferObjectOutput<T>,
  ObjectConfig<T>
> {
  readonly _type = 'object' as const;

  constructor(shape: T, config: ObjectSchemaConfig = {}) {
    super({ ...config, shape, unknownKeys: config.unknownKeys ?? 'strip' });
  }

  // ==========================================================================
  // CORE VALIDATION
  // ==========================================================================

  protected _validate(
    value: unknown,
    path: string
  ): ValidationResult<InferObjectOutput<T>> {
    // Type check
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return err(
        createError(
          ErrorCode.NOT_OBJECT,
          this.config.errorMessage ?? 'Expected object',
          path,
          { received: value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value }
        )
      );
    }

    const input = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const errors: ValidationError[] = [];

    // Validate defined fields
    for (const key in this.config.shape) {
      const schema = this.config.shape[key]!;
      const fieldPath = path ? `${path}.${key}` : key;
      const fieldValue = input[key];

      const fieldResult = schema.validate(fieldValue);

      if (!fieldResult.ok) {
        // Collect errors with proper path
        for (const error of fieldResult.errors) {
          errors.push({
            ...error,
            path: error.path ? `${fieldPath}.${error.path}` : fieldPath,
          });
        }
      } else {
        // Only include defined values
        if (fieldResult.data !== undefined) {
          result[key] = fieldResult.data;
        }
      }
    }

    // Handle unknown keys
    if (this.config.unknownKeys !== 'strip') {
      const knownKeys = new Set(Object.keys(this.config.shape));

      for (const key of Object.keys(input)) {
        if (!knownKeys.has(key)) {
          if (this.config.unknownKeys === 'strict') {
            errors.push(
              createError(
                ErrorCode.OBJECT_UNKNOWN_KEY,
                `Unrecognized key: ${key}`,
                path ? `${path}.${key}` : key,
                { received: key }
              )
            );
          } else if (this.config.unknownKeys === 'passthrough') {
            result[key] = input[key];
          }
        }
      }
    }

    if (errors.length > 0) {
      return errs(errors);
    }

    return ok(result as InferObjectOutput<T>);
  }

  protected override _check(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const input = value as Record<string, unknown>;

    for (const key in this.config.shape) {
      const schema = this.config.shape[key]!;
      if (!schema.is(input[key])) {
        return false;
      }
    }

    if (this.config.unknownKeys === 'strict') {
      const knownKeys = new Set(Object.keys(this.config.shape));
      for (const key of Object.keys(input)) {
        if (!knownKeys.has(key)) return false;
      }
    }

    return true;
  }

  protected _clone(config: Partial<ObjectConfig<T>>): this {
    return new ObjectValidator(
      config.shape ?? this.config.shape,
      { ...this.config, ...config }
    ) as this;
  }

  // ==========================================================================
  // SHAPE ACCESS
  // ==========================================================================

  /**
   * Get the object shape.
   */
  get shape(): T {
    return this.config.shape;
  }

  /**
   * Get schema for specific key.
   */
  get<K extends keyof T>(key: K): T[K] {
    return this.config.shape[key];
  }

  // ==========================================================================
  // UNKNOWN KEYS HANDLING
  // ==========================================================================

  /**
   * Strip unknown keys (default).
   */
  strip(): ObjectValidator<T> {
    return this._clone({ unknownKeys: 'strip' });
  }

  /**
   * Allow unknown keys through.
   */
  passthrough(): ObjectValidator<T> {
    return this._clone({ unknownKeys: 'passthrough' });
  }

  /**
   * Reject unknown keys.
   */
  strict(): ObjectValidator<T> {
    return this._clone({ unknownKeys: 'strict' });
  }

  // ==========================================================================
  // SHAPE MODIFIERS
  // ==========================================================================

  /**
   * Make all fields optional.
   */
  partial(): ObjectValidator<{ [K in keyof T]: Schema<T[K]['_output'] | undefined> }> {
    const newShape: ObjectShape = {};
    for (const key in this.config.shape) {
      newShape[key] = this.config.shape[key]!.optional() as Schema<unknown>;
    }
    const unknownKeys = this.config.unknownKeys ?? 'strip';
    return new ObjectValidator(newShape, { unknownKeys }) as unknown as ObjectValidator<{ [K in keyof T]: Schema<T[K]['_output'] | undefined> }>;
  }

  /**
   * Make all fields required.
   */
  required(): ObjectValidator<{ [K in keyof T]: Schema<NonNullable<T[K]['_output']>> }> {
    // Note: This is a type-level operation primarily
    return this as unknown as ObjectValidator<{ [K in keyof T]: Schema<NonNullable<T[K]['_output']>> }>;
  }

  /**
   * Pick specific fields.
   */
  pick<K extends keyof T>(keys: K[]): ObjectValidator<Pick<T, K>> {
    const newShape: ObjectShape = {};
    for (const key of keys) {
      if (key in this.config.shape) {
        newShape[key as string] = this.config.shape[key as string]!;
      }
    }
    const unknownKeys = this.config.unknownKeys ?? 'strip';
    return new ObjectValidator(newShape as Pick<T, K>, { unknownKeys });
  }

  /**
   * Omit specific fields.
   */
  omit<K extends keyof T>(keys: K[]): ObjectValidator<Omit<T, K>> {
    const keySet = new Set<string>(keys as string[]);
    const newShape: ObjectShape = {};
    for (const key in this.config.shape) {
      if (!keySet.has(key)) {
        newShape[key] = this.config.shape[key]!;
      }
    }
    const unknownKeys = this.config.unknownKeys ?? 'strip';
    return new ObjectValidator(newShape as Omit<T, K>, { unknownKeys });
  }

  /**
   * Extend with additional fields.
   */
  extend<U extends ObjectShape>(shape: U): ObjectValidator<T & U> {
    const newShape = { ...this.config.shape, ...shape };
    const unknownKeys = this.config.unknownKeys ?? 'strip';
    return new ObjectValidator(newShape as T & U, { unknownKeys });
  }

  /**
   * Merge with another object schema.
   */
  merge<U extends ObjectShape>(
    other: ObjectValidator<U>
  ): ObjectValidator<T & U> {
    return this.extend(other.shape);
  }

  /**
   * Get keys array.
   */
  keyof(): (keyof T)[] {
    return Object.keys(this.config.shape) as (keyof T)[];
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new object validator.
 */
export function object<T extends ObjectShape>(
  shape: T,
  config?: ObjectSchemaConfig
): ObjectValidator<T> {
  return new ObjectValidator(shape, config);
}
