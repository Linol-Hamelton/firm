/**
 * LAYER 1: Special Validators
 *
 * Special type validators: literal, enum, date, null, undefined, any, unknown, never.
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { SchemaConfig, Schema } from '../../../common/types/schema.js';
import type { ValidationResult } from '../../../common/types/result.js';
import { ok, err, createError, ErrorCode } from '../../../common/types/result.js';

// ============================================================================
// LITERAL VALIDATOR
// ============================================================================

interface LiteralConfig<T> extends SchemaConfig {
  value: T;
}

export class LiteralValidator<T extends string | number | boolean | null | undefined> extends BaseSchema<T, LiteralConfig<T>> {
  readonly _type = 'literal' as const;

  constructor(value: T) {
    super({ value });
  }

  protected _validate(value: unknown, path: string): ValidationResult<T> {
    if (value !== this.config.value) {
      return err(
        createError(
          ErrorCode.INVALID_LITERAL,
          this.config.errorMessage ?? `Expected ${formatLiteral(this.config.value)}`,
          path,
          { expected: this.config.value, received: value }
        )
      );
    }
    return ok(value as T);
  }

  protected _check(value: unknown): boolean {
    return value === this.config.value;
  }

  protected _clone(config: Partial<LiteralConfig<T>>): this {
    return new LiteralValidator(config.value ?? this.config.value) as this;
  }

  /**
   * Get the literal value.
   */
  get value(): T {
    return this.config.value;
  }
}

// ============================================================================
// ENUM VALIDATOR
// ============================================================================

interface EnumConfig<T extends readonly unknown[]> extends SchemaConfig {
  values: T;
}

export class EnumValidator<T extends readonly [string, ...string[]]> extends BaseSchema<T[number], EnumConfig<T>> {
  readonly _type = 'enum' as const;
  private readonly valueSet: Set<unknown>;

  constructor(values: T) {
    super({ values });
    this.valueSet = new Set(values);
  }

  protected _validate(value: unknown, path: string): ValidationResult<T[number]> {
    if (!this.valueSet.has(value)) {
      return err(
        createError(
          ErrorCode.INVALID_ENUM_VALUE,
          this.config.errorMessage ?? `Expected one of: ${this.config.values.join(', ')}`,
          path,
          { expected: this.config.values, received: value }
        )
      );
    }
    return ok(value as T[number]);
  }

  protected _check(value: unknown): boolean {
    return this.valueSet.has(value);
  }

  protected _clone(config: Partial<EnumConfig<T>>): this {
    return new EnumValidator(config.values ?? this.config.values) as this;
  }

  /**
   * Get enum values.
   */
  get values(): T {
    return this.config.values;
  }

  /**
   * Get options (alias for values).
   */
  get options(): T {
    return this.config.values;
  }

  /**
   * Exclude specific values.
   */
  exclude<K extends T[number]>(values: K[]): EnumValidator<Exclude<T, K>[]> {
    const excludeSet = new Set(values);
    const newValues = this.config.values.filter((v) => !excludeSet.has(v)) as unknown as Exclude<T, K>[];
    return new EnumValidator(newValues as unknown as readonly [string, ...string[]]) as unknown as EnumValidator<Exclude<T, K>[]>;
  }

  /**
   * Extract specific values.
   */
  extract<K extends T[number]>(values: K[]): EnumValidator<K[]> {
    return new EnumValidator(values as unknown as readonly [string, ...string[]]) as unknown as EnumValidator<K[]>;
  }
}

// ============================================================================
// NATIVE ENUM VALIDATOR
// ============================================================================

type EnumLike = { [k: string]: string | number; [nu: number]: string };

interface NativeEnumConfig<T extends EnumLike> extends SchemaConfig {
  enum: T;
}

export class NativeEnumValidator<T extends EnumLike> extends BaseSchema<T[keyof T], NativeEnumConfig<T>> {
  readonly _type = 'native_enum' as const;
  private readonly valueSet: Set<unknown>;

  constructor(enumObj: T) {
    super({ enum: enumObj });
    // Handle numeric enums (which have reverse mappings)
    this.valueSet = new Set(
      Object.values(enumObj).filter((v) => typeof v !== 'number' || !enumObj[v])
    );
  }

  protected _validate(value: unknown, path: string): ValidationResult<T[keyof T]> {
    if (!this.valueSet.has(value)) {
      return err(
        createError(
          ErrorCode.INVALID_ENUM_VALUE,
          this.config.errorMessage ?? `Expected enum value`,
          path,
          { received: value }
        )
      );
    }
    return ok(value as T[keyof T]);
  }

  protected _check(value: unknown): boolean {
    return this.valueSet.has(value);
  }

  protected _clone(config: Partial<NativeEnumConfig<T>>): this {
    return new NativeEnumValidator(config.enum ?? this.config.enum) as this;
  }
}

// ============================================================================
// DATE VALIDATOR
// ============================================================================

interface DateConfig extends SchemaConfig {
  min?: Date;
  max?: Date;
}

