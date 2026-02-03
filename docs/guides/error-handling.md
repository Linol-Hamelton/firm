# Error Handling Guide

This guide covers comprehensive error handling in Firm Validator, including structured errors, custom messages, error formatting, and best practices for user-facing applications.

## Error Structure

Firm provides structured validation errors with detailed information:

```typescript
const schema = s.object({
  name: s.string().min(2),
  age: s.number().int().min(0),
});

const result = schema.validate({
  name: 'A',     // Too short
  age: -5,       // Negative
});

if (!result.ok) {
  console.log(result.errors);
  // [
  //   {
  //     code: 'too_small',
  //     path: ['name'],
  //     message: 'String must be at least 2 characters long',
  //     received: 'A',
  //     minimum: 2
  //   },
  //   {
  //     code: 'too_small',
  //     path: ['age'],
  //     message: 'Must be at least 0',
  //     received: -5,
  //     minimum: 0
  //   }
  // ]
}
```

## Error Properties

Each error object contains:

- **`code`**: Machine-readable error code (string)
- **`path`**: Path to the field that failed (string[])
- **`message`**: Human-readable error message (string)
- **Additional properties**: Context-specific data (received, minimum, etc.)

## Error Codes

### Common Error Codes

| Code | Description | Context |
|------|-------------|---------|
| `invalid_type` | Wrong data type | `received`, `expected` |
| `too_small` | Value below minimum | `minimum`, `received` |
| `too_big` | Value above maximum | `maximum`, `received` |
| `not_integer` | Not an integer | `received` |
| `not_finite` | Infinite number | `received` |
| `invalid_string` | Invalid string format | `validation` |
| `too_short` | String too short | `minimum`, `received` |
| `too_long` | String too long | `maximum`, `received` |
| `invalid_enum_value` | Not in allowed values | `received`, `options` |
| `unrecognized_keys` | Extra object keys | `keys` |
| `missing_key` | Required field missing | - |

### Security-Related Codes

| Code | Description |
|------|-------------|
| `object_security_violation` | Prototype pollution or depth limit |
| `string_pattern_security_violation` | ReDoS protection triggered |

## Error Formatting

### Flatten Errors

Convert nested errors to a flat structure:

```typescript
const result = schema.validate(data);

if (!result.ok) {
  const flat = result.error.flatten();
  // {
  //   'name': ['String must be at least 2 characters long'],
  //   'age': ['Must be at least 0']
  // }
}
```

### Format Errors

Get formatted error messages:

```typescript
const result = schema.validate(data);

if (!result.ok) {
  const formatted = result.error.format();
  // {
  //   name: ['String must be at least 2 characters long'],
  //   age: ['Must be at least 0']
  // }
}
```

### Custom Formatting

```typescript
function formatErrors(errors: ValidationError[]): string[] {
  return errors.map(error => {
    const path = error.path.join('.');
    return `${path}: ${error.message}`;
  });
}

const result = schema.validate(data);
if (!result.ok) {
  const messages = formatErrors(result.errors);
  // ['name: String must be at least 2 characters long', 'age: Must be at least 0']
}
```

## Custom Error Messages

### Schema-Level Messages

```typescript
const schema = s.string()
  .min(5, 'Password must be at least 5 characters')
  .regex(/^[a-zA-Z0-9]+$/, 'Password can only contain letters and numbers');
```

### Global Error Messages

```typescript
import { setErrorMap } from 'firm-validator';

setErrorMap((error, ctx) => {
  switch (error.code) {
    case 'too_small':
      if (error.path.includes('age')) {
        return { message: 'You must be at least 18 years old' };
      }
      return { message: `Too small: ${error.received} < ${error.minimum}` };

    case 'invalid_type':
      return { message: `Expected ${error.expected}, got ${error.received}` };

    default:
      return { message: ctx.defaultError };
  }
});
```

## Async Error Handling

For async validation with `.refineAsync()`:

```typescript
const schema = s.object({
  email: s.string().email(),
  username: s.string().min(3),
}).refineAsync(async (data) => {
  // Check if email is already taken
  const exists = await checkEmailExists(data.email);
  if (exists) {
    throw new Error('Email already registered');
  }

  // Check username availability
  const usernameTaken = await checkUsernameExists(data.username);
  if (usernameTaken) {
    throw new Error('Username already taken');
  }
});

try {
  const result = await schema.validateAsync(data);
  console.log('Registration successful:', result.data);
} catch (error) {
  if (error.name === 'ValidationError') {
    console.log('Validation failed:', error.errors);
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

## User-Friendly Messages

### Form Validation

```typescript
function getFieldErrors(result: ValidationResult) {
  if (result.ok) return {};

  const errors: Record<string, string> = {};

  for (const error of result.errors) {
    const field = error.path[0] as string;
    errors[field] = getUserFriendlyMessage(error);
  }

  return errors;
}

function getUserFriendlyMessage(error: ValidationError): string {
  switch (error.code) {
    case 'too_small':
      if (error.path.includes('age')) return 'Age must be 18 or older';
      if (error.path.includes('password')) return 'Password is too short';
      return 'Value is too small';

    case 'invalid_string':
      if (error.validation === 'email') return 'Please enter a valid email address';
      if (error.validation === 'url') return 'Please enter a valid URL';
      return 'Invalid format';

    case 'missing_key':
      return 'This field is required';

    default:
      return error.message;
  }
}

// Usage in React component
const [errors, setErrors] = useState({});

