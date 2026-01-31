/**
 * Angular Integration
 * 
 * Provides Angular-specific validators and form integration.
 */

import type { Schema } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';

/**
 * Angular FormControl wrapper for FIRM schemas
 */
export class FirmFormControl<T> {
  private value: T | null = null;
  private errors: string[] = [];

  constructor(
    private schema: Schema<T>,
    initialValue?: T
  ) {
    if (initialValue !== undefined) {
      this.setValue(initialValue);
    }
  }

  /**
   * Set value and validate
   */
  setValue(value: T): void {
    const result = this.schema.validate(value);
    this.value = result.ok ? result.data : null;
    this.errors = result.ok ? [] : result.errors.map(err => err.message);
  }

  /**
   * Get current value
   */
  getValue(): T | null {
    return this.value;
  }

  /**
   * Get validation errors
   */
  getErrors(): string[] {
    return this.errors;
  }

  /**
   * Check if value is valid
   */
  isValid(): boolean {
    return this.errors.length === 0;
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.value = null;
    this.errors = [];
  }
}

/**
 * Angular Reactive Forms integration
 */
export function toFormControl<T>(schema: Schema<T>, initialValue?: T): FirmFormControl<T> {
  return new FirmFormControl(schema, initialValue);
}

/**
 * Angular Template-Driven Forms integration
 */
export function createTemplateValidator<T>(schema: Schema<T>) {
  return {
    validate: (control: any): { [key: string]: any } | null => {
      const result = schema.validate(control.value);
      if (result.ok) {
        return null;
      } else {
        return {
          firmValidation: {
            errors: result.errors
          }
        };
      }
    }
  };
}

/**
 * Angular Pipe for validation
 */
export class ValidationPipe {
  transform(value: any, schema: Schema<any>): any {
    const result = schema.validate(value);
    if (!result.ok) {
      throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
    }
    return result.data;
  }
}

/**
 * Angular Directive for form validation
 */
export function createValidationDirective(schema: Schema<any>) {
  return {
    selector: '[firmValidate]',
    providers: [
      {
        provide: NG_VALIDATORS,
        useExisting: forwardRef(() => FirmValidationDirective),
        multi: true
      }
    ]
  };
}

// These would be actual Angular classes in a real implementation
const NG_VALIDATORS = 'NG_VALIDATORS';
function forwardRef(fn: any): any {
  return fn;
}
class FirmValidationDirective {
  // Implementation would go here
}

export default {
  FirmFormControl,
  toFormControl,
  createTemplateValidator,
  ValidationPipe,
  createValidationDirective
};