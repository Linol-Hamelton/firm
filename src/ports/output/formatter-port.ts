/**
 * LAYER 2: Output Ports
 *
 * Output ports define how FIRM interacts with external systems.
 * These are the "driven" adapters in Hexagonal Architecture.
 *
 * Examples of output adapters:
 * - Error formatters
 * - Loggers
 * - Cache providers
 * - Telemetry collectors
 */

import type { ValidationError, ErrorCode } from '../../common/types/result.js';

// ============================================================================
// ERROR FORMATTER PORT
// ============================================================================

/**
 * Port for formatting validation errors.
 * Allows customizing error output for different contexts.
 */
export interface ErrorFormatterPort {
  /**
   * Format a single error.
   */
  formatError(error: ValidationError): string;

  /**
   * Format multiple errors.
   */
  formatErrors(errors: readonly ValidationError[]): string;

  /**
   * Format errors as structured object (for JSON responses).
   */
  formatAsObject(errors: readonly ValidationError[]): object;
}

// ============================================================================
// MESSAGE PROVIDER PORT
// ============================================================================

/**
 * Port for providing custom error messages.
 * Used for i18n and custom error text.
 */
export interface MessageProviderPort {
  /**
   * Get message for error code.
   */
  getMessage(code: ErrorCode, params?: Record<string, unknown>): string;

  /**
   * Get all messages for a locale.
   */
  getMessages(locale: string): Record<ErrorCode, string>;

  /**
   * Set current locale.
   */
  setLocale(locale: string): void;

  /**
   * Get current locale.
   */
  getLocale(): string;
}

// ============================================================================
// CACHE PORT
// ============================================================================

/**
 * Port for caching compiled schemas.
 * Improves performance for repeated validations.
 */
export interface CachePort<T> {
  /**
   * Get cached value.
   */
  get(key: string): T | undefined;

  /**
   * Set cached value.
   */
  set(key: string, value: T): void;

  /**
   * Check if key exists.
   */
  has(key: string): boolean;

  /**
   * Delete cached value.
   */
  delete(key: string): boolean;

  /**
   * Clear all cached values.
   */
  clear(): void;

  /**
   * Get cache size.
   */
  size(): number;
}

// ============================================================================
// LOGGER PORT
// ============================================================================

/**
 * Log levels.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Port for logging.
 * Allows integration with different logging systems.
 */
export interface LoggerPort {
  /**
   * Log debug message.
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log info message.
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log warning message.
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log error message.
   */
  error(message: string, meta?: Record<string, unknown>): void;

  /**
   * Create child logger with context.
   */
  child(context: Record<string, unknown>): LoggerPort;
}

// ============================================================================
// TELEMETRY PORT
// ============================================================================

/**
 * Port for telemetry and metrics.
 * Allows tracking validation performance and errors.
 */
export interface TelemetryPort {
  /**
   * Record validation timing.
   */
  recordValidation(schemaType: string, durationMs: number, success: boolean): void;

  /**
   * Record validation error.
   */
  recordError(code: ErrorCode, schemaType: string): void;

  /**
   * Increment counter.
   */
  incrementCounter(name: string, tags?: Record<string, string>): void;

  /**
   * Record gauge value.
   */
  recordGauge(name: string, value: number, tags?: Record<string, string>): void;
}

// ============================================================================
// SCHEMA REGISTRY PORT
// ============================================================================

/**
 * Port for schema registry.
 * Allows storing and retrieving schemas by name/version.
 */
export interface SchemaRegistryPort {
  /**
   * Register a schema.
   */
  register(name: string, schema: unknown, version?: string): void;

  /**
   * Get a schema by name.
   */
  get(name: string, version?: string): unknown | undefined;

  /**
   * Check if schema exists.
   */
  has(name: string, version?: string): boolean;

  /**
   * List all registered schemas.
   */
  list(): Array<{ name: string; version: string }>;

  /**
   * Remove a schema.
   */
  remove(name: string, version?: string): boolean;
}
