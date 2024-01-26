import path from "path";
import { uploadDir } from "./settings";
import fs from "fs";
import generateThumbnail from "./helpers/generate-thumbnail";
import { executeCommand } from "./helpers/exec";
import extractAudio from "./helpers/extract-audio";
import { getMediaMetadata } from "./helpers/get-video-metadata";
import { classifyAudio } from "./helpers/classify-audio";
import { db } from "./db";

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

export async function processVideo(id: string) {
  const videoDir = path.join(uploadDir, id);
  const videoPath = path.join(videoDir, 'video.mp4');

  // ensure the directory exists
  if (!fs.existsSync(videoPath)) {
    throw new Error(`Video ${videoDir} does not exist`);
  }

  try {
    // create thumbnail
    await generateThumbnail(videoPath, videoDir);

    // fetch video duration, metadata and update info.json
    const metadata = await getMediaMetadata(videoPath);
    const duration = metadata.format.duration;

    db.video.updateInfo(id, {
      duration,
      metadata
    });

    // extract audio
    await extractAudio(videoPath, path.join(videoDir, 'audio.wav'));

    // run audio classification
    await classifyAudio(id);
  } catch (err) {
    console.error(err);
  }



}