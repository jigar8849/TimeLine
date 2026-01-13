require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const videoRoutes = require('./routes/videoRoutes');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/timeline_video_player';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log('--- Server Configuration ---');
console.log(`PORT: ${PORT}`);
console.log(`MONGO_URI: ${MONGO_URI}`);
console.log(`FRONTEND_URL: ${FRONTEND_URL}`);
console.log('----------------------------');

// Create necessary directories
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}
if (!fs.existsSync(path.join(__dirname, 'public/thumbnails'))) {
    fs.mkdirSync(path.join(__dirname, 'public/thumbnails'), { recursive: true });
}

mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        console.error('Check your MONGO_URI in .env');
    });

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

// Serve static thumbnails
app.use('/thumbnails', express.static(path.join(__dirname, 'public/thumbnails')));

// Routes
app.get('/', (req, res) => {
    res.send('Backend is working successfully! Status: Active');
});

app.get('/health', (req, res) => {
    res.json({
        status: 'UP',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

app.use('/api/videos', videoRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
