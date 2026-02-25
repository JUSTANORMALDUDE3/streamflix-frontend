import React, { useState } from 'react';
import axios from 'axios';
import { Download, X, AlertCircle } from 'lucide-react';
import './TokenModal.css';

const TokenModal = ({ videoId, onClose }) => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleVerifyAndDownload = async (e) => {
        e.preventDefault();
        setError('');

        if (!token.trim()) {
            setError('Please enter a download token.');
            return;
        }

        setIsVerifying(true);

        try {
            const res = await axios.post('/download/verify', {
                token: token.trim(),
                videoId
            });

            if (res.data.downloadUrl) {
                setSuccess(true);
                // The backend proxy sends Content-Disposition: attachment, so this will trigger a native download and keep the user on the page
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                // Remove trailing slash from apiUrl if present to avoid double slashes
                const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
                window.location.href = `${cleanApiUrl}${res.data.downloadUrl}`;

                // Auto-close after 2 seconds
                setTimeout(() => {
                    onClose();
                }, 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Invalid or expired token.');
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content glass animate-fade-in" style={{ maxWidth: '400px' }}>
                <div className="modal-header flex-row ai-center jc-between mb-4">
                    <h3 className="flex-row ai-center gap-1" style={{ fontSize: '1.2rem', margin: 0 }}>
                        <Download size={20} className="primary-color" /> Download Video
                    </h3>
                    <button type="button" className="close-btn" onClick={onClose} disabled={isVerifying}>
                        <X size={20} />
                    </button>
                </div>

                {success ? (
                    <div className="success-state flex-column ai-center" style={{ padding: '20px', textAlign: 'center' }}>
                        <div style={{ color: '#10b981', marginBottom: '16px' }}>
                            <Download size={48} />
                        </div>
                        <h4 style={{ margin: '0 0 8px 0', color: '#10b981' }}>Token Verified!</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your secure download is starting...</p>
                    </div>
                ) : (
                    <form onSubmit={handleVerifyAndDownload} className="flex-column gap-3">
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0 }}>
                            This video is protected. Please enter your secure one-time download token below to proceed.
                        </p>

                        {error && (
                            <div className="error-banner flex-row ai-center gap-1" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
                                <AlertCircle size={16} />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="form-group">
                            <input
                                type="text"
                                className="input-field"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="e.g. AbC@19#xYz!PqR2"
                                autoComplete="off"
                                autoFocus
                            />
                        </div>

                        <div className="flex-row gap-2 mt-2">
                            <button type="button" className="btn-secondary" onClick={onClose} disabled={isVerifying} style={{ flex: 1 }}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-primary" disabled={isVerifying || !token.trim()} style={{ flex: 2 }}>
                                {isVerifying ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px' }}></div> : 'Verify & Download'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default TokenModal;
