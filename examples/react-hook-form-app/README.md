# React Hook Form + FIRM Validation

Production-ready form validation example with React Hook Form and FIRM validator.

## Features

- ✅ **React Hook Form** - Performant, flexible forms with easy validation
- ✅ **FIRM Validation** - Pre-compiled schemas for maximum performance
- ✅ **Full TypeScript** - Complete type safety from schema to form
- ✅ **Multiple Examples** - Basic, profile, multi-step, and dynamic forms
- ✅ **Custom Resolver** - Seamless FIRM integration with React Hook Form
- ✅ **Production Ready** - Real-world patterns and best practices

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Build

```bash
npm run build
npm run preview
```

## Project Structure

```
react-hook-form-app/
├── src/
│   ├── components/
│   │   ├── RegisterForm.tsx      # Basic form example
│   │   ├── ProfileForm.tsx       # Form with optional fields
│   │   ├── MultiStepForm.tsx     # Multi-step form workflow
│   │   ├── DynamicForm.tsx       # Conditional fields
│   │   └── forms.css             # Form styles
│   ├── schemas/
│   │   └── user.schema.ts        # FIRM validation schemas
│   ├── lib/
│   │   └── firmResolver.ts       # FIRM resolver for RHF
│   ├── App.tsx                   # Main app component
│   ├── App.css                   # App styles
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Global styles
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## How It Works

### 1. Define Schemas with FIRM

```typescript
// src/schemas/user.schema.ts
import { s } from 'firm-validator';

export const registerSchema = s
  .object({
    username: s.string().min(3).max(20),
    email: s.string().email(),
    password: s.string().min(8),
    confirmPassword: s.string(),
    age: s.coerce.number().int().min(18),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .compile(); // Pre-compile for performance!

export type RegisterInput = typeof registerSchema.infer;
```

### 2. Create FIRM Resolver

```typescript
// src/lib/firmResolver.ts
import type { FieldValues, Resolver } from 'react-hook-form';
import type { Schema } from 'firm-validator';

export function firmResolver<T extends FieldValues>(
  schema: Schema<T>
): Resolver<T> {
  return async (values) => {
    const result = schema.validate(values);

    if (result.ok) {
      return {
        values: result.data as T,
        errors: {},
      };
    }

    // Convert FIRM errors to React Hook Form format
    const errors: Record<string, any> = {};
    for (const error of result.errors) {
      const path = error.path.join('.');
      errors[path] = {
        type: error.code,
        message: error.message,
      };
    }

    return {
      values: {},
      errors,
    };
  };
}
```

### 3. Use in React Components

```typescript
// src/components/RegisterForm.tsx
import { useForm } from 'react-hook-form';
import { firmResolver } from '../lib/firmResolver';
import { registerSchema, type RegisterInput } from '../schemas/user.schema';

export function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: firmResolver(registerSchema), // Use FIRM validation!
    mode: 'onBlur',
  });

  const onSubmit = async (data: RegisterInput) => {
    // data is fully typed and validated!
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username')} />
      {errors.username && <span>{errors.username.message}</span>}

      <input type="email" {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        Register
      </button>
    </form>
  );
}
```

## Examples

### 1. Basic Registration Form

**File:** [RegisterForm.tsx](src/components/RegisterForm.tsx)

Demonstrates:
- Basic field validation (email, password, username)
- Cross-field validation (password confirmation)
- Type coercion (age as number)
- Checkbox validation (terms acceptance)
- Error display

**Key Features:**
```typescript
// Username validation with regex
username: s.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/)

// Email validation
email: s.string().email()

// Password validation
password: s.string().min(8).max(100)

// Cross-field validation
.refine((data) => data.password === data.confirmPassword)
```

### 2. Profile Update Form

**File:** [ProfileForm.tsx](src/components/ProfileForm.tsx)

Demonstrates:
- Optional fields
- Nested objects (notification preferences)
- URL validation
- Date handling with coercion
- Default values
- Form dirty state

**Key Features:**
```typescript
// Optional fields
displayName: s.string().min(1).max(50).optional()
website: s.string().url().optional()

