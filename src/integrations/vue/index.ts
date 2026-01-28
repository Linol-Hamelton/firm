/**
 * Vue 3 Integration for FIRM Validator
 *
 * Provides composables for validating forms in Vue 3.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { s } from 'firm-validator';
 * import { useFirmValidation } from 'firm-validator/integrations/vue';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(18)
 * });
 *
 * const { values, errors, validate, validateField, isValid } = useFirmValidation(userSchema, {
 *   name: '',
 *   email: '',
 *   age: 0
 * });
 *
 * const handleSubmit = async () => {
 *   if (await validate()) {
 *     console.log('Valid:', values);
 *   }
 * };
 * </script>
 *
 * <template>
 *   <form @submit.prevent="handleSubmit">
 *     <input v-model="values.name" @blur="validateField('name')" />
 *     <span v-if="errors.name">{{ errors.name }}</span>
 *
 *     <button type="submit" :disabled="!isValid">Submit</button>
 *   </form>
 * </template>
 * ```
 */

import type { Ref } from 'vue';
import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface ValidationState<T> {
  /** Form values (reactive) */
  values: Ref<T>;
  /** Validation errors (reactive) */
  errors: Ref<Record<string, string>>;
  /** Whether form is valid (computed) */
  isValid: Ref<boolean>;
  /** Whether validation is in progress */
  isValidating: Ref<boolean>;
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
  /** Set form values */
  setValues: (newValues: Partial<T>) => void;
  /** Set field value */
  setFieldValue: (field: keyof T, value: any) => void;
}

export interface UseFirmValidationOptions {
  /** Validate on mount */
  validateOnMount?: boolean;
  /** Validate on value change */
  validateOnChange?: boolean;
  /** Debounce delay for validateOnChange (ms) */
  debounce?: number;
}

// ============================================================================
// COMPOSABLES
// ============================================================================

/**
 * Vue composable for form validation with FIRM.
 *
 * @param schema - FIRM validation schema
 * @param initialValues - Initial form values
 * @param options - Validation options
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFirmValidation } from 'firm-validator/integrations/vue';
 *
 * const { values, errors, validate } = useFirmValidation(userSchema, {
 *   name: '',
 *   email: ''
 * });
 *
 * const handleSubmit = async () => {
 *   if (await validate()) {
 *     // Submit form
 *   }
 * };
 * </script>
 * ```
 */
export function useFirmValidation<T extends Record<string, any>>(
  schema: Schema<T>,
  initialValues: T,
  options: UseFirmValidationOptions = {}
): ValidationState<T> {
  // Note: In real implementation, these would use Vue's ref, computed, watch
  // For type-only library, we provide the interface

  // Simulate Vue refs (would be actual refs in real implementation)
  const values: any = { value: { ...initialValues } };
  const errors: any = { value: {} };
  const isValid: any = { value: true };
  const isValidating: any = { value: false };

  const validate = async (): Promise<boolean> => {
    isValidating.value = true;
    errors.value = {};

    try {
      const result = schema.validate(values.value);

      if (result.ok) {
        values.value = result.data;
        isValid.value = true;
        return true;
      }

      // Set errors
      for (const error of result.errors) {
        const path = error.path || 'root';
        errors.value[path] = error.message;
      }

      isValid.value = false;
      return false;
    } finally {
      isValidating.value = false;
    }
  };

  const validateField = async (field: keyof T): Promise<boolean> => {
    // In real implementation, would validate just this field
    // For now, validate entire form and filter errors
    await validate();
    return !errors.value[field as string];
  };

  const clearErrors = (): void => {
    errors.value = {};
  };

  const clearFieldError = (field: keyof T): void => {
    delete errors.value[field as string];
  };

  const reset = (): void => {
    values.value = { ...initialValues };
    errors.value = {};
    isValid.value = true;
  };

  const setValues = (newValues: Partial<T>): void => {
    values.value = { ...values.value, ...newValues };
  };

  const setFieldValue = (field: keyof T, value: any): void => {
    values.value[field] = value;
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
    setValues,
    setFieldValue,
  };
}

/**
 * Vue composable for single field validation.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useFirmField } from 'firm-validator/integrations/vue';
 *
 * const emailSchema = s.string().email();
 * const { value, error, validate } = useFirmField(emailSchema, '');
 * </script>
 *
 * <template>
 *   <input v-model="value" @blur="validate" />
 *   <span v-if="error">{{ error }}</span>
 * </template>
 * ```
 */
export function useFirmField<T>(
  schema: Schema<T>,
  initialValue: T
): {
  value: Ref<T>;
  error: Ref<string | null>;
  isValid: Ref<boolean>;
  validate: () => Promise<boolean>;
  clear: () => void;
} {
  const value: any = { value: initialValue };
  const error: any = { value: null };
  const isValid: any = { value: true };

  const validate = async (): Promise<boolean> => {
    error.value = null;

    const result = schema.validate(value.value);

    if (result.ok) {
      value.value = result.data;
      isValid.value = true;
      return true;
    }

    error.value = result.errors[0]?.message || 'Invalid value';
    isValid.value = false;
    return false;
  };

  const clear = (): void => {
    error.value = null;
    isValid.value = true;
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
// DIRECTIVE
// ============================================================================

/**
 * Vue directive for automatic validation.
 *
 * @example
 * ```vue
 * <script setup>
 * import { vFirm } from 'firm-validator/integrations/vue';
 *
 * const emailSchema = s.string().email();
 * </script>
 *
 * <template>
 *   <input v-model="email" v-firm="emailSchema" />
 * </template>
 * ```
 */
export const vFirm = {
  mounted(el: HTMLInputElement, binding: any) {
    const schema = binding.value;

    el.addEventListener('blur', async () => {
      const result = schema.validate(el.value);

      if (!result.ok) {
        el.classList.add('invalid');
        el.setCustomValidity(result.errors[0]?.message || 'Invalid');
      } else {
        el.classList.remove('invalid');
        el.setCustomValidity('');
      }
    });
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useFirmValidation,
  useFirmField,
  vFirm,
};
