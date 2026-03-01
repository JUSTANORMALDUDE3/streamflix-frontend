import React from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Users, HardDrive, Video, Key, ScanSearch, Activity, BarChart2 } from 'lucide-react';
import './Admin.css';

const AdminDashboard = () => {
    return (
        <div className="admin-container">
            <h1 className="admin-title">Admin Dashboard</h1>
            <p className="admin-subtitle text-muted">Manage users, upload content, and configure drive access.</p>

            <div className="admin-grid mt-4">
                <Link to="/admin/upload" className="admin-card glass">
                    <div className="admin-icon-wrapper blue">
                        <UploadCloud size={32} />
                    </div>
                    <h3>Upload Video</h3>
                    <p>Upload new content to Google Drive securely.</p>
                </Link>

                <Link to="/admin/users" className="admin-card glass">
                    <div className="admin-icon-wrapper green">
                        <Users size={32} />
                    </div>
                    <h3>Manage Users</h3>
                    <p>Create accounts and assign viewing ranks.</p>
                </Link>

                <Link to="/admin/videos" className="admin-card glass">
                    <div className="admin-icon-wrapper" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                        <Video size={32} />
                    </div>
                    <h3>Manage Videos</h3>
                    <p>Browse content library and permanently delete videos.</p>
                </Link>

                <Link to="/admin/tokens" className="admin-card glass">
                    <div className="admin-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <Key size={32} />
                    </div>
                    <h3>Manage Tokens</h3>
                    <p>Generate, monitor, and revoke single-use secure downloads.</p>
                </Link>

                <Link to="/admin/drive-scanner" className="admin-card glass">
                    <div className="admin-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                        <ScanSearch size={32} />
                    </div>
                    <h3>Drive Scanner</h3>
                    <p>Detect unregistered Drive videos and add them to the platform.</p>
                </Link>

                <Link to="/admin/health" className="admin-card glass">
                    <div className="admin-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#34d399' }}>
                        <Activity size={32} />
                    </div>
                    <h3>System Health</h3>
                    <p>View platform stats, missing thumbnails, and metadata issues.</p>
                </Link>

                <Link to="/admin/analytics" className="admin-card glass">
                    <div className="admin-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.08)', color: '#a78bfa' }}>
                        <BarChart2 size={32} />
                    </div>
                    <h3>Analytics</h3>
                    <p>Daily views, top videos, and watch time over 30 days.</p>
                </Link>

                {/* This link directs to the backend API endpoint for Drive Auth directly because it's OAuth */}
                <a href={`${import.meta.env.VITE_API_URL}/admin/auth/drive`} className="admin-card glass" target="_blank" rel="noreferrer">
                    <div className="admin-icon-wrapper orange">
                        <HardDrive size={32} />
                    </div>
                    <h3>Primary Drive Auth</h3>
                    <p>Generate Google Drive refresh token for main account.</p>
                </a>

                <a href={`${import.meta.env.VITE_API_URL}/admin/auth/drive?accountType=fallback`} className="admin-card glass" target="_blank" rel="noreferrer">
                    <div className="admin-icon-wrapper orange">
                        <HardDrive size={32} />
                    </div>
                    <h3>Fallback Drive Auth</h3>
                    <p>Generate Google Drive refresh token for secondary account.</p>
                </a>
            </div>
        </div>
    );
};

export default AdminDashboard;