// Nested object
notifications: s.object({
  email: s.boolean().default(true),
  push: s.boolean().default(false),
  sms: s.boolean().default(false),
}).optional()

// Date coercion
birthdate: s.coerce.date().optional()
```

### 3. Multi-Step Form

**File:** [MultiStepForm.tsx](src/components/MultiStepForm.tsx)

Demonstrates:
- Multi-step workflow with progress tracking
- Separate validation for each step
- Data persistence across steps
- Forward/backward navigation
- Different schemas for different steps

**Steps:**
1. **Account Information** - User registration data
2. **Shipping Address** - Address validation with state codes
3. **Payment Information** - Credit card validation

**Key Features:**
```typescript
// State code validation (2-letter)
state: s.string().min(2).max(2).regex(/^[A-Z]{2}$/)

// ZIP code validation (12345 or 12345-6789)
zipCode: s.string().regex(/^\d{5}(-\d{4})?$/)

// Credit card validation
cardNumber: s.string().regex(/^\d{16}$/)
cvv: s.string().regex(/^\d{3,4}$/)

// Expiry year validation (current year or later)
expiryYear: s.coerce.number().int().min(new Date().getFullYear())
```

### 4. Dynamic Form with Conditional Fields

**File:** [DynamicForm.tsx](src/components/DynamicForm.tsx)

Demonstrates:
- Conditional field rendering based on user selection
- Dynamic validation rules
- `useWatch` hook for reactive forms
- Complex nested validation

**Key Features:**
```typescript
// Conditional validation based on selection
.refine((data) => {
  if (data.contactMethod === 'email') return !!data.email;
  if (data.contactMethod === 'phone') return !!data.phone;
  if (data.contactMethod === 'mail') return !!data.mailingAddress;
  return false;
})

// Using useWatch to show/hide fields
const contactMethod = useWatch({
  control,
  name: 'contactMethod',
});
```

## FIRM Validation Features

### Pre-Compiled Schemas

All schemas are pre-compiled for maximum performance:

```typescript
export const schema = s.object({
  email: s.string().email(),
  name: s.string().min(1),
}).compile(); // 3-10x faster!
```

### Full Type Inference

TypeScript automatically infers types:

```typescript
type RegisterInput = typeof registerSchema.infer;
// {
//   username: string;
//   email: string;
//   password: string;
//   confirmPassword: string;
//   age: number;
//   acceptTerms: boolean;
// }
```

### Type Coercion

Automatic type conversion for form inputs:

```typescript
// String input "25" → number 25
age: s.coerce.number().int().min(18)

// String input "2024-01-01" → Date object
birthdate: s.coerce.date()
```

### Cross-Field Validation

Validate relationships between fields:

```typescript
s.object({
  password: s.string().min(8),
  confirmPassword: s.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'], // Error shown on confirmPassword field
  }
)
```

### Custom Error Messages

Provide user-friendly error messages:

```typescript
username: s.string().regex(/^[a-zA-Z0-9_]+$/, {
  message: 'Username can only contain letters, numbers, and underscores',
})
```

## React Hook Form Integration

### Form Modes

Control when validation occurs:

```typescript
useForm({
  resolver: firmResolver(schema),
  mode: 'onBlur',      // Validate on blur
  // mode: 'onChange',  // Validate on every change
  // mode: 'onSubmit',  // Validate only on submit
});
```

### Error Handling

Access validation errors:

```typescript
const { formState: { errors } } = useForm();

{errors.email && (
  <span className="error">{errors.email.message}</span>
)}
```

### Form State

Track form state:

```typescript
const {
  formState: {
    errors,        // Validation errors
    isSubmitting,  // Submit in progress
    isDirty,       // Form has been modified
    isValid,       // Form is valid
  }
} = useForm();
```

### Default Values

Pre-populate form fields:

```typescript
useForm({
  resolver: firmResolver(schema),
  defaultValues: {
    displayName: 'John Doe',
    email: 'john@example.com',
    notifications: {
      email: true,
      push: false,
    },
  },
});
```

## Performance

FIRM validation provides significant performance benefits:

- **Pre-compiled schemas:** 3-10x faster than runtime validation
- **Zero parsing:** Compiled schemas have no interpretation overhead
- **Type coercion:** Automatic with `.coerce` methods
- **Memory efficient:** No schema AST in memory
- **React Hook Form:** Minimal re-renders with uncontrolled inputs

## Best Practices

### 1. Pre-compile All Schemas

Always call `.compile()` on your schemas:

```typescript
// ✅ Good
export const schema = s.object({ ... }).compile();

