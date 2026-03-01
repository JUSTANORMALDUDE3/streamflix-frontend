import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Trash2, Video, Edit2, Check, X, CheckSquare, Square, ChevronDown, Tag, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import ConfirmModal from '../components/ConfirmModal';
import CustomSelect from '../components/CustomSelect';
import './Admin.css';

const rankOptions = [
    { value: 'free', label: 'Free' },
    { value: 'middle', label: 'Middle' },
    { value: 'top', label: 'Top' },
];

const STATUS_COLORS = { published: '#10b981', scheduled: '#f59e0b', draft: '#6b7280' };

const AdminVideoMgmt = () => {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Single delete
    const [videoToDelete, setVideoToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Inline edit
    const [editingVideoId, setEditingVideoId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', rank: '' });

    // Bulk selection
    const [selected, setSelected] = useState(new Set());
    const [bulkAction, setBulkAction] = useState('');
    const [bulkRank, setBulkRank] = useState('free');
    const [bulkTagsInput, setBulkTagsInput] = useState('');
    const [bulkWorking, setBulkWorking] = useState(false);
    const [bulkMsg, setBulkMsg] = useState('');

    const fetchVideos = async () => {
        try {
            const res = await axios.get('/admin/videos');
            setVideos(res.data);
        } catch (err) {
            setError('Failed to load videos');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchVideos(); }, []);

    // ── Selection helpers ──────────────────────────────────────────
    const allSelected = videos.length > 0 && selected.size === videos.length;
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(videos.map(v => v._id)));
    const toggleOne = (id) => {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    };

    // ── Bulk action ────────────────────────────────────────────────
    const runBulkAction = async () => {
        if (!bulkAction || selected.size === 0) return;
        setBulkWorking(true); setBulkMsg('');
        try {
            let data = {};
            if (bulkAction === 'changeRank') data = { rank: bulkRank };
            if (bulkAction === 'addTags') data = { tags: bulkTagsInput.split(',').map(t => t.trim()).filter(Boolean) };
            if (bulkAction === 'removeTags') data = { tags: bulkTagsInput.split(',').map(t => t.trim()).filter(Boolean) };

            const res = await axios.post('/admin/videos/bulk', {
                action: bulkAction,
                videoIds: [...selected],
                data
            });

            const count = res.data.deletedCount ?? res.data.modifiedCount ?? selected.size;
            setBulkMsg(`✅ ${count} videos updated.`);
            setSelected(new Set());
            setBulkAction('');
            fetchVideos();
        } catch (err) {
            setBulkMsg(`❌ ${err.response?.data?.message || 'Bulk action failed.'}`);
        } finally {
            setBulkWorking(false);
        }
    };

    // ── Single delete ──────────────────────────────────────────────
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

    const handleEditClick = (video) => { setEditingVideoId(video._id); setEditForm({ title: video.title, rank: video.rank }); };
    const handleCancelEdit = () => setEditingVideoId(null);
    const handleSaveEdit = async () => {
        try {
            await axios.put(`/admin/videos/${editingVideoId}`, editForm);
            fetchVideos(); setEditingVideoId(null);
        } catch (err) { alert(err.response?.data?.message || 'Error updating video'); }
    };

    return (
        <div className="admin-container">
            <div className="flex-row ai-center gap-2 mb-4">
                <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Video Management</h1>
            </div>

            {error && <div className="error-message" style={{ margin: '16px 0' }}>{error}</div>}

            {/* ── Bulk Actions Bar ────────────────────────────────── */}
            {selected.size > 0 && (
                <div className="admin-card glass" style={{ margin: '0 0 16px', padding: '12px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontWeight: 600, color: '#6366f1' }}>{selected.size} selected</span>

                    <select className="input-field" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                        value={bulkAction} onChange={e => { setBulkAction(e.target.value); setBulkMsg(''); }}>
                        <option value="">Choose action…</option>
                        <option value="delete">Delete</option>
                        <option value="changeRank">Change Rank</option>
                        <option value="addTags">Add Tags</option>
                        <option value="removeTags">Remove Tags</option>
                    </select>

                    {bulkAction === 'changeRank' && (
                        <select className="input-field" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }}
                            value={bulkRank} onChange={e => setBulkRank(e.target.value)}>
                            {rankOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    )}
                    {(bulkAction === 'addTags' || bulkAction === 'removeTags') && (
                        <input className="input-field" style={{ width: '180px', padding: '6px 10px', fontSize: '0.85rem' }}
                            value={bulkTagsInput} onChange={e => setBulkTagsInput(e.target.value)}
                            placeholder="tag1, tag2, tag3" />
                    )}

                    <button className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        onClick={runBulkAction} disabled={bulkWorking || !bulkAction}>
                        {bulkWorking ? <div className="spinner" style={{ width: 14, height: 14 }} /> : 'Apply'}
                    </button>
                    <button onClick={() => setSelected(new Set())} style={{ background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem' }}>
                        Clear
                    </button>
                    {bulkMsg && <span style={{ fontSize: '0.82rem' }}>{bulkMsg}</span>}
                </div>
            )}

            <div className="admin-card glass" style={{ padding: '24px' }}>
                {/* Select-all header */}
                <div className="flex-row ai-center gap-3" style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                    <button onClick={toggleAll} style={{ background: 'transparent', cursor: 'pointer', color: allSelected ? '#6366f1' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', border: 'none', padding: 0 }}>
                        {allSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                        {allSelected ? 'Deselect All' : 'Select All'}
                    </button>
                    <h3 style={{ margin: 0 }}><Video size={18} className="inline-icon" /> Videos ({videos.length})</h3>
                </div>

                <div className="user-list flex-column gap-2">
                    {loading ? <div className="spinner" /> : videos.map(video => {
                        const isChecked = selected.has(video._id);
                        const statusColor = STATUS_COLORS[video.status] || '#6b7280';
                        return (
                            <div key={video._id} className="user-list-item admin-list-item flex-row ai-center jc-between"
                                style={{ padding: '12px', background: isChecked ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${isChecked ? 'rgba(99,102,241,0.4)' : 'var(--border-color)'}`, transition: 'all 0.2s' }}>

                                <div className="flex-row gap-3 ai-center" style={{ flex: 1, minWidth: 0 }}>
                                    {/* Checkbox */}
                                    <button onClick={() => toggleOne(video._id)} style={{ background: 'transparent', cursor: 'pointer', color: isChecked ? '#6366f1' : 'var(--text-muted)', flexShrink: 0, border: 'none', padding: '4px' }}>
                                        {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                                    </button>

                                    {/* Thumbnail */}
                                    <div style={{ width: '80px', height: '45px', borderRadius: '4px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                                        <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" referrerPolicy="no-referrer" />
                                    </div>

                                    {/* Info */}
                                    <div style={{ minWidth: 0 }}>
                                        {editingVideoId === video._id ? (
                                            <div className="flex-column gap-2" style={{ marginTop: '4px' }}>
                                                <input type="text" className="input-field" style={{ padding: '4px 8px', fontSize: '0.9rem', width: '250px', maxWidth: '100%' }}
                                                    value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                                                <div style={{ width: '120px' }}>
                                                    <CustomSelect options={rankOptions} value={editForm.rank} onChange={(e) => setEditForm({ ...editForm, rank: e.target.value })} />
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div style={{ fontWeight: 600, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{video.title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                                                    <span className={`rank-badge rank-${video.rank}`} style={{ padding: '2px 6px', fontSize: '0.65rem' }}>{video.rank.toUpperCase()}</span>
                                                    <span style={{ background: `${statusColor}20`, color: statusColor, padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 600 }}>
                                                        {(video.status || 'published').toUpperCase()}
                                                    </span>
                                                    {video.publishAt && <span>{new Date(video.publishAt).toLocaleDateString()}</span>}
                                                    {video.tags?.slice(0, 3).map(t => (
                                                        <span key={t} style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: '4px', fontSize: '0.65rem' }}>#{t}</span>
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex-row gap-2 admin-list-actions" style={{ flexShrink: 0 }}>
                                    {editingVideoId === video._id ? (
                                        <>
                                            <button onClick={handleSaveEdit} style={{ background: 'transparent', color: '#10b981', padding: '8px', cursor: 'pointer', border: 'none' }} title="Save"><Check size={18} /></button>
                                            <button onClick={handleCancelEdit} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '8px', cursor: 'pointer', border: 'none' }} title="Cancel"><X size={18} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => handleEditClick(video)} style={{ background: 'transparent', color: 'var(--primary-color)', padding: '8px', cursor: 'pointer', border: 'none' }} title="Edit"><Edit2 size={18} /></button>
                                            <button onClick={() => setVideoToDelete(video)} style={{ background: 'transparent', color: '#ef4444', padding: '8px', cursor: 'pointer', border: 'none' }} title="Delete"><Trash2 size={18} /></button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {!loading && videos.length === 0 && <div className="text-muted text-center py-4">No videos uploaded yet.</div>}
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
