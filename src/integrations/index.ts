/**
 * Framework Integrations for FIRM Validator
 *
 * This module provides ready-to-use integrations for popular frameworks.
 */

// Backend Frameworks
export * as express from './express/index.js';
export * as fastify from './fastify/index.js';
export * as hono from './hono/index.js';
export * as next from './next/index.js';

// Frontend Frameworks
export * as reactHookForm from './react-hook-form/index.js';
export * as vue from './vue/index.js';
export * as svelte from './svelte/index.js';
export * as solid from './solid/index.js';

// API Frameworks
export * as trpc from './trpc/index.js';
export * as graphql from './graphql/index.js';
export * as rest from './rest/index.js';
export * as openapi from './openapi/index.js';

// ORM Integrations
export * as prisma from './prisma/index.js';
export * as typeorm from './typeorm/index.js';
export * as drizzle from './drizzle/index.js';
export * as sequelize from './sequelize/index.js';

// Backend - Re-export for convenience
export { validate as expressValidate } from './express/index.js';
export { firmValidatorPlugin as fastifyPlugin } from './fastify/index.js';
export { validator as honoValidator } from './hono/index.js';
export { withValidation as nextWithValidation } from './next/index.js';

// Frontend - Re-export for convenience
export { firmResolver } from './react-hook-form/index.js';
export { useFirmValidation } from './vue/index.js';
export { createFirmStore } from './svelte/index.js';
export { createFirmForm } from './solid/index.js';

// API - Re-export for convenience
export { firmInput } from './trpc/index.js';
export { firmArgs } from './graphql/index.js';
export { createRestValidator } from './rest/index.js';
export { generateOpenAPI } from './openapi/index.js';

// ORM - Re-export for convenience
export { createFirmMiddleware as prismaMiddleware } from './prisma/index.js';
export { ValidatedEntity as TypeORMValidatedEntity } from './typeorm/index.js';
export { createValidatedDb as drizzleValidatedDb } from './drizzle/index.js';
export { addValidationHooks as sequelizeValidationHooks } from './sequelize/index.js';
