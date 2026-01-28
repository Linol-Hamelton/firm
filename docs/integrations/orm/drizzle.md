# Drizzle ORM Integration

FIRM provides validated database wrapper for Drizzle ORM.

## Installation

```bash
npm install firm-validator drizzle-orm
```

## Quick Start

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, serial, text, integer } from 'drizzle-orm/pg-core';
import { s } from 'firm-validator';
import { createValidatedDb } from 'firm-validator/integrations/drizzle';

// Define Drizzle schema
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  age: integer('age'),
});

// Define validation schema
const userSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150).optional(),
});

// Create validated database
const db = drizzle(connection);
const validatedDb = createValidatedDb(db, {
  users: userSchema
});

// All insert/update operations are validated
await validatedDb.insert(users).values({
  name: 'John',
  email: 'john@example.com',
  age: 30
});
```

## API Reference

### `createValidatedDb(db, schemas, options?)`

Creates validated Drizzle database wrapper.

```typescript
const validatedDb = createValidatedDb(db, {
  users: userSchema,
  posts: postSchema,
}, {
  throwOnError: true,
  onError: (errors) => console.error(errors),
});
```

### `validateInsert(data, schema)`

Manual validation for insert operations.

```typescript
const validated = validateInsert({
  name: 'John',
  email: 'john@example.com'
}, userSchema);

await db.insert(users).values(validated);
```

### `validateUpdate(data, schema)`

Manual validation for update operations (partial).

```typescript
const validated = validateUpdate({
  name: 'John Doe'
}, userSchema);

await db.update(users)
  .set(validated)
  .where(eq(users.id, 1));
```

### Schema Helpers

```typescript
import { drizzleInsert, drizzleUpdate } from 'firm-validator/integrations/drizzle';

// Omit auto-generated fields
const insertSchema = drizzleInsert(userSchema, ['id', 'createdAt']);

// Partial schema for updates
const updateSchema = drizzleUpdate(userSchema, ['id', 'createdAt']);
```

## Complete Example

```typescript
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { createValidatedDb, drizzleInsert } from 'firm-validator/integrations/drizzle';

const db = drizzle(connection);

const userSchema = s.object({
  id: s.number(),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  createdAt: s.date(),
});

const insertSchema = drizzleInsert(userSchema, ['id', 'createdAt']);

const validatedDb = createValidatedDb(db, {
  users: insertSchema
});

// CRUD operations
const user = await validatedDb
  .insert(users)
  .values({
    name: 'John',
    email: 'john@example.com'
  })
  .returning();

await validatedDb
  .update(users)
  .set({ name: 'John Doe' })
  .where(eq(users.id, user[0].id));

const allUsers = await db.select().from(users);
```

## See Also

- [Drizzle Documentation](https://orm.drizzle.team)
- [API Reference](../../api/README.md)
