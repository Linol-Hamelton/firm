/**
 * LAYER 3: Infrastructure
 *
 * Implementations of output ports.
 * Contains all I/O and side-effect code.
 *
 * This layer can be slow - it's not performance critical.
 * Core validation logic is in core/ layer.
 */

export * from './formatting/index.js';
export * from './cache/index.js';
export * from './logging/index.js';
