/**
 * Svelte Integration for FIRM Validator
 *
 * Provides stores and actions for validating forms in Svelte.
 *
 * @example
 * ```svelte
 * <script lang="ts">
 * import { s } from 'firm-validator';
 * import { createFirmStore } from 'firm-validator/integrations/svelte';
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 *   age: s.number().int().min(18)
 * });
 *
 * const form = createFirmStore(userSchema, {
 *   name: '',
 *   email: '',
 *   age: 0
 * });
 *
 * const handleSubmit = async () => {
 *   if (await form.validate()) {
 *     console.log('Valid:', $form.values);
 *   }
 * };
 * </script>
 *
 * <form on:submit|preventDefault={handleSubmit}>
 *   <input bind:value={$form.values.name} on:blur={() => form.validateField('name')} />
 *   {#if $form.errors.name}
 *     <span class="error">{$form.errors.name}</span>
 *   {/if}
 *
 *   <button type="submit" disabled={!$form.isValid}>Submit</button>
 * </form>
 * ```
 */

import type { Writable } from 'svelte/store';
import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface FirmStore<T> extends Writable<FormState<T>> {
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
  /** Update form values */
  updateValues: (updater: (values: T) => T) => void;
  /** Set field value */
  setFieldValue: (field: keyof T, value: any) => void;
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  isValid: boolean;
  isValidating: boolean;
  touched: Record<string, boolean>;
}

export interface CreateFirmStoreOptions {
  /** Validate on value change */
  validateOnChange?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
}

// ============================================================================
// STORE CREATOR
// ============================================================================

/**
 * Create a Svelte store for form validation with FIRM.
 *
 * @param schema - FIRM validation schema
 * @param initialValues - Initial form values
 * @param options - Store options
 *
 * @example
 * ```svelte
 * <script>
 * import { createFirmStore } from 'firm-validator/integrations/svelte';
 *
 * const form = createFirmStore(userSchema, {
 *   name: '',
 *   email: ''
 * });
 * </script>
 *
 * <form on:submit|preventDefault={form.validate}>
 *   <input bind:value={$form.values.name} />
 *   {#if $form.errors.name}
 *     <span>{$form.errors.name}</span>
 *   {/if}
 * </form>
 * ```
 */
export function createFirmStore<T extends Record<string, any>>(
  schema: Schema<T>,
  initialValues: T,
  options: CreateFirmStoreOptions = {}
): FirmStore<T> {
  // Internal state
  let state: FormState<T> = {
    values: { ...initialValues },
    errors: {},
    isValid: true,
    isValidating: false,
    touched: {},
  };

  const subscribers = new Set<(value: FormState<T>) => void>();

  // Notify subscribers
  const notify = () => {
    subscribers.forEach((subscriber) => subscriber(state));
  };

  // Subscribe method
  const subscribe = (subscriber: (value: FormState<T>) => void) => {
    subscribers.add(subscriber);
    subscriber(state); // Initial call
    return () => subscribers.delete(subscriber);
  };

  // Set method
  const set = (newState: FormState<T>) => {
    state = newState;
    notify();
  };

  // Update method
  const update = (updater: (state: FormState<T>) => FormState<T>) => {
    state = updater(state);
    notify();
  };

  // Validate entire form
  const validate = async (): Promise<boolean> => {
    update((s) => ({ ...s, isValidating: true, errors: {} }));

    try {
      const result = schema.validate(state.values);

      if (result.ok) {
        update((s) => ({
          ...s,
          values: result.data,
          isValid: true,
          isValidating: false,
        }));
        return true;
      }

      // Set errors
      const errors: Record<string, string> = {};
      for (const error of result.errors) {
        const path = error.path || 'root';
        errors[path] = error.message;
      }

      update((s) => ({
        ...s,
        errors,
        isValid: false,
        isValidating: false,
      }));

      return false;
    } catch {
      update((s) => ({ ...s, isValidating: false }));
      return false;
    }
  };

  // Validate single field
  const validateField = async (field: keyof T): Promise<boolean> => {
    // Mark as touched
    update((s) => ({
      ...s,
      touched: { ...s.touched, [field]: true },
    }));

    // Validate entire form and check this field
    await validate();
    return !state.errors[field as string];
  };

  // Clear all errors
  const clearErrors = (): void => {
    update((s) => ({ ...s, errors: {}, isValid: true }));
  };

  // Clear error for specific field
  const clearFieldError = (field: keyof T): void => {
    update((s) => {
      const newErrors = { ...s.errors };
      delete newErrors[field as string];
      return { ...s, errors: newErrors };
    });
  };

  // Reset form
  const reset = (): void => {
    set({
      values: { ...initialValues },
      errors: {},
      isValid: true,
      isValidating: false,
      touched: {},
    });
  };

  // Update values
  const updateValues = (updater: (values: T) => T): void => {
    update((s) => ({ ...s, values: updater(s.values) }));
  };

  // Set field value
  const setFieldValue = (field: keyof T, value: any): void => {
    update((s) => ({
      ...s,
      values: { ...s.values, [field]: value },
    }));
  };

  return {
    subscribe,
    set,
    update,
    validate,
    validateField,
    clearErrors,
    clearFieldError,
    reset,
    updateValues,
    setFieldValue,
  };
}

