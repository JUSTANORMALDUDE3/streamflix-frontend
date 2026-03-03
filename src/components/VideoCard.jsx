import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import useReducedMotion from '../hooks/useReducedMotion';
import { prefetchVideoDetail, prioritizePreviewStream, saveScrollPosition } from '../utils/prefetchStore';
import './VideoCard.css';

const PREVIEW_DELAY_MS = 140;
const PREVIEW_LONG_SECONDS = 30;
const PREVIEW_SHORT_SECONDS = 10;
const PREVIEW_BATCH_SECONDS = 10;
const PREVIEW_START_BUFFER_SECONDS = 0.35;
const PREVIEW_END_BUFFER_SECONDS = 0.25;
const PREVIEW_STOP_EVENT = 'streamflix:stop-preview';
let activePreviewCardId = null;

const useInView = (ref, rootMargin = '200px') => {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const isTouchViewport = window.matchMedia('(hover: none), (pointer: coarse)').matches;
        if (!('IntersectionObserver' in window) || isTouchViewport) {
            setInView(true);
            return;
        }

        const el = ref.current;
        if (!el) return;

        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                obs.disconnect();
            }
        }, { rootMargin });

        obs.observe(el);
        return () => obs.disconnect();
    }, [ref, rootMargin]);

    return inView;
};

const buildPreviewWindow = (duration) => {
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    if (!safeDuration) {
        return {
            startTime: 0,
            endTime: PREVIEW_SHORT_SECONDS,
            previewDuration: PREVIEW_SHORT_SECONDS,
            nextBatchBoundary: PREVIEW_SHORT_SECONDS,
        };
    }

    const cappedPreviewDuration = safeDuration >= PREVIEW_LONG_SECONDS
        ? PREVIEW_LONG_SECONDS
        : Math.min(PREVIEW_SHORT_SECONDS, safeDuration);

    const usableDuration = Math.max(safeDuration - PREVIEW_END_BUFFER_SECONDS, 0);
    const maxStartTime = Math.max(usableDuration - cappedPreviewDuration, 0);
    const startTime = maxStartTime > 0
        ? Math.random() * maxStartTime
        : 0;
    const endTime = Math.min(usableDuration, startTime + cappedPreviewDuration);

    return {
        startTime,
        endTime,
        previewDuration: Math.max(endTime - startTime, Math.min(cappedPreviewDuration, safeDuration)),
        nextBatchBoundary: Math.min(endTime, startTime + PREVIEW_BATCH_SECONDS),
    };
};

