# Prisma ORM Integration

FIRM provides seamless integration with Prisma for automatic data validation.

## Installation

```bash
npm install firm-validator prisma @prisma/client
```

## Quick Start

```typescript
import { PrismaClient } from '@prisma/client';
import { s } from 'firm-validator';
import { createFirmMiddleware } from 'firm-validator/integrations/prisma';

const prisma = new PrismaClient();

// Define validation schema
const userSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150).optional(),
});

// Add validation middleware
prisma.$use(createFirmMiddleware({
  user: {
    create: userSchema,
    update: userSchema.partial(),
  }
}));

// All operations are now validated automatically
const user = await prisma.user.create({
  data: {
    name: 'John',
    email: 'john@example.com',
    age: 30
  }
});
```

## API Reference

### `createFirmMiddleware(config)`

Create Prisma middleware for automatic validation.

**Parameters:**
- `config: FirmMiddlewareConfig` - Schema configuration for each model and action

**Example:**
```typescript
const middleware = createFirmMiddleware({
  user: {
    create: userCreateSchema,
    update: userUpdateSchema,
    upsert: userUpsertSchema,
  },
  post: {
    create: postCreateSchema,
  }
});

prisma.$use(middleware);
```

### `validateModel(operation, args, schema)`

Validate data before Prisma operation.

**Example:**
```typescript
const user = await validateModel(
  prisma.user.create,
  { data: { name: 'John', email: 'john@example.com' } },
  userSchema
);
```

### Schema Helpers

#### `prismaOmit(schema, keys)`

Omit auto-generated fields:

```typescript
const createSchema = prismaOmit(userSchema, ['id', 'createdAt', 'updatedAt']);
```

#### `prismaUpdate(schema)`

Make all fields optional for updates:

```typescript
const updateSchema = prismaUpdate(userSchema);
```

## Complete Example

```typescript
// schemas/user.ts
import { s } from 'firm-validator';

export const userBaseSchema = s.object({
  id: s.number(),
  name: s.string().min(1).max(100),
  email: s.string().email().toLowerCase(),
  age: s.number().int().min(0).max(150).optional(),
  role: s.enum(['admin', 'user']).default('user'),
  createdAt: s.date(),
  updatedAt: s.date(),
});

export const userCreateSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email().toLowerCase(),
  age: s.number().int().min(0).max(150).optional(),
  role: s.enum(['admin', 'user']).default('user'),
});

export const userUpdateSchema = userCreateSchema.partial();

// prisma/client.ts
import { PrismaClient } from '@prisma/client';
import { createFirmMiddleware } from 'firm-validator/integrations/prisma';
import { userCreateSchema, userUpdateSchema } from '../schemas/user';

const prisma = new PrismaClient();

prisma.$use(createFirmMiddleware({
  user: {
    create: userCreateSchema,
    createMany: userCreateSchema,
    update: userUpdateSchema,
    updateMany: userUpdateSchema,
    upsert: userCreateSchema,
  }
}));

export default prisma;

// Usage
import prisma from './prisma/client';

// Create (validated automatically)
const user = await prisma.user.create({
  data: {
    name: 'John Doe',
    email: 'JOHN@EXAMPLE.COM', // Will be lowercased
    age: 30
  }
});

// Update (validated automatically)
await prisma.user.update({
  where: { id: user.id },
  data: {
    age: 31
  }
});

// Batch operations
await prisma.user.createMany({
  data: [
    { name: 'User 1', email: 'user1@example.com' },
    { name: 'User 2', email: 'user2@example.com' },
  ]
});
```

## Error Handling

```typescript
import { ValidationException } from 'firm-validator';

try {
  await prisma.user.create({
    data: {
      name: '',
      email: 'invalid-email'
    }
  });
} catch (error) {
  if (error instanceof ValidationException) {
    console.error('Validation failed:', error.errors);
    // Handle validation errors
  }
}
```

## Best Practices

1. **Omit auto-generated fields**: Use `prismaOmit()` for create schemas
2. **Use partial for updates**: `schema.partial()` makes all fields optional
3. **Centralize schemas**: Keep validation schemas in separate files
4. **Validate transformations**: Use transforms for data normalization (e.g., `.toLowerCase()`)
5. **Test thoroughly**: Write tests for both valid and invalid data

## See Also

- [Prisma Documentation](https://www.prisma.io/docs)
- [API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
