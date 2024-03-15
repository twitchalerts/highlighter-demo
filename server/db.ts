
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import { uploadDir } from './settings';
import fs from "fs";
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';

export interface VideoInfo {
  id: string;
  /**
   * original video file name
   */
  name: string;
  /**
   * list of files in the video directory
   */
  files: string[];
  /**
   * size in bytes
   */
  size: number;
  /**
   * duration in seconds
   */
  duration: number;

  /**
   * Link to the original video
   */
  sourceUrl: string;

  sourcePlatform: 'youtube' | 'twitch' | '';
  
  /**
   * Id of the source video (youtube video id or twitch video id)
   **/
  sourceId: string;

  /**
   * metadata
   */
  metadata: ffmpeg.FfprobeData;

  error: string;
}


// Simulate database in fs

export const db = {

  video: {
    getList: async () => {
      return (await getVideoListFromDir(uploadDir)).reverse();
    },
    findById: async (id: string) => {
      return getVideoFromDir(path.join(uploadDir, id));
    },
    remove(id: string) {
      const dir = path.join(uploadDir, id);
      fse.removeSync(dir);
    },
    getClassificatorData(id: string, classNames: string[]) {
      return getScoresData(id, classNames)
    },
    getInfo(id: string): VideoInfo {
      const dir = this.getDir(id);
      return JSON.parse(fs.readFileSync(path.join(dir, 'info.json'), 'utf-8'));
    },
    create(info: Partial<VideoInfo> = {}) {
      // Generate unique ID
      const currentDate = new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
      const uniqueID = currentDate + '-' + Date.now() + '-' + uuidv4(); // Use date to keep directory sorted by date

      // Create a new directory for the video
      const dir = `${uploadDir}/${uniqueID}`;

      fs.mkdirSync(dir, { recursive: true });
      this.updateInfo(uniqueID, info);
      return uniqueID;
    },
    /**
     * Update info.json file in the video directory
     **/ 
    updateInfo(id: string, patch: Partial<VideoInfo>) {
      const dir = this.getDir(id);
      const infoPath: string = path.join(dir, 'info.json');
      const currentInfo = fs.existsSync(infoPath) ? JSON.parse(fs.readFileSync(infoPath, 'utf-8')) : {};
      const newInfo = {
        id,
        ...currentInfo,
        ...patch
      };
      fs.writeFileSync(infoPath, JSON.stringify(newInfo));
    },
    /**
     * Returns the workng directory path for the video
     */
    getDir(id: string) {
      return path.join(uploadDir, id);
    }
  }
};


/**
 * Reads data from all chunk files and returns data for the given class names.
 * @param {string[]} classNames - The class names to filter scores by.
 * @returns {Promise<{classNames: string[], scores: number[][]}>} - The scores for the given class names.
 */
async function getScoresData(id: string, classNames: string[]): Promise<{classNames: string[], scores: number[][]}> {
  // Path to the directory containing chunk files and class names file
  const outputDir = db.video.getDir(id);
  
  // Read the class names from scores_classes.json
  const allClassNames = JSON.parse(fs.readFileSync(path.join(outputDir, 'scores_classes.json'), 'utf8'));
  
  // Map requested class names to indices
  const classIndices = classNames.map(className => allClassNames.indexOf(className));
  
  // Initialize an array to hold aggregated scores for requested class names
  const aggregatedScores = [];
  
  // Read and process each chunk file
  let chunkIndex = 0;
  while (fs.existsSync(path.join(outputDir, `scores_data_chunk_${chunkIndex}.json`))) {
    // Read the chunk file
    const chunkScores = JSON.parse(fs.readFileSync(path.join(outputDir, `scores_data_chunk_${chunkIndex}.json`), 'utf8'));
    
    // Extract scores for requested class names
    const filteredScores = chunkScores.scores.map(frameScores => classIndices.map(index => frameScores[index]));
    
    // Append to aggregated scores
    aggregatedScores.push(...filteredScores);
    
    // Move to the next chunk
    chunkIndex++;
  }
  
  return {
    classNames,
    scores: aggregatedScores
  };
}



/**
 * Get list of processed videos from a directory
 */
async function getVideoListFromDir(dir: string): Promise<VideoInfo[]> {
  const results: VideoInfo[] = [];
  const folders: string[] = glob.sync(path.join(dir, '**/info.json')).map(file => path.dirname(file));

  for (const folder of folders) {
    const folderInfo = await getVideoFromDir(folder);
    if (!folderInfo) continue;
    results.push(folderInfo);
  }

  return results.reverse(); // reverse to show the latest videos first
}

async function getVideoFromDir(folder: string): Promise<VideoInfo | null> {
  try {
    const infoPath: string = path.join(folder, 'info.json');
    const info = await fse.readJson(infoPath);
    const files: string[] = await fse.readdir(folder);
    const filteredFiles: string[] = files.filter(file => file !== 'info.json');

    return {
      ...info,
      files: filteredFiles
    };
  } catch (e) {
    console.error(`Error processing ${folder}: ${e.message}`);
    return null;
  }
}
