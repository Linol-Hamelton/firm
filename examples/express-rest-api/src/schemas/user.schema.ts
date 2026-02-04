import { s } from 'firm-validator';

/**
 * User schemas with FIRM validation
 */

// Create user schema
export const createUserSchema = s.object({
  email: s.string().email(),
  password: s.string().min(8),
  name: s.string().min(1).max(100),
  role: s.enum(['user', 'admin']).default('user'),
  age: s.number().int().min(18).optional(),
}).compile(); // Pre-compile for performance

// Update user schema (all fields optional except email for identification)
export const updateUserSchema = s.object({
  email: s.string().email().optional(),
  name: s.string().min(1).max(100).optional(),
  role: s.enum(['user', 'admin']).optional(),
  age: s.number().int().min(18).optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
).compile();

// Query parameters schema
export const getUsersQuerySchema = s.object({
  page: s.coerce.number().int().min(1).default(1),
  limit: s.coerce.number().int().min(1).max(100).default(10),
  role: s.enum(['user', 'admin']).optional(),
  search: s.string().optional(),
}).compile();

// URL params schema
export const userIdParamSchema = s.object({
  id: s.coerce.number().int().positive(),
}).compile();

// Password validation with custom rules
export const changePasswordSchema = s.object({
  currentPassword: s.string(),
  newPassword: s.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: s.string(),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  }
).compile();

// Type exports
export type CreateUserInput = typeof createUserSchema.infer;
export type UpdateUserInput = typeof updateUserSchema.infer;
export type GetUsersQuery = typeof getUsersQuerySchema.infer;
export type UserIdParam = typeof userIdParamSchema.infer;
export type ChangePasswordInput = typeof changePasswordSchema.infer;
