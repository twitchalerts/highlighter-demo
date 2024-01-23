
import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import { db } from './db';
import { publicProcedure, router } from './trpc';
import cors from 'cors';
import express from 'express';

import './helpers/file-uploader'

// created for each request
const createContext = ({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) => ({}); // no context
type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().create();


const appRouter = t.router({
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
  videoProcessLink: publicProcedure
    .input(z.object({ link: z.string() }))
    .mutation(async (opts) => {
      const { input } = opts;
      await db.video.remove(input.id);
      return true;
    }),
});

const app = express();
app.use(cors());

app.use(
  '/api',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter;

const PORT = process.env.SERVER_PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on port ${PORT}`);
});