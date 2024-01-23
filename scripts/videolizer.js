#!/usr/bin/env node

import { program } from 'commander';
import axios from 'axios';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import dotenv from 'dotenv';
import path from 'path';
import { performance } from 'perf_hooks';
import WaveformData from 'waveform-data';
import pkg from '@deepgram/sdk';
const { Deepgram } = pkg;





const env = dotenv.config({ path: '.env.local' });
const { VITE_DEEPGRAM_KEY } = env.parsed;
if (!VITE_DEEPGRAM_KEY) {
    console.error('Missing Deepgram API key in environment variables.');
    process.exit(1);
}

ffmpeg.setFfmpegPath(ffmpegPath);



async function downloadVideo(url, outputPath) {
    try {
        console.log(`Downloading video from ${url}...`);

        // Axios GET request to the URL, response type set to 'stream' for downloading
        const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream'
        });

        // Create a write stream to the output path
        const writer = fs.createWriteStream(outputPath);

        // Pipe the video data to the file
        response.data.pipe(writer);

        // Return a new Promise that resolves when the download finishes
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading video: ${error.message}`);
        throw error;
    }
}



async function analyzeWithDeepgram(inputPath, outputPath) {
    try {
        const deepgram = new Deepgram(VITE_DEEPGRAM_KEY);
        let source;

        if (inputPath.startsWith('http')) {
            source = { url: inputPath };
        } else {
            const audio = fs.readFileSync(inputPath);
            source = {
                buffer: audio,
                mimetype: 'audio/wav',
            };
        }

        const response = await deepgram.transcription.preRecorded(source, {
            punctuate: true,
            model: 'general',
        });

        fs.writeFileSync(outputPath, JSON.stringify(response, null, 2));
        console.log(`Transcription saved to ${outputPath}`);
    } catch (error) {
        console.error(`Error in Deepgram analysis: ${error.message}`);
        throw error;
    }
}


function createCompressedDataFile(deepgramPath, outputPath) {
    const deepgramData = JSON.parse(fs.readFileSync(deepgramPath));

    // compress the words array
    const words = deepgramData.results.channels[0].alternatives[0].words.map((word, ind) => {
        return [ind,word.punctuated_word, Math.round(word.start), Math.round(word.end) ];
    });

    const outputData = {
        metadata: deepgramData.metadata,
        results: {
            words,
        }
    }


    fs.writeFileSync(outputPath, JSON.stringify(outputData));
    console.log(`Compressed data saved to ${outputPath}`);

}

program
    .argument('<video-url>')
    .argument('<upload-dir>')
    .action(async (videoUrl) => {
        const startTime = performance.now();

        console.log('Starting videolizer...');

        
        // Ensure the upload directory exists
        const UPLOAD_DIR = 'uploads';
        if (!fs.existsSync(UPLOAD_DIR)) {
            fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

        const fileExtension = path.extname(videoUrl);
        const isRemote = videoUrl.startsWith('http');
        const destDir = path.resolve(UPLOAD_DIR, encodeURIComponent(videoUrl));
        
        const shouldDownload = isRemote && !fs.existsSync(destDir);

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        if (shouldDownload) {
            console.log('Downloading video...');
            await downloadVideo(videoUrl, destDir);
        } else {
            console.log('Video found in cache.');
        }

        const videoPath = isRemote ? cachedPath : videoUrl;
        const audioPath = path.resolve(destDir, 'audio.wav');
        const peaksPath = path.resolve(destDir, 'peaks.json');
        const deepgramPath = path.resolve(destDir, 'deepgram.json');
        const compressedPath = path.resolve(destDir, 'compressed.json');


        if (!fs.existsSync(audioPath)) {
            console.log('Extracting audio...');
            await extractAudio(videoPath, audioPath);
        } else {
            console.log('Audio found in cache.');
        }

        if (!fs.existsSync(deepgramPath)) {
            console.log('Analyzing with Deepgram...');
            await analyzeWithDeepgram(audioPath, deepgramPath);
        } else {
            console.log('Deepgram analysis found in cache.');
        }

        console.log('Compressing data...');
        await createCompressedDataFile(deepgramPath, compressedPath);

        const endTime = performance.now();
        console.log(`Completed in ${(endTime - startTime).toFixed(2)}ms`);
        console.log(`Generated files: ${peaksPath}, ${deepgramPath}`);
    });

program.parse();
