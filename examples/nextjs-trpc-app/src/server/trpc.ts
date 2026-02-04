import { initTRPC } from '@trpc/server';
import superjson from 'superjson';

/**
 * tRPC initialization with SuperJSON transformer
 */

const t = initTRPC.create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;
