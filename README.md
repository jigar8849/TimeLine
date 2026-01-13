# Modern Video Player with Timeline Preview

A full-stack video player application that features automatic thumbnail generation and a responsive timeline hover preview (similar to YouTube).

## Key Features
- **Custom Video Player**: HTML5 video with custom controls and a timeline that supports scrubbing.
- **Hover Previews**: Hover over the timeline to see a thumbnail preview of that exact second.
- **Automatic Processing**: Uploaded videos are processed by FFmpeg to generate 1-second interval thumbnails.
- **Modern UI**: Built with React and CSS Variables for a responsive, dark-themed aesthetic.

## Tech Stack
- **Frontend**: React, Vite
- **Backend**: Node.js, Express, MongoDB
- **Processing**: FFmpeg (via fluent-ffmpeg)

## Setup & Running

### Prerequisites
- Node.js installed
- MongoDB installed and running locally on default port (27017)

### 1. Backend
The backend handles video uploads, storage, and thumbnail generation.

```bash
cd backend
npm install
node server.js
```
The server will start on `http://localhost:5000`.

### 2. Frontend
The frontend provides the user interface.

```bash
cd frontend
npm install
npm run dev
```
Open the URL shown (usually `http://localhost:5173`).

## Usage
1. Open the web app.
2. Click "Upload Video" to select an MP4 file.
3. Wait for the upload and processing to complete (thumbnails are generating in the background).
4. Select the video from the library grid.
5. Hover over the timeline to see the frame previews!
