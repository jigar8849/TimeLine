const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Video = require('../models/Video');
const { generateThumbnails, getVideoMetadata } = require('../utils/videoProcessor');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure uploads dir exists
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads');
        }
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Sanitize filename to avoid issues
        const sanitized = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
        cb(null, Date.now() + '-' + sanitized);
    }
});
const upload = multer({ storage });

// POST /api/videos/upload
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        console.log('Video uploaded:', req.file.path);
        const filePath = req.file.path;
        const metadata = await getVideoMetadata(filePath);
        const duration = metadata.duration;

        // Create Video Entry
        const video = new Video({
            title: req.body.title || req.file.originalname,
            filename: req.file.filename,
            filePath: filePath,
            duration: duration
        });
        const savedVideo = await video.save();
        console.log('Video saved to DB:', savedVideo._id);

        // Generate Thumbnails
        const thumbsDir = path.join(__dirname, '../public/thumbnails', savedVideo._id.toString());
        console.log('Generating thumbnails...');
        await generateThumbnails(filePath, thumbsDir);
        console.log('Thumbnails generated.');

        // Count files
        const files = fs.readdirSync(thumbsDir);
        savedVideo.thumbnailCount = files.length;
        // We serve static files from /thumbnails (mapped to public/thumbnails)
        // Pattern: /thumbnails/<id>/thumb-%d.jpg
        savedVideo.thumbnailPattern = `/thumbnails/${savedVideo._id}/thumb-%d.jpg`;

        await savedVideo.save();

        res.json(savedVideo);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json({ error: 'Processing failed: ' + err.message });
    }
});

// GET /api/videos
router.get('/', async (req, res) => {
    try {
        const videos = await Video.find().sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/videos/:id
router.get('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });
        res.json(video);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/videos/:id
router.delete('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });

        // Delete video file
        if (fs.existsSync(video.filePath)) {
            fs.unlinkSync(video.filePath);
        }

        // Delete thumbnails directory
        const thumbsDir = path.join(__dirname, '../public/thumbnails', video._id.toString());
        if (fs.existsSync(thumbsDir)) {
            fs.rmSync(thumbsDir, { recursive: true, force: true });
        }

        // Delete from DB
        await Video.findByIdAndDelete(req.params.id);

        res.json({ message: 'Video deleted successfully' });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/videos/stream/:id
router.get('/stream/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).send('Video not found');

        const path = video.filePath;
        if (!fs.existsSync(path)) return res.status(404).send('File not found on server');

        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Error streaming video');
    }
});

module.exports = router;
