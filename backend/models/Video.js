const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    // Cloudinary Public ID
    cloudinaryId: {
        type: String,
        required: true
    },
    // Secure URL from Cloudinary
    url: {
        type: String,
        required: true
    },
    duration: {
        type: Number, // In seconds
        default: 0
    },
    thumbnailPattern: {
        type: String, // format: https://res.cloudinary.com/.../video/upload/so_%s/v.../id.jpg
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
