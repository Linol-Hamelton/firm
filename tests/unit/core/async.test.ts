/**
 * Async Validation Tests
 *
 * Tests for async refinements, transforms, and validation methods.
 */

import { s } from '../../../src/index';

describe('Async Validation', () => {
  describe('validateAsync()', () => {
    it('should work with sync schemas', async () => {
      const schema = s.string();
      const result = await schema.validateAsync('hello');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('hello');
      }
    });

    it('should handle optional with async', async () => {
      const schema = s.string().optional();
      const result = await schema.validateAsync(undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeUndefined();
      }
    });

    it('should handle nullable with async', async () => {
      const schema = s.string().nullable();
      const result = await schema.validateAsync(null);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBeNull();
      }
    });

    it('should handle default values with async', async () => {
      const schema = s.string().default('default');
      const result = await schema.validateAsync(undefined);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('default');
      }
    });
  });

  describe('refineAsync()', () => {
    it('should validate with async refinement', async () => {
      const asyncCheck = vi.fn().mockResolvedValue(true);
      const schema = s.string().refineAsync(asyncCheck, 'Async check failed');

      const result = await schema.validateAsync('hello');
      expect(result.ok).toBe(true);
      expect(asyncCheck).toHaveBeenCalledWith('hello');
    });

    it('should fail when async refinement returns false', async () => {
      const asyncCheck = vi.fn().mockResolvedValue(false);
      const schema = s.string().refineAsync(asyncCheck, 'Username taken');

      const result = await schema.validateAsync('john');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].message).toBe('Username taken');
      }
    });

    it('should handle async refinement errors', async () => {
      const asyncCheck = vi.fn().mockRejectedValue(new Error('Network error'));
      const schema = s.string().refineAsync(asyncCheck, 'Check failed');

      const result = await schema.validateAsync('test');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].message).toBe('Network error');
      }
    });

    it('should validate inner schema before async refinement', async () => {
      const asyncCheck = vi.fn().mockResolvedValue(true);
      const schema = s.string().min(5).refineAsync(asyncCheck, 'Check failed');

      const result = await schema.validateAsync('hi');
      expect(result.ok).toBe(false);
      expect(asyncCheck).not.toHaveBeenCalled(); // Should not call async check if inner validation fails
    });

    it('should chain multiple async refinements', async () => {
      const check1 = vi.fn().mockResolvedValue(true);
      const check2 = vi.fn().mockResolvedValue(true);

      const schema = s.string()
        .refineAsync(check1, 'Check 1 failed')
        .refineAsync(check2, 'Check 2 failed');

      const result = await schema.validateAsync('test');
      expect(result.ok).toBe(true);
      expect(check1).toHaveBeenCalledWith('test');
      expect(check2).toHaveBeenCalledWith('test');
    });

    it('should stop at first failing async refinement', async () => {
      const check1 = vi.fn().mockResolvedValue(false);
      const check2 = vi.fn().mockResolvedValue(true);

      const schema = s.string()
        .refineAsync(check1, 'Check 1 failed')
        .refineAsync(check2, 'Check 2 failed');

      const result = await schema.validateAsync('test');
      expect(result.ok).toBe(false);
      expect(check1).toHaveBeenCalled();
      expect(check2).not.toHaveBeenCalled();
    });
  });

  describe('transformAsync()', () => {
    it('should transform value asynchronously', async () => {
      const asyncTransform = vi.fn().mockResolvedValue('HELLO');
      const schema = s.string().transformAsync(asyncTransform);

      const result = await schema.validateAsync('hello');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('HELLO');
      }
      expect(asyncTransform).toHaveBeenCalledWith('hello');
    });

    it('should handle transform errors', async () => {
      const asyncTransform = vi.fn().mockRejectedValue(new Error('Transform error'));
      const schema = s.string().transformAsync(asyncTransform);

      const result = await schema.validateAsync('hello');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors[0].message).toBe('Transform error');
      }
    });

    it('should validate before transform', async () => {
      const asyncTransform = vi.fn().mockResolvedValue('result');
      const schema = s.string().min(5).transformAsync(asyncTransform);

      const result = await schema.validateAsync('hi');
      expect(result.ok).toBe(false);
      expect(asyncTransform).not.toHaveBeenCalled();
    });

    it('should chain transforms', async () => {
      const schema = s.string()
        .transform(val => val.trim())
        .transformAsync(async val => val.toUpperCase());

      const result = await schema.validateAsync('  hello  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('HELLO');
      }
    });
  });

  describe('parseAsync()', () => {
    it('should return data on success', async () => {
      const schema = s.string();
      const result = await schema.parseAsync('hello');
      expect(result).toBe('hello');
    });

    it('should throw on validation failure', async () => {
      const schema = s.string().min(10);
      await expect(schema.parseAsync('hello')).rejects.toThrow();
    });

    it('should throw on async refinement failure', async () => {
      const schema = s.string().refineAsync(async () => false, 'Failed');
      await expect(schema.parseAsync('test')).rejects.toThrow();
    });
  });

  describe('safeParseAsync()', () => {
    it('should be alias for validateAsync', async () => {
      const schema = s.string();
      const result = await schema.safeParseAsync('hello');
      expect(result.ok).toBe(true);
    });
  });

  describe('preprocess()', () => {
    it('should preprocess before validation', async () => {
      const schema = s.number().preprocess((val) => {
        if (typeof val === 'string') {
          return parseInt(val, 10);
        }
        return val;
      });

      const result = await schema.validateAsync('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(42);
      }
    });

    it('should work with sync validate too', () => {
      const schema = s.number().preprocess((val) => {
        if (typeof val === 'string') {
          return parseInt(val, 10);
        }
        return val;
      });

      const result = schema.validate('42');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe(42);
      }
    });
  });

  describe('Real-world async scenarios', () => {
    it('should validate username availability', async () => {
      const takenUsernames = ['admin', 'root', 'system'];

      const checkUsernameAvailable = async (username: string): Promise<boolean> => {
        // Simulate async API call
        await new Promise((resolve) => setTimeout(resolve, 10));
        return !takenUsernames.includes(username);
      };

      const usernameSchema = s.string()
        .min(3, 'Username must be at least 3 characters')
        .max(20, 'Username must be at most 20 characters')
        .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
        .refineAsync(checkUsernameAvailable, 'Username is already taken');

      // Valid username
      const validResult = await usernameSchema.validateAsync('john_doe');
      expect(validResult.ok).toBe(true);

      // Taken username
      const takenResult = await usernameSchema.validateAsync('admin');
      expect(takenResult.ok).toBe(false);
      if (!takenResult.ok) {
        expect(takenResult.errors[0].message).toBe('Username is already taken');
      }

      // Invalid format (doesn't reach async check)
      const invalidResult = await usernameSchema.validateAsync('ab');
      expect(invalidResult.ok).toBe(false);
      if (!invalidResult.ok) {
        expect(invalidResult.errors[0].code).toBe('STRING_TOO_SHORT');
      }
    });

    it('should fetch and transform user data', async () => {
      interface User {
        id: number;
        name: string;
        email: string;
      }

      const fetchUser = async (id: number): Promise<User> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { id, name: `User ${id}`, email: `user${id}@example.com` };
      };

      const schema = s.number()
        .int()
        .positive()
        .transformAsync(fetchUser);

      const result = await schema.validateAsync(42);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toEqual({
          id: 42,
          name: 'User 42',
          email: 'user42@example.com',
        });
      }
    });

    it('should validate email with async check', async () => {
      const registeredEmails = ['admin@example.com', 'test@example.com'];

      const checkEmailNotRegistered = async (email: string): Promise<boolean> => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return !registeredEmails.includes(email);
      };

      const emailSchema = s.string()
        .email('Invalid email format')
        .refineAsync(checkEmailNotRegistered, 'Email is already registered');

      // New email
      const newResult = await emailSchema.validateAsync('new@example.com');
      expect(newResult.ok).toBe(true);

      // Registered email
      const existingResult = await emailSchema.validateAsync('admin@example.com');
      expect(existingResult.ok).toBe(false);

      // Invalid email format
      const invalidResult = await emailSchema.validateAsync('not-an-email');
      expect(invalidResult.ok).toBe(false);
      if (!invalidResult.ok) {
        expect(invalidResult.errors[0].code).toBe('STRING_INVALID_EMAIL');
      }
    });
  });

  describe('Mixed sync and async', () => {
    it('should work with sync refine and async refine together', async () => {
      const schema = s.string()
        .refine(val => val.length > 0, 'Cannot be empty')
        .refineAsync(async val => val !== 'forbidden', 'Forbidden value');

      const validResult = await schema.validateAsync('hello');
      expect(validResult.ok).toBe(true);

      const forbiddenResult = await schema.validateAsync('forbidden');
      expect(forbiddenResult.ok).toBe(false);

      const emptyResult = await schema.validateAsync('');
      expect(emptyResult.ok).toBe(false);
    });

    it('should work with transform and async transform together', async () => {
      const schema = s.string()
        .transform(val => val.trim())
        .transform(val => val.toLowerCase())
        .transformAsync(async val => `processed_${val}`);

      const result = await schema.validateAsync('  HELLO  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data).toBe('processed_hello');
      }
    });
  });
});
