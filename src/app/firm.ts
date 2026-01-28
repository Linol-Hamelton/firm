/**
 * LAYER 4: FIRM Application Instance
 *
 * Main entry point that composes all layers together.
 * This is the public API that users interact with.
 *
 * Usage:
 * ```ts
 * import { s } from 'firm-validator';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(0),
 * });
 *
 * const result = userSchema.validate(data);
 * ```
 */

// Core validators
import {
  StringValidator,
  string,
  NumberValidator,
  number,
  BooleanValidator,
  boolean,
  LiteralValidator,
  literal,
  EnumValidator,
  enumeration,
  NativeEnumValidator,
  nativeEnum,
  DateValidator,
  date,
  nullType,
  undefinedType,
  any,
  unknown,
  never,
  voidType,
} from '../core/validators/primitives/index.js';

import {
  ObjectValidator,
  object,
  ArrayValidator,
  array,
  TupleValidator,
  tuple,
  UnionValidator,
  union,
  DiscriminatedUnionValidator,
  discriminatedUnion,
  IntersectionValidator,
  intersection,
  RecordValidator,
  record,
  MapValidator,
  map,
  SetValidator,
  set,
} from '../core/validators/composites/index.js';

import { compile } from '../core/compiler/index.js';

// Types
import type { Schema, Infer, InferInput, CompiledValidator } from '../common/types/schema.js';
import type { ValidationResult, ValidationError, ErrorCode } from '../common/types/result.js';

// ============================================================================
// FIRM SCHEMA BUILDER (s)
// ============================================================================

/**
 * FIRM Schema Builder.
 *
 * The main API for creating schemas.
 * All methods return Schema instances that can be chained.
 *
 * @example
 * ```ts
 * import { s } from 'firm-validator';
 *
 * const schema = s.object({
 *   name: s.string().min(1).max(100),
 *   age: s.number().int().positive(),
 *   email: s.string().email(),
 *   tags: s.array(s.string()).nonempty(),
 * });
 * ```
 */
