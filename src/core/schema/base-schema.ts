/**
 * LAYER 1: Base Schema
 *
 * Abstract base class for all validators.
 * Implements common functionality and enforces the Schema contract.
 *
 * PERFORMANCE CRITICAL:
 * - All methods must be pure (no I/O)
 * - Minimize object allocations
 * - Use early returns for fast paths
 */

import type {
  Schema,
  SchemaType,
  SchemaConfig,
  CompiledValidator,
} from '../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../common/types/result.js';
import { ok, err, createError, ErrorCode } from '../../common/types/result.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// ============================================================================
// BASE SCHEMA ABSTRACT CLASS
// ============================================================================

/**
 * Abstract base class for all FIRM schemas.
 *
 * @typeParam T - Output type after validation
 * @typeParam Config - Configuration type for this schema
 */
export abstract class BaseSchema<T, Config extends SchemaConfig = SchemaConfig>
  implements Schema<T>
{
  /**
   * Schema type discriminator.
   */
  abstract readonly _type: SchemaType;

  /**
   * Phantom type for output inference.
   */
  declare readonly _output: T;

  /**
   * Phantom type for input inference.
   */
  declare readonly _input: unknown;

  /**
   * Schema configuration.
   */
  protected readonly config: Readonly<Config>;

  constructor(config: Config) {
    this.config = Object.freeze({ ...config });
  }

  // ==========================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ==========================================================================

  /**
   * Core validation logic.
   * MUST be pure - no side effects, no I/O.
   *
   * @param value - Value to validate
   * @param path - Current path for error reporting
   */
  protected abstract _validate(value: unknown, path: string): ValidationResult<T>;

  /**
   * Fast check without error details.
   * Override for optimized implementation.
   */
  protected _check(value: unknown): boolean {
    return this._validate(value, '').ok;
  }

  /**
   * Clone schema with new config.
   * Used for fluent API methods.
   */
  protected abstract _clone(config: Partial<Config>): this;

  // ==========================================================================
  // PUBLIC API (Implements Schema interface)
  // ==========================================================================

  /**
   * Validate data and return result.
   */
  validate(data: unknown): ValidationResult<T> {
    // Handle optional
    if (data === undefined && this.config.isOptional) {
      return ok(undefined as T);
    }

    // Handle nullable
    if (data === null && this.config.isNullable) {
      return ok(null as T);
    }

    // Handle default
    if (data === undefined && this.config.defaultValue !== undefined) {
      return ok(this.config.defaultValue as T);
    }

    return this._validate(data, '');
  }

  /**
   * Check if value is valid (fast path).
   */
  is(data: unknown): data is T {
    if (data === undefined && this.config.isOptional) return true;
    if (data === null && this.config.isNullable) return true;
    if (data === undefined && this.config.defaultValue !== undefined) return true;
    return this._check(data);
  }

  /**
   * Assert value is valid or throw.
   */
  assert(data: unknown): asserts data is T {
    const result = this.validate(data);
    if (!result.ok) {
      throw new ValidationException(result.errors);
    }
  }

  /**
   * Parse and return data or throw.
   */
  parse(data: unknown): T {
    const result = this.validate(data);
    if (!result.ok) {
      throw new ValidationException(result.errors);
    }
    return result.data;
  }

  /**
   * Safe parse (alias for validate).
   */
  safeParse(data: unknown): ValidationResult<T> {
    return this.validate(data);
  }

  /**
   * Compile schema for repeated validation.
   */
  compile(): CompiledValidator<T> {
    // Default implementation - subclasses can override for optimization
    const validator = (data: unknown): ValidationResult<T> => this.validate(data);
    validator.is = (data: unknown): data is T => this.is(data);
    return validator;
  }

  // ==========================================================================
  // MODIFIER METHODS (Fluent API)
  // ==========================================================================

  /**
   * Make schema optional (allows undefined).
   */
  optional(): Schema<T | undefined> {
    return this._clone({ isOptional: true } as Partial<Config>) as unknown as Schema<
      T | undefined
    >;
  }

  /**
   * Make schema nullable (allows null).
   */
  nullable(): Schema<T | null> {
    return this._clone({ isNullable: true } as Partial<Config>) as unknown as Schema<T | null>;
  }

  /**
   * Make schema nullish (allows null or undefined).
   */
  nullish(): Schema<T | null | undefined> {
    return this._clone({
      isOptional: true,
      isNullable: true,
    } as Partial<Config>) as unknown as Schema<T | null | undefined>;
  }

  /**
   * Provide default value when undefined.
   */
  default(value: T): Schema<T> {
    return this._clone({ defaultValue: value } as Partial<Config>);
  }

  /**
   * Add description for documentation.
   */
  describe(description: string): this {
    return this._clone({ description } as Partial<Config>);
  }

  /**
   * Override error message.
   */
  errorMessage(message: string): this {
    return this._clone({ errorMessage: message } as Partial<Config>);
  }

  // ==========================================================================
  // REFINEMENT METHODS
  // ==========================================================================

  /**
   * Add custom refinement.
   */
  refine(
    check: (value: T) => boolean,
    message: string = 'Refinement failed'
  ): RefinedSchema<T> {
    return new RefinedSchema(this, check, message);
  }

  /**
   * Add custom refinement with type narrowing.
   */
  superRefine<U extends T>(
    refiner: (value: T, ctx: RefinementContext) => value is U
  ): Schema<U> {
    return new SuperRefinedSchema(this, refiner) as unknown as Schema<U>;
  }

  /**
   * Transform value after validation.
   */
  transform<U>(transformer: (value: T) => U): Schema<U> {
    return new TransformSchema(this, transformer);
  }

  /**
   * Pipe through another schema after this one.
   */
  pipe<U>(schema: Schema<U>): Schema<U> {
    return new PipeSchema(this as unknown as Schema<unknown>, schema);
  }

  // ==========================================================================
  // UTILITY METHODS
  // ==========================================================================

  /**
   * Get schema configuration.
   */
  getConfig(): Readonly<Config> {
    return this.config;
  }

  /**
   * Check if schema is optional.
   */
  isOptionalSchema(): boolean {
    return this.config.isOptional === true;
  }

  /**
   * Check if schema is nullable.
   */
  isNullableSchema(): boolean {
    return this.config.isNullable === true;
  }
}

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

class RefinedSchema<T> extends BaseSchema<T> {
  readonly _type = 'custom' as SchemaType;

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

class SuperRefinedSchema<T, U extends T> extends BaseSchema<U> {
  readonly _type = 'custom' as SchemaType;

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
// TRANSFORM SCHEMA
// ============================================================================

class TransformSchema<T, U> extends BaseSchema<U> {
  readonly _type = 'pipeline' as SchemaType;

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
// PIPE SCHEMA
// ============================================================================

class PipeSchema<T, U> extends BaseSchema<U> {
  readonly _type = 'pipeline' as SchemaType;

  constructor(
    private readonly first: Schema<T>,
    private readonly second: Schema<U>
  ) {
    super({});
  }

  protected _validate(value: unknown, path: string): ValidationResult<U> {
    const firstResult = this.first.validate(value);
    if (!firstResult.ok) return firstResult;

    return this.second.validate(firstResult.data);
  }

  protected _clone(): this {
    return new PipeSchema(this.first, this.second) as this;
  }
}
