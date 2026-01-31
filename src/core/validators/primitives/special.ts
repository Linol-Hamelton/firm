/**
 * LAYER 1: Special Validators
 *
 * Special type validators: literal, enum, date, null, undefined, any, unknown, never.
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { SchemaConfig } from '../../../common/types/schema.js';
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

  constructor(value: T, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, value });
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

  protected override _check(value: unknown): boolean {
    return value === this.config.value;
  }

  protected _clone(config: Partial<LiteralConfig<T>>): this {
    const merged = { ...this.config, ...config };
    return new LiteralValidator(merged.value, merged) as this;
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

  constructor(values: T, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, values });
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

  protected override _check(value: unknown): boolean {
    return this.valueSet.has(value);
  }

  protected _clone(config: Partial<EnumConfig<T>>): this {
    const merged = { ...this.config, ...config };
    return new EnumValidator(merged.values, merged) as this;
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
  exclude<K extends T[number]>(values: readonly K[]): EnumValidator<readonly [string, ...string[]]> {
    const excludeSet = new Set(values);
    const newValues = this.config.values.filter((v): v is string => !excludeSet.has(v as K));
    return new EnumValidator(newValues as unknown as readonly [string, ...string[]], this.config);
  }

  /**
   * Extract specific values.
   */
  extract<K extends T[number]>(values: readonly K[]): EnumValidator<readonly [string, ...string[]]> {
    return new EnumValidator(values as unknown as readonly [string, ...string[]], this.config);
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

  constructor(enumObj: T, baseConfig: Partial<SchemaConfig> = {}) {
    super({ ...baseConfig, enum: enumObj });
    // Handle numeric enums (which have reverse mappings)
    // Filter out string keys that map back to numbers (reverse mappings)
    this.valueSet = new Set(
      Object.values(enumObj).filter((v) => typeof enumObj[v as keyof T] !== 'number')
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

  protected override _check(value: unknown): boolean {
    return this.valueSet.has(value);
  }

  protected _clone(config: Partial<NativeEnumConfig<T>>): this {
    const merged = { ...this.config, ...config };
    return new NativeEnumValidator(merged.enum, merged) as this;
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

  protected override _check(value: unknown): boolean {
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

  after(date: Date): DateValidator {
    return this._clone({ min: date });
  }

  before(date: Date): DateValidator {
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

  protected override _check(value: unknown): boolean {
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

  protected override _check(value: unknown): boolean {
    return value === undefined;
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new UndefinedValidator({ ...this.config, ...config }) as this;
  }
}

// ============================================================================
// BIGINT VALIDATOR
// ============================================================================

export class BigIntValidator extends BaseSchema<bigint> {
  readonly _type = 'bigint' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown, path: string): ValidationResult<bigint> {
    if (typeof value !== 'bigint') {
      return err(
        createError(
          ErrorCode.NOT_BIGINT,
          this.config.errorMessage ?? 'Expected bigint',
          path,
          { received: typeof value }
        )
      );
    }
    return ok(value);
  }

  protected override _check(value: unknown): boolean {
    return typeof value === 'bigint';
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new BigIntValidator({ ...this.config, ...config }) as this;
  }
}

// ============================================================================
// SYMBOL VALIDATOR
// ============================================================================

export class SymbolValidator extends BaseSchema<symbol> {
  readonly _type = 'symbol' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown, path: string): ValidationResult<symbol> {
    if (typeof value !== 'symbol') {
      return err(
        createError(
          ErrorCode.NOT_SYMBOL,
          this.config.errorMessage ?? 'Expected symbol',
          path,
          { received: typeof value }
        )
      );
    }
    return ok(value);
  }

  protected override _check(value: unknown): boolean {
    return typeof value === 'symbol';
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new SymbolValidator({ ...this.config, ...config }) as this;
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

  protected override _check(): boolean {
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

  protected override _check(): boolean {
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

  protected override _check(): boolean {
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

  protected override _check(value: unknown): boolean {
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

export function bigint(config?: SchemaConfig): BigIntValidator {
  return new BigIntValidator(config);
}

export function symbol(config?: SchemaConfig): SymbolValidator {
  return new SymbolValidator(config);
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
