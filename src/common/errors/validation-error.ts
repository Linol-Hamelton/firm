/**
 * LAYER 0: Error Classes
 *
 * Custom error classes for FIRM validation errors.
 * Designed for both programmatic handling and debugging.
 */

import type { ValidationError as ValidationErrorData, ErrorCode } from '../types/result.js';

// ============================================================================
// FIRM ERROR BASE CLASS
// ============================================================================

/**
 * Base error class for all FIRM errors.
 * Extends Error with additional context.
 */
export abstract class FirmError extends Error {
  abstract override readonly name: string;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    // Maintains proper stack trace for where error was thrown
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// ============================================================================
// VALIDATION EXCEPTION
// ============================================================================

/**
 * Exception thrown when validation fails and throws are enabled.
 * Contains all validation errors for inspection.
 */
export class ValidationException extends FirmError {
  override readonly name = 'ValidationException' as const;
  override readonly code = 'VALIDATION_FAILED' as const;

  constructor(
    public readonly errors: readonly ValidationErrorData[],
    message?: string
  ) {
    super(message ?? formatValidationErrors(errors));
  }

  /**
   * Get the first error (convenience method).
   */
  get firstError(): ValidationErrorData | undefined {
    return this.errors[0];
  }

  /**
   * Get errors at a specific path.
   */
  errorsAt(path: string): readonly ValidationErrorData[] {
    return this.errors.filter((e) => e.path === path || e.path.startsWith(`${path}.`));
  }

  /**
   * Check if path has errors.
   */
  hasErrorAt(path: string): boolean {
    return this.errors.some((e) => e.path === path || e.path.startsWith(`${path}.`));
  }

  /**
   * Get error codes.
   */
  get codes(): readonly ErrorCode[] {
    return this.errors.map((e) => e.code);
  }

  /**
   * Convert to JSON for serialization.
   */
  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      errors: this.errors,
    };
  }
}

// ============================================================================
// SCHEMA DEFINITION ERROR
// ============================================================================

/**
 * Exception thrown when schema definition is invalid.
 * This is a developer error, not a runtime validation error.
 */
export class SchemaDefinitionError extends FirmError {
  override readonly name = 'SchemaDefinitionError' as const;
  override readonly code = 'INVALID_SCHEMA' as const;

  constructor(
    message: string,
    public readonly schemaPath?: string
  ) {
    super(schemaPath ? `${message} at ${schemaPath}` : message);
  }
}

// ============================================================================
// COMPILATION ERROR
// ============================================================================

/**
 * Exception thrown when schema compilation fails.
 */
export class CompilationError extends FirmError {
  override readonly name = 'CompilationError' as const;
  override readonly code = 'COMPILATION_FAILED' as const;

  constructor(
    message: string,
    public readonly schemaType?: string
  ) {
    super(message);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Format validation errors into a human-readable string.
 */
function formatValidationErrors(errors: readonly ValidationErrorData[]): string {
  if (errors.length === 0) {
    return 'Validation failed';
  }

  if (errors.length === 1) {
    const e = errors[0]!;
    return e.path ? `${e.path}: ${e.message}` : e.message;
  }

  const messages = errors.map((e) => (e.path ? `  - ${e.path}: ${e.message}` : `  - ${e.message}`));

  return `Validation failed with ${errors.length} errors:\n${messages.join('\n')}`;
}

/**
 * Type guard for ValidationException.
 */
export function isValidationException(error: unknown): error is ValidationException {
  return error instanceof ValidationException;
}

/**
 * Type guard for FirmError.
 */
export function isFirmError(error: unknown): error is FirmError {
  return error instanceof FirmError;
}
