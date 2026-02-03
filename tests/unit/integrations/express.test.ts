/**
 * Express Integration Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { s } from '../../../src/index';
import { validate, validateBody, validateParams, validateQuery } from '../../../src/integrations/express/index';

describe('Express Integration', () => {
  describe('validate() middleware', () => {
    it('should validate request body successfully', async () => {
      const schema = s.object({
        name: s.string(),
        email: s.string().email(),
      });

      const req: any = {
        body: { name: 'John', email: 'john@example.com' },
        params: {},
        query: {},
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should return 400 on validation error', async () => {
      const schema = s.object({
        name: s.string(),
        email: s.string().email(),
      });

      const req: any = {
        body: { name: 'John', email: 'invalid-email' },
        params: {},
        query: {},
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validate({ body: schema });
      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();

      const errorResponse = res.json.mock.calls[0][0];
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.errors).toBeDefined();
      expect(errorResponse.errors.length).toBeGreaterThan(0);
    });

    it('should validate multiple sources (body + query)', async () => {
      const bodySchema = s.object({
        name: s.string(),
      });
      const querySchema = s.object({
        page: s.coerce.number(),
      });

      const req: any = {
        body: { name: 'John' },
        query: { page: '2' },
        params: {},
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validate({
        body: bodySchema,
        query: querySchema,
      });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(2); // Coerced to number
    });

    it('should call custom error handler', async () => {
      const schema = s.object({
        name: s.string(),
      });

      const onError = vi.fn();

      const req: any = {
        body: { name: 123 },
        params: {},
        query: {},
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validate({
        body: schema,
        onError,
      });
      await middleware(req, res, next);

      expect(onError).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('validateBody() shorthand', () => {
    it('should validate body only', async () => {
      const schema = s.object({
        name: s.string(),
      });

      const req: any = {
        body: { name: 'John' },
        params: {},
        query: {},
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validateBody(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateParams() shorthand', () => {
    it('should validate params only', async () => {
      const schema = s.object({
        id: s.string().min(1),
      });

      const req: any = {
        body: {},
        params: { id: '123' },
        query: {},
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validateParams(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateQuery() shorthand', () => {
    it('should validate query only', async () => {
      const schema = s.object({
        page: s.coerce.number(),
      });

      const req: any = {
        body: {},
        params: {},
        query: { page: '5' },
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validateQuery(schema);
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(5);
    });
  });

  describe('error handling', () => {
    it('should pass exceptions to next()', async () => {
      const schema = s.object({
        name: s.string(),
      });

      // Mock a schema that throws
      const throwingSchema = {
        validate: () => {
          throw new Error('Test error');
        },
      };

      const req: any = {
        body: { name: 'John' },
        params: {},
        query: {},
        headers: {},
      };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };
      const next = vi.fn();

      const middleware = validate({ body: throwingSchema as any });
      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });
});
