import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, UserPlus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import ConfirmModal from '../components/ConfirmModal';
import './Admin.css';

const rankOptions = [
    { value: 'free', label: 'Free' },
    { value: 'middle', label: 'Middle' },
    { value: 'top', label: 'Top' }
];

const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'admin', label: 'Admin' }
];

const AdminUserMgmt = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [rank, setRank] = useState('free');
    const [role, setRole] = useState('user');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Modal State
    const [userToDelete, setUserToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddUser = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            await axios.post('/admin/users', { username, password, rank, role });
            setMessage('User created successfully');
            setUsername('');
            setPassword('');
            fetchUsers(); // Refresh list
        } catch (err) {
            setError(err.response?.data?.message || 'Error creating user');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            await axios.delete(`/admin/users/${userToDelete._id}`);
            fetchUsers();
            setUserToDelete(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error deleting user');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="admin-container">
            <div className="flex-row ai-center gap-2 mb-4">
                <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>User Management</h1>
            </div>

            <div className="admin-grid" style={{ alignItems: 'start' }}>
                {/* Create User Form */}
                <div className="admin-card glass flex-column" style={{ padding: '24px' }}>
                    <h3><UserPlus size={20} className="inline-icon" /> Add New User</h3>
                    {error && <div className="error-message" style={{ margin: '16px 0' }}>{error}</div>}
                    {message && <div style={{ color: '#10b981', margin: '16px 0' }}>{message}</div>}

                    <form onSubmit={handleAddUser} className="flex-column gap-3 mt-4">
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" className="input-field" value={username} onChange={e => setUsername(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" className="input-field" value={password} onChange={e => setPassword(e.target.value)} required />
                        </div>
                        <div className="flex-row gap-2">
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Rank</label>
                                <CustomSelect
                                    options={rankOptions}
                                    value={rank}
                                    onChange={e => setRank(e.target.value)}
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Role</label>
                                <CustomSelect
                                    options={roleOptions}
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary mt-2">Create User</button>
                    </form>
                </div>

                {/* Users List */}
                <div className="admin-card glass" style={{ padding: '24px' }}>
                    <h3>Registered Users ({users.length})</h3>
                    <div className="user-list mt-4 flex-column gap-2">
                        {loading ? <div className="spinner"></div> : users.map(u => (
                            <div key={u._id} className="user-list-item flex-row ai-center jc-between" style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.username}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                        <span className={`rank-badge rank-${u.rank}`} style={{ padding: '2px 6px', fontSize: '0.65rem', marginRight: '8px' }}>{u.rank.toUpperCase()}</span>
                                        Role: {u.role}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setUserToDelete(u)}
                                    style={{ background: 'transparent', color: '#ef4444', padding: '8px', cursor: 'pointer' }}
                                    title="Delete User"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteUser}
                title="Delete User"
                message={`Are you sure you want to permanently delete user "${userToDelete?.username}"? This action cannot be undone.`}
                isLoading={isDeleting}
            />
        </div>
    );
};

export default AdminUserMgmt;
