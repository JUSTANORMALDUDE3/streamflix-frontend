import React from 'react';
import { Link } from 'react-router-dom';
import { UploadCloud, Users, HardDrive, Video } from 'lucide-react';
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

                {/* This link directs to the backend API endpoint for Drive Auth directly because it's OAuth */}
                <a href="http://localhost:5000/api/admin/auth/drive" className="admin-card glass" target="_blank" rel="noreferrer">
                    <div className="admin-icon-wrapper orange">
                        <HardDrive size={32} />
                    </div>
                    <h3>Drive Authorization</h3>
                    <p>Generate Google Drive refresh tokens.</p>
                </a>
            </div>
        </div>
    );
};

export default AdminDashboard;
