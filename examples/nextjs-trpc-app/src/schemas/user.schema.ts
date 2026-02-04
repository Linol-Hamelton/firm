import { s } from 'firm-validator';

/**
 * User schemas with FIRM validation for tRPC
 */

// Create user input
export const createUserInput = s.object({
  email: s.string().email(),
  name: s.string().min(1).max(100),
  age: s.number().int().min(18).max(120).optional(),
  bio: s.string().max(500).optional(),
}).compile();

// Update user input
export const updateUserInput = s.object({
  id: s.number().int().positive(),
  email: s.string().email().optional(),
  name: s.string().min(1).max(100).optional(),
  age: s.number().int().min(18).max(120).optional(),
  bio: s.string().max(500).optional(),
}).refine(
  (data) => {
    const { id, ...rest } = data;
    return Object.keys(rest).length > 0;
  },
  { message: 'At least one field must be provided for update' }
).compile();

// Get user by ID input
export const getUserInput = s.object({
  id: s.number().int().positive(),
}).compile();

// Delete user input
export const deleteUserInput = s.object({
  id: s.number().int().positive(),
}).compile();

// List users input
export const listUsersInput = s.object({
  limit: s.number().int().min(1).max(100).default(10),
  cursor: s.number().int().positive().optional(),
  search: s.string().optional(),
}).compile();

// Type exports
export type CreateUserInput = typeof createUserInput.infer;
export type UpdateUserInput = typeof updateUserInput.infer;
export type GetUserInput = typeof getUserInput.infer;
export type DeleteUserInput = typeof deleteUserInput.infer;
export type ListUsersInput = typeof listUsersInput.infer;
