/**
 * Tests for ValidationError utilities
 */

import {
  ValidationException,
  isValidationException,
  isFirmError,
} from '../../../src/common/errors/validation-error.js';
import { ErrorCode } from '../../../src/common/types/result.js';

describe('ValidationError', () => {
  describe('ValidationException', () => {
    it('should create ValidationException with errors', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Expected string',
          path: 'field',
          received: 123,
        },
      ];

      const exception = new ValidationException(errors);

      expect(exception).toBeInstanceOf(ValidationException);
      expect(exception.errors).toEqual(errors);
      expect(exception.message).toContain('Expected string');
    });

    it('should have correct name', () => {
      const exception = new ValidationException([]);

      expect(exception.name).toBe('ValidationException');
    });

    it('should have correct code', () => {
      const exception = new ValidationException([]);

      expect(exception.code).toBe('VALIDATION_FAILED');
    });

    it('should format single error without path', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Expected string',
          path: '',
          received: 123,
        },
      ];

      const exception = new ValidationException(errors);

      expect(exception.message).toBe('Expected string');
    });

    it('should format single error with path', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Expected string',
          path: 'user.name',
          received: 123,
        },
      ];

      const exception = new ValidationException(errors);

      expect(exception.message).toBe('user.name: Expected string');
    });

    it('should format multiple errors', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Expected string',
          path: 'name',
          received: 123,
        },
        {
          code: ErrorCode.NOT_NUMBER,
          message: 'Expected number',
          path: 'age',
          received: 'old',
        },
      ];

      const exception = new ValidationException(errors);

      expect(exception.message).toContain('Validation failed with 2 errors');
      expect(exception.message).toContain('name: Expected string');
      expect(exception.message).toContain('age: Expected number');
    });

    it('should handle errors without paths in multiple errors', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Error 1',
          path: '',
          received: null,
        },
        {
          code: ErrorCode.NOT_NUMBER,
          message: 'Error 2',
          path: 'field',
          received: null,
        },
      ];

      const exception = new ValidationException(errors);

      expect(exception.message).toContain('- Error 1');
      expect(exception.message).toContain('- field: Error 2');
    });

    it('should support custom message', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Expected string',
          path: 'field',
          received: 123,
        },
      ];

      const exception = new ValidationException(errors, 'Custom error message');

      expect(exception.message).toBe('Custom error message');
    });

    it('should get first error', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Error 1',
          path: 'field1',
          received: 123,
        },
        {
          code: ErrorCode.NOT_NUMBER,
          message: 'Error 2',
          path: 'field2',
          received: 'text',
        },
      ];

      const exception = new ValidationException(errors);

      expect(exception.firstError).toEqual(errors[0]);
    });

    it('should return undefined for firstError when no errors', () => {
      const exception = new ValidationException([]);

      expect(exception.firstError).toBeUndefined();
    });

    it('should get errors at specific path', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Error 1',
          path: 'user.name',
          received: 123,
        },
        {
          code: ErrorCode.NOT_NUMBER,
          message: 'Error 2',
          path: 'user.age',
          received: 'text',
        },
        {
          code: ErrorCode.NOT_BOOLEAN,
          message: 'Error 3',
          path: 'admin',
          received: 'yes',
        },
      ];

      const exception = new ValidationException(errors);

      const userErrors = exception.errorsAt('user');
      expect(userErrors).toHaveLength(2);
      expect(userErrors[0]?.path).toBe('user.name');
      expect(userErrors[1]?.path).toBe('user.age');
    });

    it('should get error at exact path', () => {
      const errors = [
        {
          code: ErrorCode.NOT_STRING,
          message: 'Error',
          path: 'field',
          received: 123,
        },
      ];

      const exception = new ValidationException(errors);

      const fieldErrors = exception.errorsAt('field');
      expect(fieldErrors).toHaveLength(1);
    });
  });

  describe('isValidationException', () => {
    it('should return true for ValidationException', () => {
      const error = new ValidationException([]);

      expect(isValidationException(error)).toBe(true);
    });

    it('should return false for other Error types', () => {
      const error = new Error('Regular error');

      expect(isValidationException(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isValidationException(null)).toBe(false);
      expect(isValidationException({})).toBe(false);
      expect(isValidationException('error')).toBe(false);
    });
  });

  describe('isFirmError', () => {
    it('should return true for ValidationException (extends FirmError)', () => {
      const error = new ValidationException([]);

      expect(isFirmError(error)).toBe(true);
    });

    it('should return false for other Error types', () => {
      const error = new Error('Regular error');

      expect(isFirmError(error)).toBe(false);
    });

    it('should return false for non-Error values', () => {
      expect(isFirmError(null)).toBe(false);
      expect(isFirmError({})).toBe(false);
      expect(isFirmError(123)).toBe(false);
    });
  });
});