// ❌ Bad (slower)
export const schema = s.object({ ... });
```

### 2. Extract Types

Use type inference for type safety:

```typescript
export const schema = s.object({ ... }).compile();
export type SchemaInput = typeof schema.infer;
```

### 3. Reuse Schemas

Share schemas between forms:

```typescript
// Reuse addressSchema in multiple forms
export const addressSchema = s.object({ ... }).compile();

export const orderSchema = s.object({
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
}).compile();
```

### 4. Validation Mode

Choose the right validation mode:

- **onBlur** - Best UX for most forms (validate when user leaves field)
- **onChange** - Real-time validation (use sparingly, can be distracting)
- **onSubmit** - Only validate on submit (fastest, but delayed feedback)

### 5. Error Messages

Provide clear, actionable error messages:

```typescript
// ✅ Good
password: s.string().min(8, {
  message: 'Password must be at least 8 characters',
})

// ❌ Bad
password: s.string().min(8)  // Generic error: "Must be at least 8 characters"
```

## Testing

Test your forms with FIRM validation:

```typescript
import { describe, it, expect } from 'vitest';
import { registerSchema } from './schemas/user.schema';

describe('User Registration', () => {
  it('validates correct data', () => {
    const result = registerSchema.validate({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'password123',
      age: 25,
      acceptTerms: true,
    });

    expect(result.ok).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = registerSchema.validate({
      username: 'john_doe',
      email: 'not-an-email',
      password: 'password123',
      confirmPassword: 'password123',
      age: 25,
      acceptTerms: true,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0].code).toBe('invalid_email');
  });

  it('rejects password mismatch', () => {
    const result = registerSchema.validate({
      username: 'john_doe',
      email: 'john@example.com',
      password: 'password123',
      confirmPassword: 'different',
      age: 25,
      acceptTerms: true,
    });

    expect(result.ok).toBe(false);
    expect(result.errors[0].message).toBe('Passwords do not match');
  });
});
```

## Extending the Example

### Add Server Validation

Use the same schemas on the server:

```typescript
// server/routes/register.ts
import express from 'express';
import { registerSchema } from '../schemas/user.schema';

const router = express.Router();

router.post('/register', (req, res) => {
  const result = registerSchema.validate(req.body);

  if (!result.ok) {
    return res.status(400).json({
      errors: result.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  // Process registration with result.data
  const user = createUser(result.data);
  res.json({ user });
});
```

### Add Field-Level Validation

Show errors as user types:

```typescript
import { Controller } from 'react-hook-form';

<Controller
  name="email"
  control={control}
  render={({ field, fieldState }) => (
    <div>
      <input {...field} />
      {fieldState.error && <span>{fieldState.error.message}</span>}
    </div>
  )}
/>
```

### Add Async Validation

Check if username is available:

```typescript
const checkUsername = async (username: string) => {
  const response = await fetch(`/api/check-username?username=${username}`);
  const { available } = await response.json();
  return available;
};

export const registerSchema = s
  .object({ ... })
  .refine(
    async (data) => await checkUsername(data.username),
    { message: 'Username is already taken', path: ['username'] }
  )
  .compile();
```

## Learn More

- [FIRM Validator Documentation](https://github.com/Linol-Hamelton/firm/tree/main/docs)
- [React Hook Form Documentation](https://react-hook-form.com)
- [Migration from Zod](../../docs/guides/migration-from-zod.md)
- [Migration from Yup](../../docs/guides/migration-from-yup.md)

## License

MIT
