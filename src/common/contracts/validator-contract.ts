/**
 * LAYER 0: Validator Contracts
 *
 * Defines the contracts (interfaces) that validators must implement.
 * This is the "Ports" part of Hexagonal Architecture.
 *
 * Benefits:
 * - Clear separation between interface and implementation
 * - Easy to swap implementations
 * - Perfect for testing (mock implementations)
 * - Documentation of expected behavior
 */

import type { ValidationResult, ValidationError, ErrorCode } from '../types/result.js';
import type { Schema, SchemaConfig } from '../types/schema.js';

// ============================================================================
// VALIDATOR FUNCTION CONTRACT
// ============================================================================

/**
 * Pure validation function type.
 * This is the core contract for all validation logic.
 *
 * MUST be pure:
 * - No side effects
 * - No I/O operations
 * - Deterministic output for same input
 * - No external dependencies
 */
export type ValidatorFn<T> = (value: unknown, path: string) => ValidationResult<T>;

/**
 * Check function type (faster than full validation).
 * Returns boolean only, no error details.
 */
export type CheckFn = (value: unknown) => boolean;

// ============================================================================
// SCHEMA BUILDER CONTRACT
// ============================================================================

/**
 * Contract for schema builders (fluent API).
 * All schema methods should return a new schema instance (immutable).
 */
export interface SchemaBuilder<T, S extends Schema<T>> {
  /**
   * Mark field as optional (T | undefined).
   */
  optional(): Schema<T | undefined>;

  /**
   * Mark field as nullable (T | null).
   */
  nullable(): Schema<T | null>;

  /**
   * Provide default value when undefined.
   */
  default(value: T): Schema<T>;

  /**
   * Add description (for documentation/OpenAPI).
   */
  describe(description: string): S;

  /**
   * Override error message for this schema.
   */
  errorMessage(message: string): S;

  /**
   * Add custom refinement.
   */
  refine<U extends T>(
    check: (value: T) => value is U,
    message?: string
  ): Schema<U>;
  refine(check: (value: T) => boolean, message?: string): S;

  /**
   * Transform value after validation.
   */
  transform<U>(transformer: (value: T) => U): Schema<U>;
}

// ============================================================================
// STRING VALIDATOR CONTRACT
// ============================================================================

/**
 * Contract for string validators.
 * Extends base schema builder with string-specific methods.
 */
export interface StringValidatorContract extends SchemaBuilder<string, StringValidatorContract> {
  // Length constraints
  min(length: number): StringValidatorContract;
  max(length: number): StringValidatorContract;
  length(length: number): StringValidatorContract;

  // Pattern matching
  regex(pattern: RegExp): StringValidatorContract;
  includes(substring: string): StringValidatorContract;
  startsWith(prefix: string): StringValidatorContract;
  endsWith(suffix: string): StringValidatorContract;

  // Format validators
  email(): StringValidatorContract;
  url(): StringValidatorContract;
  uuid(): StringValidatorContract;
  cuid(): StringValidatorContract;
  cuid2(): StringValidatorContract;
  ip(): StringValidatorContract;
  datetime(): StringValidatorContract;
  date(): StringValidatorContract;
  time(): StringValidatorContract;

  // Transforms
  trim(): StringValidatorContract;
  toLowerCase(): StringValidatorContract;
  toUpperCase(): StringValidatorContract;

  // Constraints
  nonempty(): StringValidatorContract;
}

// ============================================================================
// NUMBER VALIDATOR CONTRACT
// ============================================================================

/**
 * Contract for number validators.
 */
export interface NumberValidatorContract extends SchemaBuilder<number, NumberValidatorContract> {
  // Range constraints
  min(value: number): NumberValidatorContract;
  max(value: number): NumberValidatorContract;
  gt(value: number): NumberValidatorContract;
  gte(value: number): NumberValidatorContract;
  lt(value: number): NumberValidatorContract;
  lte(value: number): NumberValidatorContract;

  // Type constraints
  int(): NumberValidatorContract;
  positive(): NumberValidatorContract;
  negative(): NumberValidatorContract;
  nonnegative(): NumberValidatorContract;
  nonpositive(): NumberValidatorContract;
  finite(): NumberValidatorContract;
  safe(): NumberValidatorContract;

  // Multiple
  multipleOf(value: number): NumberValidatorContract;
}

