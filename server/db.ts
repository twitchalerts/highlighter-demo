
import * as fse from 'fs-extra';
import * as glob from 'glob';
import * as path from 'path';
import { uploadDir } from './settings';

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
}


// Imaginary database

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
    getClassificatorData(id: string) {
      return fse.readJsonSync(path.join(uploadDir, id, 'scores_data.json'));
    }
  }
};

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
