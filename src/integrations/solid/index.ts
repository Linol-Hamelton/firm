/**
 * Solid.js Integration for FIRM Validator
 *
 * Provides signals and utilities for validating forms in Solid.js.
 *
 * @example
 * ```tsx
 * import { s } from 'firm-validator';
 * import { createFirmForm } from 'firm-validator/integrations/solid';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(18)
 * });
 *
 * function MyForm() {
 *   const { values, errors, handleSubmit, handleBlur } = createFirmForm(userSchema, {
 *     name: '',
 *     email: '',
 *     age: 0
 *   });
 *
 *   const onSubmit = handleSubmit((data) => {
 *     console.log('Valid:', data);
 *   });
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       <input
 *         value={values().name}
 *         onInput={(e) => values.set({ ...values(), name: e.target.value })}
 *         onBlur={handleBlur('name')}
 *       />
 *       {errors().name && <span>{errors().name}</span>}
 *
 *       <button type="submit">Submit</button>
 *     </form>
 *   );
 * }
 * ```
 */

import type { Accessor, Setter } from 'solid-js';
import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface FirmFormReturn<T> {
  /** Form values (signal) */
  values: Accessor<T> & { set: Setter<T> };
  /** Validation errors (signal) */
  errors: Accessor<Record<string, string>> & { set: Setter<Record<string, string>> };
  /** Whether form is valid (signal) */
  isValid: Accessor<boolean>;
  /** Whether validation is in progress */
  isValidating: Accessor<boolean>;
  /** Validate entire form */
  validate: () => Promise<boolean>;
  /** Validate single field */
  validateField: (field: keyof T) => Promise<boolean>;
  /** Clear all errors */
  clearErrors: () => void;
  /** Clear error for specific field */
  clearFieldError: (field: keyof T) => void;
  /** Reset form to initial values */
  reset: () => void;
  /** Handle form submit */
  handleSubmit: (onValid: (data: T) => void | Promise<void>) => (e: Event) => Promise<void>;
  /** Handle field blur */
  handleBlur: (field: keyof T) => () => Promise<void>;
  /** Handle field change */
  handleChange: (field: keyof T) => (value: any) => void;
}

export interface CreateFirmFormOptions {
  /** Validate on mount */
  validateOnMount?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
}

// ============================================================================
// FORM CREATOR
// ============================================================================

/**
 * Create form validation with Solid.js signals.
 *
 * @param schema - FIRM validation schema
 * @param initialValues - Initial form values
 * @param options - Form options
 *
 * @example
 * ```tsx
 * import { createFirmForm } from 'firm-validator/integrations/solid';
 *
 * function MyForm() {
 *   const { values, errors, handleSubmit } = createFirmForm(userSchema, {
 *     name: '',
 *     email: ''
 *   });
 *
 *   const onSubmit = handleSubmit((data) => {
 *     console.log('Valid:', data);
 *   });
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       <input value={values().name} />
 *       {errors().name && <span>{errors().name}</span>}
 *     </form>
 *   );
 * }
 * ```
 */
