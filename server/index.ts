import { createHTTPServer } from '@trpc/server/adapters/standalone';
import { z } from 'zod';
import { db } from './db';
import { publicProcedure, router } from './trpc';
import cors from 'cors';

import './helpers/file-uploader'

const appRouter = router({
  videoList: publicProcedure.query(async () => {
    return await db.video.getList();
  }),
  videoById: publicProcedure.input(z.string()).query(async (opts) => {
    const { input } = opts;
    return db.video.findById(input);
  }),
  videoClassificatorData: publicProcedure.input(z.string()).query(async (opts) => {
    const { input } = opts;
    return db.video.getClassificatorData(input);
  }),
  videoRemove: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      await db.video.remove(input.id);
      return true;
    }),
});

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

const server = createHTTPServer({
  router: appRouter,
  middleware: cors()
});

const PORT = process.env.SERVER_PORT || 3000;
console.log(`Listening trpc on port ${PORT}`);
server.listen(PORT);