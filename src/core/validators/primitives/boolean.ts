/**
 * LAYER 1: Boolean Validator
 *
 * Simple boolean validation.
 * Target: 50M+ ops/sec
 */

import { BaseSchema } from '../../schema/base-schema.js';
import type { SchemaConfig } from '../../../common/types/schema.js';
import type { ValidationResult } from '../../../common/types/result.js';
import { ok, err, createError, ErrorCode } from '../../../common/types/result.js';

// ============================================================================
// BOOLEAN VALIDATOR
// ============================================================================

export class BooleanValidator extends BaseSchema<boolean, SchemaConfig> {
  readonly _type = 'boolean' as const;

  constructor(config: SchemaConfig = {}) {
    super(config);
  }

  protected _validate(value: unknown, path: string): ValidationResult<boolean> {
    if (typeof value !== 'boolean') {
      return err(
        createError(
          ErrorCode.NOT_BOOLEAN,
          this.config.errorMessage ?? 'Expected boolean',
          path,
          { received: typeof value }
        )
      );
    }
    return ok(value);
  }

  protected override _check(value: unknown): boolean {
    return typeof value === 'boolean';
  }

  protected _clone(config: Partial<SchemaConfig>): this {
    return new BooleanValidator({ ...this.config, ...config }) as this;
  }

  /**
   * Require the value to be true.
   */
  true(): BooleanValidator {
    return this.refine(
      (v) => v === true,
      'Value must be true'
    ) as unknown as BooleanValidator;
  }

  /**
   * Require the value to be false.
   */
  false(): BooleanValidator {
    return this.refine(
      (v) => v === false,
      'Value must be false'
    ) as unknown as BooleanValidator;
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create a new boolean validator.
 */
export function boolean(config?: SchemaConfig): BooleanValidator {
  return new BooleanValidator(config);
}
