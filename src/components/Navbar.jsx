import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme, availableThemes } from '../context/ThemeContext';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, PlaySquare, Settings, Shield, Palette } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [showThemeMenu, setShowThemeMenu] = useState(false);
    const themeMenuRef = useRef(null);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [isFocused, setIsFocused] = useState(false);

    const calculateWidth = () => {
        if (!searchQuery) return isFocused ? 350 : 250;
        // Approximate 9px per character + 60px padding
        const textWidth = searchQuery.length * 9 + 60;
        const baseWidth = isFocused ? 350 : 250;
        return Math.min(Math.max(textWidth, baseWidth), 600);
    };

    const inputWidth = window.innerWidth > 768 ? calculateWidth() : undefined;

    useEffect(() => {
        setSearchQuery(searchParams.get('search') || '');
    }, [searchParams]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
        } else {
            navigate('/');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
                setShowThemeMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <nav className="navbar glass">
            <div className="navbar-left">
                <Link to="/" className="logo-container">
                    <PlaySquare className="brand-icon" size={32} />
                    <span className="brand-text">StreamFlix</span>
                </Link>
            </div>

            <div className="navbar-center">
                <form className="search-bar" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Search videos..."
                        className="input-field"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        style={inputWidth ? { width: `${inputWidth}px` } : {}}
                    />
                </form>
            </div>

            <div className="navbar-right">
                <div className={`rank-badge rank-${user.rank}`}>
                    {user.rank.toUpperCase()}
                </div>

                <div className="theme-menu-container" ref={themeMenuRef}>
                    <button onClick={() => setShowThemeMenu(!showThemeMenu)} className="theme-toggle" title="Select Theme">
                        <Palette size={20} />
                    </button>

                    {showThemeMenu && (
                        <div className="theme-dropdown glass animate-fade-in">
                            {availableThemes.map(t => (
                                <button
                                    key={t.id}
                                    className={`theme-option ${theme === t.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setTheme(t.id);
                                        setShowThemeMenu(false);
                                    }}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {user.role === 'admin' && (
                    <Link to="/admin" className="admin-btn" title="Admin Dashboard">
                        <Shield size={20} />
                    </Link>
                )}

                <button onClick={handleLogout} className="logout-btn" title="Logout">
                    <LogOut size={20} />
                </button>
            </div>
        </nav>
    );
};

export default Navbar;
