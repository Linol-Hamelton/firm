/**
 * LAYER 3: AI-Powered Error Messages
 *
 * Enhance validation error messages with contextual suggestions,
 * examples, and actionable fixes.
 *
 * Target: Reduce developer debugging time by 50%.
 */

import type { ValidationError } from '../../common/types/result.js';

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedError {
  /** Original error */
  original: ValidationError;
  /** Enhanced human-readable message */
  message: string;
  /** Suggested fix (code snippet) */
  suggestion?: string | undefined;
  /** Example of correct value */
  example?: string | undefined;
  /** Link to documentation */
  docsUrl: string;
  /** Confidence score (0-1) */
  confidence: number;
}

export interface ErrorEnhancementOptions {
  /** Include code suggestions */
  includeSuggestions?: boolean;
  /** Include examples */
  includeExamples?: boolean;
  /** Language for examples (default: 'typescript') */
  language?: 'typescript' | 'javascript' | 'json';
  /** Maximum suggestions per error */
  maxSuggestions?: number;
}

// ============================================================================
// ERROR ENHANCER
// ============================================================================

/**
 * Enhance validation errors with AI-powered suggestions.
 * Uses rule-based enhancement (could be extended with LLM).
 *
 * @example
 * ```ts
 * const result = schema.validate(data);
 * if (!result.ok) {
 *   const enhanced = enhanceErrors(result.errors);
 *   console.log(enhanced[0].suggestion);
 * }
 * ```
 */
export function enhanceErrors(
  errors: ValidationError[],
  options: ErrorEnhancementOptions = {}
): EnhancedError[] {
  const {
    includeSuggestions = true,
    includeExamples = true,
    language = 'typescript',
    maxSuggestions = 3,
  } = options;

  return errors.map((error) => enhanceError(error, { includeSuggestions, includeExamples, language, maxSuggestions }));
}

/**
 * Enhance a single validation error.
 */
export function enhanceError(
  error: ValidationError,
  options: ErrorEnhancementOptions = {}
): EnhancedError {
  const { code, message, path, received, meta } = error;
  const { includeSuggestions = true, includeExamples = true, language = 'typescript' } = options;

  // Base enhanced message
  let enhancedMessage = message;
  let suggestion: string | undefined;
  let example: string | undefined;
  let confidence = 0.8;

  // Rule-based enhancement based on error code
  switch (code) {
    case 'NOT_STRING':
      enhancedMessage = `Expected a string at path "${path}", but got ${typeof received}.`;
      if (includeSuggestions) {
        suggestion = `Ensure the value is a string, e.g., ${language === 'typescript' ? 'const value = "example";' : 'const value = "example";'}`;
      }
      if (includeExamples) {
        example = `"example"`;
      }
      break;

    case 'NOT_NUMBER':
      enhancedMessage = `Expected a number at path "${path}", but got ${typeof received}.`;
      if (includeSuggestions) {
        suggestion = `Convert to number using Number() or parseFloat(), or ensure the input is numeric.`;
      }
      if (includeExamples) {
        example = `42`;
      }
      break;

    case 'NOT_BOOLEAN':
      enhancedMessage = `Expected a boolean at path "${path}", but got ${typeof received}.`;
      if (includeSuggestions) {
        suggestion = `Use true or false, or convert using Boolean().`;
      }
      if (includeExamples) {
        example = `true`;
      }
      break;

    case 'STRING_TOO_SHORT':
      enhancedMessage = `String at path "${path}" is too short. Minimum length is ${meta?.['min']}, but got ${meta?.['received']}.`;
      if (includeSuggestions) {
        suggestion = `Increase the string length or adjust the .min() constraint.`;
      }
      break;

    case 'STRING_TOO_LONG':
      enhancedMessage = `String at path "${path}" is too long. Maximum length is ${meta?.['max']}, but got ${meta?.['received']}.`;
      if (includeSuggestions) {
        suggestion = `Truncate the string or adjust the .max() constraint.`;
      }
      break;

    case 'NUMBER_TOO_SMALL':
      enhancedMessage = `Number at path "${path}" is too small. Minimum is ${meta?.['min']}, but got ${meta?.['received']}.`;
      if (includeSuggestions) {
        suggestion = `Increase the value or adjust the .min() constraint.`;
      }
      break;

    case 'NUMBER_TOO_BIG':
      enhancedMessage = `Number at path "${path}" is too large. Maximum is ${meta?.['max']}, but got ${meta?.['received']}.`;
      if (includeSuggestions) {
        suggestion = `Decrease the value or adjust the .max() constraint.`;
      }
      break;

    case 'STRING_INVALID_EMAIL':
      enhancedMessage = `The email address at path "${path}" is invalid.`;
      if (includeSuggestions) {
        suggestion = `Use a valid email format like "user@example.com".`;
      }
      if (includeExamples) {
        example = `"user@example.com"`;
      }
      break;

    case 'STRING_INVALID_URL':
      enhancedMessage = `The URL at path "${path}" is invalid.`;
      if (includeSuggestions) {
        suggestion = `Use a valid URL format like "https://example.com".`;
      }
      if (includeExamples) {
        example = `"https://example.com"`;
      }
      break;

    case 'NOT_ARRAY':
      enhancedMessage = `Expected an array at path "${path}", but got ${typeof received}.`;
      if (includeSuggestions) {
        suggestion = `Wrap the value in an array [] or ensure it's an array.`;
      }
      if (includeExamples) {
        example = `[1, 2, 3]`;
      }
      break;

    case 'NOT_OBJECT':
      enhancedMessage = `Expected an object at path "${path}", but got ${typeof received}.`;
      if (includeSuggestions) {
        suggestion = `Use an object literal {} or ensure it's an object.`;
      }
      if (includeExamples) {
        example = `{ key: "value" }`;
      }
      break;

    default:
      // Generic enhancement
      enhancedMessage = `Validation failed at path "${path}": ${message}`;
      confidence = 0.5;
      break;
  }

  // Add path context if not already included
  if (path && !enhancedMessage.includes(path)) {
    enhancedMessage = `At path "${path}": ${enhancedMessage}`;
  }

  // Construct docs URL
  const docsUrl = `https://firm-validator.dev/docs/errors/${code.toLowerCase()}`;

  return {
    original: error,
    message: enhancedMessage,
    suggestion: suggestion ?? undefined,
    example: example ?? undefined,
    docsUrl,
    confidence,
  };
}

/**
 * Format enhanced errors for console output.
 */
export function formatEnhancedErrors(errors: EnhancedError[]): string {
  return errors
    .map((err, idx) => {
      const lines = [
        `Error ${idx + 1}: ${err.message}`,
        err.suggestion && `  Suggestion: ${err.suggestion}`,
        err.example && `  Example: ${err.example}`,
        err.docsUrl && `  Docs: ${err.docsUrl}`,
        `  Confidence: ${Math.round(err.confidence * 100)}%`,
      ].filter(Boolean);
      return lines.join('\n');
    })
    .join('\n\n');
}

/**
 * Create a error handler that logs enhanced errors.
 */
export function createEnhancedErrorHandler(options: ErrorEnhancementOptions = {}) {
  return (errors: ValidationError[]) => {
    const enhanced = enhanceErrors(errors, options);
    console.error(formatEnhancedErrors(enhanced));
  };
}