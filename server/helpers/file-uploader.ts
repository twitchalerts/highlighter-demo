import express from 'express';
import fileUpload from 'express-fileupload';
import { uploadDir } from '../settings';
import cors from 'cors';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { processVideo } from '../process-video';
import { createTask } from './create-task';

const app = express();

app.use(cors());

// Middleware for file upload
app.use(fileUpload({
    limits: { fileSize: 4 * 1024 * 1024 * 1024 }, // 4GB limit or adjust as needed
    useTempFiles: true,
    tempFileDir: '/tmp/',
}));

// Endpoint to upload files
app.post('/uploader', async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('No files were uploaded.');
    }

    let uploadedFile = req.files.file;

    // Check if the file is a video
    const allowedMimeTypes = ['video/mp4', 'video/avi', 'video/mpeg', 'video/webm']; // Add other video MIME types as needed
    if (!allowedMimeTypes.includes(uploadedFile.mimetype)) {
        return res.status(400).send({ error: 'Only video files are allowed.' });
    }

    // // Generate unique ID
    // const currentDate = new Date().toISOString().slice(0, 10); // Format as 'YYYY-MM-DD'
    // const uniqueID = currentDate + '-' + Date.now() + '-' + uuidv4(); // Use date to keep directory sorted by date

    // // Create a new directory for the video
    // const newDir = `${uploadDir}/${uniqueID}`;
    // fs.mkdirSync(newDir, { recursive: true });
    const { id, dir } = createTask();

    // Set new file name and path
    const newFilePath = `${dir}/video.mp4`;

    // Move the file to the new directory
    try {
        await uploadedFile.mv(newFilePath);
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }

    // Create info.json file
    const info = {
        id,
        name: uploadedFile.name,
        size: uploadedFile.size
    };
    fs.writeFileSync(`${dir}/info.json`, JSON.stringify(info));

    // Send response
    res.send(info);

    // Process the video
    processVideo(id);
});

const PORT = 3001;


app.listen(PORT, '0.0.0.0', () => {
    console.log(`Uploader listening on port ${PORT}`);
});
