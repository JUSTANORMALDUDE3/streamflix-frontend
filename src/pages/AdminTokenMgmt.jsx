import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Trash2, Plus, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import './Admin.css';

const AdminTokenMgmt = () => {
    const [tokens, setTokens] = useState([]);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // Form State
    const [selectedVideo, setSelectedVideo] = useState('');
    const [usageCount, setUsageCount] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [tokensRes, videosRes] = await Promise.all([
                axios.get('/admin/tokens'),
                axios.get('/admin/videos')
            ]);
            setTokens(tokensRes.data);

            // Format videos for the CustomSelect component
            const videoOptions = videosRes.data.map(v => ({
                value: v._id,
                label: v.title
            }));
            // Add default empty option
            videoOptions.unshift({ value: '', label: 'Select a video...' });

            setVideos(videoOptions);
        } catch (err) {
            console.error(err);
            setError('Failed to load Token Data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!selectedVideo) {
            setError('Please select a video first.');
            return;
        }

        setGenerating(true);
        setError('');

        try {
            const res = await axios.post('/admin/tokens', {
                videoId: selectedVideo,
                remainingUses: parseInt(usageCount, 10)
            });

            // The newly generated token from backend doesn't have populated video fields immediately
            // We'll refetch all to ensure data consistency in the table
            await fetchData();
            setUsageCount(1);
            setSelectedVideo('');
        } catch (err) {
            console.error(err);
            setError('Failed to generate token');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (tokenId) => {
        if (!window.confirm('Are you sure you want to delete this token permanently?')) return;

        try {
            await axios.delete(`/admin/tokens/${tokenId}`);
            setTokens(tokens.filter(t => t._id !== tokenId));
        } catch (err) {
            console.error(err);
            setError('Failed to delete token');
        }
    };

    return (
        <div className="admin-container animate-fade-in">
            <div className="flex-row ai-center gap-2 mb-4">
                <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                <div style={{ flex: 1 }}>
                    <h1 className="admin-title" style={{ marginBottom: 0 }}>Secure Tokens</h1>
                </div>
            </div>

            <p className="admin-subtitle text-muted mb-4">Generate and manage single-use access codes for protected video downloads.</p>

            {error && (
                <div className="error-banner mb-4" style={{ padding: '12px', fontSize: '0.9rem' }}>
                    <AlertCircle size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {error}
                </div>
            )}

            {/* Token Generation Form Card */}
            <div className="admin-card glass mb-4" style={{ padding: '24px', position: 'relative', zIndex: 10 }}>
                <h3 className="flex-row ai-center gap-2 mb-3" style={{ color: '#10b981' }}>
                    <Plus size={20} /> Generate New Token
                </h3>

                <form onSubmit={handleGenerate} className="flex-row gap-3" style={{ flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: '1 1 300px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Target Video</label>
                        <CustomSelect
                            options={videos}
                            value={selectedVideo}
                            onChange={(e) => setSelectedVideo(e.target.value)}
                        />
                    </div>

                    <div style={{ flex: '0 0 120px' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Allowed Uses</label>
                        <input
                            type="number"
                            min="1"
                            max="500"
                            className="input-field"
                            value={usageCount}
                            onChange={(e) => setUsageCount(e.target.value)}
                            style={{ height: '48px' }}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={generating || loading || !selectedVideo} style={{ height: '48px', padding: '0 24px' }}>
                        {generating ? '...' : <><Key size={18} /> Generate Token</>}
                    </button>
                </form>
            </div>

            {/* Active Tokens Master Table */}
            <div className="admin-card glass" style={{ padding: '24px' }}>
                <h3 className="mb-4"><Key size={20} className="inline-icon" /> Active Generation Tokens ({tokens.length})</h3>

                {loading ? (
                    <div className="spinner"></div>
                ) : tokens.length === 0 ? (
                    <div className="text-muted text-center py-4">No active download tokens currently exist.</div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                    <th style={{ padding: '12px 8px' }}>Secure Token Key</th>
                                    <th style={{ padding: '12px 8px' }}>Linked Video</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>Uses Left</th>
                                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokens.map(token => (
                                    <tr key={token._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '12px 8px', fontFamily: 'monospace', letterSpacing: '1px', color: '#60a5fa', fontWeight: 600 }}>
                                            {token.token}
                                        </td>
                                        <td style={{ padding: '12px 8px', color: 'var(--text-main)' }}>
                                            {token.videoId ? token.videoId.title : <span className="text-muted">Video Deleted</span>}
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                                            <span className="rank-badge rank-top" style={{ padding: '4px 10px' }}>
                                                {token.remainingUses}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleDelete(token._id)}
                                                style={{ background: 'transparent', color: '#ef4444', padding: '6px', cursor: 'pointer', borderRadius: '4px' }}
                                                title="Revoke Token"
                                                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTokenMgmt;
