import React, { memo } from 'react';
import './skeleton.css';

const VideoCardSkeleton = () => (
    <div className="video-card-skeleton skeleton-fade" aria-hidden="true">
        <div className="thumb-skeleton shimmer"></div>
        <div className="video-card-skeleton-content">
            <div className="text-skeleton title shimmer"></div>
            <div className="video-card-skeleton-meta">
                <div className="text-skeleton rank shimmer"></div>
                <div className="text-skeleton meta shimmer"></div>
            </div>
        </div>
        <div className="video-card-skeleton-indicator shimmer"></div>
    </div>
);

export default memo(VideoCardSkeleton);
