import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Plus, ListVideo, Trash2 } from 'lucide-react';
import PlaylistCardSkeleton from '../components/skeletons/PlaylistCardSkeleton';
import { useLoadingState } from '../hooks/useLoadingState';
import './Home.css';

const getSkeletonCount = () => (window.innerWidth <= 600 ? 6 : 8);

const Playlists = () => {
    const navigate = useNavigate();
    const [playlists, setPlaylists] = useState([]);
    const { loading, startLoading, stopLoading } = useLoadingState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [skeletonCount, setSkeletonCount] = useState(getSkeletonCount);

    useEffect(() => {
        const fetchPlaylists = async () => {
            startLoading();
            try {
                const res = await axios.get('/playlists');
                setPlaylists(res.data.data);
            } catch (err) {
                console.error('Error fetching playlists', err);
            } finally {
                stopLoading();
            }
        };

        fetchPlaylists();
    }, [startLoading, stopLoading]);

    useEffect(() => {
        const handleResize = () => setSkeletonCount(getSkeletonCount());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newPlaylistName.trim()) return;

        try {
            const res = await axios.post('/playlists', { name: newPlaylistName });
            setPlaylists([res.data.data, ...playlists]);
            setNewPlaylistName('');
            setIsCreating(false);
        } catch (err) {
            alert('Failed to create playlist');
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Delete this playlist permanently?')) {
            try {
                await axios.delete(`/playlists/${id}`);
                setPlaylists(playlists.filter(p => p._id !== id));
            } catch (err) {
                alert('Failed to delete playlist');
            }
        }
    };

    return (
        <div className="home-container" aria-busy={loading}>
            <div className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>My Playlists</h2>
                <button
                    className="btn-primary"
                    onClick={() => setIsCreating(!isCreating)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> New Playlist
                </button>
            </div>

            {isCreating && (
                <form onSubmit={handleCreate} className="glass" style={{ padding: '1.5rem', marginBottom: '2rem', borderRadius: '12px' }}>
                    <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Create New Playlist</h3>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            placeholder="Playlist Name"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                            autoFocus
                        />
                        <button type="submit" className="btn-primary" disabled={!newPlaylistName.trim()}>Create</button>
                        <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '10px 14px', background: 'transparent', color: 'var(--text-muted)', border: 'none', cursor: 'pointer' }}>Cancel</button>
                    </div>
                </form>
            )}

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {Array.from({ length: skeletonCount }, (_, index) => (
                        <PlaylistCardSkeleton key={`playlist-skeleton-${index}`} />
                    ))}
                </div>
            ) : playlists.length === 0 ? (
                <div className="empty-state">
                    <h3>No playlists yet</h3>
                    <p>Create a playlist to organize your favorite videos.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {playlists.map((playlist) => (
                        <div
                            key={playlist._id}
                            className="glass"
                            onClick={() => navigate(`/playlists/${playlist._id}`)}
                            style={{ padding: '1.5rem', borderRadius: '12px', cursor: 'pointer', transition: 'transform 0.2s', position: 'relative' }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '8px', color: 'var(--primary-color)' }}>
                                    <ListVideo size={24} />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <h3 style={{ fontSize: '1.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{playlist.name}</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{playlist.videos.length} videos</p>
                                </div>
                            </div>

                            <button
                                onClick={(e) => handleDelete(e, playlist._id)}
                                style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Playlists;
