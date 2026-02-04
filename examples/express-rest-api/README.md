# Express REST API with FIRM Validation

Production-ready Express REST API example using FIRM validator for request validation.

## Features

- ✅ Full TypeScript support with strict type checking
- ✅ FIRM validation for request body, query params, and URL params
- ✅ Pre-compiled schemas for maximum performance
- ✅ Comprehensive error handling
- ✅ Pagination and filtering
- ✅ RESTful API design
- ✅ In-memory data store (easily replaceable with real database)
- ✅ Custom validation rules and cross-field validation

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### Build

```bash
npm run build
npm start
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Users

#### Get all users (with pagination and filtering)
```bash
GET /api/users?page=1&limit=10&role=user&search=john

# Query parameters:
# - page: number (default: 1)
# - limit: number (default: 10, max: 100)
# - role: 'user' | 'admin' (optional)
# - search: string (optional, searches name and email)
```

#### Get user by ID
```bash
GET /api/users/:id
```

#### Create user
```bash
POST /api/users
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "role": "user",  // optional, default: "user"
  "age": 25        // optional, must be >= 18
}
```

#### Update user
```bash
PUT /api/users/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "age": 30
}

# All fields optional, but at least one must be provided
```

#### Delete user
```bash
DELETE /api/users/:id
```

#### Change password
```bash
POST /api/users/:id/change-password
Content-Type: application/json

{
  "currentPassword": "OldPass123",
  "newPassword": "NewPass123",
  "confirmPassword": "NewPass123"
}

# Password requirements:
# - At least 8 characters
# - At least one uppercase letter
# - At least one lowercase letter
# - At least one number
# - Must be different from current password
```

## Usage Examples

### Using curl

```bash
# Get all users
curl http://localhost:3000/api/users

# Create user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "SecurePass123",
    "name": "New User",
    "age": 25
  }'

# Get user by ID
curl http://localhost:3000/api/users/1

# Update user
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "age": 30
  }'

# Delete user
curl -X DELETE http://localhost:3000/api/users/1

# Search users
curl "http://localhost:3000/api/users?search=admin&page=1&limit=5"
```

### Using JavaScript/TypeScript

```typescript
import fetch from 'node-fetch';

// Create user
const response = await fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123',
    name: 'John Doe',
    age: 25,
  }),
});

const data = await response.json();
console.log(data);
```

## Validation Examples

### Valid Request
```bash
POST /api/users

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe",
  "age": 25
}

# Response: 201 Created
{
  "message": "User created successfully",
  "data": {
    "id": 3,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "age": 25,
    "createdAt": "2026-02-04T00:00:00.000Z",
    "updatedAt": "2026-02-04T00:00:00.000Z"
  }
}
```

### Invalid Request (Validation Error)
```bash
POST /api/users

{
  "email": "invalid-email",
  "password": "short",
  "name": ""
}

# Response: 400 Bad Request
{
  "error": "Validation Error",
  "message": "Request body validation failed",
  "issues": [
    {
      "path": ["email"],
      "message": "Invalid email address",
      "code": "invalid_email"
    },
    {
      "path": ["password"],
      "message": "Must be at least 8 characters",
      "code": "too_small"
    },
    {
      "path": ["name"],
      "message": "Must be at least 1 character",
      "code": "too_small"
    }
  ]
}
```

## Project Structure

```
express-rest-api/
├── src/
│   ├── index.ts                 # Main application entry
│   ├── schemas/
│   │   └── user.schema.ts       # FIRM validation schemas
│   ├── routes/
│   │   └── users.ts             # User routes
│   └── middleware/
│       ├── validate.ts          # Validation middleware factory
│       └── errorHandler.ts      # Error handling middleware
├── package.json
├── tsconfig.json
└── README.md
```

## FIRM Validation Features

### Pre-compiled Schemas
All schemas are pre-compiled for maximum performance:

```typescript
export const createUserSchema = s.object({
  email: s.string().email(),
  password: s.string().min(8),
  name: s.string().min(1).max(100),
  role: s.enum(['user', 'admin']).default('user'),
  age: s.number().int().min(18).optional(),
}).compile(); // Pre-compiled!
```

### Type-Safe Validation
Full TypeScript type inference:

```typescript
export type CreateUserInput = typeof createUserSchema.infer;

// TypeScript knows the exact shape:
// {
//   email: string;
//   password: string;
//   name: string;
//   role: 'user' | 'admin';
//   age?: number;
// }
```

### Query Parameter Coercion
Automatic type coercion for query parameters:

```typescript
export const getUsersQuerySchema = s.object({
  page: s.coerce.number().int().min(1).default(1),
  limit: s.coerce.number().int().min(1).max(100).default(10),
  role: s.enum(['user', 'admin']).optional(),
  search: s.string().optional(),
}).compile();

// Query string "?page=2&limit=20" automatically converts to:
// { page: 2, limit: 20 }
```

### Cross-Field Validation
Complex validation rules:

```typescript
export const changePasswordSchema = s.object({
  currentPassword: s.string(),
  newPassword: s.string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[a-z]/, 'Must contain lowercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: s.string(),
})
  .refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different',
    path: ['newPassword'],
  })
  .compile();
```

### Validation Middleware
Reusable validation middleware for body, query, and params:

```typescript
import { validateBody, validateQuery, validateParams } from './middleware/validate';

router.post('/', validateBody(createUserSchema), (req, res) => {
  // req.validatedBody is fully typed!
  const data = req.validatedBody as CreateUserInput;
});

router.get('/', validateQuery(getUsersQuerySchema), (req, res) => {
  const query = req.validatedQuery as GetUsersQuery;
});

router.get('/:id', validateParams(userIdParamSchema), (req, res) => {
  const params = req.validatedParams as UserIdParam;
});
```

## Performance

FIRM validation is significantly faster than alternatives:

- **Pre-compiled schemas:** 3-10x faster than runtime validation
- **Type coercion:** Automatic conversion of query params (no manual parsing)
- **Zero overhead:** Compiled schemas have minimal runtime cost
- **Memory efficient:** No schema parsing or interpretation at runtime

## Error Handling

All errors are handled consistently:

### Validation Errors (400)
```json
{
  "error": "Validation Error",
  "message": "Request body validation failed",
  "issues": [
    {
      "path": ["email"],
      "message": "Invalid email address",
      "code": "invalid_email"
    }
  ]
}
```

### Not Found (404)
```json
{
  "error": "Not Found",
  "message": "User not found"
}
```

### Conflict (409)
```json
{
  "error": "Error",
  "message": "Email already exists"
}
```

### Server Error (500)
```json
{
  "error": "Error",
  "message": "Internal Server Error"
}
```

## Testing

Run tests with:

```bash
npm test
```

## Next Steps

- Replace in-memory store with real database (PostgreSQL, MongoDB, etc.)
- Add authentication and authorization
- Add rate limiting
- Add request logging (Morgan, Winston)
- Add API documentation (Swagger/OpenAPI)
- Add Docker support
- Add CI/CD pipeline

## Learn More

- [FIRM Validator Documentation](https://github.com/Linol-Hamelton/firm/tree/main/docs)
- [Migration from Zod](https://github.com/Linol-Hamelton/firm/tree/main/docs/guides/migration-from-zod.md)
- [Migration from Yup](https://github.com/Linol-Hamelton/firm/tree/main/docs/guides/migration-from-yup.md)

## License

MIT
