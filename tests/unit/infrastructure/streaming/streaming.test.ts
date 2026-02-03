// @ts-ignore - TypeScript doesn't see compiled files
import { s } from '../../../../src/index';
// @ts-ignore - TypeScript doesn't see compiled files
import { validateStream, validateArrayStream, isStream } from '../../../../src/infrastructure/streaming/streaming-validator.js';

describe('Streaming Validation', () => {
  const userSchema = s.object({
    id: s.number(),
    name: s.string().min(1),
    email: s.string().email(),
  });

  describe('validateStream', () => {
    it('should validate newline-delimited JSON stream', async () => {
      const stream = [
        '{"id":1,"name":"Alice","email":"alice@example.com"}\n',
        '{"id":2,"name":"Bob","email":"bob@example.com"}\n',
      ];

      const result = await validateStream(userSchema, stream);

      expect(result.ok).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toEqual({ id: 1, name: 'Alice', email: 'alice@example.com' });
      expect(result.total).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle validation errors', async () => {
      const stream = [
        '{"id":1,"name":"Alice","email":"invalid-email"}\n',
        '{"id":2,"name":"Bob","email":"bob@example.com"}\n',
      ];

      const result = await validateStream(userSchema, stream, { abortEarly: false });

      expect(result.ok).toBe(false);
      expect(result.items).toHaveLength(1); // Only second item valid
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('VALIDATION_FAILED');
    });

    it('should abort early on error', async () => {
      const stream = [
        '{"id":1,"name":"Alice","email":"invalid-email"}\n',
        '{"id":2,"name":"Bob","email":"bob@example.com"}\n',
      ];

      const result = await validateStream(userSchema, stream, { abortEarly: true });

      expect(result.ok).toBe(false);
      expect(result.items).toHaveLength(0); // No items processed after error
      expect(result.errors).toHaveLength(1);
    });

    it('should handle parse errors', async () => {
      const stream = [
        'invalid json\n',
        '{"id":1,"name":"Alice","email":"alice@example.com"}\n',
      ];

      const result = await validateStream(userSchema, stream, { abortEarly: false });

      expect(result.ok).toBe(false);
      expect(result.items).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe('PARSE_ERROR');
    });

    it('should respect maxSize limit', async () => {
      const stream = [
        '{"id":1,"name":"Alice","email":"alice@example.com"}\n',
        '{"id":2,"name":"Bob","email":"bob@example.com"}\n',
      ];

      // Each line ~60 bytes, set maxSize to 50
      const result = await validateStream(userSchema, stream, { maxSize: 50 });

      expect(result.ok).toBe(false);
      expect(result.errors[0].code).toBe('STREAM_SIZE_EXCEEDED');
    });
  });

  describe('validateArrayStream', () => {
    it('should validate JSON array stream', async () => {
      const stream = [
        '[',
        '{"id":1,"name":"Alice","email":"alice@example.com"},',
        '{"id":2,"name":"Bob","email":"bob@example.com"}',
        ']',
      ];

      const result = await validateArrayStream(userSchema, stream);

      expect(result.ok).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should handle invalid JSON array', async () => {
      const stream = ['invalid json'];

      const result = await validateArrayStream(userSchema, stream);

      expect(result.ok).toBe(false);
      expect(result.errors[0].code).toBe('PARSE_ERROR');
    });
  });

  describe('isStream', () => {
    it('should detect async iterable', () => {
      const asyncIterable = {
        [Symbol.asyncIterator]: () => ({ next: () => Promise.resolve({ done: true }) }),
      };
      expect(isStream(asyncIterable)).toBe(true);
    });

    it('should detect sync iterable', () => {
      const syncIterable = {
        [Symbol.iterator]: () => ({ next: () => ({ done: true }) }),
      };
      expect(isStream(syncIterable)).toBe(true);
    });

    it('should reject non-iterable', () => {
      expect(isStream({})).toBe(false);
      expect(isStream(null)).toBe(false);
      expect(isStream(42)).toBe(false);
      expect(isStream('string')).toBe(false);
    });
  });
});