export class DateValidator extends BaseSchema<Date, DateConfig> {
  readonly _type = 'date' as const;

  constructor(config: DateConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown, path: string): ValidationResult<Date> {
    if (!(value instanceof Date)) {
      return err(
        createError(
          ErrorCode.NOT_DATE,
          this.config.errorMessage ?? 'Expected Date instance',
          path,
          { received: typeof value }
        )
      );
    }

    if (Number.isNaN(value.getTime())) {
      return err(
        createError(
          ErrorCode.NOT_DATE,
          this.config.errorMessage ?? 'Invalid Date',
          path
        )
      );
    }

    if (this.config.min && value < this.config.min) {
      return err(
        createError(
          ErrorCode.NUMBER_TOO_SMALL,
          `Date must be after ${this.config.min.toISOString()}`,
          path
        )
      );
    }

    if (this.config.max && value > this.config.max) {
      return err(
        createError(
          ErrorCode.NUMBER_TOO_BIG,
          `Date must be before ${this.config.max.toISOString()}`,
          path
        )
      );
    }

    return ok(value);
  }

  protected _check(value: unknown): boolean {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return false;
    if (this.config.min && value < this.config.min) return false;
    if (this.config.max && value > this.config.max) return false;
    return true;
  }

  protected _clone(config: Partial<DateConfig>): this {
    return new DateValidator({ ...this.config, ...config }) as this;
  }

  min(date: Date): DateValidator {
    return this._clone({ min: date });
  }

  max(date: Date): DateValidator {
    return this._clone({ max: date });
  }
}

// ============================================================================
// NULL, UNDEFINED, ANY, UNKNOWN, NEVER, VOID
// ============================================================================

export class NullValidator extends BaseSchema<null> {
  readonly _type = 'null' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown, path: string): ValidationResult<null> {
    if (value !== null) {
      return err(createError(ErrorCode.NOT_NULL, 'Expected null', path));
    }
    return ok(null);
  }

  protected _check(value: unknown): boolean {
    return value === null;
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new NullValidator({ ...this.config, ...config }) as this;
  }
}

export class UndefinedValidator extends BaseSchema<undefined> {
  readonly _type = 'undefined' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown, path: string): ValidationResult<undefined> {
    if (value !== undefined) {
      return err(createError(ErrorCode.NOT_UNDEFINED, 'Expected undefined', path));
    }
    return ok(undefined);
  }

  protected _check(value: unknown): boolean {
    return value === undefined;
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new UndefinedValidator({ ...this.config, ...config }) as this;
  }
}

export class AnyValidator extends BaseSchema<any> {
  readonly _type = 'any' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown): ValidationResult<any> {
    return ok(value);
  }

  protected _check(): boolean {
    return true;
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new AnyValidator({ ...this.config, ...config }) as this;
  }
}

export class UnknownValidator extends BaseSchema<unknown> {
  readonly _type = 'unknown' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown): ValidationResult<unknown> {
    return ok(value);
  }

  protected _check(): boolean {
    return true;
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new UnknownValidator({ ...this.config, ...config }) as this;
  }
}

export class NeverValidator extends BaseSchema<never> {
  readonly _type = 'never' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(_value: unknown, path: string): ValidationResult<never> {
    return err(createError(ErrorCode.INVALID_TYPE, 'Never type cannot have value', path));
  }

  protected _check(): boolean {
    return false;
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new NeverValidator({ ...this.config, ...config }) as this;
  }
}

export class VoidValidator extends BaseSchema<void> {
  readonly _type = 'void' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown, path: string): ValidationResult<void> {
    if (value !== undefined) {
      return err(createError(ErrorCode.NOT_UNDEFINED, 'Expected void (undefined)', path));
    }
    return ok(undefined);
  }

  protected _check(value: unknown): boolean {
    return value === undefined;
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new VoidValidator({ ...this.config, ...config }) as this;
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

export function literal<T extends string | number | boolean | null | undefined>(
  value: T
): LiteralValidator<T> {
  return new LiteralValidator(value);
}

export function enumeration<T extends readonly [string, ...string[]]>(
  values: T
): EnumValidator<T> {
  return new EnumValidator(values);
}

export function nativeEnum<T extends EnumLike>(enumObj: T): NativeEnumValidator<T> {
  return new NativeEnumValidator(enumObj);
}

export function date(config?: DateConfig): DateValidator {
  return new DateValidator(config);
}

export const nullType = (): NullValidator => new NullValidator();
export const undefinedType = (): UndefinedValidator => new UndefinedValidator();
export const any = (): AnyValidator => new AnyValidator();
export const unknown = (): UnknownValidator => new UnknownValidator();
export const never = (): NeverValidator => new NeverValidator();
export const voidType = (): VoidValidator => new VoidValidator();

// ============================================================================
// HELPERS
// ============================================================================

function formatLiteral(value: unknown): string {
  if (typeof value === 'string') return `"${value}"`;
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  return String(value);
}
