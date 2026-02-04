/**
 * Tests for AI-powered error enhancement
 *
 * Coverage: ai-error-enhancer.ts
 * Target: 100% coverage (240 lines)
 */

import type { ValidationError, ErrorCode } from '../../../../src/common/types/result.js';
import {
  enhanceErrors,
  enhanceError,
  formatEnhancedErrors,
  createEnhancedErrorHandler,
  type EnhancedError,
  type ErrorEnhancementOptions,
} from '../../../../src/infrastructure/ai-errors/ai-error-enhancer.js';

// ============================================================================
// TEST HELPERS
// ============================================================================

function createError(
  code: ErrorCode,
  message: string,
  path = 'field',
  received: unknown = null,
  meta?: Record<string, unknown>
): ValidationError {
  return {
    code,
    message,
    path,
    received,
    meta,
  };
}

// ============================================================================
// ENHANCE ERRORS (BATCH)
// ============================================================================

describe('enhanceErrors', () => {
  it('should enhance multiple errors', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
      createError('NOT_NUMBER', 'Expected number', 'age', 'abc'),
    ];

    const enhanced = enhanceErrors(errors);

    expect(enhanced).toHaveLength(2);
    expect(enhanced[0]!.message).toContain('Expected a string');
    expect(enhanced[1]!.message).toContain('Expected a number');
  });

  it('should handle empty array', () => {
    const enhanced = enhanceErrors([]);
    expect(enhanced).toHaveLength(0);
  });

  it('should apply default options', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
    ];

    const enhanced = enhanceErrors(errors);

    expect(enhanced[0]!.suggestion).toBeDefined();
    expect(enhanced[0]!.example).toBeDefined();
  });

  it('should respect includeSuggestions option', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
    ];

    const enhanced = enhanceErrors(errors, { includeSuggestions: false });

    expect(enhanced[0]!.suggestion).toBeUndefined();
  });

  it('should respect includeExamples option', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
    ];

    const enhanced = enhanceErrors(errors, { includeExamples: false });

    expect(enhanced[0]!.example).toBeUndefined();
  });

  it('should pass language option', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
    ];

    const enhanced = enhanceErrors(errors, { language: 'javascript' });

    expect(enhanced[0]!.suggestion).toBeDefined();
  });
});

// ============================================================================
// ENHANCE ERROR - NOT_STRING
// ============================================================================

describe('enhanceError - NOT_STRING', () => {
  it('should enhance NOT_STRING error', () => {
    const error = createError('NOT_STRING', 'Expected string', 'name', 123);
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('Expected a string');
    expect(enhanced.message).toContain('name');
    expect(enhanced.message).toContain('number');
    expect(enhanced.suggestion).toContain('string');
    expect(enhanced.example).toBe('"example"');
    expect(enhanced.docsUrl).toContain('not_string');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle NOT_STRING without suggestions', () => {
    const error = createError('NOT_STRING', 'Expected string', 'name', 123);
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
    expect(enhanced.example).toBeDefined();
  });

  it('should handle NOT_STRING without examples', () => {
    const error = createError('NOT_STRING', 'Expected string', 'name', 123);
    const enhanced = enhanceError(error, { includeExamples: false });

    expect(enhanced.suggestion).toBeDefined();
    expect(enhanced.example).toBeUndefined();
  });

  it('should support typescript language for NOT_STRING', () => {
    const error = createError('NOT_STRING', 'Expected string', 'name', 123);
    const enhanced = enhanceError(error, { language: 'typescript' });

    expect(enhanced.suggestion).toContain('const value');
  });

  it('should support javascript language for NOT_STRING', () => {
    const error = createError('NOT_STRING', 'Expected string', 'name', 123);
    const enhanced = enhanceError(error, { language: 'javascript' });

    expect(enhanced.suggestion).toContain('const value');
  });
});

// ============================================================================
// ENHANCE ERROR - NOT_NUMBER
// ============================================================================

