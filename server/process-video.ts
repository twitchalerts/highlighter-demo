import path from "path";
import { uploadDir } from "./settings";
import fs from "fs";
import generateThumbnail from "./helpers/generate-thumbnail";
import { executeCommand } from "./helpers/exec";
import extractAudio from "./helpers/extract-audio";
import { getVideoMetadata } from "./helpers/get-video-metadata";

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

    // get video duration, metadata and update info.json
    const metadata = await getVideoMetadata(videoPath);
    const duration = metadata.format.duration;
    const info = JSON.parse(fs.readFileSync(path.join(videoDir, 'info.json'), 'utf-8'));
    info.duration = duration;
    info.metadata = metadata;
    fs.writeFileSync(path.join(videoDir, 'info.json'), JSON.stringify(info));

    // extract audio
    const audioPath = await extractAudio(videoPath, path.join(videoDir, 'audio.wav'));

    // run audio classification
    await executeCommand(`python ./scripts/yamnet_classifier.py ${audioPath} ${videoDir}`);
  } catch (err) {
    console.error(err);
  }



}