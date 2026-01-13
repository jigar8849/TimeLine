const express = require('express');
const router = express.Router();
const multer = require('multer');
const Video = require('../models/Video');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'timeline_videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'mov', 'avi', 'mkv']
    },
});

const upload = multer({ storage: storage });

// POST /api/videos/upload
router.post('/upload', upload.single('video'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file provided' });
        }

        console.log('Cloudinary Upload Result:', req.file);

        // Fetch duration from Cloudinary API (req.file might not have it depending on driver version)
        // req.file.filename gives the public_id
        const videoInfo = await cloudinary.api.resource(req.file.filename, {
            resource_type: 'video',
            image_metadata: true
        });

        const duration = videoInfo.duration || 0;

        // Construct a pattern for thumbnails.
        // Cloudinary can generate a thumbnail at a specific second using 'so_<seconds>'
        // We use '%d' as a placeholder that the frontend presumably replaces.
        // Example URL: https://res.cloudinary.com/demo/video/upload/so_%d/v12345/my_video.jpg
        // We need to carefully construct this to match what the frontend replacement logic expects.
        // Assuming frontend replaces "%d" with a number (seconds).

        const baseUrl = videoInfo.secure_url.split('/upload/')[0] + '/upload/';
        const versionAndId = videoInfo.secure_url.split('/upload/')[1]; // e.g., v123/id.mp4

        // We want a jpg, not mp4.
        const idWithoutExt = videoInfo.public_id;
        const version = 'v' + videoInfo.version;

        // Pattern: .../upload/w_300,f_jpg,so_%d/<version>/<public_id>.jpg
        // Note: We force jpg format.
        const thumbnailPattern = `${baseUrl}w_300,f_jpg,so_%d/${version}/${idWithoutExt}.jpg`;

        // Create Video Entry
        const video = new Video({
            title: req.body.title || req.file.originalname,
            cloudinaryId: req.file.filename,
            url: req.file.path, // Secure URL
            duration: duration,
            thumbnailPattern: thumbnailPattern,
            thumbnailCount: Math.floor(duration), // One thumb per second roughly
        });

        const savedVideo = await video.save();
        console.log('Video saved to DB:', savedVideo._id);

        res.json(savedVideo);
    } catch (err) {
        console.error('Upload error:', err);
        // Try to delete from cloudinary if DB save fails
        if (req.file && req.file.filename) {
            await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'video' });
        }
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

        // Delete from Cloudinary
        if (video.cloudinaryId) {
            await cloudinary.uploader.destroy(video.cloudinaryId, { resource_type: 'video' });
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

        // Redirect to Cloudinary URL for streaming
        res.redirect(video.url);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error streaming video');
    }
});

module.exports = router;
