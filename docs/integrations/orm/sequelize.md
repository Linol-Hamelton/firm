# Sequelize ORM Integration

FIRM provides validation hooks and model wrapper for Sequelize.

## Installation

```bash
npm install firm-validator sequelize
```

## Quick Start

```typescript
import { Sequelize, Model, DataTypes } from 'sequelize';
import { s } from 'firm-validator';
import { addValidationHooks } from 'firm-validator/integrations/sequelize';

const sequelize = new Sequelize('sqlite::memory:');

const userSchema = s.object({
  name: s.string().min(1).max(100),
  email: s.string().email(),
  age: s.number().int().min(0).max(150).optional(),
});

class User extends Model {
  declare name: string;
  declare email: string;
  declare age?: number;
}

User.init({
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  age: { type: DataTypes.INTEGER },
}, { sequelize, modelName: 'user' });

// Add validation hooks
addValidationHooks(User, userSchema);

// All operations are validated automatically
const user = await User.create({
  name: 'John',
  email: 'john@example.com',
  age: 30
});
```

## API Reference

### `addValidationHooks(model, schema, options?)`

Add validation hooks to Sequelize model.

```typescript
addValidationHooks(User, userSchema, {
  throwOnError: true,
  skip: ['beforeUpdate'], // Skip specific hooks
});
```

### `createValidatedModel(model, schema, options?)`

Create validated model wrapper.

```typescript
const ValidatedUser = createValidatedModel(User, userSchema);

await ValidatedUser.create({
  name: 'John',
  email: 'john@example.com'
});
```

### Manual Validation

```typescript
import {
  validateCreate,
  validateUpdateData,
  validateModelInstance
} from 'firm-validator/integrations/sequelize';

// Validate before create
const data = validateCreate({
  name: 'John',
  email: 'john@example.com'
}, userSchema);

await User.create(data);

// Validate before update
const updateData = validateUpdateData({
  name: 'John Doe'
}, userSchema);

await User.update(updateData, { where: { id: 1 } });

// Validate existing instance
const user = await User.findByPk(1);
validateModelInstance(user, userSchema);
```

### Schema Helpers

```typescript
import { sequelizeCreate, sequelizeUpdate } from 'firm-validator/integrations/sequelize';

// Omit auto-generated fields
const createSchema = sequelizeCreate(userSchema, ['id', 'createdAt', 'updatedAt']);

// Partial schema for updates
const updateSchema = sequelizeUpdate(userSchema, ['id', 'createdAt']);
```

## Complete Example

```typescript
import { Sequelize, Model, DataTypes } from 'sequelize';
import { s } from 'firm-validator';
import { addValidationHooks, sequelizeCreate, sequelizeUpdate } from 'firm-validator/integrations/sequelize';

const sequelize = new Sequelize({
  dialect: 'postgres',
  // ... config
});

const userBaseSchema = s.object({
  id: s.number(),
  name: s.string().min(1).max(100),
  email: s.string().email(),
  role: s.enum(['admin', 'user']).default('user'),
  createdAt: s.date(),
  updatedAt: s.date(),
});

class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare role: 'admin' | 'user';
  declare createdAt: Date;
  declare updatedAt: Date;
}

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  role: { type: DataTypes.ENUM('admin', 'user'), defaultValue: 'user' },
}, { sequelize, modelName: 'user', timestamps: true });

// Add validation with schema helpers
const createSchema = sequelizeCreate(userBaseSchema, ['id', 'createdAt', 'updatedAt']);
const updateSchema = sequelizeUpdate(userBaseSchema, ['id', 'createdAt', 'updatedAt']);

addValidationHooks(User, createSchema);

// Usage
await sequelize.sync();

const user = await User.create({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'admin'
});

await user.update({
  name: 'Jane Doe'
});

const users = await User.findAll({
  where: { role: 'admin' }
});
```

## Error Handling

```typescript
import { ValidationException } from 'firm-validator';

try {
  await User.create({
    name: '',
    email: 'invalid-email'
  });
} catch (error) {
  if (error instanceof ValidationException) {
    console.error('Validation failed:', error.errors);
  }
}
```

## See Also

- [Sequelize Documentation](https://sequelize.org)
- [API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
