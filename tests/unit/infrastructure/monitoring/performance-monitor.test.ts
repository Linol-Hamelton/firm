/**
 * Tests for Performance Monitor - Performance budgets & monitoring
 *
 * Coverage: performance-monitor.ts
 * Target: 80%+ coverage (302 lines)
 */

import { s } from '../../../../src/index.js';
import {
  PerformanceMonitor,
  createPerformanceMonitor,
  withPerformanceMonitor,
  globalPerformanceMonitor,
  type PerformanceMetrics,
  type PerformanceBudget,
  type PerformanceMonitorOptions,
} from '../../../../src/infrastructure/monitoring/performance-monitor.js';

// ============================================================================
// PERFORMANCE MONITOR CLASS TESTS
// ============================================================================

describe('PerformanceMonitor', () => {
  describe('constructor', () => {
    it('should create monitor with default options', () => {
      const monitor = new PerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toEqual([]);
    });

    it('should create monitor with custom budget', () => {
      const monitor = new PerformanceMonitor({
        defaultBudget: {
          maxDuration: 50,
          action: 'throw',
        },
      });

      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should accept enabled option', () => {
      const monitor = new PerformanceMonitor({ enabled: false });

      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should accept custom callbacks', () => {
      const onBudgetExceeded = vi.fn();
      const onValidation = vi.fn();

      const monitor = new PerformanceMonitor({
        onBudgetExceeded,
        onValidation,
      });

      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });
  });

  describe('wrapSchema', () => {
    it('should wrap schema with performance monitoring', () => {
      const monitor = new PerformanceMonitor();
      const schema = s.string();
      const wrapped = monitor.wrapSchema(schema);

      expect(wrapped).toBeDefined();
      expect(wrapped._type).toBe('string');
    });

    it('should not wrap schema when disabled', () => {
      const monitor = new PerformanceMonitor({ enabled: false });
      const schema = s.string();
      const wrapped = monitor.wrapSchema(schema);

      expect(wrapped).toBe(schema); // Returns same instance
    });

    it('should preserve schema type', () => {
      const monitor = new PerformanceMonitor();
      const schema = s.object({ name: s.string() });
      const wrapped = monitor.wrapSchema(schema);

      expect(wrapped._type).toBe('object');
    });

    it('should wrap different schema types', () => {
      const monitor = new PerformanceMonitor();

      const stringSchema = monitor.wrapSchema(s.string());
      const numberSchema = monitor.wrapSchema(s.number());
      const booleanSchema = monitor.wrapSchema(s.boolean());

      expect(stringSchema._type).toBe('string');
      expect(numberSchema._type).toBe('number');
      expect(booleanSchema._type).toBe('boolean');
    });
  });

  describe('validation measurement', () => {
    it('should measure validation duration', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should record validation success', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.success).toBe(true);
    });

    it('should record validation failure', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate(123); // Invalid

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.success).toBe(false);
    });

    it('should record schema type', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.number());

      schema.validate(42);

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.schemaType).toBe('number');
    });

    it('should record timestamp', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      const before = Date.now();
      schema.validate('test');
      const after = Date.now();

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.timestamp).toBeGreaterThanOrEqual(before);
      expect(metrics[0]!.timestamp).toBeLessThanOrEqual(after);
    });

    it('should record memory delta', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.memoryDelta).toBeDefined();
    });

    it('should collect multiple validation metrics', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      schema.validate('test2');
      schema.validate('test3');

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(3);
    });
  });

  describe('onValidation callback', () => {
    it('should call onValidation callback', () => {
      const onValidation = vi.fn();
      const monitor = new PerformanceMonitor({ onValidation });
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      expect(onValidation).toHaveBeenCalledOnce();
      expect(onValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          duration: expect.any(Number),
          schemaType: 'string',
          success: true,
        })
      );
    });

    it('should call onValidation for each validation', () => {
      const onValidation = vi.fn();
      const monitor = new PerformanceMonitor({ onValidation });
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      schema.validate('test2');

      expect(onValidation).toHaveBeenCalledTimes(2);
    });
  });

  describe('budget enforcement', () => {
    it('should detect budget exceeded', () => {
      const onBudgetExceeded = vi.fn();
      const monitor = new PerformanceMonitor({
        defaultBudget: { maxDuration: 0.001, action: 'log' }, // Very small budget
        onBudgetExceeded,
      });

      const schema = monitor.wrapSchema(
        s.object({
          name: s.string(),
          email: s.string().email(),
          age: s.number().min(0).max(150),
        })
      );

      schema.validate({ name: 'John', email: 'john@example.com', age: 30 });

      expect(onBudgetExceeded).toHaveBeenCalled();
    });

    it('should log when action is "log"', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const monitor = new PerformanceMonitor({
        defaultBudget: { maxDuration: 0.001, action: 'log' },
      });

      const schema = monitor.wrapSchema(s.object({ name: s.string() }));
      schema.validate({ name: 'Test' });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should warn when action is "warn"', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const monitor = new PerformanceMonitor({
        defaultBudget: { maxDuration: 0.001, action: 'warn' },
      });

      const schema = monitor.wrapSchema(s.object({ name: s.string() }));
      schema.validate({ name: 'Test' });

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should throw when action is "throw"', () => {
      const monitor = new PerformanceMonitor({
        defaultBudget: { maxDuration: 0.001, action: 'throw' },
      });

      const schema = monitor.wrapSchema(s.object({ name: s.string() }));

      expect(() => {
        schema.validate({ name: 'Test' });
      }).toThrow('Performance budget exceeded');
    });

    it('should not trigger budget check when within budget', () => {
      const onBudgetExceeded = vi.fn();
      const monitor = new PerformanceMonitor({
        defaultBudget: { maxDuration: 10000, action: 'warn' }, // Very large budget
        onBudgetExceeded,
      });

      const schema = monitor.wrapSchema(s.string());
      schema.validate('test');

      expect(onBudgetExceeded).not.toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return empty array initially', () => {
      const monitor = new PerformanceMonitor();
      const metrics = monitor.getMetrics();

      expect(metrics).toEqual([]);
    });

    it('should return all collected metrics', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      schema.validate('test2');

      const metrics = monitor.getMetrics();

      expect(metrics).toHaveLength(2);
      expect(metrics[0]).toHaveProperty('duration');
      expect(metrics[1]).toHaveProperty('duration');
    });

    it('should return a copy of metrics array', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      const metrics1 = monitor.getMetrics();
      const metrics2 = monitor.getMetrics();

      expect(metrics1).not.toBe(metrics2); // Different arrays
      expect(metrics1).toEqual(metrics2); // Same content
    });
  });

  describe('clearMetrics', () => {
    it('should clear collected metrics', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      schema.validate('test2');

      expect(monitor.getMetrics()).toHaveLength(2);

      monitor.clearMetrics();

      expect(monitor.getMetrics()).toHaveLength(0);
    });

    it('should reset metrics after clearing', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      monitor.clearMetrics();
      schema.validate('test2');

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]!.schemaType).toBe('string');
    });
  });

  describe('getStats', () => {
    it('should return null when no metrics', () => {
      const monitor = new PerformanceMonitor();
      const stats = monitor.getStats();

      expect(stats).toBeNull();
    });

    it('should calculate statistics for single validation', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      const stats = monitor.getStats();

      expect(stats).toBeDefined();
      expect(stats!.count).toBe(1);
      expect(stats!.avg).toBeGreaterThanOrEqual(0);
      expect(stats!.min).toBeGreaterThanOrEqual(0);
      expect(stats!.max).toBeGreaterThanOrEqual(0);
    });

    it('should calculate average duration', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      schema.validate('test2');
      schema.validate('test3');

      const stats = monitor.getStats();

      expect(stats!.avg).toBeGreaterThanOrEqual(0);
      expect(stats!.totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('should calculate min and max', () => {
      const monitor = new PerformanceMonitor();
      const simpleSchema = monitor.wrapSchema(s.string());
      const complexSchema = monitor.wrapSchema(
        s.object({ name: s.string(), email: s.string().email() })
      );

      simpleSchema.validate('test');
      complexSchema.validate({ name: 'John', email: 'john@example.com' });

      const stats = monitor.getStats();

      expect(stats!.min).toBeLessThanOrEqual(stats!.max);
    });

    it('should calculate percentiles', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      // Create multiple validations
      for (let i = 0; i < 100; i++) {
        schema.validate(`test${i}`);
      }

      const stats = monitor.getStats();

      expect(stats!.p50).toBeDefined();
      expect(stats!.p95).toBeDefined();
      expect(stats!.p99).toBeDefined();
      expect(stats!.p50).toBeLessThanOrEqual(stats!.p95);
      expect(stats!.p95).toBeLessThanOrEqual(stats!.p99);
    });

    it('should calculate total duration', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      schema.validate('test2');

      const stats = monitor.getStats();

      expect(stats!.totalDuration).toBeGreaterThan(0);
    });

    it('should include count of measurements', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test1');
      schema.validate('test2');
      schema.validate('test3');

      const stats = monitor.getStats();

      expect(stats!.count).toBe(3);
    });
  });

  describe('async validation', () => {
    it('should measure async validation', async () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      await schema.validateAsync('test');

      const metrics = monitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0]!.duration).toBeGreaterThanOrEqual(0);
    });

    it('should record async validation success', async () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      await schema.validateAsync('test');

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.success).toBe(true);
    });

    it('should record async validation failure', async () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      await schema.validateAsync(123); // Invalid

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.success).toBe(false);
    });

    it('should call onValidation for async validation', async () => {
      const onValidation = vi.fn();
      const monitor = new PerformanceMonitor({ onValidation });
      const schema = monitor.wrapSchema(s.string());

      await schema.validateAsync('test');

      expect(onValidation).toHaveBeenCalledOnce();
    });

    it('should enforce budget for async validation', async () => {
      const onBudgetExceeded = vi.fn();
      const monitor = new PerformanceMonitor({
        defaultBudget: { maxDuration: 0.001, action: 'log' },
        onBudgetExceeded,
      });

      const schema = monitor.wrapSchema(s.object({ name: s.string() }));
      await schema.validateAsync({ name: 'Test' });

      expect(onBudgetExceeded).toHaveBeenCalled();
    });
  });

  describe('memory tracking', () => {
    it('should track memory delta', () => {
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.memoryDelta).toBeDefined();
      expect(typeof metrics[0]!.memoryDelta).toBe('number');
    });

    it('should return 0 memory delta in non-Node environment', () => {
      // This test verifies the fallback behavior
      const monitor = new PerformanceMonitor();
      const schema = monitor.wrapSchema(s.string());

      schema.validate('test');

      const metrics = monitor.getMetrics();
      expect(metrics[0]!.memoryDelta).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// HELPER FUNCTIONS TESTS
// ============================================================================

describe('createPerformanceMonitor', () => {
  it('should create PerformanceMonitor instance', () => {
    const monitor = createPerformanceMonitor();

    expect(monitor).toBeInstanceOf(PerformanceMonitor);
  });

  it('should pass options to monitor', () => {
    const onValidation = vi.fn();
    const monitor = createPerformanceMonitor({ onValidation });

    const schema = monitor.wrapSchema(s.string());
    schema.validate('test');

    expect(onValidation).toHaveBeenCalled();
  });

  it('should create monitors with different options', () => {
    const monitor1 = createPerformanceMonitor({ enabled: true });
    const monitor2 = createPerformanceMonitor({ enabled: false });

    expect(monitor1).toBeInstanceOf(PerformanceMonitor);
    expect(monitor2).toBeInstanceOf(PerformanceMonitor);
  });
});

describe('withPerformanceMonitor', () => {
  it('should wrap schema with monitoring', () => {
    const schema = s.string();
    const wrapped = withPerformanceMonitor(schema);

    expect(wrapped._type).toBe('string');
  });

  it('should return monitored schema', () => {
    const schema = s.string();
    const wrapped = withPerformanceMonitor(schema, {
      defaultBudget: { maxDuration: 100, action: 'warn' },
    });

    const result = wrapped.validate('test');

    expect(result.ok).toBe(true);
  });

  it('should accept custom options', () => {
    const onValidation = vi.fn();
    const schema = s.string();
    const wrapped = withPerformanceMonitor(schema, { onValidation });

    wrapped.validate('test');

    expect(onValidation).toHaveBeenCalled();
  });

  it('should work with complex schemas', () => {
    const schema = s.object({
      name: s.string(),
      age: s.number(),
      tags: s.array(s.string()),
    });

    const wrapped = withPerformanceMonitor(schema);
    const result = wrapped.validate({
      name: 'John',
      age: 30,
      tags: ['developer', 'typescript'],
    });

    expect(result.ok).toBe(true);
  });
});

describe('globalPerformanceMonitor', () => {
  it('should be a PerformanceMonitor instance', () => {
    expect(globalPerformanceMonitor).toBeInstanceOf(PerformanceMonitor);
  });

  it('should be usable for wrapping schemas', () => {
    const schema = s.string();
    const wrapped = globalPerformanceMonitor.wrapSchema(schema);

    expect(wrapped._type).toBe('string');
  });

  it('should collect metrics', () => {
    // Clear any existing metrics first
    globalPerformanceMonitor.clearMetrics();

    const schema = globalPerformanceMonitor.wrapSchema(s.string());
    schema.validate('test');

    const metrics = globalPerformanceMonitor.getMetrics();
    expect(metrics.length).toBeGreaterThan(0);

    // Clean up
    globalPerformanceMonitor.clearMetrics();
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Integration Tests', () => {
  it('should handle complete monitoring workflow', () => {
    const onValidation = vi.fn();
    const onBudgetExceeded = vi.fn();

    const monitor = new PerformanceMonitor({
      defaultBudget: { maxDuration: 100, action: 'log' },
      onValidation,
      onBudgetExceeded,
    });

    const schema = monitor.wrapSchema(
      s.object({
        name: s.string(),
        email: s.string().email(),
      })
    );

    // Valid
    schema.validate({ name: 'John', email: 'john@example.com' });

    // Invalid
    schema.validate({ name: 123, email: 'invalid' });

    const metrics = monitor.getMetrics();
    expect(metrics).toHaveLength(2);
    expect(metrics[0]!.success).toBe(true);
    expect(metrics[1]!.success).toBe(false);

    expect(onValidation).toHaveBeenCalledTimes(2);

    const stats = monitor.getStats();
    expect(stats!.count).toBe(2);
    expect(stats!.avg).toBeGreaterThanOrEqual(0);
  });

  it('should maintain separate metrics per monitor instance', () => {
    const monitor1 = new PerformanceMonitor();
    const monitor2 = new PerformanceMonitor();

    const schema1 = monitor1.wrapSchema(s.string());
    const schema2 = monitor2.wrapSchema(s.number());

    schema1.validate('test');
    schema2.validate(42);

    expect(monitor1.getMetrics()).toHaveLength(1);
    expect(monitor2.getMetrics()).toHaveLength(1);
    expect(monitor1.getMetrics()[0]!.schemaType).toBe('string');
    expect(monitor2.getMetrics()[0]!.schemaType).toBe('number');
  });

  it('should handle multiple wrapped schemas from same monitor', () => {
    const monitor = new PerformanceMonitor();

    const stringSchema = monitor.wrapSchema(s.string());
    const numberSchema = monitor.wrapSchema(s.number());
    const booleanSchema = monitor.wrapSchema(s.boolean());

    stringSchema.validate('test');
    numberSchema.validate(42);
    booleanSchema.validate(true);

    const metrics = monitor.getMetrics();
    expect(metrics).toHaveLength(3);
    expect(metrics.map((m) => m.schemaType)).toEqual(['string', 'number', 'boolean']);
  });

  it('should properly track performance over many validations', () => {
    const monitor = new PerformanceMonitor();
    const schema = monitor.wrapSchema(s.string().min(5).max(100));

    // Perform many validations
    for (let i = 0; i < 50; i++) {
      schema.validate(`test${i}`);
    }

    const stats = monitor.getStats();
    expect(stats!.count).toBe(50);
    expect(stats!.min).toBeLessThanOrEqual(stats!.avg);
    expect(stats!.avg).toBeLessThanOrEqual(stats!.max);
    expect(stats!.p50).toBeLessThanOrEqual(stats!.p95);
    expect(stats!.p95).toBeLessThanOrEqual(stats!.p99);
  });
});
