/**
 * End-to-End Integration Tests
 *
 * Tests real-world usage scenarios.
 */

import { s, compile } from '../../src/index.js';
import type { Infer } from '../../src/index.js';

describe('E2E: User Registration Schema', () => {
  const userSchema = s.object({
    username: s.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
    email: s.string().email(),
    password: s.string().min(8),
    confirmPassword: s.string().min(8),
    age: s.number().int().min(13).optional(),
    acceptTerms: s.boolean(),
    newsletter: s.boolean().default(false),
  });

  type User = Infer<typeof userSchema>;

  it('should validate valid user data', () => {
    const result = userSchema.validate({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'secure123',
      confirmPassword: 'secure123',
      age: 25,
      acceptTerms: true,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.username).toBe('john_doe');
      expect(result.data.newsletter).toBe(false); // default
    }
  });

  it('should reject invalid username', () => {
    const result = userSchema.validate({
      username: 'ab', // too short
      email: 'john@example.com',
      password: 'secure123',
      confirmPassword: 'secure123',
      acceptTerms: true,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.path).toBe('username');
    }
  });

  it('should reject invalid email', () => {
    const result = userSchema.validate({
      username: 'john_doe',
      email: 'invalid-email',
      password: 'secure123',
      confirmPassword: 'secure123',
      acceptTerms: true,
    });

    expect(result.ok).toBe(false);
  });

  it('should report multiple errors', () => {
    const result = userSchema.validate({
      username: 'ab',
      email: 'invalid',
      password: 'short',
      confirmPassword: 'short',
      acceptTerms: 'yes', // should be boolean
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.length).toBeGreaterThan(1);
    }
  });
});

describe('E2E: API Response Schema', () => {
  const apiResponseSchema = s.discriminatedUnion('status', [
    s.object({
      status: s.literal('success'),
      data: s.object({
        items: s.array(s.object({
          id: s.number(),
          name: s.string(),
          price: s.number().positive(),
          tags: s.array(s.string()).optional(),
        })),
        pagination: s.object({
          page: s.number().int().positive(),
          perPage: s.number().int().positive(),
          total: s.number().int().nonnegative(),
        }),
      }),
    }),
    s.object({
      status: s.literal('error'),
      error: s.object({
        code: s.string(),
        message: s.string(),
        details: s.record(s.string()).optional(),
      }),
    }),
  ]);

  it('should validate success response', () => {
    const result = apiResponseSchema.validate({
      status: 'success',
      data: {
        items: [
          { id: 1, name: 'Product 1', price: 9.99, tags: ['sale'] },
          { id: 2, name: 'Product 2', price: 19.99 },
        ],
        pagination: { page: 1, perPage: 10, total: 100 },
      },
    });

    expect(result.ok).toBe(true);
  });

  it('should validate error response', () => {
    const result = apiResponseSchema.validate({
      status: 'error',
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
        details: { id: '123' },
      },
    });

    expect(result.ok).toBe(true);
  });

  it('should reject invalid status', () => {
    const result = apiResponseSchema.validate({
      status: 'unknown',
      data: {},
    });

    expect(result.ok).toBe(false);
  });
});

describe('E2E: Configuration Schema', () => {
  const configSchema = s.object({
    server: s.object({
      host: s.string().default('localhost'),
      port: s.number().int().min(1).max(65535).default(3000),
      ssl: s.boolean().default(false),
    }),
    database: s.object({
      url: s.string().url(),
      poolSize: s.number().int().positive().default(10),
      timeout: s.number().int().positive().default(5000),
    }),
    logging: s.object({
      level: s.enum(['debug', 'info', 'warn', 'error']).default('info'),
      format: s.enum(['json', 'text']).default('json'),
    }),
    features: s.record(s.boolean()).default({}),
  });

  it('should apply defaults', () => {
    const result = configSchema.validate({
      server: {},
      database: { url: 'https://db.example.com' },
      logging: {},
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.server.host).toBe('localhost');
      expect(result.data.server.port).toBe(3000);
      expect(result.data.database.poolSize).toBe(10);
      expect(result.data.logging.level).toBe('info');
    }
  });

  it('should override defaults', () => {
    const result = configSchema.validate({
      server: { port: 8080 },
      database: { url: 'https://db.example.com', poolSize: 20 },
      logging: { level: 'debug' },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.server.port).toBe(8080);
      expect(result.data.database.poolSize).toBe(20);
      expect(result.data.logging.level).toBe('debug');
    }
  });
});

