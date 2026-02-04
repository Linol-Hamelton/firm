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
import { ErrorCode } from '../../common/types/result.js';

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
  const validateFn = compileByType(schema, schemaType, abortEarly);

  // Create compiled validator with is() method
  const validator = validateFn as CompiledValidator<T>;
  (validator as any).is = (data: unknown): data is T => validateFn(data).ok;

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
  // Get base validator
  let baseFn: (data: unknown) => ValidationResult<T>;

  switch (type) {
    case 'string':
      baseFn = compileString(schema as unknown as Schema<string>) as (data: unknown) => ValidationResult<T>;
      break;

    case 'number':
      baseFn = compileNumber(schema as unknown as Schema<number>) as (data: unknown) => ValidationResult<T>;
      break;

    case 'boolean':
      baseFn = compileBoolean(schema as unknown as Schema<boolean>) as (data: unknown) => ValidationResult<T>;
      break;

    case 'object':
      baseFn = compileObject(schema as unknown as Schema<Record<string, unknown>>, abortEarly) as (data: unknown) => ValidationResult<T>;
      break;

    case 'array':
      baseFn = compileArray(schema as unknown as Schema<unknown[]>, abortEarly) as (data: unknown) => ValidationResult<T>;
      break;

    case 'literal':
      baseFn = compileLiteral(schema) as (data: unknown) => ValidationResult<T>;
      break;

    case 'enum':
      baseFn = compileEnum(schema) as (data: unknown) => ValidationResult<T>;
      break;

    case 'union':
      baseFn = compileUnion(schema, abortEarly) as (data: unknown) => ValidationResult<T>;
      break;

    case 'record':
      baseFn = compileRecord(schema, abortEarly) as (data: unknown) => ValidationResult<T>;
      break;

    case 'tuple':
      baseFn = compileTuple(schema, abortEarly) as (data: unknown) => ValidationResult<T>;
      break;

    case 'date':
      baseFn = compileDate(schema as unknown as Schema<Date>) as (data: unknown) => ValidationResult<T>;
      break;

    default:
      // Fallback to schema's validate method
      baseFn = (data: unknown) => schema.validate(data);
  }

  // Wrap with optional/nullable handling
  return wrapWithOptionalNullable(schema, baseFn);
}

/**
 * Wrap a validator function with optional/nullable handling.
 */