const VideoCard = ({ video }) => {
    const { user } = useAuth();
    const mediaToken = user?.token ? encodeURIComponent(user.token) : '';
    const prefersReducedMotion = useReducedMotion();
    const imgRef = useRef(null);
    const previewVideoRef = useRef(null);
    const previewDelayRef = useRef(null);
    const previewStopRef = useRef(null);
    const previewStartAttemptedRef = useRef(false);
    const previewWindowRef = useRef({
        startTime: 0,
        endTime: PREVIEW_SHORT_SECONDS,
        previewDuration: PREVIEW_SHORT_SECONDS,
        nextBatchBoundary: PREVIEW_SHORT_SECONDS,
    });
    const inView = useInView(imgRef);
    const [loaded, setLoaded] = useState(false);
    const [supportsHoverPreview, setSupportsHoverPreview] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
    const [previewFailed, setPreviewFailed] = useState(false);

    useEffect(() => {
        setLoaded(false);
        setShowPreview(false);
        setIsPreviewPlaying(false);
        setPreviewFailed(false);
        previewStartAttemptedRef.current = false;
        previewWindowRef.current = {
            startTime: 0,
            endTime: PREVIEW_SHORT_SECONDS,
            previewDuration: PREVIEW_SHORT_SECONDS,
            nextBatchBoundary: PREVIEW_SHORT_SECONDS,
        };
    }, [video._id, video.thumbnailUrl]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const updateSupport = () => setSupportsHoverPreview(mediaQuery.matches);
        updateSupport();
        mediaQuery.addEventListener('change', updateSupport);
        return () => mediaQuery.removeEventListener('change', updateSupport);
    }, []);

    const rankMapper = { top: 3, middle: 2, free: 1 };
    const userRankVal = user && user.role === 'admin' ? 99 : (user ? rankMapper[user.rank] || 0 : 0);
    const videoRankVal = rankMapper[video.rank] || 3;
    const isLocked = userRankVal < videoRankVal;
    const canPreview = supportsHoverPreview && inView && !prefersReducedMotion && !isLocked;
    const previewUrl = `${import.meta.env.VITE_API_URL}/videos/stream/${video._id}${mediaToken ? `?token=${mediaToken}` : ''}`;

    const clearPreviewTimers = useCallback(() => {
        if (previewDelayRef.current) {
            window.clearTimeout(previewDelayRef.current);
            previewDelayRef.current = null;
        }
        if (previewStopRef.current) {
            window.clearTimeout(previewStopRef.current);
            previewStopRef.current = null;
        }
    }, []);

    const resetPreviewElement = useCallback(() => {
        const node = previewVideoRef.current;
        if (!node) return;

        node.pause();
        node.removeAttribute('src');
        node.load();
        previewStartAttemptedRef.current = false;
    }, []);

    const stopPreview = useCallback(() => {
        clearPreviewTimers();
        setShowPreview(false);
        setIsPreviewPlaying(false);
        resetPreviewElement();
        if (activePreviewCardId === video._id) {
            activePreviewCardId = null;
        }
    }, [clearPreviewTimers, resetPreviewElement, video._id]);

    useEffect(() => {
        const handleStopEvent = (event) => {
            if (event.detail?.cardId !== video._id) {
                stopPreview();
            }
        };

        window.addEventListener(PREVIEW_STOP_EVENT, handleStopEvent);
        return () => window.removeEventListener(PREVIEW_STOP_EVENT, handleStopEvent);
    }, [stopPreview, video._id]);

    useEffect(() => {
        if (!canPreview || !inView) {
            stopPreview();
        }
    }, [canPreview, inView, stopPreview]);

    useEffect(() => () => stopPreview(), [stopPreview]);

    const getRankTheme = (rank) => {
        switch (rank) {
            case 'top': return 'var(--rank-top-bg)';
            case 'middle': return 'var(--rank-middle-bg)';
            case 'free': return 'var(--rank-free-bg)';
            default: return 'var(--border-color)';
        }
    };

    const handlePrefetch = useCallback(() => {
        if (!isLocked) {
            prefetchVideoDetail(video._id).catch(() => {});
        }
    }, [isLocked, video._id]);

    const startPreview = useCallback(() => {
        if (!canPreview || previewFailed) return;

        if (activePreviewCardId && activePreviewCardId !== video._id) {
            window.dispatchEvent(new CustomEvent(PREVIEW_STOP_EVENT, {
                detail: { cardId: activePreviewCardId }
            }));
        }

        activePreviewCardId = video._id;
        previewStartAttemptedRef.current = false;
        setPreviewFailed(false);
        setIsPreviewPlaying(false);
        setShowPreview(true);
    }, [canPreview, previewFailed, video._id]);

    const handleMouseEnter = () => {
        handlePrefetch();
        if (!canPreview) return;

        prioritizePreviewStream(video._id, user?.token || '').catch(() => {});
        clearPreviewTimers();
        previewDelayRef.current = window.setTimeout(startPreview, PREVIEW_DELAY_MS);
    };

    const handleMouseLeave = () => {
        stopPreview();
    };

    const beginPlayback = useCallback(() => {
        const node = previewVideoRef.current;
        if (!node || previewStartAttemptedRef.current) return;

        previewStartAttemptedRef.current = true;
        node.play().catch(() => {
            setPreviewFailed(true);
            stopPreview();
        });
    }, [stopPreview]);

    const handlePreviewLoadedMetadata = () => {
        const node = previewVideoRef.current;
        if (!node) return;

        const previewWindow = buildPreviewWindow(node.duration);
        previewWindowRef.current = previewWindow;

        const targetStartTime = Math.min(
            previewWindow.startTime,
            Math.max((node.duration || 0) - PREVIEW_START_BUFFER_SECONDS, 0)
        );

        if (targetStartTime > PREVIEW_START_BUFFER_SECONDS) {
            const handleSeeked = () => beginPlayback();
            node.addEventListener('seeked', handleSeeked, { once: true });
            node.currentTime = targetStartTime;
            return;
        }

        beginPlayback();
    };

    const handlePreviewCanPlay = () => {
        beginPlayback();
    };

    const handlePreviewPlay = () => {
        setIsPreviewPlaying(true);
        if (previewStopRef.current) {
            window.clearTimeout(previewStopRef.current);
        }

        const timeoutMs = Math.max((previewWindowRef.current.previewDuration + 2) * 1000, 12000);
        previewStopRef.current = window.setTimeout(stopPreview, timeoutMs);
    };

    const handlePreviewTimeUpdate = () => {
        const node = previewVideoRef.current;
        if (!node) return;

        const previewWindow = previewWindowRef.current;
        const stopAt = Math.max(previewWindow.endTime - PREVIEW_END_BUFFER_SECONDS, previewWindow.startTime);

        if (node.currentTime >= stopAt) {
            stopPreview();
            return;
        }

        if (node.currentTime >= previewWindow.nextBatchBoundary - PREVIEW_END_BUFFER_SECONDS) {
            previewWindowRef.current = {
                ...previewWindow,
                nextBatchBoundary: Math.min(previewWindow.endTime, previewWindow.nextBatchBoundary + PREVIEW_BATCH_SECONDS),
            };
        }
    };

    const handlePreviewError = () => {
        setPreviewFailed(true);
        setIsPreviewPlaying(false);
        stopPreview();
    };

    const handleNavigationStart = () => {
        saveScrollPosition(`${window.location.pathname}${window.location.search}`);
    };

    return (
        <Link
            to={`/watch/${video._id}`}
            className="video-card"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handlePrefetch}
            onTouchStart={handlePrefetch}
            onClick={handleNavigationStart}
        >
            <div className="video-thumbnail-wrapper" ref={imgRef}>
                {(!inView || !loaded) && (
                    <div className="video-thumb-skeleton" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', borderRadius: '8px 8px 0 0' }} />
                )}
                {inView && (
                    <img
                        src={video.thumbnailUrl || 'https://via.placeholder.com/640x360.png?text=No+Thumbnail'}
                        alt={video.title}
                        className={`video-thumbnail thumbnail ${loaded ? 'loaded' : ''} ${isLocked ? 'locked-thumb' : ''} ${isPreviewPlaying ? 'thumbnail-hidden' : ''}`}
                        loading="lazy"
                        onLoad={(e) => {
                            e.target.classList.add('loaded');
                            setLoaded(true);
                        }}
                        onError={(e) => {
                            e.target.classList.add('loaded');
                            setLoaded(true);
                        }}
                        referrerPolicy="no-referrer"
                    />
                )}
                {showPreview && !previewFailed && (
                    <video
                        ref={previewVideoRef}
                        className={`video-preview ${isPreviewPlaying ? 'active' : ''}`}
                        src={previewUrl}
                        muted
                        playsInline
                        preload="auto"
                        onLoadedMetadata={handlePreviewLoadedMetadata}
                        onCanPlay={handlePreviewCanPlay}
                        onPlay={handlePreviewPlay}
                        onTimeUpdate={handlePreviewTimeUpdate}
                        onEnded={stopPreview}
                        onError={handlePreviewError}
                    />
                )}
                {isLocked ? (
                    <div className="locked-overlay">
                        <Lock size={32} fill="currentColor" />
                    </div>
                ) : (
                    <div className={`play-overlay ${isPreviewPlaying ? 'hidden' : ''}`}>
                        <Play fill="white" size={32} />
                    </div>
                )}
            </div>
            <div className="video-info">
                <h3 className="video-title" title={video.title}>{video.title}</h3>
                <div className="video-meta flex-row ai-center jc-between mt-2" style={{ flexWrap: 'wrap', gap: '8px', marginTop: 'auto' }}>
                    <span className={`rank-tag rank-${video.rank}`}>
                        {video.rank.toUpperCase()}
                    </span>
                    <div className="flex-row ai-center gap-2">
                        <span className="flex-row ai-center text-muted" style={{ fontSize: '0.75rem', gap: '4px' }}>
                            <Eye size={12} /> {video.views || 0}
                        </span>
                        <span className="upload-date" style={{ fontSize: '0.75rem' }}>
                            {new Date(video.createdAt || video.uploadDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
            <div className="card-indicator" style={{ background: getRankTheme(video.rank) }}></div>
        </Link>
    );
};

export default memo(VideoCard);
