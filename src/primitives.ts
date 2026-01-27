/**
 * FIRM - Primitive Validators Entry Point
 *
 * Tree-shakeable import for primitive validators only.
 *
 * @example
 * ```ts
 * import { string, number, boolean } from 'firm-validator/primitives';
 * ```
 */

export {
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
} from './core/validators/primitives/index.js';