// ============================================================================
// OBJECT VALIDATOR CONTRACT
// ============================================================================

/**
 * Contract for object validators.
 */
export interface ObjectValidatorContract<T extends Record<string, unknown>>
  extends SchemaBuilder<T, ObjectValidatorContract<T>> {
  /**
   * Make all fields optional.
   */
  partial(): ObjectValidatorContract<Partial<T>>;

  /**
   * Make all fields required.
   */
  required(): ObjectValidatorContract<Required<T>>;

  /**
   * Pick specific fields.
   */
  pick<K extends keyof T>(keys: K[]): ObjectValidatorContract<Pick<T, K>>;

  /**
   * Omit specific fields.
   */
  omit<K extends keyof T>(keys: K[]): ObjectValidatorContract<Omit<T, K>>;

  /**
   * Extend with additional fields.
   */
  extend<U extends Record<string, Schema<unknown>>>(
    shape: U
  ): ObjectValidatorContract<T & { [K in keyof U]: U[K]['_output'] }>;

  /**
   * Merge with another object schema.
   */
  merge<U extends Record<string, unknown>>(
    other: ObjectValidatorContract<U>
  ): ObjectValidatorContract<T & U>;

  /**
   * Strip unknown keys (default behavior).
   */
  strip(): ObjectValidatorContract<T>;

  /**
   * Pass through unknown keys.
   */
  passthrough(): ObjectValidatorContract<T & Record<string, unknown>>;

  /**
   * Reject unknown keys with error.
   */
  strict(): ObjectValidatorContract<T>;
}

// ============================================================================
// ARRAY VALIDATOR CONTRACT
// ============================================================================

/**
 * Contract for array validators.
 */
export interface ArrayValidatorContract<T>
  extends SchemaBuilder<T[], ArrayValidatorContract<T>> {
  /**
   * Minimum array length.
   */
  min(length: number): ArrayValidatorContract<T>;

  /**
   * Maximum array length.
   */
  max(length: number): ArrayValidatorContract<T>;

  /**
   * Exact array length.
   */
  length(length: number): ArrayValidatorContract<T>;

  /**
   * Non-empty array (at least 1 item).
   */
  nonempty(): ArrayValidatorContract<[T, ...T[]]>;

  /**
   * Unique items only.
   */
  unique(): ArrayValidatorContract<T>;
}

// ============================================================================
// COMPILER CONTRACT
// ============================================================================

/**
 * Contract for schema compiler.
 * Compiles schema to optimized validation function.
 */
export interface CompilerContract {
  /**
   * Compile schema to optimized validator.
   */
  compile<T>(schema: Schema<T>): (data: unknown) => ValidationResult<T>;

  /**
   * Compile schema to fast check function.
   */
  compileCheck<T>(schema: Schema<T>): (data: unknown) => boolean;
}

// ============================================================================
// ERROR FORMATTER CONTRACT
// ============================================================================

/**
 * Contract for error formatters.
 * Allows customizing error output format.
 */
export interface ErrorFormatterContract {
  /**
   * Format a single error.
   */
  format(error: ValidationError): string;

  /**
   * Format multiple errors.
   */
  formatAll(errors: readonly ValidationError[]): string;

  /**
   * Create error object with custom message.
   */
  createError(
    code: ErrorCode,
    path: string,
    params?: Record<string, unknown>
  ): ValidationError;
}

// ============================================================================
// PLUGIN CONTRACT
// ============================================================================

/**
 * Contract for FIRM plugins.
 * Allows extending FIRM with custom validators and features.
 */
export interface PluginContract {
  /**
   * Plugin name (unique identifier).
   */
  readonly name: string;

  /**
   * Plugin version.
   */
  readonly version: string;

  /**
   * Initialize plugin.
   */
  init?(firm: FirmInstance): void;

  /**
   * Add custom validators.
   */
  validators?: Record<string, (...args: unknown[]) => Schema<unknown>>;

  /**
   * Add custom error messages.
   */
  messages?: Partial<Record<ErrorCode, string>>;
}

/**
 * FIRM instance interface for plugins.
 */
export interface FirmInstance {
  /**
   * Register custom validator.
   */
  register<T>(name: string, validator: Schema<T>): void;

  /**
   * Get registered validator.
   */
  get<T>(name: string): Schema<T> | undefined;
}
