/**
 * LAYER 1: Record & Map Validators
 *
 * Dynamic key-value validators:
 * - Record<string, T>
 * - Map<K, V>
 * - Set<T>
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { Schema, SchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../../common/types/result.js';
import { ok, err, errs, createError, ErrorCode } from '../../../common/types/result.js';

// ============================================================================
// RECORD VALIDATOR
// ============================================================================

interface RecordConfig<K extends string | number | symbol, V> extends SchemaConfig {
  keySchema: Schema<K>;
  valueSchema: Schema<V>;
}

export class RecordValidator<K extends string | number | symbol, V> extends BaseSchema<
  Record<K, V>,
  RecordConfig<K, V>
> {
  readonly _type = 'record' as const;

  constructor(keySchema: Schema<K>, valueSchema: Schema<V>, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, keySchema, valueSchema });
  }

  protected _validate(value: unknown, path: string): ValidationResult<Record<K, V>> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return err(
        createError(
          ErrorCode.NOT_OBJECT,
          this.config.errorMessage ?? 'Expected object',
          path
        )
      );
    }

    const input = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const errors: ValidationError[] = [];

    for (const key of Object.keys(input)) {
      const keyPath = path ? `${path}.${key}` : key;

      // Validate key
      const keyResult = this.config.keySchema.validate(key);
      if (!keyResult.ok) {
        for (const error of keyResult.errors) {
          errors.push({
            ...error,
            path: keyPath,
            message: `Invalid key: ${error.message}`,
          });
        }
        continue;
      }

      // Validate value
      const valueResult = this.config.valueSchema.validate(input[key]);
      if (!valueResult.ok) {
        for (const error of valueResult.errors) {
          errors.push({
            ...error,
            path: error.path ? `${keyPath}.${error.path}` : keyPath,
          });
        }
      } else {
        result[key] = valueResult.data;
      }
    }

    if (errors.length > 0) {
      return errs(errors);
    }

    return ok(result as Record<K, V>);
  }

  protected override _check(value: unknown): boolean {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return false;
    }

    const input = value as Record<string, unknown>;

    for (const key of Object.keys(input)) {
      if (!this.config.keySchema.is(key)) return false;
      if (!this.config.valueSchema.is(input[key])) return false;
    }

    return true;
  }

  protected _clone(config: Partial<RecordConfig<K, V>>): this {
    const merged = { ...this.config, ...config };
    return new RecordValidator(
      merged.keySchema,
      merged.valueSchema,
      merged
    ) as this;
  }
}

// ============================================================================
// MAP VALIDATOR
// ============================================================================

interface MapConfig<K, V> extends SchemaConfig {
  keySchema: Schema<K>;
  valueSchema: Schema<V>;
}

export class MapValidator<K, V> extends BaseSchema<Map<K, V>, MapConfig<K, V>> {
  readonly _type = 'map' as const;

  constructor(keySchema: Schema<K>, valueSchema: Schema<V>, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, keySchema, valueSchema });
  }

  protected _validate(value: unknown, path: string): ValidationResult<Map<K, V>> {
    if (!(value instanceof Map)) {
      return err(
        createError(
          ErrorCode.INVALID_TYPE,
          this.config.errorMessage ?? 'Expected Map',
          path,
          { received: typeof value }
        )
      );
    }

    const result = new Map<K, V>();
    const errors: ValidationError[] = [];

    let index = 0;
    for (const [k, v] of value) {
      const entryPath = `${path}[${index}]`;

      const keyResult = this.config.keySchema.validate(k);
      if (!keyResult.ok) {
        for (const error of keyResult.errors) {
          errors.push({
            ...error,
            path: `${entryPath}.key`,
          });
        }
      }

      const valueResult = this.config.valueSchema.validate(v);
      if (!valueResult.ok) {
        for (const error of valueResult.errors) {
          errors.push({
            ...error,
            path: `${entryPath}.value`,
          });
        }
      }

      if (keyResult.ok && valueResult.ok) {
        result.set(keyResult.data, valueResult.data);
      }

      index++;
    }

    if (errors.length > 0) {
      return errs(errors);
    }

    return ok(result);
  }

  protected override _check(value: unknown): boolean {
    if (!(value instanceof Map)) return false;

    for (const [k, v] of value) {
      if (!this.config.keySchema.is(k)) return false;
      if (!this.config.valueSchema.is(v)) return false;
    }

    return true;
  }

  protected _clone(config: Partial<MapConfig<K, V>>): this {
    const merged = { ...this.config, ...config };
    return new MapValidator(
      merged.keySchema,
      merged.valueSchema,
      merged
    ) as this;
  }
}

// ============================================================================
// SET VALIDATOR
// ============================================================================

interface SetConfig<T> extends SchemaConfig {
  valueSchema: Schema<T>;
  minSize?: number;
  maxSize?: number;
}

export class SetValidator<T> extends BaseSchema<Set<T>, SetConfig<T>> {
  readonly _type = 'set' as const;

  constructor(valueSchema: Schema<T>, config: Partial<SetConfig<T>> = {}) {
    super({ ...config, valueSchema });
  }

  protected _validate(value: unknown, path: string): ValidationResult<Set<T>> {
    if (!(value instanceof Set)) {
      return err(
        createError(
          ErrorCode.INVALID_TYPE,
          this.config.errorMessage ?? 'Expected Set',
          path,
          { received: typeof value }
        )
      );
    }

    if (this.config.minSize !== undefined && value.size < this.config.minSize) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_SHORT,
          `Set must have at least ${this.config.minSize} items`,
          path
        )
      );
    }

    if (this.config.maxSize !== undefined && value.size > this.config.maxSize) {
      return err(
        createError(
          ErrorCode.ARRAY_TOO_LONG,
          `Set must have at most ${this.config.maxSize} items`,
          path
        )
      );
    }

    const result = new Set<T>();
    const errors: ValidationError[] = [];

    let index = 0;
    for (const item of value) {
      const itemPath = `${path}[${index}]`;
      const itemResult = this.config.valueSchema.validate(item);

      if (!itemResult.ok) {
        for (const error of itemResult.errors) {
          errors.push({
            ...error,
            path: error.path ? `${itemPath}.${error.path}` : itemPath,
          });
        }
      } else {
        result.add(itemResult.data);
      }

      index++;
    }

    if (errors.length > 0) {
      return errs(errors);
    }

    return ok(result);
  }

  protected override _check(value: unknown): boolean {
    if (!(value instanceof Set)) return false;

    if (this.config.minSize !== undefined && value.size < this.config.minSize) {
      return false;
    }
    if (this.config.maxSize !== undefined && value.size > this.config.maxSize) {
      return false;
    }

    for (const item of value) {
      if (!this.config.valueSchema.is(item)) return false;
    }

    return true;
  }

  protected _clone(config: Partial<SetConfig<T>>): this {
    return new SetValidator(
      config.valueSchema ?? this.config.valueSchema,
      { ...this.config, ...config }
    ) as this;
  }

  min(size: number): SetValidator<T> {
    return this._clone({ minSize: size });
  }

  max(size: number): SetValidator<T> {
    return this._clone({ maxSize: size });
  }

  size(size: number): SetValidator<T> {
    return this._clone({ minSize: size, maxSize: size });
  }

  nonempty(): SetValidator<T> {
    return this._clone({ minSize: 1 });
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a record validator.
 * For simple string keys, use record(valueSchema).
 * For typed keys, use record(keySchema, valueSchema).
 */
