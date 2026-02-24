import React from 'react';
import { NavLink, Link, useSearchParams } from 'react-router-dom';
import { Home, Compass, PlaySquare, Clock, ThumbsUp, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const currentCategory = searchParams.get('category');

    if (!user) return null;

    return (
        <aside className="sidebar">
            <div className="sidebar-menu">
                <Link to="/" className={`menu-item ${!currentCategory ? 'active' : ''}`}>
                    <Home size={22} />
                    <span>Home</span>
                </Link>
                <NavLink to="/explore" className="menu-item disabled">
                    <Compass size={22} />
                    <span>Explore</span>
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
