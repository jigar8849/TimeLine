const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    filename: {
        type: String, // Original filename
        required: true
    },
    filePath: {
        type: String, // Path on disk
        required: true
    },
    duration: {
        type: Number, // In seconds
        default: 0
    },
    thumbnailPattern: {
        type: String, // e.g., "/thumbnails/video-id/thumb-%s.png"
        default: ""
    },
    thumbnailCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Video', videoSchema);
