import React, { memo } from 'react';
import './skeleton.css';

const PlaylistCardSkeleton = () => (
    <div className="playlist-card-skeleton skeleton-fade" aria-hidden="true">
        <div className="playlist-row-skeleton">
            <div className="playlist-icon-skeleton shimmer"></div>
            <div className="playlist-text-group">
                <div className="playlist-title-skeleton shimmer"></div>
                <div className="playlist-meta-skeleton shimmer"></div>
            </div>
        </div>
        <div className="playlist-title-skeleton shimmer" style={{ width: '48%' }}></div>
    </div>
);

export default memo(PlaylistCardSkeleton);
