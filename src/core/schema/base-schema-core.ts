/**
 * LAYER 1: Base Schema Core
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
import type { ValidationResult } from '../../common/types/result.js';
import { ok } from '../../common/types/result.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// Import modifier factory functions
import {
  createRefinedSchema,
  createAsyncRefinedSchema,
  createSuperRefinedSchema,
  createTransformSchema,
  createAsyncTransformSchema,
  createPreprocessSchema,
  createPipeSchema,
  type RefinementContext,
} from './schema-modifiers-factory.js';

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

  // ==========================================================================
  // ASYNC VALIDATION METHODS
  // ==========================================================================

  /**
   * Validate data asynchronously.
   * Use this when schema contains async refinements.
   */
  async validateAsync(data: unknown): Promise<ValidationResult<T>> {
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

    return this._validateAsync(data, '');
  }

  /**
   * Async validation implementation.
   * Override in subclasses that support async validation.
   * Default implementation falls back to sync validation.
   */
  protected async _validateAsync(value: unknown, path: string): Promise<ValidationResult<T>> {
    return this._validate(value, path);
  }

  /**
   * Parse asynchronously and return data or throw.
   */
  async parseAsync(data: unknown): Promise<T> {
    const result = await this.validateAsync(data);
    if (!result.ok) {
      throw new ValidationException(result.errors);
    }
    return result.data;
  }

  /**
   * Safe async parse (alias for validateAsync).
   */
  async safeParseAsync(data: unknown): Promise<ValidationResult<T>> {
    return this.validateAsync(data);
  }

  // ==========================================================================
  // FLUENT API METHODS
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
   * Add custom synchronous refinement.
   */
  refine(
    check: (value: T) => boolean,
    message: string | { message: string } = 'Refinement failed'
  ): Schema<T> {
    const msg = typeof message === 'string' ? message : message.message;
    return createRefinedSchema(this, check, msg);
  }

  /**
   * Add custom async refinement.
   * Use validateAsync() to execute async validations.
   */
  refineAsync(
    check: (value: T) => Promise<boolean>,
    message: string | { message: string } = 'Refinement failed'
  ): Schema<T> {
    const msg = typeof message === 'string' ? message : message.message;
    return createAsyncRefinedSchema(this, check, msg);
  }

  /**
   * Add custom refinement with type narrowing.
   */
  superRefine<U extends T>(
    refiner: (value: T, ctx: RefinementContext) => value is U
  ): Schema<U> {
    return createSuperRefinedSchema(this, refiner) as unknown as Schema<U>;
  }

  /**
   * Transform value after validation.
   */
  transform<U>(transformer: (value: T) => U): Schema<U> {
    return createTransformSchema(this, transformer);
  }

  /**
   * Transform value after validation (async).
   * Use validateAsync() to execute async transformations.
   */
  transformAsync<U>(transformer: (value: T) => Promise<U>): Schema<U> {
    return createAsyncTransformSchema(this, transformer);
  }

  /**
   * Preprocess value before validation.
   * Useful for coercion or normalization.
   */
  preprocess(preprocessor: (value: unknown) => unknown): Schema<T> {
    return createPreprocessSchema(this, preprocessor);
  }

  /**
   * Pipe through another schema after this one.
   */
  pipe<U>(schema: Schema<U>): Schema<U> {
    return createPipeSchema(this as unknown as Schema<unknown>, schema);
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

  // ==========================================================================
  // COMPILATION
  // ==========================================================================

  /**
   * Compile schema for repeated validation.
   */
  compile(): CompiledValidator<T> {
    // Default implementation - subclasses can override for optimization
    const validator = (data: unknown): ValidationResult<T> => this.validate(data);
    validator.is = (data: unknown): data is T => this.is(data);
    return validator;
  }
}