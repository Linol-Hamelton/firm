# Object Validator API

The object validator provides comprehensive validation for JavaScript objects with support for nested structures, optional/required fields, and unknown key handling.

## Basic Usage

```typescript
import { s } from 'firm-validator';

const schema = s.object({
  name: s.string(),
  age: s.number(),
});
```

## Field Definitions

```typescript
s.object({
  requiredField: s.string(),           // Required field
  optionalField: s.string().optional(), // Optional field
  nullableField: s.string().nullable(), // Nullable field
  defaultField: s.string().default('default'), // Field with default
})
```

## Object Modifiers

```typescript
s.object({ ... })
  .strict()                    // Reject unknown keys (default)
  .passthrough()               // Allow unknown keys
  .strip()                     // Remove unknown keys

  .partial()                   // Make all fields optional
  .required()                  // Make all fields required
  .pick(['field1', 'field2'])  // Select specific fields
  .omit(['field1', 'field2'])  // Exclude specific fields
```

## Nested Objects

```typescript
const schema = s.object({
  user: s.object({
    name: s.string(),
    profile: s.object({
      bio: s.string().optional(),
      avatar: s.string().url(),
    }),
  }),
  settings: s.object({
    theme: s.enum(['light', 'dark']),
    notifications: s.boolean(),
  }),
});
```

## Advanced Features

### Extend Objects

```typescript
const baseUser = s.object({
  id: s.number(),
  name: s.string(),
});

const fullUser = baseUser.extend({
  email: s.string().email(),
  age: s.number().int().optional(),
});
```

### Merge Objects

```typescript
const userInfo = s.object({
  name: s.string(),
  email: s.string().email(),
});

const userPrefs = s.object({
  theme: s.string(),
  notifications: s.boolean(),
});

const mergedSchema = userInfo.merge(userPrefs);
```

## Type Inference

```typescript
const schema = s.object({
  name: s.string(),
  age: s.number().int().optional(),
  tags: s.array(s.string()),
});

type Inferred = s.Infer<typeof schema>;
// {
//   name: string;
//   age?: number;
//   tags: string[];
// }
```

## Error Handling

```typescript
const schema = s.object({
  name: s.string().min(1),
  age: s.number().int().min(0),
});

const result = schema.validate({
  name: '',           // Too short
  age: -5,            // Negative
  extra: 'field'      // Unknown key (if strict)
});

// Structured errors
if (!result.ok) {
  console.log(result.errors);
  // [
  //   { path: ['name'], code: 'too_small', message: '...' },
  //   { path: ['age'], code: 'too_small', message: '...' },
  //   { path: ['extra'], code: 'unknown_key', message: '...' }
  // ]
}
```

## Security Features

### Prototype Pollution Protection

```typescript
// Automatically protected against:
const malicious = {
  name: 'safe',
  __proto__: { polluted: true }  // This is blocked
};

schema.validate(malicious); // Security violation error
```

### Depth Limiting

```typescript
// Prevent stack overflow attacks
const schema = s.object({
  data: s.string(),
}).maxDepth(10); // Limit nesting depth

const deepObject = createVeryDeepObject(20);
schema.validate(deepObject); // Depth violation error
```

## Examples

### User Registration

```typescript
const userSchema = s.object({
  username: s.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email: s.string().email(),
  password: s.string().min(8),
  profile: s.object({
    firstName: s.string().min(1),
    lastName: s.string().min(1),
    age: s.number().int().min(13).max(120).optional(),
  }).optional(),
});

const result = userSchema.validate({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'securePass123',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    age: 30,
  },
});
```

### API Response Validation

```typescript
const apiResponseSchema = s.object({
  success: s.boolean(),
  data: s.object({
    id: s.number().int(),
    items: s.array(s.object({
      id: s.number().int(),
      name: s.string(),
      price: s.number().positive(),
    })),
    total: s.number().positive(),
  }),
  meta: s.object({
    page: s.number().int().positive(),
    limit: s.number().int().positive(),
    totalCount: s.number().int().nonnegative(),
  }),
});

const result = apiResponseSchema.validate(apiResponse);
```

### Configuration Object

```typescript
const configSchema = s.object({
  database: s.object({
    host: s.string(),
    port: s.number().int().min(1).max(65535).default(5432),
    ssl: s.boolean().default(false),
  }),
  cache: s.object({
    enabled: s.boolean().default(true),
    ttl: s.number().int().positive().default(3600),
    maxSize: s.number().int().positive().default(1000),
  }).optional(),
}).strict(); // No extra keys allowed

const result = configSchema.validate({
  database: {
    host: 'localhost',
    port: 5432,
  },
  // cache is optional
});
```

### Form Data Validation

```typescript
const formSchema = s.object({
  title: s.string().min(1).max(100),
  description: s.string().max(1000).optional(),
  category: s.enum(['bug', 'feature', 'question', 'other']),
  priority: s.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  tags: s.array(s.string().min(1).max(20)).max(5).optional(),
  attachments: s.array(s.object({
    name: s.string(),
    size: s.number().int().max(10 * 1024 * 1024), // 10MB
    type: s.string(),
  })).max(10).optional(),
}).passthrough(); // Allow additional form fields

const result = formSchema.validate(formData);
```

## Performance Notes

- Object validation uses compiled validators for optimal performance
- Field validation is short-circuited on first error
- Unknown key handling is optimized based on configuration
- Nested object validation maintains performance through caching

## Best Practices

### Use Appropriate Key Handling

```typescript
// For APIs - use strict mode
const apiSchema = s.object({...}).strict();

// For forms - allow extra fields
const formSchema = s.object({...}).passthrough();

// For data processing - strip unknown fields
const dataSchema = s.object({...}).strip();
```

### Structure for Readability

```typescript
// Group related fields
const userSchema = s.object({
  // Identity
  id: s.number().int(),
  username: s.string(),

  // Personal info
  profile: s.object({
    name: s.string(),
    email: s.string().email(),
  }),

  // Preferences
  settings: s.object({
    theme: s.string(),
    notifications: s.boolean(),
  }),
});
```

### Leverage Type Inference

```typescript
const schema = s.object({
  id: s.number(),
  data: s.array(s.string()),
});

type MyType = s.Infer<typeof schema>;
// Use MyType throughout your application
function processData(data: MyType) { ... }
```

## Related Validators

- [`record`](./record.md) - For dynamic key-value objects
- [`union`](./union.md) - For objects with different shapes
- [`intersection`](./intersection.md) - For merging object types