describe('enhanceError - NOT_NUMBER', () => {
  it('should enhance NOT_NUMBER error', () => {
    const error = createError('NOT_NUMBER', 'Expected number', 'age', 'abc');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('Expected a number');
    expect(enhanced.message).toContain('age');
    expect(enhanced.message).toContain('string');
    expect(enhanced.suggestion).toContain('Number()');
    expect(enhanced.example).toBe('42');
    expect(enhanced.docsUrl).toContain('not_number');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle NOT_NUMBER without suggestions', () => {
    const error = createError('NOT_NUMBER', 'Expected number', 'age', 'abc');
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });

  it('should handle NOT_NUMBER without examples', () => {
    const error = createError('NOT_NUMBER', 'Expected number', 'age', 'abc');
    const enhanced = enhanceError(error, { includeExamples: false });

    expect(enhanced.example).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - NOT_BOOLEAN
// ============================================================================

describe('enhanceError - NOT_BOOLEAN', () => {
  it('should enhance NOT_BOOLEAN error', () => {
    const error = createError('NOT_BOOLEAN', 'Expected boolean', 'active', 'yes');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('Expected a boolean');
    expect(enhanced.message).toContain('active');
    expect(enhanced.message).toContain('string');
    expect(enhanced.suggestion).toContain('true or false');
    expect(enhanced.example).toBe('true');
    expect(enhanced.docsUrl).toContain('not_boolean');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle NOT_BOOLEAN without suggestions', () => {
    const error = createError('NOT_BOOLEAN', 'Expected boolean', 'active', 'yes');
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });

  it('should handle NOT_BOOLEAN without examples', () => {
    const error = createError('NOT_BOOLEAN', 'Expected boolean', 'active', 'yes');
    const enhanced = enhanceError(error, { includeExamples: false });

    expect(enhanced.example).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - STRING_TOO_SHORT
// ============================================================================

describe('enhanceError - STRING_TOO_SHORT', () => {
  it('should enhance STRING_TOO_SHORT error', () => {
    const error = createError('STRING_TOO_SHORT', 'String too short', 'password', 'ab', {
      min: 8,
      received: 2,
    });
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too short');
    expect(enhanced.message).toContain('password');
    expect(enhanced.message).toContain('8');
    expect(enhanced.message).toContain('2');
    expect(enhanced.suggestion).toContain('Increase the string length');
    expect(enhanced.docsUrl).toContain('string_too_short');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle STRING_TOO_SHORT without meta', () => {
    const error = createError('STRING_TOO_SHORT', 'String too short', 'password', 'ab');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too short');
  });

  it('should handle STRING_TOO_SHORT without suggestions', () => {
    const error = createError('STRING_TOO_SHORT', 'String too short', 'password', 'ab', {
      min: 8,
      received: 2,
    });
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - STRING_TOO_LONG
// ============================================================================

describe('enhanceError - STRING_TOO_LONG', () => {
  it('should enhance STRING_TOO_LONG error', () => {
    const error = createError('STRING_TOO_LONG', 'String too long', 'username', 'a'.repeat(100), {
      max: 50,
      received: 100,
    });
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too long');
    expect(enhanced.message).toContain('username');
    expect(enhanced.message).toContain('50');
    expect(enhanced.message).toContain('100');
    expect(enhanced.suggestion).toContain('Truncate the string');
    expect(enhanced.docsUrl).toContain('string_too_long');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle STRING_TOO_LONG without meta', () => {
    const error = createError('STRING_TOO_LONG', 'String too long', 'username', 'a'.repeat(100));
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too long');
  });

  it('should handle STRING_TOO_LONG without suggestions', () => {
    const error = createError('STRING_TOO_LONG', 'String too long', 'username', 'a'.repeat(100), {
      max: 50,
      received: 100,
    });
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - NUMBER_TOO_SMALL
// ============================================================================

describe('enhanceError - NUMBER_TOO_SMALL', () => {
  it('should enhance NUMBER_TOO_SMALL error', () => {
    const error = createError('NUMBER_TOO_SMALL', 'Number too small', 'age', 5, {
      min: 18,
      received: 5,
    });
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too small');
    expect(enhanced.message).toContain('age');
    expect(enhanced.message).toContain('18');
    expect(enhanced.message).toContain('5');
    expect(enhanced.suggestion).toContain('Increase the value');
    expect(enhanced.docsUrl).toContain('number_too_small');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle NUMBER_TOO_SMALL without meta', () => {
    const error = createError('NUMBER_TOO_SMALL', 'Number too small', 'age', 5);
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too small');
  });

  it('should handle NUMBER_TOO_SMALL without suggestions', () => {
    const error = createError('NUMBER_TOO_SMALL', 'Number too small', 'age', 5, {
      min: 18,
      received: 5,
    });
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - NUMBER_TOO_BIG
// ============================================================================

describe('enhanceError - NUMBER_TOO_BIG', () => {
  it('should enhance NUMBER_TOO_BIG error', () => {
    const error = createError('NUMBER_TOO_BIG', 'Number too large', 'score', 150, {
      max: 100,
      received: 150,
    });
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too large');
    expect(enhanced.message).toContain('score');
    expect(enhanced.message).toContain('100');
    expect(enhanced.message).toContain('150');
    expect(enhanced.suggestion).toContain('Decrease the value');
    expect(enhanced.docsUrl).toContain('number_too_big');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle NUMBER_TOO_BIG without meta', () => {
    const error = createError('NUMBER_TOO_BIG', 'Number too large', 'score', 150);
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('too large');
  });

  it('should handle NUMBER_TOO_BIG without suggestions', () => {
    const error = createError('NUMBER_TOO_BIG', 'Number too large', 'score', 150, {
      max: 100,
      received: 150,
    });
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - STRING_INVALID_EMAIL
// ============================================================================

describe('enhanceError - STRING_INVALID_EMAIL', () => {
  it('should enhance STRING_INVALID_EMAIL error', () => {
    const error = createError('STRING_INVALID_EMAIL', 'Invalid email', 'email', 'notanemail');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('email address');
    expect(enhanced.message).toContain('invalid');
    expect(enhanced.message).toContain('email');
    expect(enhanced.suggestion).toContain('user@example.com');
    expect(enhanced.example).toBe('"user@example.com"');
    expect(enhanced.docsUrl).toContain('string_invalid_email');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle STRING_INVALID_EMAIL without suggestions', () => {
    const error = createError('STRING_INVALID_EMAIL', 'Invalid email', 'email', 'notanemail');
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });

  it('should handle STRING_INVALID_EMAIL without examples', () => {
    const error = createError('STRING_INVALID_EMAIL', 'Invalid email', 'email', 'notanemail');
    const enhanced = enhanceError(error, { includeExamples: false });

    expect(enhanced.example).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - STRING_INVALID_URL
// ============================================================================

describe('enhanceError - STRING_INVALID_URL', () => {
  it('should enhance STRING_INVALID_URL error', () => {
    const error = createError('STRING_INVALID_URL', 'Invalid URL', 'website', 'notaurl');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('URL');
    expect(enhanced.message).toContain('invalid');
    expect(enhanced.message).toContain('website');
    expect(enhanced.suggestion).toContain('https://example.com');
    expect(enhanced.example).toBe('"https://example.com"');
    expect(enhanced.docsUrl).toContain('string_invalid_url');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle STRING_INVALID_URL without suggestions', () => {
    const error = createError('STRING_INVALID_URL', 'Invalid URL', 'website', 'notaurl');
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });

  it('should handle STRING_INVALID_URL without examples', () => {
    const error = createError('STRING_INVALID_URL', 'Invalid URL', 'website', 'notaurl');
    const enhanced = enhanceError(error, { includeExamples: false });

    expect(enhanced.example).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - NOT_ARRAY
// ============================================================================

describe('enhanceError - NOT_ARRAY', () => {
  it('should enhance NOT_ARRAY error', () => {
    const error = createError('NOT_ARRAY', 'Expected array', 'items', 'notarray');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('Expected an array');
    expect(enhanced.message).toContain('items');
    expect(enhanced.message).toContain('string');
    expect(enhanced.suggestion).toContain('Wrap the value in an array');
    expect(enhanced.example).toBe('[1, 2, 3]');
    expect(enhanced.docsUrl).toContain('not_array');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle NOT_ARRAY without suggestions', () => {
    const error = createError('NOT_ARRAY', 'Expected array', 'items', 'notarray');
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });

  it('should handle NOT_ARRAY without examples', () => {
    const error = createError('NOT_ARRAY', 'Expected array', 'items', 'notarray');
    const enhanced = enhanceError(error, { includeExamples: false });

    expect(enhanced.example).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - NOT_OBJECT
// ============================================================================

describe('enhanceError - NOT_OBJECT', () => {
  it('should enhance NOT_OBJECT error', () => {
    const error = createError('NOT_OBJECT', 'Expected object', 'user', 'notobject');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('Expected an object');
    expect(enhanced.message).toContain('user');
    expect(enhanced.message).toContain('string');
    expect(enhanced.suggestion).toContain('object literal');
    expect(enhanced.example).toBe('{ key: "value" }');
    expect(enhanced.docsUrl).toContain('not_object');
    expect(enhanced.confidence).toBe(0.8);
  });

  it('should handle NOT_OBJECT without suggestions', () => {
    const error = createError('NOT_OBJECT', 'Expected object', 'user', 'notobject');
    const enhanced = enhanceError(error, { includeSuggestions: false });

    expect(enhanced.suggestion).toBeUndefined();
  });

  it('should handle NOT_OBJECT without examples', () => {
    const error = createError('NOT_OBJECT', 'Expected object', 'user', 'notobject');
    const enhanced = enhanceError(error, { includeExamples: false });

    expect(enhanced.example).toBeUndefined();
  });
});

// ============================================================================
// ENHANCE ERROR - UNKNOWN ERROR CODE
// ============================================================================

describe('enhanceError - Unknown Error Code', () => {
  it('should handle unknown error codes with generic enhancement', () => {
    const error = createError('UNKNOWN_ERROR', 'Custom error occurred', 'field', 'value');
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('Validation failed');
    expect(enhanced.message).toContain('field');
    expect(enhanced.message).toContain('Custom error occurred');
    expect(enhanced.confidence).toBe(0.5);
    expect(enhanced.docsUrl).toContain('unknown_error');
  });

  it('should not add duplicate path context for unknown errors', () => {
    const error = createError('UNKNOWN_ERROR', 'At path "field": error', 'field', 'value');
    const enhanced = enhanceError(error);

    // Should not duplicate the path
    const pathCount = (enhanced.message.match(/At path/g) || []).length;
    expect(pathCount).toBe(1);
  });
});

// ============================================================================
// PATH HANDLING
// ============================================================================

describe('enhanceError - Path Handling', () => {
  it('should add path context when not present', () => {
    const error = createError('NOT_STRING', 'Expected string', 'user.name', 123);
    const enhanced = enhanceError(error);

    expect(enhanced.message).toContain('user.name');
  });

  it('should not duplicate path if already in message', () => {
    const error = createError('NOT_STRING', 'At path "field": Expected string', 'field', 123);
    const enhanced = enhanceError(error);

    const pathCount = (enhanced.message.match(/field/g) || []).length;
    expect(pathCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle empty path', () => {
    const error = createError('NOT_STRING', 'Expected string', '', 123);
    const enhanced = enhanceError(error);

    expect(enhanced.message).toBeDefined();
  });
});

// ============================================================================
// FORMAT ENHANCED ERRORS
// ============================================================================

describe('formatEnhancedErrors', () => {
  it('should format single error', () => {
    const enhanced: EnhancedError[] = [
      {
        original: createError('NOT_STRING', 'Expected string', 'name', 123),
        message: 'Expected a string at path "name"',
        suggestion: 'Use a string value',
        example: '"example"',
        docsUrl: 'https://firm-validator.dev/docs/errors/not_string',
        confidence: 0.8,
      },
    ];

    const formatted = formatEnhancedErrors(enhanced);

    expect(formatted).toContain('Error 1:');
    expect(formatted).toContain('Expected a string');
    expect(formatted).toContain('Suggestion:');
    expect(formatted).toContain('Example:');
    expect(formatted).toContain('Docs:');
    expect(formatted).toContain('Confidence: 80%');
  });

  it('should format multiple errors', () => {
    const enhanced: EnhancedError[] = [
      {
        original: createError('NOT_STRING', 'Expected string', 'name', 123),
        message: 'Expected a string',
        docsUrl: 'https://firm-validator.dev/docs/errors/not_string',
        confidence: 0.8,
      },
      {
        original: createError('NOT_NUMBER', 'Expected number', 'age', 'abc'),
        message: 'Expected a number',
        docsUrl: 'https://firm-validator.dev/docs/errors/not_number',
        confidence: 0.8,
      },
    ];

    const formatted = formatEnhancedErrors(enhanced);

    expect(formatted).toContain('Error 1:');
    expect(formatted).toContain('Error 2:');
    expect(formatted).toContain('Expected a string');
    expect(formatted).toContain('Expected a number');
  });

  it('should handle errors without suggestion or example', () => {
    const enhanced: EnhancedError[] = [
      {
        original: createError('NOT_STRING', 'Expected string', 'name', 123),
        message: 'Expected a string',
        docsUrl: 'https://firm-validator.dev/docs/errors/not_string',
        confidence: 0.8,
      },
    ];

    const formatted = formatEnhancedErrors(enhanced);

    expect(formatted).not.toContain('Suggestion:');
    expect(formatted).not.toContain('Example:');
    expect(formatted).toContain('Docs:');
    expect(formatted).toContain('Confidence: 80%');
  });

  it('should handle empty array', () => {
    const formatted = formatEnhancedErrors([]);
    expect(formatted).toBe('');
  });

  it('should separate multiple errors with blank line', () => {
    const enhanced: EnhancedError[] = [
      {
        original: createError('NOT_STRING', 'Expected string', 'name', 123),
        message: 'Error 1',
        docsUrl: 'https://example.com',
        confidence: 0.8,
      },
      {
        original: createError('NOT_NUMBER', 'Expected number', 'age', 'abc'),
        message: 'Error 2',
        docsUrl: 'https://example.com',
        confidence: 0.8,
      },
    ];

    const formatted = formatEnhancedErrors(enhanced);

    expect(formatted).toContain('\n\n');
  });
});

// ============================================================================
// CREATE ENHANCED ERROR HANDLER
// ============================================================================

describe('createEnhancedErrorHandler', () => {
  it('should create a handler function', () => {
    const handler = createEnhancedErrorHandler();
    expect(typeof handler).toBe('function');
  });

  it('should log enhanced errors to console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = createEnhancedErrorHandler();
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
    ];

    handler(errors);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error 1:'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Expected a string'));

    consoleSpy.mockRestore();
  });

  it('should apply custom options', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = createEnhancedErrorHandler({ includeSuggestions: false });
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
    ];

    handler(errors);

    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).not.toContain('Suggestion:');

    consoleSpy.mockRestore();
  });

  it('should handle multiple errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const handler = createEnhancedErrorHandler();
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
      createError('NOT_NUMBER', 'Expected number', 'age', 'abc'),
    ];

    handler(errors);

    const output = consoleSpy.mock.calls[0]?.[0] as string;
    expect(output).toContain('Error 1:');
    expect(output).toContain('Error 2:');

    consoleSpy.mockRestore();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  it('should handle complete error enhancement workflow', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'user.name', 123),
      createError('STRING_INVALID_EMAIL', 'Invalid email', 'user.email', 'notanemail'),
      createError('NUMBER_TOO_SMALL', 'Number too small', 'user.age', 5, { min: 18, received: 5 }),
    ];

    const enhanced = enhanceErrors(errors, {
      includeSuggestions: true,
      includeExamples: true,
      language: 'typescript',
    });

    expect(enhanced).toHaveLength(3);
    expect(enhanced[0]!.message).toContain('string');
    expect(enhanced[1]!.message).toContain('email');
    expect(enhanced[2]!.message).toContain('too small');

    const formatted = formatEnhancedErrors(enhanced);
    expect(formatted).toContain('Error 1:');
    expect(formatted).toContain('Error 2:');
    expect(formatted).toContain('Error 3:');
  });

  it('should handle workflow with disabled options', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
      createError('NOT_NUMBER', 'Expected number', 'age', 'abc'),
    ];

    const enhanced = enhanceErrors(errors, {
      includeSuggestions: false,
      includeExamples: false,
    });

    expect(enhanced).toHaveLength(2);
    expect(enhanced[0]!.suggestion).toBeUndefined();
    expect(enhanced[0]!.example).toBeUndefined();
    expect(enhanced[1]!.suggestion).toBeUndefined();
    expect(enhanced[1]!.example).toBeUndefined();
  });

  it('should provide consistent docs URLs', () => {
    const errors: ValidationError[] = [
      createError('NOT_STRING', 'Expected string', 'name', 123),
      createError('NOT_NUMBER', 'Expected number', 'age', 'abc'),
      createError('STRING_INVALID_EMAIL', 'Invalid email', 'email', 'notanemail'),
    ];

    const enhanced = enhanceErrors(errors);

    enhanced.forEach((err) => {
      expect(err.docsUrl).toMatch(/^https:\/\/firm-validator\.dev\/docs\/errors\/[a-z_]+$/);
    });
  });
});
