/**
 * LAYER 0: Foundation Types
 *
 * ValidationResult - Discriminated union for validation outcomes.
 * This is the CORE contract that ALL validators must follow.
 *
 * Design principles:
 * - Discriminated union (ok field) for perfect type narrowing
 * - Immutable by design
 * - Zero allocation for success path (reuse object pattern)
 * - Rich error information without performance penalty
 */

// ============================================================================
// VALIDATION RESULT (DISCRIMINATED UNION)
// ============================================================================

/**
 * Successful validation result.
 * Contains the validated and potentially transformed data.
 */
export interface ValidationSuccess<T> {
  readonly ok: true;
  readonly data: T;
}

/**
 * Failed validation result.
 * Contains detailed error information for debugging and user feedback.
 */
export interface ValidationFailure {
  readonly ok: false;
  readonly errors: readonly ValidationError[];
}

/**
 * Discriminated union for validation results.
 * Use the `ok` field to narrow the type:
 *
 * ```ts
 * const result = schema.validate(data);
 * if (result.ok) {
 *   // TypeScript knows: result.data is T
 *   console.log(result.data);
 * } else {
 *   // TypeScript knows: result.errors is ValidationError[]
 *   console.log(result.errors);
 * }
 * ```
 */
export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;

// ============================================================================
// VALIDATION ERROR
// ============================================================================

/**
 * Detailed validation error with path tracking.
 * Designed for both developer debugging and user-facing messages.
 */
export interface ValidationError {
  /** Dot-notation path to the invalid field (e.g., "user.address.city") */
  readonly path: string;

  /** Machine-readable error code for i18n and programmatic handling */
  readonly code: ErrorCode;

  /** Human-readable error message (default locale) */
  readonly message: string;

  /** The actual value that failed validation */
  readonly received?: unknown;

  /** Expected type or constraint description */
  readonly expected?: string;

  /** Additional context for complex validations */
  readonly meta?: Readonly<Record<string, unknown>>;
}

// ============================================================================
// ERROR CODES (EXHAUSTIVE ENUM FOR TYPE SAFETY)
// ============================================================================

/**
 * All possible error codes in FIRM.
 * Using const enum for zero runtime overhead.
 * Each code maps to a specific validation failure type.
 */
export const ErrorCode = {
  // Type errors
  INVALID_TYPE: 'INVALID_TYPE',
  NOT_STRING: 'NOT_STRING',
  NOT_NUMBER: 'NOT_NUMBER',
  NOT_BOOLEAN: 'NOT_BOOLEAN',
  NOT_OBJECT: 'NOT_OBJECT',
  NOT_ARRAY: 'NOT_ARRAY',
  NOT_DATE: 'NOT_DATE',
  NOT_UNDEFINED: 'NOT_UNDEFINED',
  NOT_NULL: 'NOT_NULL',
  NOT_BIGINT: 'NOT_BIGINT',
  NOT_SYMBOL: 'NOT_SYMBOL',
  NOT_FUNCTION: 'NOT_FUNCTION',

  // String constraints
  STRING_TOO_SHORT: 'STRING_TOO_SHORT',
  STRING_TOO_LONG: 'STRING_TOO_LONG',
  STRING_PATTERN_MISMATCH: 'STRING_PATTERN_MISMATCH',
  STRING_INVALID_EMAIL: 'STRING_INVALID_EMAIL',
  STRING_INVALID_URL: 'STRING_INVALID_URL',
  STRING_INVALID_UUID: 'STRING_INVALID_UUID',
  STRING_INVALID_CUID: 'STRING_INVALID_CUID',
  STRING_INVALID_EMOJI: 'STRING_INVALID_EMOJI',
  STRING_INVALID_IP: 'STRING_INVALID_IP',
  STRING_INVALID_DATETIME: 'STRING_INVALID_DATETIME',
  STRING_NOT_EMPTY: 'STRING_NOT_EMPTY',
  STRING_STARTS_WITH: 'STRING_STARTS_WITH',
  STRING_ENDS_WITH: 'STRING_ENDS_WITH',
  STRING_INCLUDES: 'STRING_INCLUDES',

  // Number constraints
  NUMBER_TOO_SMALL: 'NUMBER_TOO_SMALL',
  NUMBER_TOO_BIG: 'NUMBER_TOO_BIG',
  NUMBER_NOT_INTEGER: 'NUMBER_NOT_INTEGER',
  NUMBER_NOT_POSITIVE: 'NUMBER_NOT_POSITIVE',
  NUMBER_NOT_NEGATIVE: 'NUMBER_NOT_NEGATIVE',
  NUMBER_NOT_FINITE: 'NUMBER_NOT_FINITE',
  NUMBER_NOT_SAFE: 'NUMBER_NOT_SAFE',
  NUMBER_NOT_MULTIPLE: 'NUMBER_NOT_MULTIPLE',

  // Array constraints
  ARRAY_TOO_SHORT: 'ARRAY_TOO_SHORT',
  ARRAY_TOO_LONG: 'ARRAY_TOO_LONG',
  ARRAY_NOT_EMPTY: 'ARRAY_NOT_EMPTY',
  ARRAY_NOT_UNIQUE: 'ARRAY_NOT_UNIQUE',

  // Object constraints
  OBJECT_UNKNOWN_KEY: 'OBJECT_UNKNOWN_KEY',
  OBJECT_MISSING_KEY: 'OBJECT_MISSING_KEY',

  // Union/Intersection
  UNION_NO_MATCH: 'UNION_NO_MATCH',
  INTERSECTION_CONFLICT: 'INTERSECTION_CONFLICT',

  // Enum/Literal
  INVALID_ENUM_VALUE: 'INVALID_ENUM_VALUE',
  INVALID_LITERAL: 'INVALID_LITERAL',

  // Date constraints
  DATE_TOO_EARLY: 'DATE_TOO_EARLY',
  DATE_TOO_LATE: 'DATE_TOO_LATE',

  // Custom
  CUSTOM_VALIDATION: 'CUSTOM_VALIDATION',

  // Refinement
  REFINEMENT_FAILED: 'REFINEMENT_FAILED',

  // Transform
  TRANSFORM_FAILED: 'TRANSFORM_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// ============================================================================
// RESULT CONSTRUCTORS (OPTIMIZED FOR PERFORMANCE)
// ============================================================================

/**
 * Create a successful validation result.
 * @param data - The validated data
 */
export function ok<T>(data: T): ValidationSuccess<T> {
  return { ok: true, data };
}

/**
 * Create a failed validation result with a single error.
 * @param error - The validation error
 */
export function err(error: ValidationError): ValidationFailure {
  return { ok: false, errors: [error] };
}

/**
 * Create a failed validation result with multiple errors.
 * @param errors - Array of validation errors
 */
export function errs(errors: readonly ValidationError[]): ValidationFailure {
  return { ok: false, errors };
}

/**
 * Create a validation error object.
 * Helper function for consistent error creation.
 */
export function createError(
  code: ErrorCode,
  message: string,
  path: string = '',
  meta?: Readonly<Record<string, unknown>>
): ValidationError {
  const error: ValidationError = { code, message, path };
  if (meta !== undefined) {
    return { ...error, meta };
  }
  return error;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard for successful validation result.
 */
export function isOk<T>(result: ValidationResult<T>): result is ValidationSuccess<T> {
  return result.ok;
}

/**
 * Type guard for failed validation result.
 */
export function isErr<T>(result: ValidationResult<T>): result is ValidationFailure {
  return !result.ok;
}
