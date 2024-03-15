
import { initTRPC } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import { z } from 'zod';
import { db } from './db';
import { publicProcedure, router } from './trpc';
import cors from 'cors';
import express from 'express';
import './helpers/file-uploader'
import { executeCommand } from './helpers/exec';
import path from 'path';
import { classifyAudio } from './helpers/classify-audio';
import extractAudio from './helpers/extract-audio';
import { getMediaMetadata } from './helpers/get-video-metadata';

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
  videoClassificatorData: publicProcedure.input(z.object({ id: z.string(), classNames: z.array(z.string()) })).query(async (opts) => {
    const { input } = opts;
    return db.video.getClassificatorData(input.id, input.classNames);
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
      // check if link is valid
      const extractTwitchVideoID = (url: string) => url.match(/twitch\.tv\/videos\/(\d+)/)?.[1] || null;
      const twitchVideoId = extractTwitchVideoID(opts.input.link);

      if (!twitchVideoId) {
        throw new Error('Invalid link');
      }

      const sourceUrl = `https://www.twitch.tv/videos/${twitchVideoId}`;

      // create folder
      const id = db.video.create({ 
        sourceUrl,
        sourcePlatform: 'twitch',
        sourceId: twitchVideoId
      });
      const dir = db.video.getDir(id);
      const mp4AudioPath = path.join(dir, `audio.m4a`);
      
      // download audio
      try {
        console.info(`START DOWNLOADNG AUDIO`);
        await executeCommand(`yt-dlp -f bestaudio --extract-audio --audio-format m4a -o '${mp4AudioPath}' ${sourceUrl}`);
      } catch (error: any) {
        console.error(error);
        db.video.updateInfo(id, { error: error.message });
        throw new Error('Error downloading audio');
      }

      // resample audio to 16kHz wav format
      const wavAudioPath = path.join(dir, 'audio.wav');
      await extractAudio(mp4AudioPath, wavAudioPath);

      // fetch duration, metadata and update info.json
      const metadata = await getMediaMetadata(wavAudioPath);
      const duration = metadata.format.duration;

      db.video.updateInfo(id, {
        duration,
        metadata
      });


      // classify audio with YAMNet in async mode and save scores to the working dir
      classifyAudio(id);

      const info = db.video.getInfo(id);
      console.info(`VIDEO INFO`, info);

      return info;
    }),
});

// launch express server
const app = express();
app.use(cors()); // TODO: setup correct CORS later

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