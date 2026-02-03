/**
 * LAYER 0: Schema Type Definitions
 *
 * Core type definitions for schema building.
 * These types define the CONTRACT that all validators must implement.
 *
 * Design principles:
 * - Phantom types for perfect type inference
 * - Discriminated unions for validator type identification
 * - Immutable configuration objects
 * - Minimal memory footprint
 */

import type { ValidationResult } from './result.js';

// ============================================================================
// SCHEMA TYPE DISCRIMINATOR
// ============================================================================

/**
 * All possible schema types.
 * Used as discriminator for type narrowing.
 */
export const SchemaType = {
  // Primitives
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  BIGINT: 'bigint',
  SYMBOL: 'symbol',
  UNDEFINED: 'undefined',
  NULL: 'null',
  DATE: 'date',

  // Composites
  OBJECT: 'object',
  ARRAY: 'array',
  TUPLE: 'tuple',
  RECORD: 'record',
  MAP: 'map',
  SET: 'set',

  // Algebraic
  UNION: 'union',
  INTERSECTION: 'intersection',
  DISCRIMINATED_UNION: 'discriminated_union',

  // Special
  LITERAL: 'literal',
  ENUM: 'enum',
  NATIVE_ENUM: 'native_enum',
  ANY: 'any',
  UNKNOWN: 'unknown',
  NEVER: 'never',
  VOID: 'void',

  // Modifiers
  OPTIONAL: 'optional',
  NULLABLE: 'nullable',
  DEFAULT: 'default',
  READONLY: 'readonly',

  // Advanced
  LAZY: 'lazy',
  BRANDED: 'branded',
  PIPELINE: 'pipeline',
  CUSTOM: 'custom',
} as const;

export type SchemaType = (typeof SchemaType)[keyof typeof SchemaType];

// ============================================================================
// CORE SCHEMA INTERFACE
// ============================================================================

/**
 * The core Schema interface that ALL validators must implement.
 * This is the fundamental contract of FIRM.
 *
 * @typeParam T - The output type after successful validation
 * @typeParam Input - The input type (defaults to unknown)
 */
export interface Schema<T, Input = unknown> {
  /**
   * Discriminator for schema type identification.
   * Used for type narrowing and compilation optimization.
   */
  readonly _type: SchemaType;

  /**
   * Phantom type marker for TypeScript inference.
   * Never actually used at runtime.
   */
  readonly _output: T;

  /**
   * Phantom type marker for input type.
   * Useful for transforms where input !== output.
   */
  readonly _input: Input;

  /**
   * Validate input data synchronously.
   * This is the primary validation method - optimized for speed.
   *
   * @param data - Unknown data to validate
   * @returns ValidationResult with typed data or errors
   */
  validate(data: unknown): ValidationResult<T>;

  /**
   * Compile schema to optimized validator function.
   * Use this for hot paths where the same schema validates many values.
   *
   * @returns Optimized validation function
   */
  compile(): CompiledValidator<T>;

  /**
   * Check if value is valid without returning detailed errors.
   * Faster than validate() when you only need boolean result.
   *
   * @param data - Data to check
   * @returns true if valid, false otherwise
   */
  is(data: unknown): data is T;

  /**
   * Assert that value is valid, throw if not.
   * Useful for fail-fast scenarios.
   *
   * @param data - Data to assert
   * @throws ValidationError if invalid
   */
  assert(data: unknown): asserts data is T;

  /**
   * Parse and return data or throw.
   * Convenience method combining validate + throw.
   *
   * @param data - Data to parse
   * @returns Validated data
   * @throws ValidationError if invalid
   */
  parse(data: unknown): T;

  /**
   * Safe parse that never throws.
   * Alias for validate() for Zod compatibility.
   *
   * @param data - Data to parse
   * @returns ValidationResult
   */
  safeParse(data: unknown): ValidationResult<T>;

  /**
   * Validate input data asynchronously.
   * Use this when schema contains async refinements or transformations.
   * Optional - only implemented by schemas that support async.
   *
   * @param data - Unknown data to validate
   * @returns Promise of ValidationResult with typed data or errors
   */
  validateAsync?(data: unknown): Promise<ValidationResult<T>>;

  /**
   * Parse asynchronously and return data or throw.
   * Convenience method for async validation + throw.
   * Optional - only implemented by schemas that support async.
   *
   * @param data - Data to parse
   * @returns Promise of validated data
   * @throws ValidationError if invalid
   */
  parseAsync?(data: unknown): Promise<T>;

