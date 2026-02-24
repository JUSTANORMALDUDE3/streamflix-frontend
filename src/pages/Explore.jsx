import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import './Home.css'; // Re-use Home grid styling

const Explore = () => {
    const { user } = useAuth();
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAndShuffleVideos = async () => {
            try {
                const res = await axios.get('/videos');
                // Fisher-Yates Shuffle Algorithm for true randomness
                let shuffledArray = [...res.data];
                for (let i = shuffledArray.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
                }
                setVideos(shuffledArray);
            } catch (err) {
                setError('Failed to load videos. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAndShuffleVideos();
    }, []);

    if (loading) return <Loader fullScreen={false} />;

    return (
        <div className="home-container">
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
                {videos.map((video, index) => (
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
