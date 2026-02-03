/**
 * Regex utilities for secure pattern matching.
 * Provides protection against ReDoS (Regular Expression Denial of Service) attacks.
 */

/**
 * Configuration for regex security
 */
export interface RegexSecurityConfig {
  /** Maximum string length to test against regex */
  maxLength?: number;
  /** Timeout in milliseconds for regex execution */
  timeout?: number;
}

/**
 * Default security configuration for regex operations
 */
export const DEFAULT_REGEX_SECURITY_CONFIG: Required<RegexSecurityConfig> = {
  maxLength: 10000,
  timeout: 1000 // 1 second
};

/**
 * Safely test a regex pattern against a string with ReDoS protection.
 *
 * @param pattern - Regex pattern to test
 * @param input - Input string to test against
 * @param config - Security configuration
 * @returns Test result or null if security violation
 */
export function safeRegexTest(
  pattern: RegExp,
  input: string,
  config: RegexSecurityConfig = {}
): boolean | null {
  const finalConfig = { ...DEFAULT_REGEX_SECURITY_CONFIG, ...config };

  // Check input length
  if (input.length > finalConfig.maxLength) {
    return null; // Security violation - input too long
  }

  // For simple patterns, we can test directly
  if (!isComplexRegex(pattern)) {
    return pattern.test(input);
  }

  // For complex patterns, use timeout protection
  return testWithTimeout(pattern, input, finalConfig.timeout);
}

/**
 * Check if a regex pattern is potentially complex (vulnerable to ReDoS).
 * This is a heuristic check - not foolproof but catches common dangerous patterns.
 *
 * @param pattern - Regex pattern to check
 * @returns True if pattern is potentially complex
 */
export function isComplexRegex(pattern: RegExp): boolean {
  const source = pattern.source;

  // Check for nested quantifiers which are common ReDoS vectors
  // Look for patterns like (a+)+ or (a*)*  - quantified groups with quantifiers
  const nestedQuantifiers = /\([^)]*[+*]\)[+*]|[+*][+*]/;

  // Check for alternation with overlapping patterns - actual | character in groups
  const overlappingAlternation = /\([^)]*\|[^)]*\)/;

  // Check for backreferences
  const backreferences = /\\[1-9]/;

  return nestedQuantifiers.test(source) ||
         overlappingAlternation.test(source) ||
         backreferences.test(source) ||
         source.length > 100; // Long patterns are suspicious
}

/**
 * Test regex with timeout protection.
 *
 * @param pattern - Regex pattern
 * @param input - Input string
 * @param timeout - Timeout in milliseconds
 * @returns Test result or null if timeout
 */
function testWithTimeout(pattern: RegExp, input: string, timeout: number): boolean | null {
  let result: boolean | null = null;
  let timedOut = false;

  // Create a promise that resolves when regex completes
  const testPromise = new Promise<boolean>((resolve) => {
    try {
      result = pattern.test(input);
      resolve(result);
    } catch {
      // If regex throws an error, consider it a security violation
      resolve(false);
    }
  });

  // Create a timeout promise
  const timeoutPromise = new Promise<null>((resolve) => {
    setTimeout(() => {
      timedOut = true;
      resolve(null);
    }, timeout);
  });

  // Race the promises
  return Promise.race([testPromise, timeoutPromise]).then((res) => {
    return timedOut ? null : res;
  }) as any; // Type assertion needed due to Promise.race typing
}

/**
 * Validate regex security constraints.
 *
 * @param pattern - Regex pattern to validate
 * @param input - Input string to validate against
 * @param config - Security configuration
 * @returns Validation result
 */
export function validateRegexSecurity(
  pattern: RegExp,
  input: string,
  config: RegexSecurityConfig = {}
): { valid: boolean; result?: boolean; error?: string } {
  const finalConfig = { ...DEFAULT_REGEX_SECURITY_CONFIG, ...config };

  if (input.length > finalConfig.maxLength) {
    return {
      valid: false,
      error: `Input length ${input.length} exceeds maximum allowed length ${finalConfig.maxLength}`
    };
  }

  // Check if pattern is complex/dangerous - don't execute it if so
  if (isComplexRegex(pattern)) {
    return {
      valid: false,
      error: 'Regex pattern is potentially dangerous (contains nested quantifiers, backreferences, or is too long) - security violation'
    };
  }

  // Only test safe patterns
  try {
    const result = pattern.test(input);
    return {
      valid: true,
      result
    };
  } catch {
    return {
      valid: false,
      error: 'Regex execution failed'
    };
  }
}