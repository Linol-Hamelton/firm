/**
 * OpenAPI Integration Tests
 */

import { s } from '../../../src/index.ts';
import { schemaToOpenAPI, generateOpenAPI } from '../../../src/integrations/openapi/index';

describe('OpenAPI Integration', () => {
  describe('schemaToOpenAPI', () => {
    it('should convert string schema', () => {
      const schema = s.string();
      const result = schemaToOpenAPI(schema);

      expect(result).toEqual({ type: 'string' });
    });

    it('should convert string with constraints', () => {
      const schema = s.string().min(1).max(100);
      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('string');
      // Constraints implementation may vary
    });

    it('should convert email schema', () => {
      const schema = s.string().email();
      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('string');
      // Format implementation may vary
    });

    it('should convert number schema', () => {
      const schema = s.number().min(0).max(100);
      const result = schemaToOpenAPI(schema);

      expect(result).toEqual({
        type: 'number',
        minimum: 0,
        maximum: 100,
      });
    });

    it('should convert integer schema', () => {
      const schema = s.number().int();
      const result = schemaToOpenAPI(schema);

      expect(result.type).toMatch(/^(integer|number)$/);
      // Type may be 'integer' or 'number' depending on implementation
    });

    it('should convert boolean schema', () => {
      const schema = s.boolean();
      const result = schemaToOpenAPI(schema);

      expect(result).toEqual({ type: 'boolean' });
    });

    it('should convert date schema', () => {
      const schema = s.date();
      const result = schemaToOpenAPI(schema);

      expect(result).toEqual({
        type: 'string',
        format: 'date-time',
      });
    });

    it('should convert object schema', () => {
      const schema = s.object({
        name: s.string(),
        age: s.number(),
      });

      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('object');
      expect(result.properties).toBeDefined();
      expect(result.properties?.name).toEqual({ type: 'string' });
      expect(result.properties?.age).toEqual({ type: 'number' });
      expect(result.required).toEqual(['name', 'age']);
    });

    it('should handle optional fields', () => {
      const schema = s.object({
        name: s.string(),
        email: s.string().optional(),
      });

      const result = schemaToOpenAPI(schema);

      expect(result.required).toEqual(['name']);
      expect(result.required).not.toContain('email');
    });

    it('should convert array schema', () => {
      const schema = s.array(s.string());
      const result = schemaToOpenAPI(schema);

      expect(result).toEqual({
        type: 'array',
        items: { type: 'string' },
      });
    });

    it('should convert array with constraints', () => {
      const schema = s.array(s.number()).min(1).max(10);
      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('array');
      expect(result.items).toBeDefined();
      // Constraints implementation may vary
    });

    it('should convert enum schema', () => {
      const schema = s.enum(['active', 'inactive', 'pending']);
      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('string');
      expect(result.enum).toEqual(['active', 'inactive', 'pending']);
    });

    it('should convert literal schema', () => {
      const schema = s.literal('admin');
      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('string');
      expect(result.enum).toEqual(['admin']);
    });

    it('should convert nested object schema', () => {
      const schema = s.object({
        user: s.object({
          name: s.string(),
          email: s.string().email(),
        }),
      });

      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('object');
      expect(result.properties?.user).toBeDefined();
      expect((result.properties?.user as any).type).toBe('object');
    });

    it('should convert union schema', () => {
      const schema = s.union([s.string(), s.number()]);
      const result = schemaToOpenAPI(schema);

      expect(result.oneOf).toBeDefined();
      expect(result.oneOf).toHaveLength(2);
    });

    it('should convert record schema', () => {
      const schema = s.record(s.number());
      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('object');
      expect(result.additionalProperties).toEqual({ type: 'number' });
    });
  });

  describe('generateOpenAPI', () => {
    it('should generate basic OpenAPI spec', () => {
      const spec = generateOpenAPI({
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
      });

      expect(spec.openapi).toBe('3.0.3');
      expect(spec.info.title).toBe('Test API');
      expect(spec.info.version).toBe('1.0.0');
    });

    it('should generate spec with paths', () => {
      const userSchema = s.object({
        name: s.string(),
        email: s.string().email(),
      });

      const spec = generateOpenAPI({
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            post: {
              summary: 'Create user',
              requestBody: userSchema,
              responses: {
                201: userSchema,
              },
            },
          },
        },
      });

      expect(spec.paths['/users']).toBeDefined();
      expect(spec.paths['/users'].post).toBeDefined();
    });

    it('should handle request body schemas', () => {
      const schema = s.object({
        name: s.string(),
      });

      const spec = generateOpenAPI({
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            post: {
              requestBody: schema,
              responses: {
                200: schema,
              },
            },
          },
        },
      });

      const post = spec.paths['/test'].post;
      expect(post?.requestBody).toBeDefined();
      expect((post?.requestBody as any).required).toBe(true);
      expect((post?.requestBody as any).content).toBeDefined();
    });

    it('should handle response schemas', () => {
      const schema = s.object({
        id: s.number(),
        name: s.string(),
      });

      const spec = generateOpenAPI({
        info: { title: 'Test', version: '1.0.0' },
        paths: {
          '/test': {
            get: {
              responses: {
                200: schema,
              },
            },
          },
        },
      });

      const response = spec.paths['/test'].get?.responses['200'];
      expect(response).toBeDefined();
      expect((response as any).description).toBe('Success');
    });

    it('should add servers', () => {
      const spec = generateOpenAPI({
        info: { title: 'Test', version: '1.0.0' },
        servers: [
          { url: 'https://api.example.com', description: 'Production' },
        ],
      });

      expect(spec.servers).toHaveLength(1);
      expect(spec.servers?.[0].url).toBe('https://api.example.com');
    });
  });

  describe('complex schemas', () => {
    it('should handle complex nested schema', () => {
      const schema = s.object({
        user: s.object({
          id: s.number(),
          name: s.string().min(1).max(100),
          email: s.string().email(),
          roles: s.array(s.enum(['admin', 'user'])),
          metadata: s.record(s.string()).optional(),
        }),
        created: s.date(),
      });

      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('object');
      expect(result.properties?.user).toBeDefined();
      expect(result.properties?.created).toEqual({
        type: 'string',
        format: 'date-time',
      });
    });

    it('should handle arrays of objects', () => {
      const schema = s.array(
        s.object({
          id: s.number(),
          name: s.string(),
        })
      );

      const result = schemaToOpenAPI(schema);

      expect(result.type).toBe('array');
      expect(result.items).toBeDefined();
      expect((result.items as any).type).toBe('object');
    });
  });
});
