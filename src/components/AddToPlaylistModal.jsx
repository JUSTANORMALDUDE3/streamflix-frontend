import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Check } from 'lucide-react';
import './ConfirmModal.css'; // Re-use modal styles

const AddToPlaylistModal = ({ isOpen, onClose, videoId }) => {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;
        const fetchPlaylists = async () => {
            try {
                const res = await axios.get('/playlists');
                setPlaylists(res.data.data);
            } catch (err) {
                console.error('Failed to load playlists', err);
            } finally {
                setLoading(false);
            }
        };
        fetchPlaylists();
    }, [isOpen]);

    const handleTogglePlaylist = async (playlist) => {
        const inPlaylist = playlist.videos.includes(videoId);
        try {
            if (inPlaylist) {
                await axios.delete(`/playlists/${playlist._id}/remove/${videoId}`);
                setPlaylists(playlists.map(p =>
                    p._id === playlist._id ? { ...p, videos: p.videos.filter(id => id !== videoId) } : p
                ));
            } else {
                await axios.post(`/playlists/${playlist._id}/add`, { videoId });
                setPlaylists(playlists.map(p =>
                    p._id === playlist._id ? { ...p, videos: [...p.videos, videoId] } : p
                ));
            }
        } catch (err) {
            alert('Failed to update playlist');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%' }}>
                <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0 }}>Save to Playlist</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
                ) : playlists.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1rem 0' }}>
                        No playlists found. Go to the Playlists tab to create one.
                    </div>
                ) : (
                    <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {playlists.map(playlist => {
                            const isAdded = playlist.videos.includes(videoId);
                            return (
                                <button
                                    key={playlist._id}
                                    onClick={() => handleTogglePlaylist(playlist)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '12px',
                                        background: isAdded ? 'rgba(99, 102, 241, 0.1)' : 'rgba(0,0,0,0.2)',
                                        border: `1px solid ${isAdded ? 'var(--primary-color)' : 'transparent'}`,
                                        borderRadius: '8px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span>{playlist.name}</span>
                                    {isAdded && <Check size={18} color="var(--primary-color)" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddToPlaylistModal;
