import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, BarChart2, Eye, Clock, Users, TrendingUp, RefreshCw } from 'lucide-react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    BarElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import './Admin.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

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

const formatWatchTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
        x: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af', font: { size: 11 } } },
        y: { grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: '#9ca3af', font: { size: 11 } }, beginAtZero: true }
    }
};

const AnalyticsDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetch = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const res = await axios.get('/admin/analytics/overview');
            setData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load analytics.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetch(); }, [fetch]);

    const lineData = data ? {
        labels: data.dailyViews.map(d => d._id),
        datasets: [{
            label: 'Views',
            data: data.dailyViews.map(d => d.count),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99,102,241,0.15)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#6366f1'
        }]
    } : null;

    const barData = data ? {
        labels: data.topVideos.map(v => v.title?.slice(0, 20) + (v.title?.length > 20 ? '…' : '')),
        datasets: [{
            label: 'Views',
            data: data.topVideos.map(v => v.views),
            backgroundColor: 'rgba(99,102,241,0.7)',
            borderColor: '#6366f1',
            borderWidth: 1,
            borderRadius: 6
        }]
    } : null;

    return (
        <div className="admin-container">
            <div className="flex-row ai-center jc-between mb-4">
                <div className="flex-row ai-center gap-2">
                    <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                    <h1 className="admin-title" style={{ marginBottom: 0 }}>Analytics</h1>
                </div>
                <button className="btn-secondary flex-row ai-center gap-2" onClick={fetch} disabled={loading}>
                    <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Refresh
                </button>
            </div>
            <p className="text-muted" style={{ marginBottom: '24px' }}>Last 30 days</p>

            {error && <div className="error-message">{error}</div>}
            {loading && !data && (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                    <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
                    <p style={{ marginTop: '12px' }}>Loading analytics…</p>
                </div>
            )}

            {data && (
                <>
                    {/* ── Stats Cards ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                        <StatCard icon={Eye} label="Total Views" value={data.totalViews.toLocaleString()} color="#6366f1" />
                        <StatCard icon={Users} label="Active Users" value={data.activeUsers.toLocaleString()} color="#10b981" />
                        <StatCard icon={Clock} label="Total Watch Time" value={formatWatchTime(data.totalWatchTime)} color="#f59e0b" />
                        <StatCard icon={TrendingUp} label="Top Video Views" value={data.topVideos[0]?.views?.toLocaleString() || 0} sub={data.topVideos[0]?.title?.slice(0, 24)} color="#8b5cf6" />
                    </div>

                    {/* ── Line Chart: Daily Views ── */}
                    <div className="admin-card glass" style={{ margin: '0 0 24px', padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} style={{ color: '#6366f1' }} /> Daily Views (30d)
                        </h3>
                        {lineData && lineData.labels.length > 0
                            ? <Line data={lineData} options={chartOptions} height={80} />
                            : <p className="text-muted">No view data yet.</p>}
                    </div>

                    {/* ── Bar Chart: Top Videos ── */}
                    <div className="admin-card glass" style={{ margin: 0, padding: '20px' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <BarChart2 size={18} style={{ color: '#6366f1' }} /> Top 10 Videos
                        </h3>
                        {barData && barData.labels.length > 0 ? (
                            <>
                                <Bar data={barData} options={chartOptions} height={100} />
                                <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {data.topVideos.map((v, i) => (
                                        <div key={v.videoId} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                            <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#6366f1', flexShrink: 0 }}>
                                                {i + 1}
                                            </span>
                                            <img src={v.thumbnailUrl} alt="" style={{ width: 40, height: 28, objectFit: 'cover', borderRadius: '4px', background: '#111' }} onError={e => e.target.style.display = 'none'} referrerPolicy="no-referrer" />
                                            <span style={{ flex: 1, fontSize: '0.85rem' }}>{v.title}</span>
                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{v.views.toLocaleString()} views</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatWatchTime(v.totalWatchTime || 0)} watched</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : <p className="text-muted">No video data yet.</p>}
                    </div>
                </>
            )}

            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

export default AnalyticsDashboard;
