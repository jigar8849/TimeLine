import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import { Upload, Film, PlayCircle, Loader, Trash2 } from 'lucide-react';
import VideoPlayer from './components/VideoPlayer';
import './App.css';

const API_Base = import.meta.env.VITE_API_URL;
const API_URL = `${API_Base}/api/videos`;

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await axios.get(API_URL);
      setVideos(res.data);
    } catch (err) {
      console.error("Failed to fetch videos", err);
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);
    setIsUploading(true);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setIsUploading(false);
      fetchVideos();
      setSelectedVideo(res.data);
    } catch (err) {
      console.error(err);
      setIsUploading(false);
      alert('Upload failed');
    }
  };

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles?.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mkv', '.avi', '.mov']
    },
    noClick: true,
    noKeyboard: true
  });

  const handleDeleteClick = (e, videoId) => {
    e.stopPropagation();
    setVideoToDelete(videoId);
  };

  const confirmDelete = async () => {
    if (!videoToDelete) return;

    try {
      await axios.delete(`${API_URL}/${videoToDelete}`);
      setVideos(videos.filter(v => v._id !== videoToDelete));
      if (selectedVideo?._id === videoToDelete) {
        setSelectedVideo(null);
      }
      setVideoToDelete(null);
    } catch (err) {
      console.error('Delete failed', err);
      alert('Failed to delete video');
    }
  };

  return (
    <div className="app-container" {...getRootProps()}>
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="drag-overlay">
          <div className="drag-content">
            <Upload size={60} />
            <h2>Drop video to upload</h2>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {videoToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Delete Video?</h3>
            <p>Are you sure you want to delete this video? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setVideoToDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <header className="app-header">
        <div className="logo">
          <Film className="icon" />
          <h1>JP Player</h1>
        </div>
        <button
          className={`btn btn-primary upload-btn ${isUploading ? 'disabled' : ''}`}
          onClick={open}
          disabled={isUploading}
        >
          {isUploading ? <Loader className="spin" size={18} /> : <Upload size={18} />}
          <span>{isUploading ? 'Processing...' : 'Upload Video'}</span>
        </button>
      </header>

      <main className={`main-content container ${selectedVideo ? 'watch-mode' : ''}`}>
        {selectedVideo ? (
          <section className="player-section">
            <VideoPlayer video={selectedVideo} key={selectedVideo._id} />
            <div className="video-details">
              <h2>{selectedVideo.title}</h2>
              <p className="video-meta">Duration: {Math.floor(selectedVideo.duration / 60)}:{(Math.floor(selectedVideo.duration % 60)).toString().padStart(2, '0')}</p>
            </div>
          </section>
        ) : (
          <section className="empty-state">
            <div className="empty-content">
              <Film size={60} opacity={0.5} />
              <h2>Select a video to start</h2>
              <p>Or drag and drop a video anywhere on the screen</p>
              <button className="btn btn-secondary" onClick={open}>Select File</button>
            </div>
          </section>
        )}

        <section className="list-section">
          <h3>{selectedVideo ? 'Up Next' : 'Your Library'}</h3>
          <div className="video-grid">
            {videos.map(video => (
              <div
                key={video._id}
                className={`video-card ${selectedVideo?._id === video._id ? 'active' : ''}`}
                onClick={() => setSelectedVideo(video)}
              >
                <div className="card-thumb">
                  <div className="play-overlay"><PlayCircle size={32} /></div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDeleteClick(e, video._id)}
                    title="Delete Video"
                  >
                    <Trash2 size={16} />
                  </button>
                  <span className="duration-badge">{Math.floor(video.duration / 60)}:{(Math.floor(video.duration % 60)).toString().padStart(2, '0')}</span>
                  {video.thumbnailPattern ? (
                    <img
                      src={`${API_Base}/thumbnails/${video._id}/thumb-${Math.max(1, Math.floor(video.duration / 2))}.jpg`}
                      alt={video.title}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  ) : (
                    <div className="no-thumb">No Preview</div>
                  )}
                </div>
                <div className="card-info">
                  <h4>{video.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
