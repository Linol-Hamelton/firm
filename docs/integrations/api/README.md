# API Framework Integrations

FIRM provides first-class support for popular API frameworks and standards:

## Available Integrations

### API Frameworks

1. **[tRPC](./trpc.md)** - End-to-end typesafe APIs
   ```typescript
   import { firmInput } from 'firm-validator/integrations/trpc';
   t.procedure.input(firmInput(userSchema)).mutation(({ input }) => { ... });
   ```

2. **[GraphQL](./graphql.md)** - Apollo Server integration
   ```typescript
   import { firmArgs } from 'firm-validator/integrations/graphql';
   createUser: firmArgs(userSchema, async (parent, args) => { ... })
   ```

3. **[REST](./rest.md)** - Generic REST helpers
   ```typescript
   import { createRestValidator } from 'firm-validator/integrations/rest';
   const validator = createRestValidator({ GET: getSchema, POST: postSchema });
   ```

4. **[OpenAPI](./openapi.md)** - Specification generator
   ```typescript
   import { generateOpenAPI } from 'firm-validator/integrations/openapi';
   const spec = generateOpenAPI({ info, paths });
   ```

## Quick Comparison

| Framework | Type Safety | Use Case | Performance |
|-----------|-------------|----------|-------------|
| tRPC | Excellent | RPC APIs | Excellent |
| GraphQL | Good | GraphQL APIs | Good |
| REST | Good | Generic REST | Excellent |
| OpenAPI | Good | API docs | N/A |

## Common Patterns

### Input Validation

All integrations provide input validation with type inference:

```typescript
// tRPC
const input = firmInput(s.object({
  name: s.string(),
  email: s.string().email()
}));

// GraphQL
const createUser = firmArgs(userSchema, resolver);

// REST
const result = validateRequest(req, {
  body: userSchema
});
```

### Error Handling

All integrations throw `ValidationError` with consistent error format:

```typescript
{
  message: 'Validation failed',
  errors: [
    {
      path: ['email'],
      code: 'INVALID_EMAIL',
      message: 'Invalid email format'
    }
  ]
}
```

### Type Inference

Full TypeScript support with automatic type inference:

```typescript
const userSchema = s.object({
  name: s.string(),
  age: s.number()
});

// Input is typed as { name: string; age: number }
t.procedure.input(firmInput(userSchema)).mutation(({ input }) => {
  const name: string = input.name;  // ✅ Type-safe
  const age: number = input.age;    // ✅ Type-safe
});
```

## Installation

```bash
# Base package
npm install firm-validator

# Framework-specific (peer dependencies)
npm install @trpc/server      # For tRPC
npm install @apollo/server    # For GraphQL
npm install graphql           # For GraphQL
```

## Features

All integrations share these features:

- **Zero dependencies**: No additional dependencies beyond peer requirements
- **Type safety**: Full TypeScript inference
- **Schema reuse**: Define once, use everywhere
- **Consistent errors**: Unified error format
- **High performance**: Minimal overhead

## Performance

API integrations are designed for production use:

- **Pre-compilation**: Compile schemas once, reuse across requests
- **Type caching**: TypeScript types computed at build time
- **Minimal allocations**: Optimized for high throughput
- **Async support**: Native Promise handling

## Use Cases

### tRPC Integration

Perfect for:
- Full-stack TypeScript applications
- Monorepo projects
- End-to-end type safety
- RPC-style APIs

### GraphQL Integration

Perfect for:
- GraphQL APIs with Apollo Server
- Complex data queries
- Schema-first development
- API federation

### REST Integration

Perfect for:
- Generic REST APIs
- Framework-agnostic validation
- HTTP client validation
- Multi-framework projects

### OpenAPI Integration

Perfect for:
- API documentation generation
- Swagger UI integration
- OpenAPI 3.0 compliance
- Schema conversion

## Next Steps

- Choose your framework and read the detailed integration guide
- See [Examples](../../examples/) for complete working projects
- Check [API Reference](../../api/README.md) for schema options
