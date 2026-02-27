import React, { useRef, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './VideoCard.css';

// Hook: returns true when the ref enters the viewport
const useInView = (ref, rootMargin = '200px') => {
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) { setInView(true); obs.disconnect(); }
        }, { rootMargin });
        obs.observe(el);
        return () => obs.disconnect();
    }, [ref, rootMargin]);
    return inView;
};

const VideoCard = ({ video }) => {
    const { user } = useAuth();
    const imgRef = useRef(null);
    const inView = useInView(imgRef);
    const [loaded, setLoaded] = useState(false);

    // Calculate if video is locked for this user
    const rankMapper = { 'top': 3, 'middle': 2, 'free': 1 };
    const userRankVal = user && user.role === 'admin' ? 99 : (user ? rankMapper[user.rank] || 0 : 0);
    const videoRankVal = rankMapper[video.rank] || 3;
    const isLocked = userRankVal < videoRankVal;

    const getRankTheme = (rank) => {
        switch (rank) {
            case 'top': return 'var(--rank-top-bg)';
            case 'middle': return 'var(--rank-middle-bg)';
            case 'free': return 'var(--rank-free-bg)';
            default: return 'var(--border-color)';
        }
    };

    return (
        <Link to={`/watch/${video._id}`} className="video-card">
            <div className="video-thumbnail-wrapper" ref={imgRef}>
                {/* Skeleton placeholder while not in view or loading */}
                {(!inView || !loaded) && (
                    <div className="video-thumb-skeleton" style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.04)', borderRadius: '8px 8px 0 0' }} />
                )}
                {inView && (
                    <img
                        src={video.thumbnailUrl || 'https://via.placeholder.com/640x360.png?text=No+Thumbnail'}
                        alt={video.title}
                        className={`video-thumbnail ${isLocked ? 'locked-thumb' : ''}`}
                        onLoad={() => setLoaded(true)}
                        style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                    />
                )}
                {isLocked ? (
                    <div className="locked-overlay">
                        <Lock size={32} fill="currentColor" />
                    </div>
                ) : (
                    <div className="play-overlay">
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
                            {new Date(video.uploadDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
            </div>
            {/* Dynamic bottom border indicating rank */}
            <div className="card-indicator" style={{ background: getRankTheme(video.rank) }}></div>
        </Link>
    );
};

export default VideoCard;
