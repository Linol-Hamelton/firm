/**
 * LAYER 3: Koa Integration
 *
 * Seamless integration with Koa framework.
 * Provides middleware, validators, and utilities for Koa applications.
 *
 * Target: Zero-config integration with koa and @koa/router.
 */

// ============================================================================
// KOA INTEGRATION
// ============================================================================

/**
 * Coerce query parameter values from strings to appropriate types
 */
function coerceQueryValues(query: Record<string, unknown>): Record<string, unknown> {
  const coerced: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') {
      // Try to convert to number
      const num = Number(value);
      if (!isNaN(num) && value.trim() !== '') {
        coerced[key] = num;
        continue;
      }

      // Try to convert to boolean
      if (value === 'true') {
        coerced[key] = true;
        continue;
      }
      if (value === 'false') {
        coerced[key] = false;
        continue;
      }

      // Keep as string
      coerced[key] = value;
    } else {
      coerced[key] = value;
    }
  }

  return coerced;
}

/**
 * Koa middleware for validating request body with FIRM schema.
 *
 * Usage:
 * ```ts
 * app.use(validateBody(userSchema));
 * ```
 */
export function validateBody<T>(schema: any) {
  return async (ctx: any, next: any) => {
    try {
      const result = await (schema.validateAsync ? 
        schema.validateAsync(ctx.request.body) : 
        Promise.resolve(schema.validate(ctx.request.body)));
      
      if (!result.ok) {
        ctx.status = 400;
        ctx.body = {
          message: 'Validation failed',
          errors: result.errors.map((error: any) => ({
            property: error.path,
            code: error.code,
            message: error.message,
          })),
        };
        return;
      }
      
      // Attach validated data to context
      ctx.validatedBody = result.data;
      await next();
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}

/**
 * Koa middleware for validating query parameters with FIRM schema.
 *
 * Usage:
 * ```ts
 * app.use(validateQuery(searchSchema));
 * ```
 */
export function validateQuery<T>(schema: any) {
  return async (ctx: any, next: any) => {
    try {
      // Coerce query parameter types from strings
      const coercedQuery = coerceQueryValues(ctx.query);

      const result = await (schema.validateAsync ?
        schema.validateAsync(coercedQuery) :
        Promise.resolve(schema.validate(coercedQuery)));
      
      if (!result.ok) {
        ctx.status = 400;
        ctx.body = {
          message: 'Query validation failed',
          errors: result.errors.map((error: any) => ({
            property: error.path,
            code: error.code,
            message: error.message,
          })),
        };
        return;
      }
      
      ctx.validatedQuery = result.data;
      await next();
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}

/**
 * Koa middleware for validating route parameters with FIRM schema.
 *
 * Usage:
 * ```ts
 * router.get('/users/:id', validateParams(idSchema), getUser);
 * ```
 */
export function validateParams<T>(schema: any) {
  return async (ctx: any, next: any) => {
    try {
      const result = await (schema.validateAsync ? 
        schema.validateAsync(ctx.params) : 
        Promise.resolve(schema.validate(ctx.params)));
      
      if (!result.ok) {
        ctx.status = 400;
        ctx.body = {
          message: 'Parameter validation failed',
          errors: result.errors.map((error: any) => ({
            property: error.path,
            code: error.code,
            message: error.message,
          })),
        };
        return;
      }
      
      ctx.validatedParams = result.data;
      await next();
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}

/**
 * Koa middleware for validating headers with FIRM schema.
 *
 * Usage:
 * ```ts
 * app.use(validateHeaders(authSchema));
 * ```
 */
export function validateHeaders<T>(schema: any) {
  return async (ctx: any, next: any) => {
    try {
      const result = await (schema.validateAsync ? 
        schema.validateAsync(ctx.headers) : 
        Promise.resolve(schema.validate(ctx.headers)));
      
      if (!result.ok) {
        ctx.status = 400;
        ctx.body = {
          message: 'Header validation failed',
          errors: result.errors.map((error: any) => ({
            property: error.path,
            code: error.code,
            message: error.message,
          })),
        };
        return;
      }
      
      ctx.validatedHeaders = result.data;
      await next();
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
}

/**
 * Koa middleware for validating response body with FIRM schema.
 * Useful for ensuring API responses match expected format.
 *
 * Usage:
 * ```ts
 * app.use(validateResponse(userSchema));
 * ```
 */
export function validateResponse<T>(schema: any) {
  return async (ctx: any, next: any) => {
    await next();
    
    // Only validate successful responses
    if (ctx.status < 200 || ctx.status >= 300) {
      return;
    }
    
    try {
      const result = await (schema.validateAsync ? 
        schema.validateAsync(ctx.body) : 
        Promise.resolve(schema.validate(ctx.body)));
      
      if (!result.ok) {
        console.warn('Response validation failed:', result.errors);
        // Don't fail the request, just log the warning
      }
    } catch (error) {
      console.warn('Response validation error:', error);
    }
  };
}

/**
 * Create a Koa router with built-in validation.
 *
 * Usage:
 * ```ts
 * const router = createValidatedRouter();
 * 
 * router.post('/users', {
 *   body: userSchema,
 *   handler: async (ctx) => {
 *     const user = ctx.validatedBody;
 *     // ...
 *   },
 * });
 * ```
 */
export function createValidatedRouter() {
  const Router = require('@koa/router');
  const router = new Router();

  return {
    /**
     * Add validated POST route.
     */
    post<T>(path: string, options: {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
      handler: (ctx: any) => Promise<void> | void;
    }) {
      const middlewares = [];
      
      if (options.body) {
        middlewares.push(validateBody(options.body));
      }
      if (options.query) {
        middlewares.push(validateQuery(options.query));
      }
      if (options.params) {
        middlewares.push(validateParams(options.params));
      }
      if (options.headers) {
        middlewares.push(validateHeaders(options.headers));
      }
      
      router.post(path, ...middlewares, options.handler);
      return this;
    },

    /**
     * Add validated GET route.
     */
    get<T>(path: string, options: {
      query?: any;
      params?: any;
      headers?: any;
      handler: (ctx: any) => Promise<void> | void;
    }) {
      const middlewares = [];
      
      if (options.query) {
        middlewares.push(validateQuery(options.query));
      }
      if (options.params) {
        middlewares.push(validateParams(options.params));
      }
      if (options.headers) {
        middlewares.push(validateHeaders(options.headers));
      }
      
      router.get(path, ...middlewares, options.handler);
      return this;
    },

    /**
     * Add validated PUT route.
     */
    put<T>(path: string, options: {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
      handler: (ctx: any) => Promise<void> | void;
    }) {
      const middlewares = [];
      
      if (options.body) {
        middlewares.push(validateBody(options.body));
      }
      if (options.query) {
        middlewares.push(validateQuery(options.query));
      }
      if (options.params) {
        middlewares.push(validateParams(options.params));
      }
      if (options.headers) {
        middlewares.push(validateHeaders(options.headers));
      }
      
      router.put(path, ...middlewares, options.handler);
      return this;
    },

    /**
     * Add validated DELETE route.
     */
    delete<T>(path: string, options: {
      query?: any;
      params?: any;
      headers?: any;
      handler: (ctx: any) => Promise<void> | void;
    }) {
      const middlewares = [];
      
      if (options.query) {
        middlewares.push(validateQuery(options.query));
      }
      if (options.params) {
        middlewares.push(validateParams(options.params));
      }
      if (options.headers) {
        middlewares.push(validateHeaders(options.headers));
      }
      
      router.delete(path, ...middlewares, options.handler);
      return this;
    },

    /**
     * Add validated PATCH route.
     */
    patch<T>(path: string, options: {
      body?: any;
      query?: any;
      params?: any;
      headers?: any;
      handler: (ctx: any) => Promise<void> | void;
    }) {
      const middlewares = [];
      
      if (options.body) {
        middlewares.push(validateBody(options.body));
      }
      if (options.query) {
        middlewares.push(validateQuery(options.query));
      }
      if (options.params) {
        middlewares.push(validateParams(options.params));
      }
      if (options.headers) {
        middlewares.push(validateHeaders(options.headers));
      }
      
      router.patch(path, ...middlewares, options.handler);
      return this;
    },

    /**
     * Get the underlying Koa router.
     */
    routes() {
      return router.routes();
    },

    /**
     * Get the router allowed methods.
     */
    allowedMethods() {
      return router.allowedMethods();
    },

    /**
     * Use the router as Koa middleware.
     */
    middleware() {
      return router.routes();
    },
  };
}

/**
 * Koa error handler middleware for FIRM validation errors.
 * Converts FIRM validation errors to proper HTTP responses.
 */
export function firmErrorHandler() {
  return async (ctx: any, next: any) => {
    try {
      await next();
    } catch (error: any) {
      // Check if it's a FIRM validation error
      if (error.errors && Array.isArray(error.errors)) {
        ctx.status = 400;
        ctx.body = {
          message: 'Validation failed',
          errors: error.errors.map((err: any) => ({
            property: err.path,
            code: err.code,
            message: err.message,
          })),
        };
      } else {
        // Re-throw other errors
        throw error;
      }
    }
  };
}

/**
 * Create a Koa application with FIRM validation built-in.
 *
 * Usage:
 * ```ts
 * const app = createFirmKoaApp();
 * 
 * app.post('/users', {
 *   body: userSchema,
 *   handler: async (ctx) => {
 *     const user = ctx.validatedBody;
 *     // ...
 *   },
 * });
 * ```
 */
export function createFirmKoaApp() {
  const Koa = require('koa');
  const app = new Koa();
  
  // Add error handler
  app.use(firmErrorHandler());
  
  // Add body parser if available
  try {
    const { bodyParser } = require('@koa/bodyparser');
    app.use(bodyParser());
  } catch {
    // Body parser not available, skip
  }
  
  const router = createValidatedRouter();
  
  return {
    /**
     * Use Koa middleware.
     */
    use(middleware: any) {
      app.use(middleware);
      return this;
    },

    /**
     * Add validated route.
     */
    post: router.post.bind(router),
    get: router.get.bind(router),
    put: router.put.bind(router),
    delete: router.delete.bind(router),
    patch: router.patch.bind(router),

    /**
     * Start the server.
     */
    listen(port: number, callback?: () => void) {
      app.use(router.routes());
      app.use(router.allowedMethods());
      return app.listen(port, callback);
    },

    /**
     * Get the underlying Koa app.
     */
    getApp() {
      return app;
    },

    /**
     * Get the router.
     */
    getRouter() {
      return router;
    },
  };
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  validateBody as body,
  validateQuery as query,
  validateParams as params,
  validateHeaders as headers,
  validateResponse as response,
  createValidatedRouter as router,
  firmErrorHandler as errorHandler,
  createFirmKoaApp as createApp,
};

/**
 * Default export for easy importing.
 */
export default {
  body: validateBody,
  query: validateQuery,
  params: validateParams,
  headers: validateHeaders,
  response: validateResponse,
  router: createValidatedRouter,
  errorHandler: firmErrorHandler,
  createApp: createFirmKoaApp,
};