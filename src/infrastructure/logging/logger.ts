/**
 * LAYER 3: Logger Implementation
 *
 * Default logger implementations for FIRM.
 * Provides console logging and no-op logger.
 */

import type { LoggerPort, LogLevel } from '../../ports/output/formatter-port.js';

// ============================================================================
// CONSOLE LOGGER
// ============================================================================

/**
 * Simple console logger implementation.
 */
export class ConsoleLogger implements LoggerPort {
  private readonly prefix: string;
  private readonly minLevel: LogLevel;
  private readonly context: Record<string, unknown>;

  private static readonly LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: ConsoleLoggerOptions = {}) {
    this.prefix = options.prefix ?? '[FIRM]';
    this.minLevel = options.minLevel ?? 'info';
    this.context = options.context ?? {};
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  child(context: Record<string, unknown>): LoggerPort {
    return new ConsoleLogger({
      prefix: this.prefix,
      minLevel: this.minLevel,
      context: { ...this.context, ...context },
    });
  }

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (ConsoleLogger.LEVELS[level] < ConsoleLogger.LEVELS[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const allMeta = { ...this.context, ...meta };
    const metaStr = Object.keys(allMeta).length > 0 ? ` ${JSON.stringify(allMeta)}` : '';

    const logMessage = `${timestamp} ${this.prefix} [${level.toUpperCase()}] ${message}${metaStr}`;

    switch (level) {
      case 'debug':
        console.debug(logMessage);
        break;
      case 'info':
        console.info(logMessage);
        break;
      case 'warn':
        console.warn(logMessage);
        break;
      case 'error':
        console.error(logMessage);
        break;
    }
  }
}

export interface ConsoleLoggerOptions {
  prefix?: string;
  minLevel?: LogLevel;
  context?: Record<string, unknown>;
}

// ============================================================================
// NO-OP LOGGER
// ============================================================================

/**
 * No-operation logger that does nothing.
 * Useful for testing or when logging should be disabled.
 */
export class NoOpLogger implements LoggerPort {
  debug(_message: string, _meta?: Record<string, unknown>): void {
    // No-op
  }

  info(_message: string, _meta?: Record<string, unknown>): void {
    // No-op
  }

  warn(_message: string, _meta?: Record<string, unknown>): void {
    // No-op
  }

  error(_message: string, _meta?: Record<string, unknown>): void {
    // No-op
  }

  child(_context: Record<string, unknown>): LoggerPort {
    return this;
  }
}

// ============================================================================
// BUFFERED LOGGER
// ============================================================================

interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  meta?: Record<string, unknown>;
}

/**
 * Logger that buffers log entries.
 * Useful for testing or batch processing.
 */
export class BufferedLogger implements LoggerPort {
  private readonly entries: LogEntry[] = [];
  private readonly maxEntries: number;
  private readonly context: Record<string, unknown>;

  constructor(options: BufferedLoggerOptions = {}) {
    this.maxEntries = options.maxEntries ?? 1000;
    this.context = options.context ?? {};
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.add('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.add('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.add('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.add('error', message, meta);
  }

  child(context: Record<string, unknown>): LoggerPort {
    const child = new BufferedLogger({
      maxEntries: this.maxEntries,
      context: { ...this.context, ...context },
    });
    // Share entries array with parent
    (child as any).entries = this.entries;
    return child;
  }

  private add(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (this.entries.length >= this.maxEntries) {
      this.entries.shift(); // Remove oldest
    }

    this.entries.push({
      timestamp: new Date(),
      level,
      message,
      meta: { ...this.context, ...meta },
    });
  }

  /**
   * Get all log entries.
   */
  getEntries(): readonly LogEntry[] {
    return this.entries;
  }

  /**
   * Get entries by level.
   */
  getEntriesByLevel(level: LogLevel): readonly LogEntry[] {
    return this.entries.filter((e) => e.level === level);
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    this.entries.length = 0;
  }

  /**
   * Get entry count.
   */
  count(): number {
    return this.entries.length;
  }

  /**
   * Check if has any errors.
   */
  hasErrors(): boolean {
    return this.entries.some((e) => e.level === 'error');
  }
}

export interface BufferedLoggerOptions {
  maxEntries?: number;
  context?: Record<string, unknown>;
}

// ============================================================================
// FACTORY
// ============================================================================

/**
 * Create logger with specified type.
 */
export function createLogger(
  type: 'console' | 'noop' | 'buffered' = 'console',
  options?: ConsoleLoggerOptions | BufferedLoggerOptions
): LoggerPort {
  switch (type) {
    case 'noop':
      return new NoOpLogger();
    case 'buffered':
      return new BufferedLogger(options as BufferedLoggerOptions);
    default:
      return new ConsoleLogger(options as ConsoleLoggerOptions);
  }
}

// ============================================================================
// GLOBAL LOGGER INSTANCE
// ============================================================================

let globalLogger: LoggerPort = new NoOpLogger();

/**
 * Set global logger instance.
 */
export function setGlobalLogger(logger: LoggerPort): void {
  globalLogger = logger;
}

/**
 * Get global logger instance.
 */
export function getGlobalLogger(): LoggerPort {
  return globalLogger;
}
