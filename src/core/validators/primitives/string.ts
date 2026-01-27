/**
 * LAYER 1: String Validator
 *
 * High-performance string validation.
 * Target: 50M+ ops/sec for simple validation.
 *
 * OPTIMIZATION TECHNIQUES:
 * - Early type check bailout
 * - Pre-compiled regex patterns
 * - Minimal object allocation
 * - Inline validation where possible
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { StringSchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult } from '../../../common/types/result.js';
import { ok, err, createError, ErrorCode } from '../../../common/types/result.js';
import {
  EMAIL_SIMPLE,
  URL_SIMPLE,
  UUID_V4,
  CUID,
  CUID2,
  IPV4,
  DATETIME_ISO,
  DATE_ISO,
  TIME,
} from '../../../common/constants/regex.js';

// ============================================================================
// STRING VALIDATOR
// ============================================================================

export class StringValidator extends BaseSchema<string, StringSchemaConfig> {
  readonly _type = 'string' as const;

  constructor(config: StringSchemaConfig = {}) {
    super(config);
  }

  // ==========================================================================
  // CORE VALIDATION (PERFORMANCE CRITICAL)
  // ==========================================================================

  protected _validate(value: unknown, path: string): ValidationResult<string> {
    // Fast type check
    if (typeof value !== 'string') {
      return err(
        createError(
          ErrorCode.NOT_STRING,
          this.config.errorMessage ?? 'Expected string',
          path,
          { received: typeof value }
        )
      );
    }

    let result: string = value;

    // Apply transforms first (order matters!)
    if (this.config.trim) {
      result = result.trim();
    }
    if (this.config.toLowerCase) {
      result = result.toLowerCase();
    }
    if (this.config.toUpperCase) {
      result = result.toUpperCase();
    }

    // Length validation
    if (this.config.minLength !== undefined && result.length < this.config.minLength) {
      return err(
        createError(
          ErrorCode.STRING_TOO_SHORT,
          this.config.errorMessage ?? `String must be at least ${this.config.minLength} characters`,
          path,
          { min: this.config.minLength, received: result.length }
        )
      );
    }

    if (this.config.maxLength !== undefined && result.length > this.config.maxLength) {
      return err(
        createError(
          ErrorCode.STRING_TOO_LONG,
          this.config.errorMessage ?? `String must be at most ${this.config.maxLength} characters`,
          path,
          { max: this.config.maxLength, received: result.length }
        )
      );
    }

    // Pattern validation
    if (this.config.pattern && !this.config.pattern.test(result)) {
      return err(
        createError(
          ErrorCode.STRING_PATTERN_MISMATCH,
          this.config.errorMessage ?? 'String does not match pattern',
          path,
          { pattern: this.config.pattern.source }
        )
      );
    }

    return ok(result);
  }

  protected _check(value: unknown): boolean {
    if (typeof value !== 'string') return false;

    let result = value;
    if (this.config.trim) result = result.trim();

    if (this.config.minLength !== undefined && result.length < this.config.minLength) {
      return false;
    }
    if (this.config.maxLength !== undefined && result.length > this.config.maxLength) {
      return false;
    }
    if (this.config.pattern && !this.config.pattern.test(result)) {
      return false;
    }

    return true;
  }

  protected _clone(config: Partial<StringSchemaConfig>): this {
    return new StringValidator({ ...this.config, ...config }) as this;
  }

  // ==========================================================================
  // LENGTH CONSTRAINTS
  // ==========================================================================

  /**
   * Minimum string length.
   */
  min(length: number): StringValidator {
    return this._clone({ minLength: length });
  }

  /**
   * Maximum string length.
   */
  max(length: number): StringValidator {
    return this._clone({ maxLength: length });
  }

  /**
   * Exact string length.
   */
  length(length: number): StringValidator {
    return this._clone({ minLength: length, maxLength: length });
  }

  /**
   * Non-empty string (length >= 1).
   */
  nonempty(): StringValidator {
    return this._clone({ minLength: 1 });
  }

  // ==========================================================================
  // PATTERN MATCHING
  // ==========================================================================

  /**
   * Match regex pattern.
   */
  regex(pattern: RegExp): StringValidator {
    return this._clone({ pattern });
  }

  /**
   * Must include substring.
   */
  includes(substring: string): StringValidator {
    return this.refine(
      (v) => v.includes(substring),
      `String must include "${substring}"`
    ) as unknown as StringValidator;
  }

  /**
   * Must start with prefix.
   */
  startsWith(prefix: string): StringValidator {
    return this.refine(
      (v) => v.startsWith(prefix),
      `String must start with "${prefix}"`
    ) as unknown as StringValidator;
  }

  /**
   * Must end with suffix.
   */
  endsWith(suffix: string): StringValidator {
    return this.refine(
      (v) => v.endsWith(suffix),
      `String must end with "${suffix}"`
    ) as unknown as StringValidator;
  }

  // ==========================================================================
  // FORMAT VALIDATORS
  // ==========================================================================

  /**
   * Valid email address.
   */
  email(): StringValidator {
    return new EmailValidator({ ...this.config, pattern: EMAIL_SIMPLE });
  }

  /**
   * Valid URL.
   */
  url(): StringValidator {
    return this._clone({ pattern: URL_SIMPLE });
  }

  /**
   * Valid UUID (v4).
   */
  uuid(): StringValidator {
    return this._clone({ pattern: UUID_V4 });
  }

  /**
   * Valid CUID.
   */
  cuid(): StringValidator {
    return this._clone({ pattern: CUID });
  }

  /**
   * Valid CUID2.
   */
  cuid2(): StringValidator {
    return this._clone({ pattern: CUID2 });
  }

  /**
   * Valid IP address.
   */
  ip(): StringValidator {
    return this._clone({ pattern: IPV4 });
  }

  /**
   * Valid ISO datetime.
   */
  datetime(): StringValidator {
    return this._clone({ pattern: DATETIME_ISO });
  }

  /**
   * Valid ISO date.
   */
  date(): StringValidator {
    return this._clone({ pattern: DATE_ISO });
  }

  /**
   * Valid time.
   */
  time(): StringValidator {
    return this._clone({ pattern: TIME });
  }

  // ==========================================================================
  // TRANSFORMS
  // ==========================================================================

  /**
   * Trim whitespace.
   */
  trim(): StringValidator {
    return this._clone({ trim: true });
  }

  /**
   * Convert to lowercase.
   */
  toLowerCase(): StringValidator {
    return this._clone({ toLowerCase: true });
  }

  /**
   * Convert to uppercase.
   */
  toUpperCase(): StringValidator {
    return this._clone({ toUpperCase: true });
  }
}