function wrapWithOptionalNullable<T>(
  schema: Schema<T>,
  baseFn: (data: unknown) => ValidationResult<T>
): (data: unknown) => ValidationResult<T> {
  const config = 'config' in schema ? (schema as any).config : {};
  const { isOptional, isNullable, defaultValue } = config;

  if (!isOptional && !isNullable && defaultValue === undefined) {
    return baseFn;
  }

  return function validateWithOptionalNullable(data: unknown): ValidationResult<T> {
    // Handle optional
    if (data === undefined && isOptional) {
      return { ok: true, data: undefined as T };
    }

    // Handle nullable
    if (data === null && isNullable) {
      return { ok: true, data: null as T };
    }

    // Handle default
    if (data === undefined && defaultValue !== undefined) {
      return { ok: true, data: defaultValue as T };
    }

    return baseFn(data);
  };
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
  const fieldCount = fieldValidators.length;
  const hasUnknownKeyHandling = unknownKeys !== 'strip';

  return function validateObject(data: unknown): ValidationResult<T> {
    // Fast type check
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

    // OPTIMIZATION 1: Lazy allocation - only create objects when needed
    let result: Record<string, unknown> | null = null;
    let errors: ValidationError[] | null = null;
    let hasTransformations = false;

    // OPTIMIZATION 2: Fast path for valid data - validate first, build result only if needed
    for (let i = 0; i < fieldCount; i++) {
      const validator = fieldValidators[i]!;
      const key = validator.key;
      const validate = validator.validate;
      const fieldResult = validate(input[key]);

      if (!fieldResult.ok) {
        // Lazy allocate errors array on first error
        if (errors === null) {
          errors = [];
        }

        // OPTIMIZATION 3: Minimize string concatenation
        const errLen = fieldResult.errors.length;
        for (let j = 0; j < errLen; j++) {
          const error = fieldResult.errors[j]!;
          errors.push({
            path: error.path ? key + '.' + error.path : key,
            code: error.code,
            message: error.message,
          });
        }

        if (abortEarly) {
          return { ok: false, errors };
        }
      } else {
        // Check if field was transformed or needs to be included
        const fieldValue = fieldResult.data;
        if (fieldValue !== input[key] || fieldValue !== undefined) {
          hasTransformations = true;
          // Lazy allocate result object only when we have data to store
          if (result === null) {
            result = {};
          }
          if (fieldValue !== undefined) {
            result[key] = fieldValue;
          }
        }
      }
    }

    // Handle unknown keys (only if configured)
    if (hasUnknownKeyHandling) {
      const inputKeys = Object.keys(input);
      const inputKeyCount = inputKeys.length;
      for (let i = 0; i < inputKeyCount; i++) {
        const key = inputKeys[i]!;
        if (!knownKeys.has(key)) {
          if (unknownKeys === 'strict') {
            // Lazy allocate errors array
            if (errors === null) {
              errors = [];
            }
            errors.push({
              path: key,
              code: ErrorCode.OBJECT_UNKNOWN_KEY,
              message: `Unrecognized key: ${key}`,
            });
            if (abortEarly) {
              return { ok: false, errors };
            }
          } else if (unknownKeys === 'passthrough') {
            // Lazy allocate result object
            if (result === null) {
              result = {};
            }
            result[key] = input[key];
            hasTransformations = true;
          }
        }
      }
    }

    // Return errors if any
    if (errors !== null && errors.length > 0) {
      return { ok: false, errors };
    }

    // OPTIMIZATION 4: If no transformations, return input as-is (avoid object copy)
    if (!hasTransformations && result === null) {
      return { ok: true, data: input as T };
    }

    // If we built a result object, return it
    if (result !== null) {
      return { ok: true, data: result as T };
    }

    // Fallback: return input (shouldn't reach here but safe)
    return { ok: true, data: input as T };
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

    // OPTIMIZATION 1: Lazy allocation - only create arrays when needed
    let result: T[] | null = null;
    let errors: ValidationError[] | null = null;
    let hasTransformations = false;

    const len = data.length;

    // OPTIMIZATION 2: Fast path - validate first, build result only if needed
    for (let i = 0; i < len; i++) {
      const item = data[i];
      const itemResult = validateElement(item);

      if (!itemResult.ok) {
        // Lazy allocate errors array on first error
        if (errors === null) {
          errors = [];
        }

        // OPTIMIZATION 3: Minimize allocations in error path
        const itemErrors = itemResult.errors;
        const errLen = itemErrors.length;
        for (let j = 0; j < errLen; j++) {
          const error = itemErrors[j]!;
          errors.push({
            path: error.path ? '[' + i + '].' + error.path : '[' + i + ']',
            code: error.code,
            message: error.message,
          });
        }

        if (abortEarly) {
          return { ok: false, errors };
        }
      } else {
        const itemData = itemResult.data as T;
        // Check if item was transformed
        if (itemData !== item) {
          hasTransformations = true;
        }
        // Lazy allocate result array only when we have data
        if (result === null) {
          result = [];
        }
        result.push(itemData);
      }
    }

    if (errors !== null && errors.length > 0) {
      return { ok: false, errors };
    }

    // OPTIMIZATION 4: If no transformations, return input as-is (avoid array copy)
    if (!hasTransformations && result === null) {
      return { ok: true, data };
    }

    return { ok: true, data: result !== null ? result : data };
  };
}

// ============================================================================
// ADDITIONAL TYPE COMPILERS
// ============================================================================

/**
 * Compile literal validator.
 */
function compileLiteral<T>(schema: Schema<T>): (data: unknown) => ValidationResult<T> {
  const config = 'config' in schema ? (schema as any).config : {};
  const literalValue = config.value;
  const errorMessage = config.errorMessage;

  return function validateLiteral(data: unknown): ValidationResult<T> {
    if (data !== literalValue) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.INVALID_LITERAL,
            message: errorMessage ?? `Expected literal value: ${JSON.stringify(literalValue)}`,
          },
        ],
      };
    }
    return { ok: true, data: data as T };
  };
}

/**
 * Compile enum validator.
 */
function compileEnum<T>(schema: Schema<T>): (data: unknown) => ValidationResult<T> {
  const config = 'config' in schema ? (schema as any).config : {};
  const values = config.values as T[] || [];
  const errorMessage = config.errorMessage;
  const valuesSet = new Set(values);

  return function validateEnum(data: unknown): ValidationResult<T> {
    if (!valuesSet.has(data as T)) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.INVALID_ENUM_VALUE,
            message: errorMessage ?? `Expected one of: ${values.map(v => JSON.stringify(v)).join(', ')}`,
          },
        ],
      };
    }
    return { ok: true, data: data as T };
  };
}

/**
 * Compile union validator.
 */
