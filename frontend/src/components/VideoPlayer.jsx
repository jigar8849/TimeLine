import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Maximize, RotateCcw } from 'lucide-react';
import './VideoPlayer.css'; // We will create this

const API_URL = import.meta.env.VITE_API_URL;

const VideoPlayer = ({ video }) => {
    const videoRef = useRef(null);
    const timelineRef = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [hoverData, setHoverData] = useState({ show: false, x: 0, time: 0, imgUrl: '' });

    useEffect(() => {
        if (videoRef.current) {
            setDuration(video.duration); // Use passed duration or wait for meta
        }
    }, [video]);

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setPlaying(true);
        } else {
            videoRef.current.pause();
            setPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        setCurrentTime(videoRef.current.currentTime);
    };

    const handleLoadedMetadata = () => {
        setDuration(videoRef.current.duration);
    };

    const handleTimelineClick = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.min(Math.max(0, x / rect.width), 1);
        videoRef.current.currentTime = percent * duration;
    };

    const handleTimelineHover = (e) => {
        const rect = timelineRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.min(Math.max(0, x / rect.width), 1);
        const time = percent * duration;

        // Calculate thumbnail URL
        let thumbUrl = '';
        if (video.thumbnailPattern) {
            thumbUrl = video.thumbnailPattern.replace('%d', Math.floor(time));
        } else {
            // Fallback for legacy videos or missing pattern
            const index = Math.max(1, Math.floor(time) + 1);
            thumbUrl = `${API_URL}/thumbnails/${video._id}/thumb-${index}.jpg`;
        }

        setHoverData({
            show: true,
            x: x,
            time: time,
            imgUrl: thumbUrl
        });
    };

    const handleTimelineLeave = () => {
        setHoverData({ show: false, x: 0, time: 0, imgUrl: '' });
    };

    const formatTime = (time) => {
        const min = Math.floor(time / 60);
        const sec = Math.floor(time % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    return (
        <div className="video-player-container">
            <div className="video-wrapper">
                <video
                    ref={videoRef}
                    src={`${API_URL}/api/videos/stream/${video._id}`}
                    className="video-element"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onClick={togglePlay}
                />

                {/* Controls Overlay */}
                <div className="controls-overlay">
                    {/* Timeline */}
                    <div
                        className="timeline-container"
                        ref={timelineRef}
                        onClick={handleTimelineClick}
                        onMouseMove={handleTimelineHover}
                        onMouseLeave={handleTimelineLeave}
                    >
                        {/* Hover Preview Box */}
                        {hoverData.show && (
                            <div
                                className="hover-preview"
                                style={{ left: `${hoverData.x}px` }}
                            >
                                <div className="preview-image-container">
                                    <img src={hoverData.imgUrl} alt="preview" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                                <div className="preview-time">{formatTime(hoverData.time)}</div>
                            </div>
                        )}

                        <div className="timeline-bg">
                            <div
                                className="timeline-fill"
                                style={{ width: `${(currentTime / duration) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="controls-bar">
                        <div className="left-controls">
                            <button onClick={togglePlay}>
                                {playing ? <Pause size={24} /> : <Play size={24} />}
                            </button>
                            <span className="time-display">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                        </div>

                        <div className="right-controls">
                            <Volume2 size={24} />
                            <Maximize size={24} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="video-info">
                <h2>{video.title}</h2>
            </div>
        </div>
    );
};

export default VideoPlayer;
