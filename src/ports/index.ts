/**
 * LAYER 2: Ports (Hexagonal Architecture)
 *
 * Ports define the boundaries between FIRM and external systems.
 *
 * Input Ports (Driving):
 * - How external systems call FIRM
 * - Middleware, form validation, etc.
 *
 * Output Ports (Driven):
 * - How FIRM calls external systems
 * - Formatters, loggers, cache, etc.
 */

export * from './input/index.js';
export * from './output/index.js';
