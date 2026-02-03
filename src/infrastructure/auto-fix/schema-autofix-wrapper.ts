/**
 * Schema auto-fix wrapper utilities.
 *
 * Provides auto-fix functionality for any schema.
 */

import type { Schema, SchemaType, CompiledValidator } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';
import { AutoFixer, globalAutoFixer, type AutoFixConfig } from './auto-fixer.js';
import { ValidationException } from '../../common/errors/validation-error.js';

// ============================================================================
// SCHEMA WRAPPER WITH AUTO-FIX
// ============================================================================

/**
 * Auto-fix enabled schema wrapper.
 */
class AutoFixSchema<T> implements Schema<T> {
  readonly _type: SchemaType;
  readonly _output!: T;
  readonly _input!: unknown;

  private fixer: AutoFixer;

  constructor(
    private schema: Schema<T>,
    fixer?: AutoFixer
  ) {
    this._type = schema._type;
    this.fixer = fixer || globalAutoFixer;
  }

  validate(data: unknown): ValidationResult<T> {
    // First validation attempt
    let result = this.schema.validate(data);

    // If validation failed and auto-fix is enabled, try to fix
    if (!result.ok && this.fixer.isEnabled()) {
      let currentData = this.deepClone(data);
      let fixed = false;

      // Try to fix each error
      for (const error of result.errors) {
        // Get the value at the error path
        const pathParts = error.path ? error.path.split('.').filter(p => p) : [];
        const valueAtPath = this.getValueAtPath(currentData, pathParts);

        const context: any = {
          errorCode: error.code,
          path: error.path,
          originalValue: valueAtPath,
        };
        if (error.expected !== undefined) {
          context.expected = error.expected;
        }

        const fixResult = this.fixer.fix(valueAtPath, context);

        if (fixResult.fixed) {
          // Set the fixed value back at the path
          if (pathParts.length === 0) {
            currentData = fixResult.value;
          } else {
            this.setValueAtPath(currentData, pathParts, fixResult.value);
          }
          fixed = true;
        }
      }

      // If we applied fixes, re-validate
      if (fixed) {
        result = this.schema.validate(currentData);
      }
    }

    return result;
  }

  private deepClone(obj: unknown): unknown {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item));
    }
    const cloned: Record<string, unknown> = {};
    for (const key in obj as Record<string, unknown>) {
      cloned[key] = this.deepClone((obj as Record<string, unknown>)[key]);
    }
    return cloned;
  }

  private getValueAtPath(obj: unknown, path: string[]): unknown {
    if (path.length === 0) {
      return obj;
    }
    let current = obj;
    for (const key of path) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[key];
    }
    return current;
  }

  private setValueAtPath(obj: unknown, path: string[], value: unknown): void {
    if (path.length === 0 || obj === null || typeof obj !== 'object') {
      return;
    }
    let current = obj as Record<string, unknown>;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (current[key] === null || current[key] === undefined || typeof current[key] !== 'object') {
        return;
      }
      current = current[key] as Record<string, unknown>;
    }
    current[path[path.length - 1]] = value;
  }

  compile(): CompiledValidator<T> {
    // Delegate to wrapped schema
    return this.schema.compile();
  }

  is(value: unknown): value is T {
    // For type guards, we don't auto-fix
    return this.schema.is(value);
  }

  assert(data: unknown): asserts data is T {
    const result = this.validate(data);
    if (!result.ok) {
      throw new ValidationException(result.errors);
    }
  }

  parse(data: unknown): T {
    const result = this.validate(data);
    if (!result.ok) {
      throw new ValidationException(result.errors);
    }
    return result.data;
  }

  safeParse(data: unknown): ValidationResult<T> {
    return this.validate(data);
  }

  optional(): Schema<T | undefined> {
    return new AutoFixSchema(this.schema.optional(), this.fixer);
  }

  nullable(): Schema<T | null> {
    return new AutoFixSchema(this.schema.nullable(), this.fixer);
  }

  nullish(): Schema<T | null | undefined> {
    return new AutoFixSchema(this.schema.nullish(), this.fixer);
  }

  default(value: T): Schema<T> {
    return new AutoFixSchema(this.schema.default(value), this.fixer);
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Wrap schema with auto-fix using global auto-fixer.
 *
 * @param schema - Schema to wrap
 *
 * @example
 * ```typescript
 * import { enableAutoFix } from 'firm-validator/infrastructure/auto-fix';
 *
 * enableAutoFix();
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int(),
 * });
 *
 * const autoFixSchema = withAutoFix(userSchema);
 *
 * // Auto-fixes common issues
 * const result = autoFixSchema.validate({
 *   name: '  John  ', // Trimmed to 'John'
 *   email: 'JOHN@EXAMPLE.COM', // Lowercased to 'john@example.com'
 *   age: '30', // Parsed to 30
 * });
 *
 * // result.ok === true
 * // result.data === { name: 'John', email: 'john@example.com', age: 30 }
 * ```
 */
export function withAutoFix<T>(schema: Schema<T>): Schema<T> {
  return new AutoFixSchema(schema);
}

/**
 * Wrap schema with auto-fix using custom configuration.
 *
 * @param schema - Schema to wrap
 * @param config - Auto-fix configuration
 *
 * @example
 * ```typescript
 * const autoFixSchema = withAutoFixConfig(userSchema, {
 *   enabled: true,
 *   strategies: ['trim', 'lowercase', 'coerce'],
 * });
 * ```
 */
export function withAutoFixConfig<T>(
  schema: Schema<T>,
  config: AutoFixConfig
): Schema<T> {
  const fixer = new AutoFixer(config);
  return new AutoFixSchema(schema, fixer);
}