  /**
   * Safe async parse that never throws.
   * Alias for validateAsync() for Zod compatibility.
   * Optional - only implemented by schemas that support async.
   *
   * @param data - Data to parse
   * @returns Promise of ValidationResult
   */
  safeParseAsync?(data: unknown): Promise<ValidationResult<T>>;

  /**
   * Make schema optional (allows undefined).
   */
  optional(): Schema<T | undefined>;

  /**
   * Make schema nullable (allows null).
   */
  nullable(): Schema<T | null>;

  /**
   * Make schema nullish (allows null or undefined).
   */
  nullish(): Schema<T | null | undefined>;

  /**
   * Provide default value when undefined.
   */
  default(value: T): Schema<T>;
}

// ============================================================================
// COMPILED VALIDATOR
// ============================================================================

/**
 * Pre-compiled validator function.
 * Generated by schema.compile() for maximum performance.
 */
export interface CompiledValidator<T> {
  (data: unknown): ValidationResult<T>;

  /**
   * Fast boolean check without error details.
   */
  is(data: unknown): data is T;
}

// ============================================================================
// TYPE INFERENCE UTILITIES
// ============================================================================

/**
 * Extract the output type from a schema.
 *
 * @example
 * ```ts
 * const userSchema = s.object({ name: s.string() });
 * type User = Infer<typeof userSchema>;
 * // User = { name: string }
 * ```
 */
export type Infer<S extends Schema<unknown>> = S['_output'];

/**
 * Extract the input type from a schema.
 * Useful for transforms where input differs from output.
 */
export type InferInput<S extends Schema<unknown, unknown>> = S['_input'];

/**
 * Extract output type from schema, handling optionals.
 */
export type InferOptional<S extends Schema<unknown>> = S extends Schema<infer T>
  ? T | undefined
  : never;

// ============================================================================
// SCHEMA CONFIGURATION
// ============================================================================

/**
 * Base configuration shared by all schemas.
 */
export interface SchemaConfig {
  /** Optional description for documentation */
  readonly description?: string;

  /** Whether the field is optional */
  readonly isOptional?: boolean;

  /** Whether the field is nullable */
  readonly isNullable?: boolean;

  /** Default value if undefined */
  readonly defaultValue?: unknown;

  /** Custom error message override */
  readonly errorMessage?: string;
}

/**
 * Configuration for string validators.
 */
export interface StringSchemaConfig extends SchemaConfig {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: RegExp;
  readonly trim?: boolean;
  readonly toLowerCase?: boolean;
  readonly toUpperCase?: boolean;
}

/**
 * Configuration for number validators.
 */
export interface NumberSchemaConfig extends SchemaConfig {
  readonly min?: number;
  readonly max?: number;
  readonly integer?: boolean;
  readonly positive?: boolean;
  readonly negative?: boolean;
  readonly finite?: boolean;
  readonly safe?: boolean;
  readonly multipleOf?: number;
}

/**
 * Configuration for array validators.
 */
export interface ArraySchemaConfig extends SchemaConfig {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly unique?: boolean;
}

/**
 * Configuration for object validators.
 */
export interface ObjectSchemaConfig extends SchemaConfig {
  /** How to handle unknown keys: strip, passthrough, or strict */
  readonly unknownKeys?: 'strip' | 'passthrough' | 'strict';
  /** Maximum depth for object validation to prevent stack overflow attacks */
  readonly maxDepth?: number;
}

// ============================================================================
// MODIFIER SCHEMAS
// ============================================================================

/**
 * Schema with optional modifier.
 */
export interface OptionalSchema<T> extends Schema<T | undefined> {
  readonly _type: typeof SchemaType.OPTIONAL;
  readonly innerSchema: Schema<T>;
}

/**
 * Schema with nullable modifier.
 */
export interface NullableSchema<T> extends Schema<T | null> {
  readonly _type: typeof SchemaType.NULLABLE;
  readonly innerSchema: Schema<T>;
}

/**
 * Schema with default value.
 */
export interface DefaultSchema<T> extends Schema<T> {
  readonly _type: typeof SchemaType.DEFAULT;
  readonly innerSchema: Schema<T>;
  readonly defaultValue: T;
}
