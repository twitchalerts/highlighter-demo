import ffmpeg from 'fluent-ffmpeg';

export default function extractAudio(inputPath: string, outputPath: string) {
    console.log(`Extracting audio from ${inputPath} to ${outputPath}`);
    return new Promise((resolve, reject) => {

        // Step 1: Extract Audio
        ffmpeg(inputPath)
            .output(outputPath)
            .audioCodec('pcm_s16le') // Convert audio to WAV format
            .audioChannels(1) // Mono channel
            .audioFrequency(16000) // Standard sample rate is 44100 but we need 16k for the tensorflow model
            .on('start', command => console.log('Spawned Ffmpeg with command: ' + command))
            .on('end', () => {
                console.log(`Audio extracted to ${outputPath}`);
                resolve(outputPath);
            })
            .on('error', (err) => {
                console.error(`Error in audio extraction: ${err.message}`);
                reject(err);
            })
            .run();
    });
}