const handleSubmit = (data) => {
  const result = schema.validate(data);
  if (!result.ok) {
    setErrors(getFieldErrors(result));
  } else {
    // Submit data
  }
};
```

### API Error Responses

```typescript
function createApiError(result: ValidationResult) {
  if (result.ok) return null;

  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: result.error.format(),
    fields: Object.keys(result.error.flatten())
  };
}

// Express middleware
app.post('/api/users', (req, res) => {
  const result = userSchema.validate(req.body);

  if (!result.ok) {
    return res.status(400).json(createApiError(result));
  }

  // Process valid data
  res.json({ success: true, user: result.data });
});
```

## Error Recovery

### Auto-Fix Mode

Firm supports automatic error correction:

```typescript
const schema = s.object({
  name: s.string().trim().toLowerCase(),
  age: s.coerce.number().int().min(0),
  email: s.string().email().toLowerCase(),
}).autoFix(); // Enable auto-fix

const result = schema.validate({
  name: '  JOHN DOE  ',    // Extra spaces
  age: '25',               // String number
  email: 'John@EXAMPLE.COM' // Mixed case
});

// Auto-fixed result:
// {
//   name: 'john doe',
//   age: 25,
//   email: 'john@example.com'
// }
```

### Partial Validation

Validate only present fields:

```typescript
const partialSchema = userSchema.partial();

const result = partialSchema.validate({
  name: 'John',  // Valid
  age: -5,       // Invalid but optional
});

// Result: { name: 'John' } - invalid fields are omitted
```

## Best Practices

### 1. Use Structured Errors

```typescript
// ✅ Good: Structured error handling
const result = schema.validate(data);
if (!result.ok) {
  const fieldErrors = result.error.flatten();
  displayErrors(fieldErrors);
}

// ❌ Bad: String-only errors
try {
  const data = schema.parse(data); // Throws on error
} catch (error) {
  displayGenericError(error.message);
}
```

### 2. Provide Context-Specific Messages

```typescript
// ✅ Good: Context-aware messages
const loginSchema = s.object({
  email: s.string().email('Please enter a valid email address'),
  password: s.string().min(8, 'Password must be at least 8 characters'),
});

// ❌ Bad: Generic messages
const genericSchema = s.object({
  email: s.string().email(),
  password: s.string().min(8),
});
```

### 3. Handle Async Errors Properly

```typescript
// ✅ Good: Async error handling
const result = await schema.validateAsync(data);
if (!result.ok) {
  handleValidationErrors(result.errors);
}

// ❌ Bad: Missing await
const result = schema.validateAsync(data); // Forgot await!
if (!result.ok) { // This will never be true
  handleValidationErrors(result.errors);
}
```

### 4. Use Appropriate Error Detail Level

```typescript
// For development: Full error details
if (process.env.NODE_ENV === 'development') {
  console.log('Validation errors:', result.errors);
}

// For production: User-friendly messages
const userErrors = result.error.flatten();
// Sanitize and format for users
```

### 5. Combine with Other Validation

```typescript
// Use Firm for type validation, custom logic for business rules
const schema = s.object({
  email: s.string().email(),
  age: s.number().int().min(0),
}).refine((data) => {
  if (data.age < 13 && data.email.includes('school')) {
    throw new Error('School emails require age 13+');
  }
  return true;
});
```

## Error Types

### ValidationError

The main error type containing all validation issues:

```typescript
interface ValidationError {
  code: string;
  path: string[];
  message: string;
  [key: string]: any; // Additional context
}
```

### ValidationFailure

Contains all errors from a failed validation:

```typescript
interface ValidationFailure {
  ok: false;
  errors: ValidationError[];
  error: {
    errors: ValidationError[];
    flatten(): Record<string, string[]>;
    format(): Record<string, string[]>;
  };
}
```

## Migration from Other Validators

### From Zod

```typescript
// Zod
const result = schema.safeParse(data);
if (!result.success) {
  console.log(result.error.issues);
}

// Firm
const result = schema.validate(data);
if (!result.ok) {
  console.log(result.errors); // Same structure
}
```

### From Yup

```typescript
// Yup
try {
  const validData = await schema.validate(data);
} catch (error) {
  console.log(error.errors);
}

// Firm
const result = await schema.validateAsync(data);
if (!result.ok) {
  console.log(result.errors.map(e => e.message));
}
```

## Advanced Error Handling

### Custom Error Classes

```typescript
class ValidationError extends Error {
  constructor(public errors: ValidationError[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

function validateOrThrow<T>(schema: Schema<T>, data: unknown): T {
  const result = schema.validate(data);
  if (!result.ok) {
    throw new ValidationError(result.errors);
  }
  return result.data;
}
```

### Error Aggregation

```typescript
function collectAllErrors(schema: Schema, data: unknown): ValidationError[] {
  const result = schema.validate(data);
  if (result.ok) return [];

  return result.errors;
}

function validateMultipleSchemas(schemas: Schema[], data: unknown[]): ValidationError[] {
  const allErrors: ValidationError[] = [];

  for (let i = 0; i < schemas.length; i++) {
    const errors = collectAllErrors(schemas[i], data[i]);
    allErrors.push(...errors.map(error => ({
      ...error,
      path: [i, ...error.path] // Add array index to path
    })));
  }

  return allErrors;
}
```

This comprehensive error handling system makes Firm Validator suitable for production applications with complex validation requirements and user-friendly error reporting.