export function createFirmForm<T extends Record<string, any>>(
  schema: Schema<T>,
  initialValues: T,
  options: CreateFirmFormOptions = {}
): FirmFormReturn<T> {
  // Note: In real implementation, these would use Solid's createSignal
  // For type-only library, we provide the interface

  // Simulate Solid signals
  let valuesState = { ...initialValues };
  let errorsState: Record<string, string> = {};
  let isValidState = true;
  let isValidatingState = false;

  const values: any = (() => valuesState) as Accessor<T> & { set: Setter<T> };
  values.set = (newValues: T) => {
    valuesState = newValues;
  };

  const errors: any = (() => errorsState) as Accessor<Record<string, string>> & {
    set: Setter<Record<string, string>>;
  };
  errors.set = (newErrors: Record<string, string>) => {
    errorsState = newErrors;
  };

  const isValid = (() => isValidState) as Accessor<boolean>;
  const isValidating = (() => isValidatingState) as Accessor<boolean>;

  const validate = async (): Promise<boolean> => {
    isValidatingState = true;
    errors.set({});

    try {
      const result = schema.validate(valuesState);

      if (result.ok) {
        values.set(result.data);
        isValidState = true;
        return true;
      }

      // Set errors
      const newErrors: Record<string, string> = {};
      for (const error of result.errors) {
        const path = error.path || 'root';
        newErrors[path] = error.message;
      }

      errors.set(newErrors);
      isValidState = false;
      return false;
    } finally {
      isValidatingState = false;
    }
  };

  const validateField = async (field: keyof T): Promise<boolean> => {
    await validate();
    return !errorsState[field as string];
  };

  const clearErrors = (): void => {
    errors.set({});
    isValidState = true;
  };

  const clearFieldError = (field: keyof T): void => {
    const newErrors = { ...errorsState };
    delete newErrors[field as string];
    errors.set(newErrors);
  };

  const reset = (): void => {
    values.set({ ...initialValues });
    errors.set({});
    isValidState = true;
  };

  const handleSubmit =
    (onValid: (data: T) => void | Promise<void>) =>
    async (e: Event): Promise<void> => {
      e.preventDefault();

      if (await validate()) {
        await onValid(valuesState);
      }
    };

  const handleBlur = (field: keyof T) => async (): Promise<void> => {
    if (options.validateOnBlur !== false) {
      await validateField(field);
    }
  };

  const handleChange = (field: keyof T) => (value: any): void => {
    values.set({ ...valuesState, [field]: value });
  };

  return {
    values,
    errors,
    isValid,
    isValidating,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    reset,
    handleSubmit,
    handleBlur,
    handleChange,
  };
}

// ============================================================================
// FIELD CREATOR
// ============================================================================

/**
 * Create validation for single field with Solid.js signals.
 *
 * @example
 * ```tsx
 * import { createFirmField } from 'firm-validator/integrations/solid';
 *
 * function EmailInput() {
 *   const { value, error, validate } = createFirmField(
 *     s.string().email(),
 *     ''
 *   );
 *
 *   return (
 *     <div>
 *       <input
 *         value={value()}
 *         onInput={(e) => value.set(e.target.value)}
 *         onBlur={validate}
 *       />
 *       {error() && <span>{error()}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function createFirmField<T>(
  schema: Schema<T>,
  initialValue: T
): {
  value: Accessor<T> & { set: Setter<T> };
  error: Accessor<string | null> & { set: Setter<string | null> };
  isValid: Accessor<boolean>;
  validate: () => Promise<boolean>;
  clear: () => void;
} {
  let valueState = initialValue;
  let errorState: string | null = null;
  let isValidState = true;

  const value: any = (() => valueState) as Accessor<T> & { set: Setter<T> };
  value.set = (newValue: T) => {
    valueState = newValue;
  };

  const error: any = (() => errorState) as Accessor<string | null> & {
    set: Setter<string | null>;
  };
  error.set = (newError: string | null) => {
    errorState = newError;
  };

  const isValid = (() => isValidState) as Accessor<boolean>;

  const validate = async (): Promise<boolean> => {
    error.set(null);

    const result = schema.validate(valueState);

    if (result.ok) {
      value.set(result.data);
      isValidState = true;
      return true;
    }

    error.set(result.errors[0]?.message || 'Invalid value');
    isValidState = false;
    return false;
  };

  const clear = (): void => {
    error.set(null);
    isValidState = true;
  };

  return {
    value,
    error,
    isValid,
    validate,
    clear,
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Create submit handler with validation.
 *
 * @example
 * ```tsx
 * const handleSubmit = createSubmitHandler(userSchema, async (data) => {
 *   await api.createUser(data);
 * });
 *
 * <form onSubmit={handleSubmit}>...</form>
 * ```
 */
export function createSubmitHandler<T>(
  schema: Schema<T>,
  onValid: (data: T) => void | Promise<void>
): (data: T) => (e: Event) => Promise<void> {
  return (data: T) => async (e: Event): Promise<void> => {
    e.preventDefault();

    const result = schema.validate(data);

    if (result.ok) {
      await onValid(result.data);
    }
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createFirmForm,
  createFirmField,
  createSubmitHandler,
};
