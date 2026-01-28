/**
 * LAYER 3: Error Formatter Implementation
 *
 * Default implementation of ErrorFormatterPort.
 * Provides various formatting options for validation errors.
 */

import type { ErrorFormatterPort } from '../../ports/output/formatter-port.js';
import type { ValidationError, ErrorCode } from '../../common/types/result.js';
import { resolveMessage, type MessageParams } from '../../common/constants/messages.js';

// ============================================================================
// DEFAULT ERROR FORMATTER
// ============================================================================

/**
 * Default error formatter implementation.
 */
export class DefaultErrorFormatter implements ErrorFormatterPort {
  constructor(
    private readonly options: ErrorFormatterOptions = {}
  ) {}

  formatError(error: ValidationError): string {
    const { includeCode = false, includePath = true } = this.options;

    let message = error.message;

    if (includePath && error.path) {
      message = `${error.path}: ${message}`;
    }

    if (includeCode) {
      message = `[${error.code}] ${message}`;
    }

    return message;
  }

  formatErrors(errors: readonly ValidationError[]): string {
    if (errors.length === 0) {
      return '';
    }

    if (errors.length === 1) {
      return this.formatError(errors[0]!);
    }

    const { separator = '\n', bullet = '- ' } = this.options;
    const messages = errors.map((e) => `${bullet}${this.formatError(e)}`);

    return messages.join(separator);
  }

  formatAsObject(errors: readonly ValidationError[]): ErrorObject {
    return {
      success: false,
      errors: errors.map((e) => ({
        path: e.path,
        code: e.code,
        message: e.message,
        ...(e.received !== undefined && { received: e.received }),
        ...(e.expected !== undefined && { expected: e.expected }),
      })),
    };
  }
}

export interface ErrorFormatterOptions {
  /** Include error code in message */
  includeCode?: boolean;
  /** Include path in message */
  includePath?: boolean;
  /** Separator between errors */
  separator?: string;
  /** Bullet prefix for list items */
  bullet?: string;
}

export interface ErrorObject {
  success: false;
  errors: Array<{
    path: string;
    code: string;
    message: string;
    received?: unknown;
    expected?: unknown;
  }>;
}

// ============================================================================
// JSON ERROR FORMATTER
// ============================================================================

/**
 * Formatter optimized for JSON API responses.
 */
export class JsonErrorFormatter implements ErrorFormatterPort {
  formatError(error: ValidationError): string {
    return JSON.stringify({
      path: error.path,
      code: error.code,
      message: error.message,
    });
  }

  formatErrors(errors: readonly ValidationError[]): string {
    return JSON.stringify(this.formatAsObject(errors));
  }

  formatAsObject(errors: readonly ValidationError[]): object {
    // Group errors by path for nested structure
    const byPath: Record<string, ValidationError[]> = {};

    for (const error of errors) {
      const path = error.path || '_root';
      if (!byPath[path]) {
        byPath[path] = [];
      }
      byPath[path]!.push(error);
    }

    return {
      valid: false,
      errorCount: errors.length,
      errors: byPath,
    };
  }
}

// ============================================================================
// FLAT ERROR FORMATTER
// ============================================================================

/**
 * Formatter that produces flat key-value pairs.
 * Useful for form validation display.
 */
export class FlatErrorFormatter implements ErrorFormatterPort {
  formatError(error: ValidationError): string {
    return error.message;
  }

  formatErrors(errors: readonly ValidationError[]): string {
    return errors.map((e) => this.formatError(e)).join('; ');
  }

  formatAsObject(errors: readonly ValidationError[]): Record<string, string> {
    const result: Record<string, string> = {};

    for (const error of errors) {
      const key = error.path || '_root';
      // Only keep first error per field
      if (!result[key]) {
        result[key] = error.message;
      }
    }

    return result;
  }
}

// ============================================================================
// I18N ERROR FORMATTER
// ============================================================================

/**
 * Formatter with i18n support.
 */
export class I18nErrorFormatter implements ErrorFormatterPort {
  constructor(
    private readonly messages: Partial<Record<ErrorCode, string>> = {},
    private readonly locale: string = 'en'
  ) {}

  formatError(error: ValidationError): string {
    // Use custom message if available, otherwise default
    const message = resolveMessage(
      error.code,
      error.meta as MessageParams,
      this.messages
    );

    return error.path ? `${error.path}: ${message}` : message;
  }

  formatErrors(errors: readonly ValidationError[]): string {
    return errors.map((e) => this.formatError(e)).join('\n');
  }

  formatAsObject(errors: readonly ValidationError[]): object {
    return {
      locale: this.locale,
      errors: errors.map((e) => ({
        path: e.path,
        code: e.code,
        message: this.formatError(e),
      })),
    };
  }

  /**
   * Create formatter with different locale.
   */
  withLocale(locale: string, messages: Partial<Record<ErrorCode, string>>): I18nErrorFormatter {
    return new I18nErrorFormatter(messages, locale);
  }
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create error formatter with options.
 */
export function createErrorFormatter(
  type: 'default' | 'json' | 'flat' | 'i18n' = 'default',
  options?: ErrorFormatterOptions | Partial<Record<ErrorCode, string>>
): ErrorFormatterPort {
  switch (type) {
    case 'json':
      return new JsonErrorFormatter();
    case 'flat':
      return new FlatErrorFormatter();
    case 'i18n':
      return new I18nErrorFormatter(options as Partial<Record<ErrorCode, string>>);
    default:
      return new DefaultErrorFormatter(options as ErrorFormatterOptions);
  }
}
