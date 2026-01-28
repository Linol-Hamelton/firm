# TypeORM Integration

FIRM provides validation subscribers and entity base class for TypeORM.

## Installation

```bash
npm install firm-validator typeorm reflect-metadata
```

## Quick Start

```typescript
import { DataSource, Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import { s } from 'firm-validator';
import { ValidatedEntity, createValidationSubscriber } from 'firm-validator/integrations/typeorm';

const userSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  age: s.number().int().min(0).max(150).optional(),
});

@Entity()
class User extends ValidatedEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ nullable: true })
  age?: number;

  static override getValidationSchema() {
    return userSchema;
  }
}

const dataSource = new DataSource({
  type: 'postgres',
  // ... config
  entities: [User],
  subscribers: [createValidationSubscriber()],
});

// All saves are validated automatically
const user = new User();
user.name = 'John';
user.email = 'john@example.com';
await user.save();
```

## API Reference

### `ValidatedEntity`

Base entity class with built-in validation.

```typescript
@Entity()
class User extends ValidatedEntity {
  static override getValidationSchema() {
    return userSchema;
  }

  // Optional: custom validation method
  async customValidate() {
    this.validate(); // Calls FIRM validation
    // Add custom logic...
  }
}
```

### `createValidationSubscriber(options?)`

Creates entity subscriber for automatic validation.

```typescript
const subscriber = createValidationSubscriber({
  throwOnError: true,
  skip: ['remove'], // Skip validation on delete
});

const dataSource = new DataSource({
  subscribers: [subscriber],
});
```

### `createValidatedRepository(repository, schema)`

Wrap repository with validation.

```typescript
const userRepo = dataSource.getRepository(User);
const validatedRepo = createValidatedRepository(userRepo, userSchema);

await validatedRepo.save({ name: 'John', email: 'john@example.com' });
```

## Complete Example

See [Prisma documentation](./prisma.md) for complete CRUD example patterns.

## See Also

- [TypeORM Documentation](https://typeorm.io)
- [API Reference](../../api/README.md)
