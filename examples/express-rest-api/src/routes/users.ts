import { Router, Request, Response, NextFunction } from 'express';
import {
  createUserSchema,
  updateUserSchema,
  getUsersQuerySchema,
  userIdParamSchema,
  changePasswordSchema,
  CreateUserInput,
  UpdateUserInput,
  GetUsersQuery,
  UserIdParam,
  ChangePasswordInput,
} from '../schemas/user.schema';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import { createError } from '../middleware/errorHandler';

const router = Router();

/**
 * In-memory user store (replace with real database in production)
 */
interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

const users: User[] = [
  {
    id: 1,
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    age: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    email: 'user@example.com',
    name: 'Regular User',
    role: 'user',
    age: 25,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

let nextId = 3;

/**
 * GET /users - Get all users with pagination and filtering
 */
router.get('/', validateQuery(getUsersQuerySchema), (req: Request, res: Response) => {
  const query = req.validatedQuery as GetUsersQuery;

  // Filter users
  let filteredUsers = users;

  if (query.role) {
    filteredUsers = filteredUsers.filter((u) => u.role === query.role);
  }

  if (query.search) {
    const searchLower = query.search.toLowerCase();
    filteredUsers = filteredUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower)
    );
  }

  // Pagination
  const startIndex = (query.page - 1) * query.limit;
  const endIndex = startIndex + query.limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  res.json({
    data: paginatedUsers.map(sanitizeUser),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: filteredUsers.length,
      totalPages: Math.ceil(filteredUsers.length / query.limit),
    },
  });
});

/**
 * GET /users/:id - Get user by ID
 */
router.get('/:id', validateParams(userIdParamSchema), (req: Request, res: Response, next: NextFunction) => {
  const params = req.validatedParams as UserIdParam;
  const user = users.find((u) => u.id === params.id);

  if (!user) {
    return next(createError('User not found', 404));
  }

  res.json({ data: sanitizeUser(user) });
});

/**
 * POST /users - Create new user
 */
router.post('/', validateBody(createUserSchema), (req: Request, res: Response, next: NextFunction) => {
  const data = req.validatedBody as CreateUserInput;

  // Check if email already exists
  if (users.some((u) => u.email === data.email)) {
    return next(createError('Email already exists', 409));
  }

  const newUser: User = {
    id: nextId++,
    email: data.email,
    name: data.name,
    role: data.role || 'user',
    age: data.age,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);

  res.status(201).json({
    message: 'User created successfully',
    data: sanitizeUser(newUser),
  });
});

/**
 * PUT /users/:id - Update user
 */
router.put(
  '/:id',
  validateParams(userIdParamSchema),
  validateBody(updateUserSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const params = req.validatedParams as UserIdParam;
    const data = req.validatedBody as UpdateUserInput;

    const userIndex = users.findIndex((u) => u.id === params.id);

    if (userIndex === -1) {
      return next(createError('User not found', 404));
    }

    // Check if new email already exists
    if (data.email && users.some((u) => u.email === data.email && u.id !== params.id)) {
      return next(createError('Email already exists', 409));
    }

    // Update user
    const updatedUser: User = {
      ...users[userIndex],
      ...data,
      updatedAt: new Date(),
    };

    users[userIndex] = updatedUser;

    res.json({
      message: 'User updated successfully',
      data: sanitizeUser(updatedUser),
    });
  }
);

/**
 * DELETE /users/:id - Delete user
 */
router.delete('/:id', validateParams(userIdParamSchema), (req: Request, res: Response, next: NextFunction) => {
  const params = req.validatedParams as UserIdParam;
  const userIndex = users.findIndex((u) => u.id === params.id);

  if (userIndex === -1) {
    return next(createError('User not found', 404));
  }

  users.splice(userIndex, 1);

  res.json({
    message: 'User deleted successfully',
  });
});

/**
 * POST /users/:id/change-password - Change user password
 */
router.post(
  '/:id/change-password',
  validateParams(userIdParamSchema),
  validateBody(changePasswordSchema),
  (req: Request, res: Response, next: NextFunction) => {
    const params = req.validatedParams as UserIdParam;
    const data = req.validatedBody as ChangePasswordInput;

    const user = users.find((u) => u.id === params.id);

    if (!user) {
      return next(createError('User not found', 404));
    }

    // In production, verify currentPassword against hashed password
    // For this example, we just accept it

    res.json({
      message: 'Password changed successfully',
    });
  }
);

/**
 * Helper function to remove sensitive fields
 */
function sanitizeUser(user: User) {
  const { ...sanitized } = user;
  return sanitized;
}

export default router;
