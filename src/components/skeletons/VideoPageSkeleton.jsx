import React, { memo } from 'react';
import './skeleton.css';

const VideoPageSkeleton = () => (
    <div className="video-page-skeleton skeleton-fade" aria-hidden="true">
        <div className="player-skeleton shimmer"></div>
        <div className="video-page-meta">
            <div className="video-page-line title shimmer"></div>
            <div className="video-page-channel-row">
                <div className="video-page-avatar shimmer"></div>
                <div className="video-page-channel-copy">
                    <div className="video-page-line channel shimmer"></div>
                    <div className="video-page-line channel-meta shimmer"></div>
                </div>
            </div>
            <div className="video-page-actions-row">
                <div className="video-page-chip shimmer"></div>
                <div className="video-page-chip shimmer"></div>
                <div className="video-page-chip shimmer"></div>
            </div>
            <div className="video-page-line description shimmer"></div>
            <div className="video-page-line description shimmer"></div>
            <div className="video-page-line description short shimmer"></div>
        </div>
    </div>
);

export default memo(VideoPageSkeleton);
