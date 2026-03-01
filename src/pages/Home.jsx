import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import './Home.css';

const LIMIT = 20;

const Home = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const searchQuery = searchParams.get('search');

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState('');
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);

    const sentinelRef = useRef(null);
    const activeRequest = useRef(false);  // prevent duplicate fetches

    const fetchVideos = useCallback(async ({ cursor = null, reset = false } = {}) => {
        if (activeRequest.current) return;
        activeRequest.current = true;

        if (reset) { setLoading(true); setVideos([]); setNextCursor(null); setHasMore(true); }
        else setLoadingMore(true);

        try {
            const params = { limit: LIMIT };
            if (cursor) params.cursor = cursor;
            if (categoryFilter) params.category = categoryFilter;
            if (searchQuery) params.search = searchQuery;

            const res = await axios.get('/videos', { params });
            const { videos: batch, nextCursor: nc, hasMore: more } = res.data;

            setVideos(prev => reset ? batch : [...prev, ...batch]);
            setNextCursor(nc);
            setHasMore(more);
        } catch (err) {
            setError('Failed to load videos. Please try again later.');
        } finally {
            setLoading(false);
            setLoadingMore(false);
            activeRequest.current = false;
        }
    }, [categoryFilter, searchQuery]);

    // Refetch when filters change
    useEffect(() => { fetchVideos({ reset: true }); }, [fetchVideos]);


    // IntersectionObserver to trigger next page
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore && !loadingMore && !loading) {
                fetchVideos({ cursor: nextCursor });
            }
        }, { rootMargin: '200px' });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, nextCursor, fetchVideos]);

    if (loading) return <Loader fullScreen={false} />;

    let displayCategory = 'Recommended for You';
    if (searchQuery) displayCategory = `Search Results for "${searchQuery}"`;
    else if (categoryFilter) displayCategory = `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Tier Content`;

    return (
        <div className="home-container">
            <div className="home-header">
                <h2>{displayCategory}</h2>
                <div className="rank-info-badge">
                    Viewing as <span className="highlight uppercase">{user.rank}</span> rank
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {!loading && videos.length === 0 && !error && (
                <div className="empty-state">
                    <h3>No videos found</h3>
                    <p>{searchQuery ? `No results match your search for "${searchQuery}".` : 'There are currently no videos available for this category.'}</p>
                </div>
            )}


            <div className="video-grid">
                {videos.map((video, index) => (
                    <div
                        key={video._id}
                        className={searchQuery ? 'search-anim-item' : ''}
                        style={{ animationDelay: searchQuery ? `${index * 0.05}s` : '0s' }}
                    >
                        <VideoCard video={video} />
                    </div>
                ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {loadingMore && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                </div>
            )}

            {!hasMore && videos.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.85rem' }}>
                    You've reached the end ✓
                </p>
            )}
        </div>
    );
};

export default Home;
