import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/skeletons/VideoCardSkeleton';
import { useLoadingState } from '../hooks/useLoadingState';
import {
    getPrefetchedHomePage,
    prefetchHomePage,
    prefetchPreviewBatch,
    primeHomePage,
    restoreScrollPosition,
    scheduleIdlePrefetch
} from '../utils/prefetchStore';
import './Home.css';

const LIMIT = 20;
const RANGE_DAYS = 30;
const FETCH_MORE_SKELETON_COUNT = 6;
const PREVIEW_WARMUP_LIMIT = 8;
const getSkeletonCount = () => (window.innerWidth <= 600 ? 6 : 12);

const Home = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const searchQuery = searchParams.get('search');
    const isDefaultFeed = !categoryFilter && !searchQuery;

    const [videos, setVideos] = useState([]);
    const { loading, startLoading, stopLoading } = useLoadingState(true);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [error, setError] = useState('');
    const [nextCursor, setNextCursor] = useState(null);
    const [hasMore, setHasMore] = useState(true);
    const [skeletonCount, setSkeletonCount] = useState(getSkeletonCount);

    const sentinelRef = useRef(null);
    const activeRequest = useRef(false);
    const restoredScroll = useRef(false);

    const fetchVideos = useCallback(async ({ cursor = null, reset = false } = {}) => {
        if (activeRequest.current) return;
        activeRequest.current = true;

        if (reset) {
            startLoading();
            setError('');
            setVideos([]);
            setNextCursor(null);
            setHasMore(true);
        } else {
            setIsFetchingMore(true);
        }

        try {
            let batch = [];
            let nc = null;
            let more = false;

            if (isDefaultFeed) {
                const params = { limit: LIMIT, rangeDays: RANGE_DAYS };
                if (cursor) params.cursor = cursor;

                const cached = getPrefetchedHomePage(params);
                const data = cached || (await axios.get('/home', { params })).data;
                if (!cached) {
                    primeHomePage(params, data);
                }

                batch = data.feed?.items || [];
                nc = data.feed?.nextCursor || null;
                more = data.feed?.hasMore ?? Boolean(nc);
            } else {
                const params = { limit: LIMIT };
                if (cursor) params.cursor = cursor;
                if (categoryFilter) params.category = categoryFilter;
                if (searchQuery) params.search = searchQuery;

                const res = await axios.get('/videos', { params });
                batch = res.data.videos || [];
                nc = res.data.nextCursor || null;
                more = res.data.hasMore ?? Boolean(nc);
            }

            setVideos((prev) => (reset ? batch : [...prev, ...batch]));
            setNextCursor(nc);
            setHasMore(more);
        } catch (err) {
            setError('Failed to load videos. Please try again later.');
        } finally {
            if (reset) stopLoading();
            else setIsFetchingMore(false);
            activeRequest.current = false;
        }
    }, [categoryFilter, isDefaultFeed, searchQuery, startLoading, stopLoading]);

    useEffect(() => {
        restoredScroll.current = false;
        fetchVideos({ reset: true });
    }, [fetchVideos]);

    useEffect(() => {
        const handleResize = () => setSkeletonCount(getSkeletonCount());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return undefined;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore && !isFetchingMore && !loading) {
                fetchVideos({ cursor: nextCursor });
            }
        }, { rootMargin: '200px' });

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [fetchVideos, hasMore, isFetchingMore, loading, nextCursor]);

    useEffect(() => {
        if (!isDefaultFeed || !nextCursor || loading || isFetchingMore) return undefined;

        return scheduleIdlePrefetch(() => {
            prefetchHomePage({ cursor: nextCursor, limit: LIMIT, rangeDays: RANGE_DAYS }).catch(() => {});
        }, 1000);
    }, [isDefaultFeed, nextCursor, loading, isFetchingMore]);

    useEffect(() => {
        if (loading || videos.length === 0) return undefined;

        return scheduleIdlePrefetch(() => {
            prefetchPreviewBatch(videos, user?.token || '', PREVIEW_WARMUP_LIMIT).catch(() => {});
        }, 700);
    }, [loading, videos, user?.token]);

    useEffect(() => {
        if (loading || restoredScroll.current || videos.length === 0) return;

        const restored = restoreScrollPosition(`${window.location.pathname}${window.location.search}`);
        restoredScroll.current = restored;
    }, [loading, videos.length]);

    let displayCategory = 'Recommended for You';
    if (searchQuery) displayCategory = `Search Results for "${searchQuery}"`;
    else if (categoryFilter) displayCategory = `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Tier Content`;

    return (
        <div className="home-container" aria-busy={loading || isFetchingMore}>
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
                {loading
                    ? Array.from({ length: skeletonCount }, (_, index) => (
                        <VideoCardSkeleton key={`home-skeleton-${index}`} />
                    ))
                    : videos.map((video, index) => (
                        <div
                            key={video._id}
                            className={searchQuery ? 'search-anim-item' : ''}
                            style={{ animationDelay: searchQuery ? `${index * 0.05}s` : '0s' }}
                        >
                            <VideoCard video={video} />
                        </div>
                    ))}

                {!loading && isFetchingMore && Array.from({ length: FETCH_MORE_SKELETON_COUNT }, (_, index) => (
                    <VideoCardSkeleton key={`home-fetch-skeleton-${index}`} />
                ))}
            </div>

            <div ref={sentinelRef} style={{ height: 1 }} />

            {!hasMore && videos.length > 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px', fontSize: '0.85rem' }}>
                    You've reached the end.
                </p>
            )}
        </div>
    );
};

export default Home;
