# ORM Integrations

FIRM provides first-class support for popular ORM libraries:

## Available Integrations

### Production Ready ORMs

1. **[Prisma](./prisma.md)** - Modern ORM for Node.js & TypeScript
   ```typescript
   import { createFirmMiddleware } from 'firm-validator/integrations/prisma';
   prisma.$use(createFirmMiddleware({ user: { create: userSchema } }));
   ```

2. **[TypeORM](./typeorm.md)** - TypeScript ORM with decorator support
   ```typescript
   import { ValidatedEntity } from 'firm-validator/integrations/typeorm';
   class User extends ValidatedEntity { /* ... */ }
   ```

3. **[Drizzle](./drizzle.md)** - Lightweight TypeScript ORM
   ```typescript
   import { createValidatedDb } from 'firm-validator/integrations/drizzle';
   const db = createValidatedDb(drizzle, { users: userSchema });
   ```

4. **[Sequelize](./sequelize.md)** - Traditional ORM for SQL databases
   ```typescript
   import { addValidationHooks } from 'firm-validator/integrations/sequelize';
   addValidationHooks(User, userSchema);
   ```

## Quick Comparison

| ORM | Type Safety | Validation | Performance | Use Case |
|-----|-------------|------------|-------------|----------|
| Prisma | Excellent | Middleware | Excellent | Modern apps |
| TypeORM | Good | Subscribers | Good | Enterprise |
| Drizzle | Excellent | Proxy | Excellent | Performance |
| Sequelize | Fair | Hooks | Good | Legacy/SQL |

## Common Patterns

### Middleware/Hooks Pattern

All ORMs support automatic validation through middleware or hooks:

```typescript
// Prisma
prisma.$use(createFirmMiddleware({ user: { create: userSchema } }));

// TypeORM
dataSource.subscribers.push(createValidationSubscriber());

// Sequelize
addValidationHooks(User, userSchema);
```

### Manual Validation Pattern

Validate data before operations:

```typescript
// Prisma
const user = await validateModel(prisma.user.create, { data }, userSchema);

// TypeORM
const validated = validateEntity(data, userSchema);

// Drizzle
const validated = validateInsert(data, userSchema);

// Sequelize
const validated = validateCreate(data, userSchema);
```

### Schema Helpers

All integrations provide schema transformation helpers:

```typescript
// Create schema (omit auto-generated fields)
const createSchema = prismaOmit(userSchema, ['id', 'createdAt', 'updatedAt']);

// Update schema (all fields optional)
const updateSchema = prismaUpdate(userSchema);

// Select schema (for query results)
const selectSchema = drizzleSelect(userSchema);
```

## Common Features

All ORM integrations share these features:

- **Type Safety**: Full TypeScript inference
- **Schema Reuse**: Define once, use everywhere
- **Error Handling**: Consistent error format
- **Performance**: Minimal overhead
- **Flexibility**: Manual and automatic validation

## Installation

```bash
# Base package
npm install firm-validator

# ORM-specific (peer dependencies)
npm install prisma          # For Prisma
npm install @prisma/client

npm install typeorm         # For TypeORM
npm install reflect-metadata

npm install drizzle-orm     # For Drizzle

npm install sequelize       # For Sequelize
```

## Use Cases

### Prisma Integration

Perfect for:
- Modern full-stack applications
- GraphQL APIs with Prisma
- Type-safe database access
- Schema-first development

### TypeORM Integration

Perfect for:
- Enterprise applications
- Decorator-based architecture
- Complex entity relationships
- Migration management

### Drizzle Integration

Perfect for:
- Performance-critical applications
- Edge runtime (Cloudflare Workers, Deno)
- Lightweight ORM needs
- SQL-first approach

### Sequelize Integration

Perfect for:
- Legacy application modernization
- Multi-database support
- Traditional ORM patterns
- SQL database expertise

## Error Handling

All integrations throw `ValidationException` with consistent error format:

```typescript
try {
  await prisma.user.create({
    data: { name: '', email: 'invalid' }
  });
} catch (error) {
  if (error instanceof ValidationException) {
    console.error(error.errors);
    // [
    //   { path: 'name', code: 'STRING_TOO_SHORT', message: '...' },
    //   { path: 'email', code: 'STRING_INVALID_EMAIL', message: '...' }
    // ]
  }
}
```

## Performance

ORM integrations are designed for production use:

- **Pre-compilation**: Compile schemas once, reuse across operations
- **Type caching**: TypeScript types computed at build time
- **Minimal allocations**: Optimized for high throughput
- **Async support**: Native Promise handling
- **Zero overhead**: When validation passes, performance is identical to native ORM

## Best Practices

1. **Define schemas centrally**: Keep validation schemas in a separate module
2. **Use schema helpers**: Leverage `omit()`, `partial()`, `pick()` for different operations
3. **Validate at boundaries**: Use automatic validation for user input, manual for internal operations
4. **Handle errors gracefully**: Catch `ValidationException` and format errors for users
5. **Test thoroughly**: Write tests for both valid and invalid data

## Examples

### Complete CRUD with Prisma

```typescript
import { s } from 'firm-validator';
import { createFirmMiddleware, prismaOmit, prismaUpdate } from 'firm-validator/integrations/prisma';

const userBaseSchema = s.object({
  id: s.number(),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150).optional(),
  createdAt: s.date(),
  updatedAt: s.date(),
});

const schemas = {
  user: {
    create: prismaOmit(userBaseSchema, ['id', 'createdAt', 'updatedAt']),
    update: prismaUpdate(prismaOmit(userBaseSchema, ['id', 'createdAt', 'updatedAt'])),
  }
};

prisma.$use(createFirmMiddleware(schemas));

// All operations now validated automatically
const user = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  }
});
```

## Next Steps

- Choose your ORM and read the detailed integration guide
- See [Examples](../../examples/) for complete working projects
- Check [API Reference](../../api/README.md) for schema options
- Review [Best Practices](../../guides/best-practices.md)