export function record<V>(valueSchema: Schema<V>): RecordValidator<string, V>;
export function record<K extends string | number | symbol, V>(
  keySchema: Schema<K>,
  valueSchema: Schema<V>
): RecordValidator<K, V>;
export function record<K extends string | number | symbol, V>(
  keyOrValueSchema: Schema<K> | Schema<V>,
  valueSchema?: Schema<V>
): RecordValidator<K, V> | RecordValidator<string, V> {
  if (valueSchema === undefined) {
    // Single argument - string keys assumed
    const StringSchema = {
      _type: 'string' as const,
      _output: '' as string,
      _input: undefined as unknown,
      validate: (v: unknown) =>
        typeof v === 'string' ? { ok: true as const, data: v } : { ok: false as const, errors: [] },
      compile: () => {
        const fn = (v: unknown) =>
          typeof v === 'string' ? { ok: true as const, data: v } : { ok: false as const, errors: [] };
        fn.is = (v: unknown): v is string => typeof v === 'string';
        return fn;
      },
      is: (v: unknown): v is string => typeof v === 'string',
      assert: (v: unknown): asserts v is string => {
        if (typeof v !== 'string') throw new Error('Not a string');
      },
      parse: (v: unknown) => {
        if (typeof v !== 'string') throw new Error('Not a string');
        return v;
      },
      safeParse: (v: unknown) =>
        typeof v === 'string' ? { ok: true as const, data: v } : { ok: false as const, errors: [] },
      optional: () => StringSchema as unknown as Schema<string | undefined>,
      nullable: () => StringSchema as unknown as Schema<string | null>,
      nullish: () => StringSchema as unknown as Schema<string | null | undefined>,
      default: () => StringSchema,
    } as Schema<string>;

    return new RecordValidator(StringSchema, keyOrValueSchema as Schema<V>);
  }

  return new RecordValidator(keyOrValueSchema as Schema<K>, valueSchema);
}

/**
 * Create a Map validator.
 */
export function map<K, V>(keySchema: Schema<K>, valueSchema: Schema<V>): MapValidator<K, V> {
  return new MapValidator(keySchema, valueSchema);
}

/**
 * Create a Set validator.
 */
export function set<T>(
  valueSchema: Schema<T>,
  config?: { minSize?: number; maxSize?: number }
): SetValidator<T> {
  return new SetValidator(valueSchema, config);
}
