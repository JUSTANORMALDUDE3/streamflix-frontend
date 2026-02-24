import React from 'react';
import { Link } from 'react-router-dom';
import { Play, Eye } from 'lucide-react';
import './VideoCard.css';

const VideoCard = ({ video }) => {
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
            <div className="video-thumbnail-wrapper">
                <img
                    src={video.thumbnailUrl || 'https://via.placeholder.com/640x360.png?text=No+Thumbnail'}
                    alt={video.title}
                    className="video-thumbnail"
                />
                <div className="play-overlay">
                    <Play fill="white" size={32} />
                </div>
            </div>
            <div className="video-info">
                <h3 className="video-title" title={video.title}>{video.title}</h3>
                <p className="video-desc">{video.description || 'No description available'}</p>
                <div className="video-meta flex-row ai-center jc-between mt-2" style={{ flexWrap: 'wrap', gap: '8px' }}>
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
