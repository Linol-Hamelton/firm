/**
 * LAYER 1: Schema Compiler
 *
 * Compiles schemas into optimized validation functions.
 * This is the key to achieving 50M+ ops/sec performance.
 *
 * Optimization techniques:
 * - Pre-compute validation logic
 * - Inline type checks
 * - Avoid function call overhead
 * - Minimize object allocations
 * - Use direct property access
 */

import type { Schema, CompiledValidator, SchemaType } from '../../common/types/schema.js';
import type { ValidationResult, ValidationError } from '../../common/types/result.js';
import { ok, err, errs, createError, ErrorCode } from '../../common/types/result.js';

// ============================================================================
// COMPILER INTERFACE
// ============================================================================

export interface CompilerOptions {
  /** Collect all errors vs fail fast on first error */
  abortEarly?: boolean;

  /** Strip unknown keys from objects */
  stripUnknown?: boolean;

  /** Enable debug mode (slower, more info) */
  debug?: boolean;
}

// ============================================================================
// SCHEMA COMPILER
// ============================================================================

/**
 * Compiles a schema into an optimized validation function.
 *
 * Usage:
 * ```ts
 * const schema = s.object({ name: s.string(), age: s.number() });
 * const validate = compile(schema);
 *
 * // Now use the compiled validator (faster than schema.validate)
 * const result = validate({ name: 'John', age: 30 });
 * ```
 */
export function compile<T>(
  schema: Schema<T>,
  options: CompilerOptions = {}
): CompiledValidator<T> {
  const { abortEarly = true } = options;

  // Get schema type for specialized compilation
  const schemaType = schema._type;

  // Compile based on schema type
  const validator = compileByType(schema, schemaType, abortEarly);

  // Add is() method
  validator.is = (data: unknown): data is T => validator(data).ok;

  return validator;
}

/**
 * Compile schema based on its type.
 */
function compileByType<T>(
  schema: Schema<T>,
  type: SchemaType,
  abortEarly: boolean
): (data: unknown) => ValidationResult<T> {
  switch (type) {
    case 'string':
      return compileString(schema) as (data: unknown) => ValidationResult<T>;

    case 'number':
      return compileNumber(schema) as (data: unknown) => ValidationResult<T>;

    case 'boolean':
      return compileBoolean(schema) as (data: unknown) => ValidationResult<T>;

    case 'object':
      return compileObject(schema, abortEarly) as (data: unknown) => ValidationResult<T>;

    case 'array':
      return compileArray(schema, abortEarly) as (data: unknown) => ValidationResult<T>;

    default:
      // Fallback to schema's validate method
      return (data: unknown) => schema.validate(data);
  }
}

// ============================================================================
// PRIMITIVE COMPILERS (INLINED FOR PERFORMANCE)
// ============================================================================

/**
 * Compile string validator.
 * Generates an optimized inline function.
 */
function compileString(schema: Schema<string>): (data: unknown) => ValidationResult<string> {
  const config = 'config' in schema ? (schema as any).config : {};
  const {
    minLength,
    maxLength,
    pattern,
    trim,
    toLowerCase,
    toUpperCase,
    errorMessage,
  } = config;

  // Pre-compute what checks are needed
  const needsTrim = trim === true;
  const needsLowerCase = toLowerCase === true;
  const needsUpperCase = toUpperCase === true;
  const hasMinLength = minLength !== undefined;
  const hasMaxLength = maxLength !== undefined;
  const hasPattern = pattern instanceof RegExp;

  // Return optimized function
  return function validateString(data: unknown): ValidationResult<string> {
    // Type check (inlined)
    if (typeof data !== 'string') {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NOT_STRING,
            message: errorMessage ?? 'Expected string',
          },
        ],
      };
    }

    let value = data;

    // Apply transforms (inlined)
    if (needsTrim) value = value.trim();
    if (needsLowerCase) value = value.toLowerCase();
    if (needsUpperCase) value = value.toUpperCase();

    // Length checks (inlined)
    if (hasMinLength && value.length < minLength) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.STRING_TOO_SHORT,
            message: errorMessage ?? `String must be at least ${minLength} characters`,
          },
        ],
      };
    }

    if (hasMaxLength && value.length > maxLength) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.STRING_TOO_LONG,
            message: errorMessage ?? `String must be at most ${maxLength} characters`,
          },
        ],
      };
    }

    // Pattern check (inlined)
    if (hasPattern && !pattern.test(value)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.STRING_PATTERN_MISMATCH,
            message: errorMessage ?? 'String does not match pattern',
          },
        ],
      };
    }

    return { ok: true, data: value };
  };
}

/**
 * Compile number validator.
 */
