import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/skeletons/VideoCardSkeleton';
import { useLoadingState } from '../hooks/useLoadingState';
import { Trash2 } from 'lucide-react';
import './Home.css';

const INITIAL_SKELETON_COUNT = () => (window.innerWidth <= 600 ? 6 : 12);
const FETCH_MORE_SKELETON_COUNT = 6;

const History = () => {
    const { user } = useAuth();
    const [history, setHistory] = useState([]);
    const { loading, startLoading, stopLoading } = useLoadingState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState('');
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [skeletonCount, setSkeletonCount] = useState(INITIAL_SKELETON_COUNT);

    const sentinelRef = useRef(null);
    const activeRequest = useRef(false);

    const fetchHistory = useCallback(async ({ cursor = null, reset = false } = {}) => {
        if (activeRequest.current) return;
        activeRequest.current = true;

        if (reset) {
            startLoading();
            setError('');
            setHistory([]);
            setNextCursor(null);
            setHasMore(true);
        } else {
            setIsFetchingMore(true);
        }

        try {
            const params = { limit: 20 };
            if (cursor) params.cursor = cursor;

            const res = await axios.get('/history', { params });
            const { history: batch, nextCursor: nc, hasMore: more } = res.data.data;

            setHistory(prev => (reset ? batch : [...prev, ...batch]));
            setNextCursor(nc);
            setHasMore(more);
        } catch (err) {
            setError('Failed to load watch history.');
        } finally {
            if (reset) stopLoading();
            else setIsFetchingMore(false);
            activeRequest.current = false;
        }
    }, [startLoading, stopLoading]);

    useEffect(() => {
        if (user) {
            fetchHistory({ reset: true });
        }
    }, [user, fetchHistory]);

    useEffect(() => {
        const handleResize = () => setSkeletonCount(INITIAL_SKELETON_COUNT());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore && !isFetchingMore && !loading) {
                fetchHistory({ cursor: nextCursor });
            }
        }, { rootMargin: '200px' });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [fetchHistory, hasMore, isFetchingMore, loading, nextCursor]);

    const handleClearHistory = async () => {
        if (window.confirm('Are you sure you want to clear your entire watch history?')) {
            try {
                await axios.delete('/history/clear');
                setHistory([]);
                setHasMore(false);
            } catch (err) {
                alert('Failed to clear history');
            }
        }
    };

    const handleDeleteItem = async (historyId) => {
        try {
            await axios.delete(`/history/${historyId}`);
            setHistory(prev => prev.filter(h => h._id !== historyId));
        } catch (err) {
            alert('Failed to delete item');
        }
    };

    return (
        <div className="home-container" aria-busy={loading || isFetchingMore}>
            <div className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Watch History</h2>
                {!loading && history.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}
                    >
                        <Trash2 size={16} /> Clear All
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            {!loading && history.length === 0 && !error && (
                <div className="empty-state">
                    <h3>No history found</h3>
                    <p>You haven't watched any videos recently.</p>
                </div>
            )}

            <div className="video-grid">
                {loading
                    ? Array.from({ length: skeletonCount }, (_, index) => (
                        <VideoCardSkeleton key={`history-skeleton-${index}`} />
                    ))
                    : history.map((record, index) => {
                        const video = record.videoId;
                        if (!video) return null;

                        return (
                            <div
                                key={record._id}
                                className="search-anim-item"
                                style={{ animationDelay: `${index * 0.05}s`, position: 'relative' }}
                            >
                                <VideoCard video={video} />
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleDeleteItem(record._id);
                                    }}
                                    style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', padding: '6px', cursor: 'pointer', zIndex: 10, backdropFilter: 'blur(4px)' }}
                                    title="Remove from history"
                                >
                                    <Trash2 size={14} />
                                </button>
                                <div style={{ position: 'absolute', top: '8px', left: '8px', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px', zIndex: 10, backdropFilter: 'blur(4px)' }}>
                                    {new Date(record.watchedAt).toLocaleDateString()}
                                </div>
                            </div>
                        );
                    })}

                {!loading && isFetchingMore && Array.from({ length: FETCH_MORE_SKELETON_COUNT }, (_, index) => (
                    <VideoCardSkeleton key={`history-fetch-skeleton-${index}`} />
                ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1 }} />

            {!hasMore && history.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.85rem' }}>
                    You've reached the end of your history.
                </p>
            )}
        </div>
    );
};

export default History;
