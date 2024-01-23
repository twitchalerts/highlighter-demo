import ffmpeg from 'fluent-ffmpeg';

/**
 * Generates a thumbnail for a video file.
 * @param {string} videoPath - The path to the video file.
 * @param {string} outputPath - The path where the thumbnail will be saved.
 */
export default function generateThumbnail(videoPath: string, outputPath: string) {

    return new Promise<void>((resolve, reject) => {
        ffmpeg(videoPath)
        .on('end', function() {
            console.log('Thumbnail generated successfully');
            resolve();
        })
        .on('error', function(err) {
            console.error('Error generating thumbnail:', err);
            reject(err);
        })
        .screenshots({
            // Will take screenshots at 20% of the video duration
            count: 1,
            folder: outputPath,
            filename: 'thumbnail.png',
            size: '320x240'
        });
    });


}
