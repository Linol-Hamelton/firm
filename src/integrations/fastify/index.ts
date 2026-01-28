/**
 * Fastify Integration for FIRM Validator
 *
 * Provides hooks and decorators for validating requests in Fastify.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { s } from 'firm-validator';
 * import { firmValidatorPlugin, validate } from 'firm-validator/integrations/fastify';
 *
 * const fastify = Fastify();
 * await fastify.register(firmValidatorPlugin);
 *
 * const userSchema = s.object({
 *   name: s.string().min(1),
 *   email: s.string().email(),
 * });
 *
 * fastify.post('/users', {
 *   schema: {
 *     body: userSchema
 *   }
 * }, async (request, reply) => {
 *   return { success: true, user: request.body };
 * });
 * ```
 */

import type { FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';
import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface FirmValidatorOptions {
  /** Abort on first error (default: true) */
  abortEarly?: boolean;
}

export interface ValidateSchemas {
  body?: Schema<any>;
  params?: Schema<any>;
  querystring?: Schema<any>;
  headers?: Schema<any>;
}

// ============================================================================
// PLUGIN
// ============================================================================

/**
 * Fastify plugin for FIRM validator.
 *
 * Registers hooks to validate requests using FIRM schemas.
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import { firmValidatorPlugin } from 'firm-validator/integrations/fastify';
 *
 * const fastify = Fastify();
 * await fastify.register(firmValidatorPlugin);
 * ```
 */
export const firmValidatorPlugin: FastifyPluginCallback<FirmValidatorOptions> = (
  fastify,
  options,
  done
) => {
  fastify.addHook('preHandler', async (request, reply) => {
    // Get route schema
    const routeSchema = (request.routeOptions.schema as any) || {};

    // Validate body
    if (routeSchema.body && request.body !== undefined) {
      const result = routeSchema.body.validate(request.body);
      if (!result.ok) {
        reply.status(400).send({
          success: false,
          errors: result.errors.map((err: any) => ({
            location: 'body',
            path: err.path,
            code: err.code,
            message: err.message,
          })),
        });
        return;
      }
      request.body = result.data;
    }

    // Validate params
    if (routeSchema.params && request.params !== undefined) {
      const result = routeSchema.params.validate(request.params);
      if (!result.ok) {
        reply.status(400).send({
          success: false,
          errors: result.errors.map((err: any) => ({
            location: 'params',
            path: err.path,
            code: err.code,
            message: err.message,
          })),
        });
        return;
      }
      request.params = result.data;
    }

    // Validate querystring
    if (routeSchema.querystring && request.query !== undefined) {
      const result = routeSchema.querystring.validate(request.query);
      if (!result.ok) {
        reply.status(400).send({
          success: false,
          errors: result.errors.map((err: any) => ({
            location: 'query',
            path: err.path,
            code: err.code,
            message: err.message,
          })),
        });
        return;
      }
      request.query = result.data;
    }

    // Validate headers
    if (routeSchema.headers && request.headers !== undefined) {
      const result = routeSchema.headers.validate(request.headers);
      if (!result.ok) {
        reply.status(400).send({
          success: false,
          errors: result.errors.map((err: any) => ({
            location: 'headers',
            path: err.path,
            code: err.code,
            message: err.message,
          })),
        });
        return;
      }
      request.headers = result.data as any;
    }
  });

  done();
};

// ============================================================================
// STANDALONE VALIDATOR
// ============================================================================

/**
 * Create a standalone Fastify validator function.
 *
 * Use this when you want to validate manually without the plugin.
 *
 * @example
 * ```typescript
 * fastify.post('/users', async (request, reply) => {
 *   const validator = validate({
 *     body: userSchema
 *   });
 *
 *   const errors = await validator(request, reply);
 *   if (errors) {
 *     reply.status(400).send(errors);
 *     return;
 *   }
 *
 *   // Continue with validated data
 * });
 * ```
 */
export function validate(schemas: ValidateSchemas) {
  return async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<null | { success: false; errors: any[] }> => {
    const errors: any[] = [];

    // Validate body
    if (schemas.body && request.body !== undefined) {
      const result = schemas.body.validate(request.body);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => ({
            location: 'body',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        request.body = result.data;
      }
    }

    // Validate params
    if (schemas.params && request.params !== undefined) {
      const result = schemas.params.validate(request.params);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => ({
            location: 'params',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        request.params = result.data;
      }
    }

    // Validate querystring
    if (schemas.querystring && request.query !== undefined) {
      const result = schemas.querystring.validate(request.query);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => ({
            location: 'query',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        request.query = result.data;
      }
    }

    // Validate headers
    if (schemas.headers && request.headers !== undefined) {
      const result = schemas.headers.validate(request.headers);
      if (!result.ok) {
        errors.push(
          ...result.errors.map((err) => ({
            location: 'headers',
            path: err.path,
            code: err.code,
            message: err.message,
          }))
        );
      } else {
        request.headers = result.data as any;
      }
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return null;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default firmValidatorPlugin;
