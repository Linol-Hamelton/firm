import { router, publicProcedure } from '../trpc';
import {
  createUserInput,
  updateUserInput,
  getUserInput,
  deleteUserInput,
  listUsersInput,
  CreateUserInput,
  UpdateUserInput,
  GetUserInput,
  DeleteUserInput,
  ListUsersInput,
} from '@/schemas/user.schema';
import { TRPCError } from '@trpc/server';

/**
 * User data model
 */
export interface User {
  id: number;
  email: string;
  name: string;
  age?: number;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * In-memory user store (replace with database in production)
 */
const users: User[] = [
  {
    id: 1,
    email: 'alice@example.com',
    name: 'Alice Smith',
    age: 28,
    bio: 'Software engineer passionate about TypeScript',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  {
    id: 2,
    email: 'bob@example.com',
    name: 'Bob Johnson',
    age: 35,
    bio: 'Full-stack developer',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];

let nextId = 3;

/**
 * User router with FIRM validation
 */
export const userRouter = router({
  /**
   * List users with pagination and search
   */
  list: publicProcedure
    .input(listUsersInput)
    .query(({ input }) => {
      let filteredUsers = [...users];

      // Search filter
      if (input.search) {
        const searchLower = input.search.toLowerCase();
        filteredUsers = filteredUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower) ||
            u.bio?.toLowerCase().includes(searchLower)
        );
      }

      // Cursor-based pagination
      let startIndex = 0;
      if (input.cursor) {
        startIndex = filteredUsers.findIndex((u) => u.id === input.cursor) + 1;
      }

      const items = filteredUsers.slice(startIndex, startIndex + input.limit);
      const nextCursor = items.length === input.limit ? items[items.length - 1].id : undefined;

      return {
        items,
        nextCursor,
        total: filteredUsers.length,
      };
    }),

  /**
   * Get user by ID
   */
  getById: publicProcedure
    .input(getUserInput)
    .query(({ input }) => {
      const user = users.find((u) => u.id === input.id);

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with id ${input.id} not found`,
        });
      }

      return user;
    }),

  /**
   * Create new user
   */
  create: publicProcedure
    .input(createUserInput)
    .mutation(({ input }) => {
      // Check if email already exists
      if (users.some((u) => u.email === input.email)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists',
        });
      }

      const newUser: User = {
        id: nextId++,
        email: input.email,
        name: input.name,
        age: input.age,
        bio: input.bio,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      users.push(newUser);

      return {
        message: 'User created successfully',
        user: newUser,
      };
    }),

  /**
   * Update user
   */
  update: publicProcedure
    .input(updateUserInput)
    .mutation(({ input }) => {
      const userIndex = users.findIndex((u) => u.id === input.id);

      if (userIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with id ${input.id} not found`,
        });
      }

      // Check if new email already exists
      if (input.email && users.some((u) => u.email === input.email && u.id !== input.id)) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Email already exists',
        });
      }

      const { id, ...updateData } = input;

      const updatedUser: User = {
        ...users[userIndex],
        ...updateData,
        updatedAt: new Date(),
      };

      users[userIndex] = updatedUser;

      return {
        message: 'User updated successfully',
        user: updatedUser,
      };
    }),

  /**
   * Delete user
   */
  delete: publicProcedure
    .input(deleteUserInput)
    .mutation(({ input }) => {
      const userIndex = users.findIndex((u) => u.id === input.id);

      if (userIndex === -1) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User with id ${input.id} not found`,
        });
      }

      users.splice(userIndex, 1);

      return {
        message: 'User deleted successfully',
      };
    }),

  /**
   * Get user count
   */
  count: publicProcedure.query(() => {
    return {
      total: users.length,
    };
  }),
});
