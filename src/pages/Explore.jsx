import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import VideoCardSkeleton from '../components/skeletons/VideoCardSkeleton';
import { useLoadingState } from '../hooks/useLoadingState';
import './Home.css'; // Re-use Home grid styling

const getSkeletonCount = () => (window.innerWidth <= 600 ? 6 : 12);

const Explore = () => {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const { loading, startLoading, stopLoading } = useLoadingState(true);
    const [error, setError] = useState('');
    const [skeletonCount, setSkeletonCount] = useState(getSkeletonCount);

    useEffect(() => {
        const fetchAndShuffleVideos = async () => {
            startLoading();
            try {
                const res = await axios.get('/videos');
                // Since the videos route was converted to cursor-pagination, the array is in res.data.videos
                let shuffledArray = [...res.data.videos];
                for (let i = shuffledArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
                }
                setVideos(shuffledArray);
            } catch (err) {
                setError('Failed to load videos. Please try again later.');
                console.error(err);
            } finally {
                stopLoading();
            }
        };
        fetchAndShuffleVideos();
    }, [startLoading, stopLoading]);

    useEffect(() => {
        const handleResize = () => setSkeletonCount(getSkeletonCount());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="home-container" aria-busy={loading}>
            <div className="home-header">
                <h2>Discover Random Videos</h2>
                <div className="rank-info-badge">
                    Viewing as <span className="highlight uppercase">{user.rank}</span> rank
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {!loading && videos.length === 0 && !error && (
                <div className="empty-state">
                    <h3>No videos found</h3>
                    <p>There are currently no videos available for your rank.</p>
                </div>
            )}

            <div className="video-grid">
                {loading
                    ? Array.from({ length: skeletonCount }, (_, index) => (
                        <VideoCardSkeleton key={`explore-skeleton-${index}`} />
                    ))
                    : videos.map((video, index) => (
                        <div
                            key={video._id}
                            className="search-anim-item"
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            <VideoCard video={video} />
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Explore;
