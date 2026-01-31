/**
 * Koa Integration Tests
 *
 * Tests for Koa middleware and validation integration.
 */

import { describe, it, expect, vi } from 'vitest';
import { validateBody, validateQuery, validateParams, validateHeaders } from '../../../src/integrations/koa/index.js';
import { s } from '../../../src/app/firm.js';

describe('Koa Integration', () => {
  describe('validateBody', () => {
    it('should validate request body and attach to context', async () => {
      const schema = s.object({
        name: s.string(),
        age: s.number().int().min(0),
      });

      const middleware = validateBody(schema);
      const ctx: any = {
        request: { body: { name: 'John', age: 30 } },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(200);
      expect(ctx.validatedBody).toEqual({ name: 'John', age: 30 });
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 on validation failure', async () => {
      const schema = s.object({
        name: s.string(),
        age: s.number().int().min(0),
      });

      const middleware = validateBody(schema);
      const ctx: any = {
        request: { body: { name: 'John', age: -5 } },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty('errors');
      expect(ctx.body.errors).toHaveLength(1);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateParams', () => {
    it('should validate route parameters and attach to context', async () => {
      const schema = s.object({
        id: s.string().uuid(),
      });

      const middleware = validateParams(schema);
      const ctx: any = {
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(200);
      expect(ctx.validatedParams).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000' });
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 on invalid parameters', async () => {
      const schema = s.object({
        id: s.string().uuid(),
      });

      const middleware = validateParams(schema);
      const ctx: any = {
        params: { id: 'invalid' },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty('errors');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateQuery', () => {
    it('should validate query parameters and attach to context', async () => {
      const schema = s.object({
        page: s.number().int().min(1).default(1),
        limit: s.number().int().min(1).max(100).default(20),
      });

      const middleware = validateQuery(schema);
      const ctx: any = {
        query: { page: '2', limit: '50' },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(200);
      expect(ctx.validatedQuery).toEqual({ page: 2, limit: 50 });
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 on invalid query parameters', async () => {
      const schema = s.object({
        page: s.number().int().min(1),
      });

      const middleware = validateQuery(schema);
      const ctx: any = {
        query: { page: '-1' },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty('errors');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('validateHeaders', () => {
    it('should validate headers and attach to context', async () => {
      const schema = s.object({
        'user-agent': s.string(),
        'content-type': s.string().optional(),
      });

      const middleware = validateHeaders(schema);
      const ctx: any = {
        headers: { 'user-agent': 'Mozilla/5.0', 'content-type': 'application/json' },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(200);
      expect(ctx.validatedHeaders).toEqual({
        'user-agent': 'Mozilla/5.0',
        'content-type': 'application/json',
      });
      expect(next).toHaveBeenCalled();
    });

    it('should return 400 on invalid headers', async () => {
      const schema = s.object({
        authorization: s.string().min(1),
      });

      const middleware = validateHeaders(schema);
      const ctx: any = {
        headers: { authorization: '' },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(400);
      expect(ctx.body).toHaveProperty('errors');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('combined validation', () => {
    it('should validate body, params, and query together', async () => {
      const bodySchema = s.object({ name: s.string() });
      const paramsSchema = s.object({ id: s.string().uuid() });
      const querySchema = s.object({ debug: s.boolean().default(false) });

      const bodyMiddleware = validateBody(bodySchema);
      const paramsMiddleware = validateParams(paramsSchema);
      const queryMiddleware = validateQuery(querySchema);

      const ctx: any = {
        request: { body: { name: 'John' } },
        params: { id: '123e4567-e89b-12d3-a456-426614174000' },
        query: { debug: 'true' },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      // Execute middlewares in sequence
      await bodyMiddleware(ctx, async () => {
        await paramsMiddleware(ctx, async () => {
          await queryMiddleware(ctx, next);
        });
      });

      expect(ctx.validatedBody).toEqual({ name: 'John' });
      expect(ctx.validatedParams).toEqual({ id: '123e4567-e89b-12d3-a456-426614174000' });
      expect(ctx.validatedQuery).toEqual({ debug: true });
      expect(next).toHaveBeenCalled();
    });
  });

  describe('async validation', () => {
    it('should handle async schema validation', async () => {
      const schema = s.object({
        email: s.string().email(),
      }).refineAsync(async (data) => {
        // Simulate async check
        return data.email.includes('@');
      });

      const middleware = validateBody(schema);
      const ctx: any = {
        request: { body: { email: 'test@example.com' } },
        status: 200,
        body: null,
      };
      const next = vi.fn();

      await middleware(ctx, next);

      expect(ctx.status).toBe(200);
      expect(ctx.validatedBody).toEqual({ email: 'test@example.com' });
      expect(next).toHaveBeenCalled();
    });
  });
});