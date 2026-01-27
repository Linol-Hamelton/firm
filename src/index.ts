/**
 * FIRM - The Fastest Schema Validator for TypeScript
 *
 * Main entry point.
 * Exports the schema builder (s) and all types.
 *
 * @example
 * ```ts
 * import { s } from 'firm-validator';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(0),
 * });
 *
 * // Validate
 * const result = userSchema.validate(data);
 * if (result.ok) {
 *   console.log(result.data); // typed!
 * } else {
 *   console.log(result.errors);
 * }
 *
 * // Or parse (throws on error)
 * const user = userSchema.parse(data);
 *
 * // Type inference
 * type User = Infer<typeof userSchema>;
 * ```
 *
 * @packageDocumentation
 */

// Main API
export { s, default } from './app/firm.js';

// Types
export type {
  Schema,
  Infer,
  InferInput,
  CompiledValidator,
  SchemaType,
  SchemaConfig,
} from './common/types/schema.js';

export type {
  ValidationResult,
  ValidationSuccess,
  ValidationFailure,
  ValidationError,
  ErrorCode,
} from './common/types/result.js';

// Result helpers
export { ok, err, errs, createError, isOk, isErr } from './common/types/result.js';

// Errors
export {
  FirmError,
  ValidationException,
  SchemaDefinitionError,
  CompilationError,
  isValidationException,
  isFirmError,
} from './common/errors/validation-error.js';

// Validator classes (for advanced usage)
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
} from './app/firm.js';

// Compiler
export { compile, compileSchema } from './core/compiler/index.js';
