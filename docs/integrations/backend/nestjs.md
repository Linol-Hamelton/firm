# NestJS Integration

FIRM provides seamless integration with NestJS through validation pipes and decorators.

## Installation

```bash
npm install firm-validator
```

## Basic Usage

### Using FirmValidationPipe

The `FirmValidationPipe` transforms and validates request data using FIRM schemas.

```typescript
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { s } from 'firm-validator';
import { FirmValidationPipe } from 'firm-validator/integrations/nestjs';

const userSchema = s.object({
  name: s.string().min(1),
  email: s.string().email(),
  age: s.number().int().min(18),
});

@Controller('users')
export class UsersController {
  @Post()
  @UsePipes(new FirmValidationPipe(userSchema))
  createUser(@Body() body: typeof userSchema._output) {
    // body is now typed and validated
    return { success: true, user: body };
  }
}
```

### Global Pipe

You can also use the pipe globally in your application:

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FirmValidationPipe } from 'firm-validator/integrations/nestjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Apply globally (for all routes)
  app.useGlobalPipes(new FirmValidationPipe());
  
  await app.listen(3000);
}
bootstrap();
```

## Advanced Features

### Async Validation

FIRM supports async validation out of the box:

```typescript
const userSchema = s.object({
  email: s.string().email(),
}).refineAsync(async (data) => {
  // Check if email exists in database
  const exists = await userService.emailExists(data.email);
  return !exists;
});

@Post('register')
@UsePipes(new FirmValidationPipe(userSchema))
async register(@Body() body: typeof userSchema._output) {
  // ...
}
```

### Custom Error Formatting

The pipe automatically converts FIRM validation errors to NestJS `BadRequestException` with a structured error response:

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "property": "email",
      "constraints": {
        "NOT_STRING": "Expected string"
      }
    }
  ]
}
```

### Schema Composition

Combine multiple schemas for complex validation:

```typescript
const addressSchema = s.object({
  street: s.string(),
  city: s.string(),
  zipCode: s.string().pattern(/^\d{5}$/),
});

const userSchema = s.object({
  name: s.string(),
  email: s.string().email(),
  address: addressSchema,
  tags: s.array(s.string()).max(10),
});
```

## Performance Considerations

- FIRM validation is compiled for maximum performance
- Schema compilation happens once and is cached
- Zero overhead for type inference in development
- Parallel validation support for arrays

## Best Practices

1. **Define schemas separately**: Export schemas from dedicated files for reusability
2. **Use type inference**: Leverage TypeScript's type inference with `typeof schema._output`
3. **Combine with class-validator**: FIRM can be used alongside class-validator if needed
4. **Test schemas**: Write unit tests for your validation schemas

## Example: Complete User Registration

```typescript
// schemas/user.schema.ts
import { s } from 'firm-validator';

export const userRegistrationSchema = s.object({
  username: s.string().min(3).max(50),
  email: s.string().email(),
  password: s.string().min(8).refine(
    (pw) => /[A-Z]/.test(pw) && /[0-9]/.test(pw),
    'Password must contain uppercase letter and number'
  ),
  birthDate: s.date().max(new Date()),
  acceptTerms: s.literal(true),
});

export type UserRegistration = typeof userRegistrationSchema._output;

// controllers/user.controller.ts
import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { FirmValidationPipe } from 'firm-validator/integrations/nestjs';
import { userRegistrationSchema, UserRegistration } from './schemas/user.schema';

@Controller('auth')
export class AuthController {
  @Post('register')
  @UsePipes(new FirmValidationPipe(userRegistrationSchema))
  async register(@Body() user: UserRegistration) {
    // user is fully validated and typed
    return await this.authService.register(user);
  }
}
```

## Migration from class-validator

If you're migrating from class-validator, FIRM offers similar functionality with better performance:

| Feature | class-validator | FIRM |
|---------|----------------|------|
| Validation | Decorator-based | Schema-based |
| Performance | ~10k ops/sec | ~1M+ ops/sec |
| Type Safety | Good | Excellent |
| Async Support | Limited | Full |
| Bundle Size | ~50KB | ~15KB |

## API Reference

### `FirmValidationPipe`

```typescript
class FirmValidationPipe<T> {
  constructor(schema?: Schema<T>);
  transform(value: unknown): T;
  transformAsync(value: unknown): Promise<T>;
}
```

### Error Response Format

```typescript
interface ValidationErrorResponse {
  message: string;
  errors: Array<{
    property: string;
    constraints: Record<string, string>;
  }>;
}
```

## Troubleshooting

**Q: Schema validation fails silently?**
A: Ensure you're using `@UsePipes()` decorator or global pipe registration.

**Q: Type inference not working?**
A: Use `typeof schema._output` for proper TypeScript inference.

**Q: Async validation not triggering?**
A: Use `validateAsync()` on the schema or ensure your refinement returns a Promise.

## See Also

- [Express Integration](./express.md)
- [Fastify Integration](./fastify.md)
- [FIRM Core Concepts](../../core-concepts/README.md)