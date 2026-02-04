import { router } from '../trpc';
import { userRouter } from './user';

/**
 * Root tRPC router
 *
 * All routers are merged here
 */
export const appRouter = router({
  user: userRouter,
});

// Export type definition of API
export type AppRouter = typeof appRouter;
