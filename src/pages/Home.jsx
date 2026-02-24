import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import Loader from '../components/Loader';
import './Home.css';

const Home = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const categoryFilter = searchParams.get('category');
    const searchQuery = searchParams.get('search');

    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVideos = async () => {
            try {
                const res = await axios.get('/videos');
                setVideos(res.data);
            } catch (err) {
                setError('Failed to load videos. Please try again later.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchVideos();
    }, []);

    if (loading) return <Loader fullScreen={false} />;

    const filteredVideos = videos.filter(video => {
        let matchesCategory = true;
        let matchesSearch = true;

        if (categoryFilter) {
            matchesCategory = video.rank === categoryFilter;
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            matchesSearch = video.title.toLowerCase().includes(query) ||
                (video.description && video.description.toLowerCase().includes(query));
        }

        return matchesCategory && matchesSearch;
    });

    let displayCategory = 'Recommended for You';
    if (searchQuery) {
        displayCategory = `Search Results for "${searchQuery}"`;
    } else if (categoryFilter) {
        displayCategory = `${categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)} Tier Content`;
    }

    return (
        <div className="home-container">
            <div className="home-header">
                <h2>{displayCategory}</h2>
                <div className="rank-info-badge">
                    Viewing as <span className="highlight uppercase">{user.rank}</span> rank
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            {!loading && filteredVideos.length === 0 && !error && (
                <div className="empty-state">
                    <h3>No videos found</h3>
                    <p>{searchQuery ? `No results match your search for "${searchQuery}".` : 'There are currently no videos available for this category.'}</p>
                </div>
            )}

            <div className="video-grid">
                {filteredVideos.map((video, index) => (
                    <div
                        key={video._id}
                        className={searchQuery ? 'search-anim-item' : ''}
                        style={{ animationDelay: searchQuery ? `${index * 0.05}s` : '0s' }}
                    >
                        <VideoCard video={video} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Home;
