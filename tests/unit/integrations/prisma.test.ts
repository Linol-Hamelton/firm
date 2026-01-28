/**
 * Prisma Integration Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { s } from '../../../src/index.js';
import {
  createFirmMiddleware,
  validateModel,
  validateOutput,
  createValidatedClient,
  prismaUpdate,
  prismaOmit,
} from '../../../src/integrations/prisma/index.js';
import { ValidationException } from '../../../src/common/errors/validation-error.js';

describe('Prisma Integration', () => {
  const userSchema = s.object({
    name: s.string().min(1),
    email: s.string().email(),
    age: s.number().optional(),
  });

  describe('createFirmMiddleware', () => {
    it('should validate data before create operation', async () => {
      const middleware = createFirmMiddleware({
        user: {
          create: userSchema,
        },
      });

      const params = {
        model: 'User',
        action: 'create',
        args: {
          data: {
            name: 'John',
            email: 'john@example.com',
            age: 30,
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = vi.fn().mockResolvedValue({ id: 1, ...params.args.data });

      const result = await middleware(params, next);

      expect(next).toHaveBeenCalled();
      expect(result.name).toBe('John');
    });

    it('should throw on invalid data', async () => {
      const middleware = createFirmMiddleware({
        user: {
          create: userSchema,
        },
      });

      const params = {
        model: 'User',
        action: 'create',
        args: {
          data: {
            name: '',
            email: 'invalid-email',
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = vi.fn();

      await expect(middleware(params, next)).rejects.toThrow(ValidationException);
      expect(next).not.toHaveBeenCalled();
    });

    it('should skip validation if no schema for action', async () => {
      const middleware = createFirmMiddleware({
        user: {
          create: userSchema,
        },
      });

      const params = {
        model: 'User',
        action: 'delete',
        args: { where: { id: 1 } },
        dataPath: [],
        runInTransaction: false,
      };

      const next = vi.fn().mockResolvedValue({ count: 1 });

      await middleware(params, next);

      expect(next).toHaveBeenCalled();
    });

    it('should handle update operations', async () => {
      const middleware = createFirmMiddleware({
        user: {
          update: userSchema.partial(),
        },
      });

      const params = {
        model: 'User',
        action: 'update',
        args: {
          data: {
            name: 'John Doe',
          },
        },
        dataPath: [],
        runInTransaction: false,
      };

      const next = vi.fn().mockResolvedValue({ id: 1, ...params.args.data });

      await middleware(params, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('validateModel', () => {
    it('should validate and call operation', async () => {
      const operation = vi.fn().mockResolvedValue({
        id: 1,
        name: 'John',
        email: 'john@example.com',
      });

      const result = await validateModel(
        operation,
        {
          data: {
            name: 'John',
            email: 'john@example.com',
          },
        },
        userSchema
      );

      expect(operation).toHaveBeenCalled();
      expect(result.name).toBe('John');
    });

    it('should throw on invalid data', async () => {
      const operation = vi.fn();

      await expect(
        validateModel(
          operation,
          {
            data: {
              name: '',
              email: 'invalid',
            },
          },
          userSchema
        )
      ).rejects.toThrow(ValidationException);

      expect(operation).not.toHaveBeenCalled();
    });
  });

  describe('validateOutput', () => {
    it('should validate output data', () => {
      const data = {
        name: 'John',
        email: 'john@example.com',
        age: 30,
      };

      const result = validateOutput(data, userSchema);

      expect(result).toEqual(data);
    });

    it('should throw on invalid output', () => {
      const data = {
        name: 'John',
        email: 'invalid-email',
      };

      expect(() => validateOutput(data, userSchema)).toThrow(ValidationException);
    });
  });

  describe('schema helpers', () => {
    it('prismaUpdate should create partial schema', () => {
      const updateSchema = prismaUpdate(userSchema);
      const result = updateSchema.validate({ name: 'John' });

      expect(result.ok).toBe(true);
    });

    it('prismaOmit should omit specified keys', () => {
      const schemaWithId = s.object({
        id: s.number(),
        name: s.string(),
        email: s.string().email(),
      });

      const createSchema = prismaOmit(schemaWithId, ['id']);

      // Should accept data without id
      const result = createSchema.validate({
        name: 'John',
        email: 'john@example.com',
      });

      expect(result.ok).toBe(true);
    });
  });
});
