/**
 * LAYER 3: Performance Budgets & Monitoring
 *
 * Monitor validation performance and enforce performance budgets.
 * Alerts when validation exceeds time or memory thresholds.
 *
 * Target: Ensure validation never exceeds 1ms p95 for typical schemas.
 */

import type { Schema } from '../../common/types/schema.js';
import type { ValidationResult } from '../../common/types/result.js';

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceMetrics {
  /** Validation duration in milliseconds */
  duration: number;
  /** Timestamp when validation started */
  timestamp: number;
  /** Schema type */
  schemaType: string;
  /** Whether validation succeeded */
  success: boolean;
  /** Memory usage delta (bytes) - optional */
  memoryDelta?: number;
}

export interface PerformanceBudget {
  /** Maximum allowed duration in milliseconds */
  maxDuration: number;
  /** Maximum allowed memory increase in bytes */
  maxMemoryIncrease?: number;
  /** Action when budget exceeded: 'warn' | 'throw' | 'log' */
  action: 'warn' | 'throw' | 'log';
}

export interface PerformanceMonitorOptions {
  /** Default performance budget */
  defaultBudget?: PerformanceBudget;
  /** Whether to enable monitoring (default: true) */
  enabled?: boolean;
  /** Callback when budget exceeded */
  onBudgetExceeded?: (metrics: PerformanceMetrics, budget: PerformanceBudget) => void;
  /** Callback for each validation */
  onValidation?: (metrics: PerformanceMetrics) => void;
}

// ============================================================================
// PERFORMANCE MONITOR
// ============================================================================

/**
 * Performance monitor for FIRM validations.
 * Wraps schema validation with timing and budget enforcement.
 *
 * @example
 * ```ts
 * const monitoredSchema = withPerformanceMonitor(schema, {
 *   defaultBudget: { maxDuration: 10, action: 'warn' }
 * });
 * const result = monitoredSchema.validate(data);
 * ```
 */
export class PerformanceMonitor {
  private options: Required<PerformanceMonitorOptions>;
  private metrics: PerformanceMetrics[] = [];

  constructor(options: PerformanceMonitorOptions = {}) {
    this.options = {
      enabled: true,
      defaultBudget: {
        maxDuration: 100, // 100ms default
        action: 'warn',
      },
      onBudgetExceeded: (metrics, budget) => {
        console.warn(
          `Performance budget exceeded: ${metrics.duration}ms > ${budget.maxDuration}ms for ${metrics.schemaType}`
        );
      },
      onValidation: () => {},
      ...options,
    };
  }

  /**
   * Wrap a schema with performance monitoring.
   */
  wrapSchema<T>(schema: Schema<T>): Schema<T> {
    if (!this.options.enabled) {
      return schema;
    }

    const monitor = this;
    const schemaType = schema._type;

    // Create a proxy that intercepts validate calls
    return new Proxy(schema, {
      get(target, prop, receiver) {
        const original = Reflect.get(target, prop, receiver);

        if (prop === 'validate') {
          return function (data: unknown): ValidationResult<T> {
            return monitor.measureValidation(
              () => original.call(target, data),
              schemaType,
              'validate'
            );
          };
        }

        if (prop === 'validateAsync') {
          return function (data: unknown): Promise<ValidationResult<T>> {
            return monitor.measureAsyncValidation(
              () => original.call(target, data),
              schemaType,
              'validateAsync'
            );
          };
        }

        return original;
      },
    });
  }

  /**
   * Measure synchronous validation.
   */
  private measureValidation<T>(
    fn: () => ValidationResult<T>,
    schemaType: string,
    _method: string
  ): ValidationResult<T> {
    const start = performance.now();
    const startMemory = this.getMemoryUsage();
    const result = fn();
    const end = performance.now();
    const endMemory = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      duration: end - start,
      timestamp: Date.now(),
      schemaType,
      success: result.ok,
      memoryDelta: endMemory - startMemory,
    };

    this.metrics.push(metrics);
    this.options.onValidation(metrics);
    this.checkBudget(metrics);

    return result;
  }

  /**
   * Measure asynchronous validation.
   */
  private async measureAsyncValidation<T>(
    fn: () => Promise<ValidationResult<T>>,
    schemaType: string,
    _method: string
  ): Promise<ValidationResult<T>> {
    const start = performance.now();
    const startMemory = this.getMemoryUsage();
    const result = await fn();
    const end = performance.now();
    const endMemory = this.getMemoryUsage();

    const metrics: PerformanceMetrics = {
      duration: end - start,
      timestamp: Date.now(),
      schemaType,
      success: result.ok,
      memoryDelta: endMemory - startMemory,
    };

    this.metrics.push(metrics);
    this.options.onValidation(metrics);
    this.checkBudget(metrics);

    return result;
  }

  /**
   * Check if metrics exceed budget.
   */
  private checkBudget(metrics: PerformanceMetrics): void {
    const budget = this.options.defaultBudget;
    if (metrics.duration > budget.maxDuration) {
      this.options.onBudgetExceeded(metrics, budget);

      switch (budget.action) {
        case 'throw':
          throw new Error(
            `Performance budget exceeded: ${metrics.duration}ms > ${budget.maxDuration}ms`
          );
        case 'warn':
          console.warn(
            `Performance budget exceeded: ${metrics.duration}ms > ${budget.maxDuration}ms`
          );
          break;
        case 'log':
          console.log(
            `Performance budget exceeded: ${metrics.duration}ms > ${budget.maxDuration}ms`
          );
          break;
      }
    }
  }

  /**
   * Get current memory usage (Node.js only).
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Get all collected metrics.
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear collected metrics.
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get summary statistics.
   */
  getStats() {
    if (this.metrics.length === 0) {
      return null;
    }

    const durations = this.metrics.map((m) => m.duration);
    const sum = durations.reduce((a, b) => a + b, 0);
    const avg = sum / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    // Calculate percentiles
    const sorted = [...durations].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    return {
      count: this.metrics.length,
      avg,
      min,
      max,
      p50,
      p95,
      p99,
      totalDuration: sum,
    };
  }
}

/**
 * Create a performance monitor instance.
 */
export function createPerformanceMonitor(options?: PerformanceMonitorOptions) {
  return new PerformanceMonitor(options);
}

/**
 * Wrap schema with performance monitoring.
 * Shorthand for monitor.wrapSchema().
 */
export function withPerformanceMonitor<T>(
  schema: Schema<T>,
  options?: PerformanceMonitorOptions
): Schema<T> {
  const monitor = createPerformanceMonitor(options);
  return monitor.wrapSchema(schema);
}

/**
 * Global performance monitor instance.
 */
export const globalPerformanceMonitor = createPerformanceMonitor();

/**
 * Default export.
 */
export default {
  PerformanceMonitor,
  createPerformanceMonitor,
  withPerformanceMonitor,
  globalPerformanceMonitor,
};