function compileNumber(schema: Schema<number>): (data: unknown) => ValidationResult<number> {
  const config = 'config' in schema ? (schema as any).config : {};
  const {
    min,
    max,
    integer,
    positive,
    negative,
    finite,
    safe,
    multipleOf,
    errorMessage,
  } = config;

  const hasMin = min !== undefined;
  const hasMax = max !== undefined;
  const needsInteger = integer === true;
  const needsPositive = positive === true;
  const needsNegative = negative === true;
  const needsFinite = finite === true;
  const needsSafe = safe === true;
  const hasMultipleOf = multipleOf !== undefined;

  return function validateNumber(data: unknown): ValidationResult<number> {
    if (typeof data !== 'number' || Number.isNaN(data)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NOT_NUMBER,
            message: errorMessage ?? 'Expected number',
          },
        ],
      };
    }

    if (needsFinite && !Number.isFinite(data)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_NOT_FINITE,
            message: errorMessage ?? 'Number must be finite',
          },
        ],
      };
    }

    if (needsInteger && !Number.isInteger(data)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_NOT_INTEGER,
            message: errorMessage ?? 'Number must be an integer',
          },
        ],
      };
    }

    if (needsSafe && !Number.isSafeInteger(data)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_NOT_SAFE,
            message: errorMessage ?? 'Number must be a safe integer',
          },
        ],
      };
    }

    if (hasMin && data < min) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_TOO_SMALL,
            message: errorMessage ?? `Number must be at least ${min}`,
          },
        ],
      };
    }

    if (hasMax && data > max) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_TOO_BIG,
            message: errorMessage ?? `Number must be at most ${max}`,
          },
        ],
      };
    }

    if (needsPositive && data <= 0) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_NOT_POSITIVE,
            message: errorMessage ?? 'Number must be positive',
          },
        ],
      };
    }

    if (needsNegative && data >= 0) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_NOT_NEGATIVE,
            message: errorMessage ?? 'Number must be negative',
          },
        ],
      };
    }

    if (hasMultipleOf && data % multipleOf !== 0) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NUMBER_NOT_MULTIPLE,
            message: errorMessage ?? `Number must be a multiple of ${multipleOf}`,
          },
        ],
      };
    }

    return { ok: true, data };
  };
}

/**
 * Compile boolean validator.
 */
function compileBoolean(schema: Schema<boolean>): (data: unknown) => ValidationResult<boolean> {
  const config = 'config' in schema ? (schema as any).config : {};
  const { errorMessage } = config;

  return function validateBoolean(data: unknown): ValidationResult<boolean> {
    if (typeof data !== 'boolean') {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NOT_BOOLEAN,
            message: errorMessage ?? 'Expected boolean',
          },
        ],
      };
    }
    return { ok: true, data };
  };
}

// ============================================================================
// COMPOSITE COMPILERS
// ============================================================================

/**
 * Compile object validator.
 */
function compileObject<T>(
  schema: Schema<T>,
  abortEarly: boolean
): (data: unknown) => ValidationResult<T> {
  const config = 'config' in schema ? (schema as any).config : {};
  const shape = config.shape || {};
  const unknownKeys = config.unknownKeys || 'strip';
  const errorMessage = config.errorMessage;

  // Pre-compile field validators
  const fieldValidators: Array<{
    key: string;
    validate: (data: unknown) => ValidationResult<unknown>;
  }> = [];

  for (const key of Object.keys(shape)) {
    const fieldSchema = shape[key] as Schema<unknown>;
    fieldValidators.push({
      key,
      validate: compile(fieldSchema, { abortEarly }),
    });
  }

  const knownKeys = new Set(Object.keys(shape));

  return function validateObject(data: unknown): ValidationResult<T> {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NOT_OBJECT,
            message: errorMessage ?? 'Expected object',
          },
        ],
      };
    }

    const input = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    const errors: ValidationError[] = [];

    // Validate known fields
    for (const { key, validate } of fieldValidators) {
      const fieldResult = validate(input[key]);

      if (!fieldResult.ok) {
        for (const error of fieldResult.errors) {
          errors.push({
            ...error,
            path: error.path ? `${key}.${error.path}` : key,
          });
        }
        if (abortEarly && errors.length > 0) {
          return { ok: false, errors };
        }
      } else if (fieldResult.data !== undefined) {
        result[key] = fieldResult.data;
      }
    }

    // Handle unknown keys
    if (unknownKeys !== 'strip') {
      for (const key of Object.keys(input)) {
        if (!knownKeys.has(key)) {
          if (unknownKeys === 'strict') {
            errors.push({
              path: key,
              code: ErrorCode.OBJECT_UNKNOWN_KEY,
              message: `Unrecognized key: ${key}`,
            });
            if (abortEarly) {
              return { ok: false, errors };
            }
          } else if (unknownKeys === 'passthrough') {
            result[key] = input[key];
          }
        }
      }
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return { ok: true, data: result as T };
  };
}

/**
 * Compile array validator.
 */
function compileArray<T>(
  schema: Schema<T[]>,
  abortEarly: boolean
): (data: unknown) => ValidationResult<T[]> {
  const config = 'config' in schema ? (schema as any).config : {};
  const element = config.element as Schema<T>;
  const minLength = config.minLength;
  const maxLength = config.maxLength;
  const errorMessage = config.errorMessage;

  // Pre-compile element validator
  const validateElement = element ? compile(element, { abortEarly }) : null;

  const hasMinLength = minLength !== undefined;
  const hasMaxLength = maxLength !== undefined;

  return function validateArray(data: unknown): ValidationResult<T[]> {
    if (!Array.isArray(data)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NOT_ARRAY,
            message: errorMessage ?? 'Expected array',
          },
        ],
      };
    }

    if (hasMinLength && data.length < minLength) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.ARRAY_TOO_SHORT,
            message: `Array must have at least ${minLength} items`,
          },
        ],
      };
    }

    if (hasMaxLength && data.length > maxLength) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.ARRAY_TOO_LONG,
            message: `Array must have at most ${maxLength} items`,
          },
        ],
      };
    }

    if (!validateElement) {
      return { ok: true, data };
    }

    const result: T[] = [];
    const errors: ValidationError[] = [];

    for (let i = 0; i < data.length; i++) {
      const itemResult = validateElement(data[i]);

      if (!itemResult.ok) {
        for (const error of itemResult.errors) {
          errors.push({
            ...error,
            path: error.path ? `[${i}].${error.path}` : `[${i}]`,
          });
        }
        if (abortEarly) {
          return { ok: false, errors };
        }
      } else {
        result.push(itemResult.data as T);
      }
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return { ok: true, data: result };
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { compile as compileSchema };
