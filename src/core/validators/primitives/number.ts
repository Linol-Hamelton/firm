/**
 * LAYER 1: Number Validator
 *
 * High-performance number validation.
 * Target: 50M+ ops/sec for simple validation.
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { NumberSchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult } from '../../../common/types/result.js';
import { ok, err, createError, ErrorCode } from '../../../common/types/result.js';

// ============================================================================
// NUMBER VALIDATOR
// ============================================================================

export class NumberValidator extends BaseSchema<number, NumberSchemaConfig> {
  readonly _type = 'number' as const;

  constructor(config: NumberSchemaConfig = {}) {
    super(config);
  }

  // ==========================================================================
  // CORE VALIDATION
  // ==========================================================================

  protected _validate(value: unknown, path: string): ValidationResult<number> {
    // Fast type check
    if (typeof value !== 'number') {
      return err(
        createError(
          ErrorCode.NOT_NUMBER,
          this.config.errorMessage ?? 'Expected number',
          path,
          { received: typeof value }
        )
      );
    }

    // NaN check (NaN is typeof number)
    if (Number.isNaN(value)) {
      return err(
        createError(
          ErrorCode.NOT_NUMBER,
          this.config.errorMessage ?? 'Expected number, received NaN',
          path
        )
      );
    }

    // Finite check
    if (this.config.finite && !Number.isFinite(value)) {
      return err(
        createError(
          ErrorCode.NUMBER_NOT_FINITE,
          this.config.errorMessage ?? 'Number must be finite',
          path
        )
      );
    }

    // Integer check
    if (this.config.integer && !Number.isInteger(value)) {
      return err(
        createError(
          ErrorCode.NUMBER_NOT_INTEGER,
          this.config.errorMessage ?? 'Number must be an integer',
          path
        )
      );
    }

    // Safe integer check
    if (this.config.safe && !Number.isSafeInteger(value)) {
      return err(
        createError(
          ErrorCode.NUMBER_NOT_SAFE,
          this.config.errorMessage ?? 'Number must be a safe integer',
          path
        )
      );
    }

    // Min check
    if (this.config.min !== undefined && value < this.config.min) {
      return err(
        createError(
          ErrorCode.NUMBER_TOO_SMALL,
          this.config.errorMessage ?? `Number must be at least ${this.config.min}`,
          path,
          { min: this.config.min, received: value }
        )
      );
    }

    // Max check
    if (this.config.max !== undefined && value > this.config.max) {
      return err(
        createError(
          ErrorCode.NUMBER_TOO_BIG,
          this.config.errorMessage ?? `Number must be at most ${this.config.max}`,
          path,
          { max: this.config.max, received: value }
        )
      );
    }

    // Positive check
    if (this.config.positive && value <= 0) {
      return err(
        createError(
          ErrorCode.NUMBER_NOT_POSITIVE,
          this.config.errorMessage ?? 'Number must be positive',
          path
        )
      );
    }

    // Negative check
    if (this.config.negative && value >= 0) {
      return err(
        createError(
          ErrorCode.NUMBER_NOT_NEGATIVE,
          this.config.errorMessage ?? 'Number must be negative',
          path
        )
      );
    }

    // Multiple of check (with floating-point tolerance)
    if (this.config.multipleOf !== undefined) {
      const remainder = Math.abs(value % this.config.multipleOf);
      const tolerance = Math.abs(this.config.multipleOf) * 1e-9;
      const isMultiple = remainder < tolerance || Math.abs(remainder - Math.abs(this.config.multipleOf)) < tolerance;

      if (!isMultiple) {
        return err(
          createError(
            ErrorCode.NUMBER_NOT_MULTIPLE,
            this.config.errorMessage ?? `Number must be a multiple of ${this.config.multipleOf}`,
            path,
            { expected: this.config.multipleOf }
          )
        );
      }
    }

    return ok(value);
  }

  protected override _check(value: unknown): boolean {
    if (typeof value !== 'number' || Number.isNaN(value)) return false;
    if (this.config.finite && !Number.isFinite(value)) return false;
    if (this.config.integer && !Number.isInteger(value)) return false;
    if (this.config.safe && !Number.isSafeInteger(value)) return false;
    if (this.config.min !== undefined && value < this.config.min) return false;
    if (this.config.max !== undefined && value > this.config.max) return false;
    if (this.config.positive && value <= 0) return false;
    if (this.config.negative && value >= 0) return false;
    if (this.config.multipleOf !== undefined) {
      const remainder = Math.abs(value % this.config.multipleOf);
      const tolerance = Math.abs(this.config.multipleOf) * 1e-9;
      if (!(remainder < tolerance || Math.abs(remainder - Math.abs(this.config.multipleOf)) < tolerance)) {
        return false;
      }
    }
    return true;
  }

  protected _clone(config: Partial<NumberSchemaConfig>): this {
    return new NumberValidator({ ...this.config, ...config }) as this;
  }

  // ==========================================================================
  // RANGE CONSTRAINTS
  // ==========================================================================

  /**
   * Minimum value (inclusive).
   */
  min(value: number): NumberValidator {
    return this._clone({ min: value });
  }

  /**
   * Maximum value (inclusive).
   */
  max(value: number): NumberValidator {
    return this._clone({ max: value });
  }

  /**
   * Greater than (exclusive).
   */
  gt(value: number): NumberValidator {
    return this._clone({ min: value + Number.EPSILON });
  }

  /**
   * Greater than or equal (inclusive).
   */
  gte(value: number): NumberValidator {
    return this._clone({ min: value });
  }

  /**
   * Less than (exclusive).
   */
  lt(value: number): NumberValidator {
    return this._clone({ max: value - Number.EPSILON });
  }

  /**
   * Less than or equal (inclusive).
   */
  lte(value: number): NumberValidator {
    return this._clone({ max: value });
  }

  // ==========================================================================
  // TYPE CONSTRAINTS
  // ==========================================================================

  /**
   * Must be an integer.
   */
  int(): NumberValidator {
    return this._clone({ integer: true });
  }

  /**
   * Must be positive (> 0).
   */
  positive(): NumberValidator {
    return this._clone({ positive: true });
  }

  /**
   * Must be negative (< 0).
   */
  negative(): NumberValidator {
    return this._clone({ negative: true });
  }

  /**
   * Must be non-negative (>= 0).
   */
  nonnegative(): NumberValidator {
    return this._clone({ min: 0 });
  }

  /**
   * Must be non-positive (<= 0).
   */
  nonpositive(): NumberValidator {
    return this._clone({ max: 0 });
  }

  /**
   * Must be finite.
   */
  finite(): NumberValidator {
    return this._clone({ finite: true });
  }

  /**
   * Must be a safe integer.
   */
  safe(): NumberValidator {
    return this._clone({ safe: true, integer: true });
  }

  /**
   * Must be a multiple of given number.
   */
  multipleOf(value: number): NumberValidator {
    return this._clone({ multipleOf: value });
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new number validator.
 */
export function number(config?: NumberSchemaConfig): NumberValidator {
  return new NumberValidator(config);
}
