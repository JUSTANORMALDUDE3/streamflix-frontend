import React, { useRef } from 'react';
import { NavLink, Link, useSearchParams } from 'react-router-dom';
import { Home, Compass, PlaySquare, Clock, ThumbsUp, Layers, ListVideo } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, closeMenu }) => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const currentCategory = searchParams.get('category');

    if (!user) return null;

    // Swipe to close logic
    let touchStartX = 0;
    const handleTouchStart = (e) => touchStartX = e.changedTouches[0].clientX;
    const handleTouchEnd = (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        if (touchStartX - touchEndX > 50) closeMenu(); // Swiped left by 50px
    };

    return (
        <aside
            className={`sidebar ${isOpen ? 'is-open' : ''}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div className="sidebar-menu">
                <NavLink to="/" end className={({ isActive }) => `menu-item ${isActive && !currentCategory ? 'active' : ''}`}>
                    <Home size={22} />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/explore" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                    <Compass size={22} />
                    <span>Explore</span>
                </NavLink>

                <div className="divider"></div>
                <div className="menu-section">LIBRARY</div>

                <NavLink to="/playlists" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                    <ListVideo size={22} />
                    <span>Playlists</span>
                </NavLink>
                <NavLink to="/history" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                    <Clock size={22} />
                    <span>History</span>
                </NavLink>

                <div className="divider"></div>
                {/* Only show ranks user has access to */}
                <div className="menu-section">CATEGORIES</div>
                <Link to="/?category=free" className={`menu-item ${currentCategory === 'free' ? 'active' : ''}`}>
                    <div className="rank-dot dot-free"></div>
                    <span>Free Content</span>
                </Link>
                {(user.rank === 'middle' || user.rank === 'top') && (
                    <Link to="/?category=middle" className={`menu-item ${currentCategory === 'middle' ? 'active' : ''}`}>
                        <div className="rank-dot dot-middle"></div>
                        <span>Middle Tier</span>
                    </Link>
                )}
                {user.rank === 'top' && (
                    <Link to="/?category=top" className={`menu-item ${currentCategory === 'top' ? 'active' : ''}`}>
                        <div className="rank-dot dot-top"></div>
                        <span>Top Tier Premium</span>
                    </Link>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;
