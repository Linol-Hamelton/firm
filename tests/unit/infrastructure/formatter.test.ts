/**
 * Error Formatter Tests
 */

import { describe, it, expect } from 'vitest';
import {
  DefaultErrorFormatter,
  JsonErrorFormatter,
  FlatErrorFormatter,
  I18nErrorFormatter,
  createErrorFormatter,
} from '../../../src/infrastructure/formatting/error-formatter.js';
import type { ValidationError } from '../../../src/common/types/result.js';
import { ErrorCode } from '../../../src/common/types/result.js';

const createTestError = (
  path: string,
  code: string,
  message: string
): ValidationError => ({
  path,
  code: code as any,
  message,
});

describe('DefaultErrorFormatter', () => {
  const formatter = new DefaultErrorFormatter();

  describe('formatError', () => {
    it('should format single error with path', () => {
      const error = createTestError('user.name', 'NOT_STRING', 'Expected string');
      const result = formatter.formatError(error);

      expect(result).toContain('user.name');
      expect(result).toContain('Expected string');
    });

    it('should format error without path', () => {
      const error = createTestError('', 'NOT_STRING', 'Expected string');
      const result = formatter.formatError(error);

      expect(result).toBe('Expected string');
    });
  });

  describe('formatErrors', () => {
    it('should format multiple errors', () => {
      const errors = [
        createTestError('name', 'NOT_STRING', 'Expected string'),
        createTestError('age', 'NOT_NUMBER', 'Expected number'),
      ];
      const result = formatter.formatErrors(errors);

      expect(result).toContain('name');
      expect(result).toContain('age');
    });

    it('should return empty string for no errors', () => {
      expect(formatter.formatErrors([])).toBe('');
    });

    it('should format single error without bullet', () => {
      const errors = [createTestError('name', 'NOT_STRING', 'Expected string')];
      const result = formatter.formatErrors(errors);

      expect(result).not.toContain('- ');
    });
  });

  describe('formatAsObject', () => {
    it('should return object with success false', () => {
      const errors = [createTestError('name', 'NOT_STRING', 'Expected string')];
      const result = formatter.formatAsObject(errors) as any;

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    it('should include error details', () => {
      const errors = [createTestError('name', 'NOT_STRING', 'Expected string')];
      const result = formatter.formatAsObject(errors) as any;

      expect(result.errors[0].path).toBe('name');
      expect(result.errors[0].code).toBe('NOT_STRING');
      expect(result.errors[0].message).toBe('Expected string');
    });
  });

  describe('options', () => {
    it('should include code when includeCode is true', () => {
      const formatter = new DefaultErrorFormatter({ includeCode: true });
      const error = createTestError('name', 'NOT_STRING', 'Expected string');
      const result = formatter.formatError(error);

      expect(result).toContain('[NOT_STRING]');
    });

    it('should not include path when includePath is false', () => {
      const formatter = new DefaultErrorFormatter({ includePath: false });
      const error = createTestError('user.name', 'NOT_STRING', 'Expected string');
      const result = formatter.formatError(error);

      expect(result).not.toContain('user.name');
    });
  });
});

describe('JsonErrorFormatter', () => {
  const formatter = new JsonErrorFormatter();

  describe('formatError', () => {
    it('should return valid JSON string', () => {
      const error = createTestError('name', 'NOT_STRING', 'Expected string');
      const result = formatter.formatError(error);

      const parsed = JSON.parse(result);
      expect(parsed.path).toBe('name');
      expect(parsed.code).toBe('NOT_STRING');
    });
  });

  describe('formatErrors', () => {
    it('should return valid JSON string', () => {
      const errors = [createTestError('name', 'NOT_STRING', 'Expected string')];
      const result = formatter.formatErrors(errors);

      const parsed = JSON.parse(result);
      expect(parsed.valid).toBe(false);
      expect(parsed.errorCount).toBe(1);
    });
  });

  describe('formatAsObject', () => {
    it('should group errors by path', () => {
      const errors = [
        createTestError('user.name', 'NOT_STRING', 'Expected string'),
        createTestError('user.name', 'STRING_TOO_SHORT', 'Too short'),
        createTestError('user.age', 'NOT_NUMBER', 'Expected number'),
      ];
      const result = formatter.formatAsObject(errors) as any;

      expect(result.errors['user.name']).toHaveLength(2);
      expect(result.errors['user.age']).toHaveLength(1);
    });
  });
});

describe('FlatErrorFormatter', () => {
  const formatter = new FlatErrorFormatter();

  describe('formatAsObject', () => {
    it('should return flat key-value pairs', () => {
      const errors = [
        createTestError('name', 'NOT_STRING', 'Expected string'),
        createTestError('age', 'NOT_NUMBER', 'Expected number'),
      ];
      const result = formatter.formatAsObject(errors) as Record<string, string>;

      expect(result['name']).toBe('Expected string');
      expect(result['age']).toBe('Expected number');
    });

    it('should use _root for empty path', () => {
      const errors = [createTestError('', 'NOT_STRING', 'Expected string')];
      const result = formatter.formatAsObject(errors) as Record<string, string>;

      expect(result['_root']).toBe('Expected string');
    });

    it('should keep only first error per field', () => {
      const errors = [
        createTestError('name', 'NOT_STRING', 'First error'),
        createTestError('name', 'STRING_TOO_SHORT', 'Second error'),
      ];
      const result = formatter.formatAsObject(errors) as Record<string, string>;

      expect(result['name']).toBe('First error');
    });
  });
});

describe('I18nErrorFormatter', () => {
  describe('custom messages', () => {
    it('should use custom messages', () => {
      const formatter = new I18nErrorFormatter({
        NOT_STRING: 'Ожидается строка',
      });
      const error = createTestError('name', ErrorCode.NOT_STRING, 'Expected string');
      const result = formatter.formatError(error);

      expect(result).toContain('Ожидается строка');
    });
  });

  describe('withLocale', () => {
    it('should create formatter with different locale', () => {
      const formatter = new I18nErrorFormatter({}, 'en');
      const ruFormatter = formatter.withLocale('ru', {
        NOT_STRING: 'Ожидается строка',
      });

      const error = createTestError('name', ErrorCode.NOT_STRING, 'Expected string');
      const result = ruFormatter.formatAsObject([error]) as any;

      expect(result.locale).toBe('ru');
    });
  });
});

describe('createErrorFormatter', () => {
  it('should create default formatter', () => {
    const formatter = createErrorFormatter('default');
    expect(formatter).toBeInstanceOf(DefaultErrorFormatter);
  });

  it('should create json formatter', () => {
    const formatter = createErrorFormatter('json');
    expect(formatter).toBeInstanceOf(JsonErrorFormatter);
  });

  it('should create flat formatter', () => {
    const formatter = createErrorFormatter('flat');
    expect(formatter).toBeInstanceOf(FlatErrorFormatter);
  });

  it('should create i18n formatter', () => {
    const formatter = createErrorFormatter('i18n');
    expect(formatter).toBeInstanceOf(I18nErrorFormatter);
  });
});