function compileUnion<T>(
  schema: Schema<T>,
  abortEarly: boolean
): (data: unknown) => ValidationResult<T> {
  const config = 'config' in schema ? (schema as any).config : {};
  const options = config.options as Schema<unknown>[] || [];
  const errorMessage = config.errorMessage;

  // Pre-compile all option validators
  const compiledOptions = options.map((opt: Schema<unknown>) => compile(opt, { abortEarly }));

  return function validateUnion(data: unknown): ValidationResult<T> {
    const allErrors: ValidationError[] = [];

    for (const validate of compiledOptions) {
      const result = validate(data);
      if (result.ok) {
        return { ok: true, data: result.data as T };
      }
      allErrors.push(...result.errors);
    }

    return {
      ok: false,
      errors: [
        {
          path: '',
          code: ErrorCode.UNION_NO_MATCH,
          message: errorMessage ?? 'Value does not match any union member',
        },
      ],
    };
  };
}

/**
 * Compile record validator.
 */
function compileRecord<T>(
  schema: Schema<T>,
  abortEarly: boolean
): (data: unknown) => ValidationResult<T> {
  const config = 'config' in schema ? (schema as any).config : {};
  const keySchema = config.keySchema as Schema<string>;
  const valueSchema = config.valueSchema as Schema<unknown>;
  const errorMessage = config.errorMessage;

  // Pre-compile validators
  const validateKey = keySchema ? compile(keySchema, { abortEarly }) : null;
  const validateValue = valueSchema ? compile(valueSchema, { abortEarly }) : null;

  return function validateRecord(data: unknown): ValidationResult<T> {
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

    for (const [key, value] of Object.entries(input)) {
      // Validate key if key schema exists
      if (validateKey) {
        const keyResult = validateKey(key);
        if (!keyResult.ok) {
          for (const error of keyResult.errors) {
            errors.push({
              ...error,
              path: `[key: ${key}]`,
            });
          }
          if (abortEarly) {
            return { ok: false, errors };
          }
          continue;
        }
      }

      // Validate value if value schema exists
      if (validateValue) {
        const valueResult = validateValue(value);
        if (!valueResult.ok) {
          for (const error of valueResult.errors) {
            errors.push({
              ...error,
              path: error.path ? `${key}.${error.path}` : key,
            });
          }
          if (abortEarly) {
            return { ok: false, errors };
          }
        } else {
          result[key] = valueResult.data;
        }
      } else {
        result[key] = value;
      }
    }

    if (errors.length > 0) {
      return { ok: false, errors };
    }

    return { ok: true, data: result as T };
  };
}

/**
 * Compile tuple validator.
 */
function compileTuple<T>(
  schema: Schema<T>,
  abortEarly: boolean
): (data: unknown) => ValidationResult<T> {
  const config = 'config' in schema ? (schema as any).config : {};
  const items = config.items as Schema<unknown>[] || [];
  const rest = config.rest as Schema<unknown> | undefined;
  const errorMessage = config.errorMessage;

  // Pre-compile item validators
  const compiledItems = items.map((item: Schema<unknown>) => compile(item, { abortEarly }));
  const compiledRest = rest ? compile(rest, { abortEarly }) : null;

  return function validateTuple(data: unknown): ValidationResult<T> {
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

    const minLength = items.length;
    if (data.length < minLength) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.ARRAY_TOO_SHORT,
            message: `Tuple must have at least ${minLength} items`,
          },
        ],
      };
    }

    if (!compiledRest && data.length > minLength) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.ARRAY_TOO_LONG,
            message: `Tuple must have exactly ${minLength} items`,
          },
        ],
      };
    }

    const result: unknown[] = [];
    const errors: ValidationError[] = [];

    // Validate defined items
    for (let i = 0; i < compiledItems.length; i++) {
      const validator = compiledItems[i]!;
      const itemResult = validator(data[i]);
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
        result.push(itemResult.data);
      }
    }

    // Validate rest items
    if (compiledRest) {
      for (let i = compiledItems.length; i < data.length; i++) {
        const itemResult = compiledRest(data[i]);
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
          result.push(itemResult.data);
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
 * Compile date validator.
 */
function compileDate(schema: Schema<Date>): (data: unknown) => ValidationResult<Date> {
  const config = 'config' in schema ? (schema as any).config : {};
  const { min, max, errorMessage } = config;

  const hasMin = min !== undefined;
  const hasMax = max !== undefined;

  return function validateDate(data: unknown): ValidationResult<Date> {
    if (!(data instanceof Date) || isNaN(data.getTime())) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.NOT_DATE,
            message: errorMessage ?? 'Expected Date',
          },
        ],
      };
    }

    if (hasMin && data.getTime() < min.getTime()) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.DATE_TOO_EARLY,
            message: errorMessage ?? `Date must be after ${min.toISOString()}`,
          },
        ],
      };
    }

    if (hasMax && data.getTime() > max.getTime()) {
      return {
        ok: false,
        errors: [
          {
            path: '',
            code: ErrorCode.DATE_TOO_LATE,
            message: errorMessage ?? `Date must be before ${max.toISOString()}`,
          },
        ],
      };
    }

    return { ok: true, data };
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { compile as compileSchema };