// ============================================================================
// FIELD STORE
// ============================================================================

/**
 * Create a Svelte store for single field validation.
 *
 * @example
 * ```svelte
 * <script>
 * import { createFirmField } from 'firm-validator/integrations/svelte';
 *
 * const email = createFirmField(s.string().email(), '');
 * </script>
 *
 * <input bind:value={$email.value} on:blur={email.validate} />
 * {#if $email.error}
 *   <span>{$email.error}</span>
 * {/if}
 * ```
 */
export function createFirmField<T>(
  schema: Schema<T>,
  initialValue: T
): Writable<{ value: T; error: string | null; isValid: boolean }> & {
  validate: () => Promise<boolean>;
  clear: () => void;
} {
  let state = {
    value: initialValue,
    error: null as string | null,
    isValid: true,
  };

  const subscribers = new Set<(value: typeof state) => void>();

  const notify = () => {
    subscribers.forEach((subscriber) => subscriber(state));
  };

  const subscribe = (subscriber: (value: typeof state) => void) => {
    subscribers.add(subscriber);
    subscriber(state);
    return () => subscribers.delete(subscriber);
  };

  const set = (newState: typeof state) => {
    state = newState;
    notify();
  };

  const update = (updater: (state: typeof state) => typeof state) => {
    state = updater(state);
    notify();
  };

  const validate = async (): Promise<boolean> => {
    const result = schema.validate(state.value);

    if (result.ok) {
      update((s) => ({ ...s, value: result.data, error: null, isValid: true }));
      return true;
    }

    const error = result.errors[0]?.message || 'Invalid value';
    update((s) => ({ ...s, error, isValid: false }));
    return false;
  };

  const clear = (): void => {
    update((s) => ({ ...s, error: null, isValid: true }));
  };

  return {
    subscribe,
    set,
    update,
    validate,
    clear,
  };
}

// ============================================================================
// ACTIONS
// ============================================================================

/**
 * Svelte action for automatic validation.
 *
 * @example
 * ```svelte
 * <script>
 * import { firmAction } from 'firm-validator/integrations/svelte';
 *
 * const emailSchema = s.string().email();
 * </script>
 *
 * <input use:firmAction={emailSchema} />
 * ```
 */
export function firmAction(node: HTMLInputElement, _schema: Schema<any>) {
  const handleBlur = async () => {
    const result = schema.validate(node.value);

    if (!result.ok) {
      node.classList.add('invalid');
      node.setCustomValidity(result.errors[0]?.message || 'Invalid');
    } else {
      node.classList.remove('invalid');
      node.setCustomValidity('');
    }
  };

  node.addEventListener('blur', handleBlur);

  return {
    destroy() {
      node.removeEventListener('blur', handleBlur);
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createFirmStore,
  createFirmField,
  firmAction,
};
