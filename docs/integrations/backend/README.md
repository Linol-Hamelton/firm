# Backend Framework Integrations

FIRM provides first-class support for popular backend frameworks:

## Available Integrations

### Tier 1 (Production Ready)

1. **[Express.js](./express.md)** - Most popular Node.js framework
   ```typescript
   import { validate } from 'firm-validator/integrations/express';
   app.post('/users', validate({ body: userSchema }), handler);
   ```

2. **[Fastify](./fastify.md)** - High-performance framework
   ```typescript
   import { firmValidatorPlugin } from 'firm-validator/integrations/fastify';
   await fastify.register(firmValidatorPlugin);
   ```

3. **[Hono](./hono.md)** - Edge runtime framework
   ```typescript
   import { validator } from 'firm-validator/integrations/hono';
   app.post('/users', validator('json', userSchema), handler);
   ```

4. **[Next.js](./nextjs.md)** - Full-stack React framework
   ```typescript
   import { validateRequest } from 'firm-validator/integrations/next';
   export async function POST(req) {
     const validation = await validateRequest(req, { body: userSchema });
     // ...
   }
   ```

5. **[NestJS](./nestjs.md)** - Progressive Node.js framework
   ```typescript
   import { FirmValidationPipe } from 'firm-validator/integrations/nestjs';
   @UsePipes(new FirmValidationPipe(userSchema))
   async createUser(@Body() body: unknown) { ... }
   ```

6. **[Koa](./koa.md)** - Next generation web framework
   ```typescript
   import { validateBody } from 'firm-validator/integrations/koa';
   app.use(validateBody(userSchema));
   ```

## Quick Comparison

| Framework | Integration Type | TypeScript | Async | Performance |
|-----------|-----------------|------------|-------|-------------|
| Express | Middleware | ✅ | ✅ | Good |
| Fastify | Plugin | ✅ | ✅ | Excellent |
| Hono | Middleware | ✅ | ✅ | Excellent |
| Next.js | Helper | ✅ | ✅ | Good |
| NestJS | Pipe | ✅ | ✅ | Excellent |
| Koa | Middleware | ✅ | ✅ | Excellent |

## Common Patterns

### Validating Request Body

```typescript
// Express
app.post('/users', validateBody(userSchema), handler);

// Fastify
fastify.post('/users', { schema: { body: userSchema } }, handler);

// Hono
app.post('/users', validator('json', userSchema), handler);

// Next.js
export async function POST(req) {
  const validation = await validateBody(req, userSchema);
}
```

### Validating Query Parameters

All integrations support query parameter validation with coercion:

```typescript
const querySchema = s.object({
  page: s.coerce.number().int().min(1),
  limit: s.coerce.number().int().max(100)
});
```

### Error Handling

All integrations return 400 status with consistent error format:

```json
{
  "success": false,
  "errors": [
    {
      "location": "body",
      "path": "email",
      "code": "INVALID_EMAIL",
      "message": "Invalid email format"
    }
  ]
}
```

## Installation

```bash
# Base package
npm install firm-validator

# Framework-specific (peer dependencies)
npm install express        # For Express
npm install fastify        # For Fastify
npm install hono           # For Hono
npm install next           # For Next.js
```

## Performance

All integrations are designed for zero overhead:

- **Pre-compilation**: Schemas can be compiled once and reused
- **Type safety**: Full TypeScript inference
- **Minimal allocations**: Optimized for high throughput
- **Async support**: Native Promise handling

## Next Steps

- Choose your framework and read the detailed integration guide
- See [Examples](../../examples/) for complete working projects
- Check [API Reference](../../api/README.md) for schema options