describe('E2E: Compiled Schema Performance', () => {
  const schema = s.object({
    id: s.string().uuid(),
    name: s.string().min(1).max(100),
    email: s.string().email(),
    age: s.number().int().min(0).max(150),
    roles: s.array(s.enum(['admin', 'user', 'guest'])),
  });

  const compiledValidator = compile(schema);

  const validData = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30,
    roles: ['admin', 'user'],
  };

  it('should produce same results as uncompiled', () => {
    const uncompiledResult = schema.validate(validData);
    const compiledResult = compiledValidator(validData);

    expect(uncompiledResult.ok).toBe(compiledResult.ok);
    if (uncompiledResult.ok && compiledResult.ok) {
      expect(uncompiledResult.data).toEqual(compiledResult.data);
    }
  });

  it('compiled validator should have is() method', () => {
    expect(compiledValidator.is(validData)).toBe(true);
    expect(compiledValidator.is({ invalid: 'data' })).toBe(false);
  });
});

describe('E2E: Form Validation', () => {
  const contactFormSchema = s.object({
    name: s.string().min(2).max(50),
    email: s.string().email(),
    subject: s.string().min(5).max(100),
    message: s.string().min(10).max(1000),
    priority: s.enum(['low', 'medium', 'high']).default('medium'),
    attachments: s.array(s.object({
      name: s.string(),
      size: s.number().max(5 * 1024 * 1024), // 5MB
      type: s.string(),
    })).max(3).optional(),
  });

  it('should validate complete form', () => {
    const result = contactFormSchema.validate({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question about your product',
      message: 'I would like to know more about your product features.',
      attachments: [
        { name: 'document.pdf', size: 1024000, type: 'application/pdf' },
      ],
    });

    expect(result.ok).toBe(true);
  });

  it('should validate form without optional fields', () => {
    const result = contactFormSchema.validate({
      name: 'Jane Doe',
      email: 'jane@example.com',
      subject: 'General inquiry',
      message: 'This is my message to you.',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.priority).toBe('medium'); // default
      expect(result.data.attachments).toBeUndefined();
    }
  });

  it('should reject oversized attachments', () => {
    const result = contactFormSchema.validate({
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Question',
      message: 'This is my message.',
      attachments: [
        { name: 'huge.zip', size: 10 * 1024 * 1024, type: 'application/zip' }, // 10MB
      ],
    });

    expect(result.ok).toBe(false);
  });
});

describe('E2E: Nested Object Transformations', () => {
  const schema = s.object({
    user: s.object({
      name: s.string().trim(),
      email: s.string().trim().toLowerCase(),
    }),
    tags: s.array(s.string().trim().toLowerCase()),
  });

  it('should apply transformations at all levels', () => {
    const result = schema.validate({
      user: {
        name: '  John Doe  ',
        email: '  JOHN@EXAMPLE.COM  ',
      },
      tags: ['  TAG1  ', '  TAG2  '],
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.user.name).toBe('John Doe');
      expect(result.data.user.email).toBe('john@example.com');
      expect(result.data.tags).toEqual(['tag1', 'tag2']);
    }
  });
});

describe('E2E: Type Inference', () => {
  it('should correctly infer types', () => {
    const schema = s.object({
      str: s.string(),
      num: s.number(),
      bool: s.boolean(),
      arr: s.array(s.string()),
      obj: s.object({ nested: s.number() }),
      opt: s.string().optional(),
      nul: s.string().nullable(),
    });

    type Schema = Infer<typeof schema>;

    // This is a compile-time check - if types are wrong, TypeScript will error
    const data: Schema = {
      str: 'hello',
      num: 42,
      bool: true,
      arr: ['a', 'b'],
      obj: { nested: 1 },
      opt: undefined,
      nul: null,
    };

    const result = schema.validate(data);
    expect(result.ok).toBe(true);
  });
});
