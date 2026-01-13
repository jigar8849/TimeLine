const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffprobePath = require('@ffprobe-installer/ffprobe').path;
const path = require('path');
const fs = require('fs');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

/**
 * Get video metadata (duration in seconds)
 */
exports.getVideoMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(filePath, (err, metadata) => {
            if (err) return reject(err);
            resolve({
                duration: metadata.format.duration,
                format: metadata.format
            });
        });
    });
};

/**
 * Generate thumbnails (1 per second)
 * Returns the number of thumbnails generated
 */
exports.generateThumbnails = (videoPath, outputDir, completedCallback) => {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // We use vf fps=1 to generate one frame every second
        // Output filename pattern: thumb-%d.jpg (1-based index)
        const outputPath = path.join(outputDir, 'thumb-%d.jpg');

        ffmpeg(videoPath)
            .outputOptions([
                '-vf', 'fps=1', // 1 frame per second
                '-q:v', '2'     // Quality (2-31, lower is better)
            ])
            .output(outputPath)
            .on('end', () => {
                resolve();
            })
            .on('error', (err) => {
                reject(err);
            })
            .run();
    });
};
