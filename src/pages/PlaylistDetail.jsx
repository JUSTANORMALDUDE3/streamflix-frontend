import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import Loader from '../components/Loader';
import VideoCard from '../components/VideoCard';
import { Play, GripVertical, Trash2, ArrowLeft } from 'lucide-react';

const PlaylistDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [playlist, setPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Drag and Drop state
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    useEffect(() => {
        const fetchPlaylist = async () => {
            try {
                const res = await axios.get(`/playlists/${id}`);
                setPlaylist(res.data.data);
            } catch (err) {
                setError('Playlist not found or you lack permission.');
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylist();
    }, [id]);

    const handleRemoveVideo = async (videoId) => {
        try {
            await axios.delete(`/playlists/${id}/remove/${videoId}`);
            setPlaylist({
                ...playlist,
                videos: playlist.videos.filter(v => v._id !== videoId)
            });
        } catch (err) {
            alert('Failed to remove video');
        }
    };

    // Native HTML5 Drag and Drop Handlers
    const onDragStart = (index) => {
        setDraggedItemIndex(index);
    };

    const onDragOver = (e, index) => {
        e.preventDefault(); // Necessary to allow dropping
    };

    const onDrop = async (e, droppedOnIndex) => {
        e.preventDefault();
        if (draggedItemIndex === null || draggedItemIndex === droppedOnIndex) return;

        const newVideos = [...playlist.videos];
        const draggedItem = newVideos[draggedItemIndex];

        // Remove item from original position
        newVideos.splice(draggedItemIndex, 1);
        // Insert at new position
        newVideos.splice(droppedOnIndex, 0, draggedItem);

        setPlaylist({ ...playlist, videos: newVideos });
        setDraggedItemIndex(null);

        // Sync with backend
        try {
            await axios.put(`/playlists/${id}/reorder`, {
                videoIds: newVideos.map(v => v._id)
            });
        } catch (err) {
            console.error('Failed to sync reorder', err);
            // Optionally revert array if it fails securely
        }
    };

    if (loading) return <Loader fullScreen={false} />;
    if (error || !playlist) return <div className="home-container"><div className="error-message">{error}</div></div>;

    return (
        <div className="home-container">
            <button
                onClick={() => navigate('/playlists')}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '1.5rem', padding: 0 }}
            >
                <ArrowLeft size={18} /> Back to Playlists
            </button>

            <div className="home-header" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem' }}>{playlist.name}</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                    {playlist.videos.length} videos • Created {new Date(playlist.createdAt).toLocaleDateString()}
                </p>
                {playlist.videos.length > 0 && (
                    <button
                        className="btn-primary mt-4"
                        onClick={() => navigate(`/watch/${playlist.videos[0]._id}?playlist=${playlist._id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px' }}
                    >
                        <Play size={18} fill="currentColor" /> Play All
                    </button>
                )}
            </div>

            {playlist.videos.length === 0 ? (
                <div className="empty-state">
                    <h3>Playlist is empty</h3>
                    <p>Go to Explore or Home to find videos to add here.</p>
                </div>
            ) : (
                <div className="video-grid">
                    {playlist.videos.map((video, index) => (
                        <div
                            key={video._id}
                            draggable
                            onDragStart={() => onDragStart(index)}
                            onDragOver={(e) => onDragOver(e, index)}
                            onDrop={(e) => onDrop(e, index)}
                            style={{
                                position: 'relative',
                                cursor: 'grab',
                                opacity: draggedItemIndex === index ? 0.5 : 1,
                                transition: 'opacity 0.2s',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Drag Handle Overlay */}
                            <div
                                className="drag-handle"
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    left: '8px',
                                    zIndex: 10,
                                    background: 'rgba(0,0,0,0.6)',
                                    borderRadius: '4px',
                                    padding: '4px',
                                    color: 'white',
                                    cursor: 'grab'
                                }}
                            >
                                <GripVertical size={16} />
                            </div>

                            {/* Remove Video Button Overlay */}
                            <button
                                onClick={() => handleRemoveVideo(video._id)}
                                style={{
                                    position: 'absolute',
                                    top: '8px',
                                    right: '8px',
                                    zIndex: 10,
                                    background: 'rgba(239, 68, 68, 0.8)',
                                    border: 'none',
                                    borderRadius: '4px',
                                    padding: '6px',
                                    color: 'white',
                                    cursor: 'pointer'
                                }}
                                title="Remove from playlist"
                                className="hover-danger"
                            >
                                <Trash2 size={16} />
                            </button>

                            <VideoCard video={{ ...video, playlistContextId: playlist._id }} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PlaylistDetail;