export const s = {
  // ===========================================================================
  // PRIMITIVES
  // ===========================================================================

  /**
   * String validator.
   *
   * @example
   * ```ts
   * s.string() // any string
   * s.string().min(1) // at least 1 char
   * s.string().email() // valid email
   * s.string().url() // valid URL
   * s.string().uuid() // valid UUID
   * s.string().regex(/^[a-z]+$/) // custom pattern
   * s.string().trim().toLowerCase() // with transforms
   * ```
   */
  string,

  /**
   * Number validator.
   *
   * @example
   * ```ts
   * s.number() // any number
   * s.number().int() // integer only
   * s.number().positive() // > 0
   * s.number().min(0).max(100) // range
   * s.number().multipleOf(5) // divisible by 5
   * ```
   */
  number,

  /**
   * Boolean validator.
   *
   * @example
   * ```ts
   * s.boolean() // true or false
   * ```
   */
  boolean,

  /**
   * Date validator.
   *
   * @example
   * ```ts
   * s.date() // Date instance
   * s.date().min(new Date('2020-01-01'))
   * s.date().max(new Date())
   * ```
   */
  date,

  // ===========================================================================
  // LITERALS & ENUMS
  // ===========================================================================

  /**
   * Literal value validator.
   *
   * @example
   * ```ts
   * s.literal('active') // only 'active'
   * s.literal(42) // only 42
   * s.literal(true) // only true
   * ```
   */
  literal,

  /**
   * Enum validator (string values).
   *
   * @example
   * ```ts
   * s.enum(['pending', 'active', 'completed'])
   * ```
   */
  enum: enumeration,

  /**
   * Native TypeScript enum validator.
   *
   * @example
   * ```ts
   * enum Status { Pending, Active, Completed }
   * s.nativeEnum(Status)
   * ```
   */
  nativeEnum,

  // ===========================================================================
  // COMPOSITES
  // ===========================================================================

  /**
   * Object validator.
   *
   * @example
   * ```ts
   * s.object({
   *   name: s.string(),
   *   age: s.number(),
   * })
   *
   * // With modifiers
   * s.object({ ... }).partial() // all optional
   * s.object({ ... }).strict() // no extra keys
   * s.object({ ... }).passthrough() // allow extra keys
   * ```
   */
  object,

  /**
   * Array validator.
   *
   * @example
   * ```ts
   * s.array(s.string()) // string[]
   * s.array(s.number()).min(1).max(10)
   * s.array(s.object({ ... })).nonempty()
   * ```
   */
  array,

  /**
   * Tuple validator.
   *
   * @example
   * ```ts
   * s.tuple([s.string(), s.number()]) // [string, number]
   * s.tuple([s.string(), s.number()]).rest(s.boolean())
   * ```
   */
  tuple,

  /**
   * Record validator (dictionary).
   *
   * @example
   * ```ts
   * s.record(s.string()) // Record<string, string>
   * s.record(s.string(), s.number()) // Record<string, number>
   * ```
   */
  record,

  /**
   * Map validator.
   *
   * @example
   * ```ts
   * s.map(s.string(), s.number()) // Map<string, number>
   * ```
   */
  map,

  /**
   * Set validator.
   *
   * @example
   * ```ts
   * s.set(s.string()) // Set<string>
   * s.set(s.number()).min(1).max(10)
   * ```
   */
  set,

  // ===========================================================================
  // UNIONS & INTERSECTIONS
  // ===========================================================================

  /**
   * Union validator (A | B | C).
   *
   * @example
   * ```ts
   * s.union([s.string(), s.number()]) // string | number
   * s.union([s.literal('a'), s.literal('b')]) // 'a' | 'b'
   * ```
   */
  union,

  /**
   * Discriminated union validator.
   *
   * @example
   * ```ts
   * s.discriminatedUnion('type', [
   *   s.object({ type: s.literal('a'), value: s.string() }),
   *   s.object({ type: s.literal('b'), value: s.number() }),
   * ])
   * ```
   */
  discriminatedUnion,

  /**
   * Intersection validator (A & B).
   *
   * @example
   * ```ts
   * s.intersection([
   *   s.object({ a: s.string() }),
   *   s.object({ b: s.number() }),
   * ])
   * ```
   */
  intersection,

  // ===========================================================================
  // SPECIAL TYPES
  // ===========================================================================

  /**
   * Null validator.
   */
  null: nullType,

  /**
   * Undefined validator.
   */
  undefined: undefinedType,

  /**
   * Any validator (no validation).
   */
  any,

  /**
   * Unknown validator (accepts anything).
   */
  unknown,

  /**
   * Never validator (always fails).
   */
  never,

  /**
   * Void validator (same as undefined).
   */
  void: voidType,

  // ===========================================================================
  // COERCE (Type Coercion)
  // ===========================================================================

  /**
   * Coercing validators that automatically convert types.
   *
   * @example
   * ```ts
   * s.coerce.string() // any value → string
   * s.coerce.number() // "42" → 42
   * s.coerce.boolean() // "true" → true, 1 → true
   * s.coerce.date() // "2024-01-01" → Date
   * ```
   */
  coerce: {
    /**
     * Coerce any value to string using String(value).
     */
    string(): StringValidator {
      return string().preprocess((val) => {
        if (val === null || val === undefined) return val;
        return String(val);
      }) as unknown as StringValidator;
    },

    /**
     * Coerce string to number using Number(value).
     */
    number(): NumberValidator {
      return number().preprocess((val) => {
        if (val === null || val === undefined) return val;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const parsed = Number(val);
          return isNaN(parsed) ? val : parsed;
        }
        if (typeof val === 'boolean') return val ? 1 : 0;
        return val;
      }) as unknown as NumberValidator;
    },

    /**
     * Coerce value to boolean.
     * - Strings: "true", "1", "yes", "on" → true; "false", "0", "no", "off" → false
     * - Numbers: 0 → false, other → true
     */
    boolean(): BooleanValidator {
      return boolean().preprocess((val) => {
        if (val === null || val === undefined) return val;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') {
          const lower = val.toLowerCase();
          if (['true', '1', 'yes', 'on'].includes(lower)) return true;
          if (['false', '0', 'no', 'off'].includes(lower)) return false;
          return val;
        }
        if (typeof val === 'number') return val !== 0;
        return val;
      }) as unknown as BooleanValidator;
    },

    /**
     * Coerce string or number to Date.
     */
    date(): DateValidator {
      return date().preprocess((val) => {
        if (val === null || val === undefined) return val;
        if (val instanceof Date) return val;
        if (typeof val === 'string' || typeof val === 'number') {
          const parsed = new Date(val);
          return isNaN(parsed.getTime()) ? val : parsed;
        }
        return val;
      }) as unknown as DateValidator;
    },
  },

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Compile schema for better performance.
   *
   * @example
   * ```ts
   * const schema = s.object({ ... });
   * const validate = s.compile(schema);
   *
   * // Use compiled validator (faster)
   * const result = validate(data);
   * ```
   */
  compile,

  /**
   * Create optional schema.
   *
   * @example
   * ```ts
   * s.optional(s.string()) // string | undefined
   * ```
   */
  optional<T>(schema: Schema<T>): Schema<T | undefined> {
    return schema.optional();
  },

  /**
   * Create nullable schema.
   *
   * @example
   * ```ts
   * s.nullable(s.string()) // string | null
   * ```
   */
  nullable<T>(schema: Schema<T>): Schema<T | null> {
    return schema.nullable();
  },

  /**
   * Create schema with default value.
   *
   * @example
   * ```ts
   * s.default(s.string(), 'default')
   * ```
   */
  default<T>(schema: Schema<T>, value: T): Schema<T> {
    return schema.default(value);
  },
} as const;

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { Schema, Infer, InferInput, CompiledValidator };
export type { ValidationResult, ValidationError, ErrorCode };

// ============================================================================
// VALIDATOR CLASS EXPORTS (for advanced usage)
// ============================================================================

export {
  StringValidator,
  NumberValidator,
  BooleanValidator,
  LiteralValidator,
  EnumValidator,
  NativeEnumValidator,
  DateValidator,
  ObjectValidator,
  ArrayValidator,
  TupleValidator,
  UnionValidator,
  DiscriminatedUnionValidator,
  IntersectionValidator,
  RecordValidator,
  MapValidator,
  SetValidator,
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default s;
