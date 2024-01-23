import { executeCommand } from "./exec";
import { uploadDir } from "../settings";
import path from "path";

const PYTHON_PATH = process.env.PYTHON_PATH || 'python';

export async function classifyAudio(id: string) {
    const beginTime = Date.now();
    const taskDir = path.join(uploadDir, id);
    const audioPath = path.join(taskDir, 'audio.wav');
    
    // run audio classification
    try {
      // run audio classification and save results to the taskDir
      console.info(`START AUDIO CLASSIFICATION`);
      await executeCommand(`${PYTHON_PATH} ./scripts/yamnet_classifier.py ${audioPath} ${taskDir}`);
    } catch (err) {
      console.error(err);
    }
    const duration = Date.now() - beginTime;
    console.info(`FINISH AUDIO CLASSIFICATION for ${duration}ms`);
}