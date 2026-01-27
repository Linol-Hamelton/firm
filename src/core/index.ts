/**
 * LAYER 1: Core Domain
 *
 * Pure business logic layer.
 * NO I/O operations allowed here.
 * Target: 50M+ ops/sec
 *
 * This is the heart of FIRM - all validation logic lives here.
 */

// Base schema
export * from './schema/index.js';

// All validators
export * from './validators/index.js';

// Compiler
export * from './compiler/index.js';
