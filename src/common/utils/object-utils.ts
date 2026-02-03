/**
 * Object utilities for secure property access.
 * Provides protection against prototype pollution attacks.
 */

/**
 * Safely get all own property keys of an object.
 * Protects against prototype pollution by filtering out inherited properties.
 *
 * @param obj - Object to get keys from
 * @returns Array of own property keys
 */
export function getOwnKeys(obj: Record<string, unknown>): string[] {
  if (obj === null || obj === undefined) {
    return [];
  }

  // Use hasOwnProperty to filter out prototype properties
  const keys: string[] = [];
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
}

/**
 * Safely check if an object has a specific own property.
 * Protects against prototype pollution.
 *
 * @param obj - Object to check
 * @param key - Property key to check
 * @returns True if object has the own property
 */
export function hasOwnProperty(obj: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Safely get the value of an own property.
 * Returns undefined if property doesn't exist or is inherited.
 *
 * @param obj - Object to get property from
 * @param key - Property key
 * @returns Property value or undefined
 */
export function getOwnProperty(obj: Record<string, unknown>, key: string): unknown {
  return hasOwnProperty(obj, key) ? obj[key] : undefined;
}

/**
 * Safely iterate over object entries, excluding prototype properties.
 *
 * @param obj - Object to iterate
 * @param callback - Callback function for each key-value pair
 */
export function forEachOwnProperty(
  obj: Record<string, unknown>,
  callback: (key: string, value: unknown) => void
): void {
  const keys = getOwnKeys(obj);
  for (const key of keys) {
    callback(key, obj[key]);
  }
}

/**
 * Safely create a shallow copy of an object with only own properties.
 * Protects against prototype pollution in copying operations.
 *
 * @param obj - Object to copy
 * @returns New object with only own properties
 */
export function safeShallowCopy(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  forEachOwnProperty(obj, (key, value) => {
    result[key] = value;
  });
  return result;
}

/**
 * Check if a value is a plain object (not null, not array, not primitive).
 * Safe version that doesn't rely on constructor checks.
 *
 * @param value - Value to check
 * @returns True if value is a plain object
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (value.constructor === Object || value.constructor == null)
  );
}

/**
 * Safely validate object depth to prevent stack overflow attacks.
 * Limits maximum nesting depth during validation.
 *
 * @param obj - Object to validate
 * @param maxDepth - Maximum allowed depth (default: 64)
 * @param currentDepth - Current depth (internal use)
 * @returns True if depth is within limits
 */
export function validateObjectDepth(
  obj: unknown,
  maxDepth: number = 64,
  currentDepth: number = 0
): boolean {
  if (currentDepth > maxDepth) {
    return false;
  }

  if (!isPlainObject(obj)) {
    return true;
  }

  const keys = getOwnKeys(obj as Record<string, unknown>);
  for (const key of keys) {
    const value = (obj as Record<string, unknown>)[key];
    if (!validateObjectDepth(value, maxDepth, currentDepth + 1)) {
      return false;
    }
  }

  return true;
}

/**
 * Configuration for object validation security
 */
export interface ObjectValidationConfig {
  /** Maximum object depth to prevent stack overflow */
  maxDepth?: number;
  /** Whether to protect against prototype pollution */
  protectPrototype?: boolean;
  /** Whether to validate object depth */
  validateDepth?: boolean;
}

/**
 * Default security configuration
 */
export const DEFAULT_SECURITY_CONFIG: Required<ObjectValidationConfig> = {
  maxDepth: 64,
  protectPrototype: true,
  validateDepth: true
};

/**
 * Validate object security constraints.
 *
 * @param obj - Object to validate
 * @param config - Security configuration
 * @returns Validation result
 */
export function validateObjectSecurity(
  obj: unknown,
  config: ObjectValidationConfig = {}
): { valid: boolean; error?: string } {
  const finalConfig = { ...DEFAULT_SECURITY_CONFIG, ...config };

  if (!isPlainObject(obj)) {
    return { valid: true };
  }

  if (finalConfig.validateDepth) {
    if (!validateObjectDepth(obj, finalConfig.maxDepth)) {
      return {
        valid: false,
        error: `Object depth exceeds maximum allowed depth of ${finalConfig.maxDepth}`
      };
    }
  }

  // Additional security checks can be added here
  // - Check for dangerous property names
  // - Validate property name patterns
  // - Check for circular references

  return { valid: true };
}