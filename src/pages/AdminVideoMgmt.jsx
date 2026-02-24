import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2, Video, Edit2, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';
import './Admin.css';

const AdminVideoMgmt = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [videoToDelete, setVideoToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [editingVideoId, setEditingVideoId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', rank: '' });

    const fetchVideos = async () => {
        try {
            const res = await axios.get('/admin/videos');
            setVideos(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleDeleteVideo = async () => {
        if (!videoToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/admin/videos/${videoToDelete._id}`);
            fetchVideos();
            setVideoToDelete(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting video');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleEditClick = (video) => {
        setEditingVideoId(video._id);
        setEditForm({ title: video.title, rank: video.rank });
    };

    const handleCancelEdit = () => {
        setEditingVideoId(null);
    };

    const handleSaveEdit = async () => {
        try {
            await axios.put(`/admin/videos/${editingVideoId}`, editForm);
            fetchVideos();
            setEditingVideoId(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error updating video');
        }
    };

    return (
        <div className="admin-container">
            <div className="flex-row ai-center gap-2 mb-4">
                <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Video Management</h1>
            </div>

            {error && <div className="error-message" style={{ margin: '16px 0' }}>{error}</div>}

            <div className="admin-card glass" style={{ padding: '24px' }}>
                <h3><Video size={20} className="inline-icon" /> Uploaded Videos ({videos.length})</h3>
                <div className="user-list mt-4 flex-column gap-2">
                    {loading ? <div className="spinner"></div> : videos.map(video => (
                        <div key={video._id} className="user-list-item admin-list-item flex-row ai-center jc-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            <div className="flex-row gap-3 ai-center">
                                <div style={{ width: '80px', height: '45px', borderRadius: '4px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                                    <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div>
                                    {editingVideoId === video._id ? (
                                        <div className="flex-column gap-2" style={{ marginTop: '4px' }}>
                                            <input
                                                type="text"
                                                className="input-field"
                                                style={{ padding: '4px 8px', fontSize: '0.9rem', width: '250px', maxWidth: '100%' }}
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            />
                                            <div style={{ width: '120px' }}>
                                                <CustomSelect
                                                    options={[
                                                        { value: 'free', label: 'Free' },
                                                        { value: 'middle', label: 'Middle' },
                                                        { value: 'top', label: 'Top' }
                                                    ]}
                                                    value={editForm.rank}
                                                    onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div style={{ fontWeight: 600, color: 'var(--text-main)', wordBreak: 'break-word', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{video.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                                <span className={`rank-badge rank-${video.rank}`} style={{ padding: '2px 6px', fontSize: '0.65rem', marginRight: '8px' }}>{video.rank.toUpperCase()}</span>
                                                {new Date(video.uploadDate).toLocaleDateString()}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex-row gap-2 admin-list-actions">
                                {editingVideoId === video._id ? (
                                    <>
                                        <button onClick={handleSaveEdit} style={{ background: 'transparent', color: '#10b981', padding: '8px', cursor: 'pointer' }} title="Save">
                                            <Check size={18} />
                                        </button>
                                        <button onClick={handleCancelEdit} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '8px', cursor: 'pointer' }} title="Cancel">
                                            <X size={18} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => handleEditClick(video)} style={{ background: 'transparent', color: 'var(--primary-color)', padding: '8px', cursor: 'pointer' }} title="Edit Metadata">
                                            <Edit2 size={18} />
                                        </button>
                                        <button onClick={() => setVideoToDelete(video)} style={{ background: 'transparent', color: '#ef4444', padding: '8px', cursor: 'pointer' }} title="Delete Video">
                                            <Trash2 size={18} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    {!loading && videos.length === 0 && (
                        <div className="text-muted text-center py-4">No videos uploaded yet.</div>
                    )}
                </div>
            </div>

            <ConfirmModal
                isOpen={!!videoToDelete}
                onClose={() => setVideoToDelete(null)}
                onConfirm={handleDeleteVideo}
                title="Delete Video"
                message={`Are you sure you want to completely erase "${videoToDelete?.title}"? This will permanently delete the file off Google Drive.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default AdminVideoMgmt;
