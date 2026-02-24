import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Loader from '../components/Loader';
import { ArrowLeft, Clock, Shield, Play, Pause, Volume2, VolumeX, Maximize, Minimize, ThumbsUp, ThumbsDown, Eye, FastForward, Rewind } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Watch.css';

const Watch = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [video, setVideo] = useState(null);
    const [likeData, setLikeData] = useState({ likes: 0, dislikes: 0, isLiked: false, isDisliked: false });
    const [viewsCount, setViewsCount] = useState(0);
    const [hasViewed, setHasViewed] = useState(false);
    const [animateUnlike, setAnimateUnlike] = useState(false);
    const [animateUndislike, setAnimateUndislike] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastTap, setLastTap] = useState(0);
    const [skipAction, setSkipAction] = useState(null);

    const videoRef = useRef(null);
    const playerWrapperRef = useRef(null);
    const controlsTimeoutRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(true);
    const [progress, setProgress] = useState(0);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isBuffering, setIsBuffering] = useState(true);

    useEffect(() => {
        const fetchVideo = async () => {
            try {
                const res = await axios.get(`/videos/${id}`);
                setVideo(res.data);
                setLikeData({
                    likes: res.data.likes?.length || 0,
                    dislikes: res.data.dislikes?.length || 0,
                    isLiked: res.data.likes?.includes(user?._id) || false,
                    isDisliked: res.data.dislikes?.includes(user?._id) || false,
                });
                setViewsCount(res.data.views || 0);
            } catch (err) {
                setError('Video not found or you lack permission to view it.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideo();
    }, [id]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        const handleKeyDown = (e) => {
            if (!videoRef.current) return;

            // Prevent default scrolling behavior for arrow keys and spacebar
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
            }

            if (e.key === 'ArrowRight') {
                videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration);
            } else if (e.key === 'ArrowLeft') {
                videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
            } else if (e.key === ' ') {
                if (videoRef.current.paused) {
                    videoRef.current.play();
                } else {
                    videoRef.current.pause();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    if (loading) return <Loader fullScreen={false} />;

    if (error || !video) {
        return (
            <div className="watch-error">
                <h2>Content Unavailable</h2>
                <p>{error}</p>
                <button className="btn-primary mt-4" onClick={() => navigate('/')}>
                    <ArrowLeft size={18} /> Back to Home
                </button>
            </div>
        );
    }

    // Generate Stream URL
    const streamUrl = `${import.meta.env.VITE_API_URL}/videos/stream/${video._id}`;

    const formatTime = (time) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
                setIsPlaying(false);
            } else {
                videoRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    const handleVideoClick = (e) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTap < DOUBLE_TAP_DELAY) {
            togglePlay(); // Reverse the single-tap play/pause effect

            const rect = videoRef.current.getBoundingClientRect();
            const clientX = e.clientX || (e.nativeEvent && e.nativeEvent.touches && e.nativeEvent.touches[0].clientX) || 0;
            const clickX = clientX - rect.left;

            if (clickX > rect.width / 2) {
                videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, videoRef.current.duration || 0);
                setSkipAction('forward');
            } else {
                videoRef.current.currentTime = Math.max(videoRef.current.currentTime - 10, 0);
                setSkipAction('backward');
            }

            setTimeout(() => setSkipAction(null), 500);
            setLastTap(0);
        } else {
            togglePlay();
            setLastTap(now);
        }
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            const current = videoRef.current.currentTime;
            const dur = videoRef.current.duration;
            setCurrentTime(formatTime(current));
            setProgress(dur ? (current / dur) * 100 : 0);

            // Trigger view tracking after 1 second of actual playback
            if (current >= 1 && !hasViewed) {
                setHasViewed(true);
                axios.post(`/videos/${id}/view`)
                    .then(res => setViewsCount(res.data.views))
                    .catch(console.error);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(formatTime(videoRef.current.duration));
        }
    };

    const handleProgressScrub = (e) => {
        if (videoRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoRef.current.currentTime = pos * videoRef.current.duration;
        }
    };

    const handleVolumeChange = (e) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
            if (isMuted && volume === 0) setVolume(1);
        }
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            playerWrapperRef.current.requestFullscreen().catch(err => console.error(err));
        } else {
            document.exitFullscreen();
        }
    };

    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    };

    const handleLike = async () => {
        const previousData = { ...likeData };

        // Optimistic UI Update
        setLikeData(prev => {
            let newLikes = prev.isLiked ? prev.likes - 1 : prev.likes + 1;
            let newDislikes = prev.isDisliked ? prev.dislikes - 1 : prev.dislikes;
            return {
                ...prev,
                isLiked: !prev.isLiked,
                isDisliked: false,
                likes: newLikes,
                dislikes: newDislikes
            };
        });

        try {
            const res = await axios.post(`/videos/${id}/like`);
            setLikeData(res.data);
        } catch (err) {
            console.error('Error liking video', err);
            setLikeData(previousData); // Revert on error
        }
    };

    const handleDislike = async () => {
        const previousData = { ...likeData };

        if (likeData.isDisliked) {
            setAnimateUndislike(true);
            setTimeout(() => setAnimateUndislike(false), 400);
        }

        // Optimistic UI Update
        setLikeData(prev => {
            let newDislikes = prev.isDisliked ? prev.dislikes - 1 : prev.dislikes + 1;
            let newLikes = prev.isLiked ? prev.likes - 1 : prev.likes;
            return {
                ...prev,
                isDisliked: !prev.isDisliked,
                isLiked: false,
                likes: newLikes,
                dislikes: newDislikes
            };
        });

        try {
            const res = await axios.post(`/videos/${id}/dislike`);
            setLikeData(res.data);
        } catch (err) {
            console.error('Error disliking video', err);
            setLikeData(previousData); // Revert on error
        }
    };

    return (
        <div className="watch-container flex-column gap-3">
            <div
                className="player-wrapper glass"
                ref={playerWrapperRef}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => isPlaying && setShowControls(false)}
            >
                <video
                    ref={videoRef}
                    autoPlay
                    onClick={handleVideoClick}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => setIsBuffering(false)}
                    onCanPlay={() => setIsBuffering(false)}
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    className="video-player"
                    poster={video.thumbnailUrl}
                >
                    <source src={streamUrl} type="video/mp4" />
                    Your browser does not support HTML video.
                </video>

                {skipAction === 'backward' && (
                    <div className="skip-indicator skip-left">
                        <Rewind size={40} fill="currentColor" />
                        <span>-10s</span>
                    </div>
                )}
                {skipAction === 'forward' && (
                    <div className="skip-indicator skip-right">
                        <FastForward size={40} fill="currentColor" />
                        <span>+10s</span>
                    </div>
                )}

                {isBuffering && (
                    <div className="video-buffering-overlay">
                        <div className="video-spinner"></div>
                    </div>
                )}

                <div className={`video-controls-overlay ${showControls || !isPlaying ? 'active' : ''}`}>
                    <div className="progress-container" onClick={handleProgressScrub}>
                        <div className="progress-filled" style={{ width: `${progress}%` }}></div>
                    </div>

                    <div className="control-bar">
                        <div className="control-group">
                            <button className="control-btn" onClick={togglePlay} title={isPlaying ? "Pause" : "Play"}>
                                {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} />}
                            </button>

                            <div className="volume-container">
                                <button className="control-btn" onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
                                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    className="volume-slider"
                                    value={isMuted ? 0 : volume}
                                    onChange={handleVolumeChange}
                                    style={{ background: `linear-gradient(to right, var(--primary-color) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.3) ${(isMuted ? 0 : volume) * 100}%)` }}
                                />
                            </div>

                            <div className="time-display">
                                {currentTime} / {duration}
                            </div>
                        </div>

                        <div className="control-group">
                            <button className="control-btn" onClick={toggleFullScreen} title="Fullscreen">
                                {isFullScreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="video-details glass p-4">
                <h1 className="watch-title">{video.title}</h1>

                <div className="watch-meta flex-row ai-center jc-between w-100" style={{ marginTop: '8px' }}>
                    <div className="flex-row ai-center gap-3">
                        <div className={`rank-badge rank-${video.rank}`}>
                            {video.rank.toUpperCase()} TIER
                        </div>
                        <div className="meta-item flex-row ai-center gap-1">
                            <Clock size={16} />
                            <span>{new Date(video.uploadDate).toLocaleDateString()}</span>
                        </div>
                        <div className="meta-item flex-row ai-center gap-1">
                            <Eye size={16} />
                            <span>{viewsCount} views</span>
                        </div>
                    </div>

                    <div className="flex-row ai-center gap-2">
                        <button
                            className={`btn-action flex-row ai-center gap-2 ${likeData.isLiked ? 'active-like' : (animateUnlike ? 'removing-like' : '')}`}
                            onClick={handleLike}
                        >
                            <ThumbsUp size={18} fill={likeData.isLiked ? 'currentColor' : 'none'} />
                            <span>{likeData.likes}</span>
                        </button>
                        <button
                            className={`btn-action flex-row ai-center gap-2 ${likeData.isDisliked ? 'active-dislike' : (animateUndislike ? 'removing-dislike' : '')}`}
                            onClick={handleDislike}
                        >
                            <ThumbsDown size={18} fill={likeData.isDisliked ? 'currentColor' : 'none'} />
                            <span>{likeData.dislikes}</span>
                        </button>
                    </div>
                </div>

                <div className="divider"></div>

                <div className="watch-description">
                    <h3>Description</h3>
                    <p>{video.description || 'No description provided for this video.'}</p>
                </div>
            </div>
        </div>
    );
};

export default Watch;