// ============================================================================
// EMAIL VALIDATOR (SPECIALIZED)
// ============================================================================

/**
 * Specialized email validator with better error messages.
 */
class EmailValidator extends StringValidator {
  protected _validate(value: unknown, path: string): ValidationResult<string> {
    if (typeof value !== 'string') {
      return err(createError(ErrorCode.NOT_STRING, 'Expected string', path));
    }

    let result = value;
    if (this.config.trim) result = result.trim();
    if (this.config.toLowerCase) result = result.toLowerCase();

    if (!EMAIL_SIMPLE.test(result)) {
      return err(
        createError(
          ErrorCode.STRING_INVALID_EMAIL,
          this.config.errorMessage ?? 'Invalid email address',
          path
        )
      );
    }

    // Check length after email validation
    if (this.config.minLength !== undefined && result.length < this.config.minLength) {
      return err(
        createError(
          ErrorCode.STRING_TOO_SHORT,
          `Email must be at least ${this.config.minLength} characters`,
          path
        )
      );
    }

    if (this.config.maxLength !== undefined && result.length > this.config.maxLength) {
      return err(
        createError(
          ErrorCode.STRING_TOO_LONG,
          `Email must be at most ${this.config.maxLength} characters`,
          path
        )
      );
    }

    return ok(result);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new string validator.
 */
export function string(config?: StringSchemaConfig): StringValidator {
  return new StringValidator(config);
}
