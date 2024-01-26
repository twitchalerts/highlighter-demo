import { v4 as uuidv4 } from 'uuid';
import { uploadDir } from '../settings';
import fs from 'fs';

export function createVideoDir() {
  // Generate unique ID
  const currentDate = new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
  const uniqueID = currentDate + '-' + Date.now() + '-' + uuidv4(); // Use date to keep directory sorted by date

  // Create a new directory for the video
  const dir = `${uploadDir}/${uniqueID}`;

      // Create a new directory for the tash where we upload audio and video files
      const newDir = `${uploadDir}/${uniqueID}`;
      fs.mkdirSync(newDir, { recursive: true });

  return {
    id: uniqueID,
    dir,
  }
}