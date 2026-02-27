import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
    ArrowLeft, Activity, Video, Key, AlertTriangle, Clock,
    CheckCircle, XCircle, RefreshCw, Database
} from 'lucide-react';
import './Admin.css';

const StatCard = ({ icon: Icon, label, value, color = '#6366f1', sub }) => (
    <div className="admin-card glass" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: 48, height: 48, borderRadius: '12px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={22} style={{ color }} />
        </div>
        <div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, lineHeight: 1 }}>{value ?? '—'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
            {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{sub}</div>}
        </div>
    </div>
);

const IssueRow = ({ label, count, severity = 'warning' }) => {
    const color = severity === 'error' ? '#ef4444' : '#f59e0b';
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '0.9rem' }}>{label}</span>
            <span style={{ background: `${color}20`, color, padding: '2px 10px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600 }}>
                {count}
            </span>
        </div>
    );
};

const AdminHealthDashboard = () => {
    const [health, setHealth] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetch = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/admin/system/health');
            setHealth(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load health report.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    return (
        <div className="admin-container">
            <div className="flex-row ai-center jc-between mb-4">
                <div className="flex-row ai-center gap-2">
                    <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                    <h1 className="admin-title" style={{ marginBottom: 0 }}>System Health</h1>
                </div>
                <button className="btn-secondary flex-row ai-center gap-2" onClick={fetch} disabled={loading}>
                    <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
                    Refresh
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {loading && !health && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '12px' }}>Running health checks…</p>
                </div>
            )}

            {health && (
                <>
                    <p className="text-muted" style={{ marginBottom: '24px', fontSize: '0.82rem' }}>
                        Generated at {new Date(health.generatedAt).toLocaleString()}
                    </p>

                    {/* ── Video Totals ── */}
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                        Videos
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <StatCard icon={Database} label="Total Videos" value={health.totals.videos.total} color="#6366f1" />
                        <StatCard icon={CheckCircle} label="Published" value={health.totals.videos.published} color="#10b981" />
                        <StatCard icon={Clock} label="Scheduled" value={health.totals.videos.scheduled} color="#f59e0b" />
                        <StatCard icon={XCircle} label="Drafts" value={health.totals.videos.draft} color="#6b7280" />
                    </div>

                    {/* ── Token Totals ── */}
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                        Download Tokens
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <StatCard icon={Key} label="Total Tokens" value={health.totals.tokens.total} color="#8b5cf6" />
                        <StatCard icon={CheckCircle} label="Active Tokens" value={health.totals.tokens.active} color="#10b981" />
                        <StatCard icon={XCircle} label="Expired Tokens" value={health.totals.tokens.expired} color="#ef4444" />
                    </div>

                    {/* ── Issues ── */}
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                        Detected Issues
                    </h2>
                    <div className="admin-card glass" style={{ margin: 0 }}>
                        {health.issues.missingThumbnails === 0 && health.issues.invalidMetadata === 0 && health.issues.overdueScheduled === 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981', padding: '8px 0' }}>
                                <CheckCircle size={20} /> All checks passed — no issues detected.
                            </div>
                        ) : (
                            <>
                                {health.issues.missingThumbnails > 0 &&
                                    <IssueRow label="Videos missing thumbnails" count={health.issues.missingThumbnails} severity="warning" />}
                                {health.issues.invalidMetadata > 0 &&
                                    <IssueRow label="Videos with invalid metadata (missing title or rank)" count={health.issues.invalidMetadata} severity="error" />}
                                {health.issues.overdueScheduled > 0 &&
                                    <IssueRow label="Videos scheduled in the past (awaiting publish)" count={health.issues.overdueScheduled} severity="warning" />}

                                {health.issues.invalidVideosSample?.length > 0 && (
                                    <div style={{ marginTop: '16px' }}>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px' }}>Sample invalid videos:</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {health.issues.invalidVideosSample.map(v => (
                                                <div key={v._id} style={{ background: 'rgba(239,68,68,0.08)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.82rem' }}>
                                                    {v.title || <em style={{ color: 'var(--text-muted)' }}>No title</em>} — rank: {v.rank || 'missing'} — status: {v.status}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AdminHealthDashboard;
