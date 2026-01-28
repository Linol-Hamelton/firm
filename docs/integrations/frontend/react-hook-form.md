# React Hook Form Integration

FIRM provides seamless integration with React Hook Form through a resolver.

## Installation

```bash
npm install firm-validator react-hook-form
```

## Quick Start

```typescript
import { useForm } from 'react-hook-form';
import { s } from 'firm-validator';
import { firmResolver } from 'firm-validator/integrations/react-hook-form';

const userSchema = s.object({
  name: s.string().min(1, 'Name is required'),
  email: s.string().email('Invalid email'),
  age: s.number().int().min(18, 'Must be 18 or older')
});

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: firmResolver(userSchema)
  });

  const onSubmit = (data) => {
    console.log('Valid data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}

      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('age')} type="number" />
      {errors.age && <span>{errors.age.message}</span>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

## API Reference

### `firmResolver(schema, options?)`

Creates a resolver for React Hook Form.

**Parameters:**
- `schema: Schema<T>` - FIRM validation schema
- `options?: FirmResolverOptions`
  - `abortEarly?: boolean` - Stop on first error (default: false)
  - `errorMap?: (error) => string` - Transform error messages

**Returns:** `Resolver<T>` - React Hook Form resolver

**Example:**

```typescript
const resolver = firmResolver(userSchema, {
  abortEarly: false, // Show all errors
  errorMap: (error) => {
    // Custom error messages
    if (error.code === 'INVALID_EMAIL') {
      return 'Please enter a valid email address';
    }
    return error.message;
  }
});
```

### `getErrorMessage(errors, field)`

Get error message for a specific field.

```typescript
import { getErrorMessage } from 'firm-validator/integrations/react-hook-form';

const { formState: { errors } } = useForm({ ... });

const emailError = getErrorMessage(errors, 'email');
const nestedError = getErrorMessage(errors, 'address.street');
```

### `hasError(errors, field)`

Check if a field has an error.

```typescript
import { hasError } from 'firm-validator/integrations/react-hook-form';

const hasEmailError = hasError(errors, 'email');

<input
  className={hasEmailError ? 'input-error' : 'input-valid'}
  {...register('email')}
/>
```

## Advanced Usage

### Nested Objects

```typescript
const addressSchema = s.object({
  street: s.string().min(1),
  city: s.string().min(1),
  country: s.string().min(2).max(2),
  zipCode: s.string().regex(/^\d{5}$/)
});

const userSchema = s.object({
  name: s.string(),
  address: addressSchema
});

function MyForm() {
  const { register, formState: { errors } } = useForm({
    resolver: firmResolver(userSchema)
  });

  return (
    <form>
      <input {...register('name')} />

      <input {...register('address.street')} />
      {errors.address?.street && <span>{errors.address.street.message}</span>}

      <input {...register('address.city')} />
      {errors.address?.city && <span>{errors.address.city.message}</span>}
    </form>
  );
}
```

### Arrays

```typescript
const schema = s.object({
  friends: s.array(
    s.object({
      name: s.string().min(1),
      email: s.string().email()
    })
  ).min(1, 'At least one friend required')
});

function MyForm() {
  const { register, control, formState: { errors } } = useForm({
    resolver: firmResolver(schema)
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'friends'
  });

  return (
    <form>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`friends.${index}.name`)} />
          <input {...register(`friends.${index}.email`)} />
          <button onClick={() => remove(index)}>Remove</button>
        </div>
      ))}

      <button onClick={() => append({ name: '', email: '' })}>
        Add Friend
      </button>
    </form>
  );
}
```

### Async Validation

```typescript
const schema = s.object({
  username: s.string()
    .min(3)
    .refineAsync(
      async (username) => {
        const response = await fetch(`/api/check-username?username=${username}`);
        const { available } = await response.json();
        return available;
      },
      { message: 'Username already taken' }
    )
});

function MyForm() {
  const { register, formState: { errors, isValidating } } = useForm({
    resolver: firmResolver(schema)
  });

  return (
    <form>
      <input {...register('username')} />
      {isValidating && <span>Checking username...</span>}
      {errors.username && <span>{errors.username.message}</span>}
    </form>
  );
}
```

### Default Values

```typescript
const { register } = useForm({
  resolver: firmResolver(userSchema),
  defaultValues: {
    name: 'John Doe',
    email: 'john@example.com',
    age: 25
  }
});
```

### Custom Validation Mode

```typescript
const { register } = useForm({
  resolver: firmResolver(userSchema),
  mode: 'onBlur',      // Validate on blur
  reValidateMode: 'onChange'  // Re-validate on change
});
```

### Watch Fields

```typescript
function MyForm() {
  const { register, watch } = useForm({
    resolver: firmResolver(userSchema)
  });

  const watchedName = watch('name');

  return (
    <form>
      <input {...register('name')} />
      <p>Current name: {watchedName}</p>
    </form>
  );
}
```

### Conditional Validation

```typescript
const schema = s.object({
  sendNotifications: s.boolean(),
  email: s.string().optional(),
}).refine(
  (data) => {
    if (data.sendNotifications && !data.email) {
      return false;
    }
    return true;
  },
  {
    message: 'Email required when notifications enabled',
    path: ['email']
  }
);
```

## TypeScript

FIRM provides perfect TypeScript inference:

```typescript
const schema = s.object({
  name: s.string(),
  age: s.number(),
  active: s.boolean()
});

const { register, handleSubmit } = useForm({
  resolver: firmResolver(schema)
});

const onSubmit = handleSubmit((data) => {
  // TypeScript knows:
  // data: { name: string; age: number; active: boolean }
  console.log(data.name.toUpperCase());
  console.log(data.age + 1);
});
```

## Error Handling

### Custom Error Messages

```typescript
const schema = s.object({
  email: s.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: s.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
});
```

### Error Formatting

```typescript
const resolver = firmResolver(schema, {
  errorMap: (error) => {
    const messages = {
      INVALID_EMAIL: 'Please check your email address',
      STRING_TOO_SHORT: 'This field is too short',
      STRING_TOO_LONG: 'This field is too long'
    };
    return messages[error.code] || error.message;
  }
});
```

## Performance Tips

1. **Memoize schema**: Define schema outside component
2. **Use compiled validators**: Pre-compile for hot paths
3. **Lazy validation**: Use `mode: 'onBlur'` instead of `onChange`

```typescript
// ✅ Good: Schema defined outside
const userSchema = s.object({ ... });

function MyForm() {
  const form = useForm({ resolver: firmResolver(userSchema) });
}

// ❌ Bad: Schema recreated on every render
function MyForm() {
  const schema = s.object({ ... });
  const form = useForm({ resolver: firmResolver(schema) });
}
```

## Migration from Zod

```typescript
// Before (Zod)
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  age: z.number().min(18)
});

const form = useForm({ resolver: zodResolver(schema) });

// After (FIRM)
import { s } from 'firm-validator';
import { firmResolver } from 'firm-validator/integrations/react-hook-form';

const schema = s.object({
  email: s.string().email(),
  age: s.number().min(18)
});

const form = useForm({ resolver: firmResolver(schema) });
```

## See Also

- [React Hook Form Documentation](https://react-hook-form.com/)
- [FIRM API Reference](../../api/README.md)
- [Schema Guide](../../core-concepts/schemas.md)
