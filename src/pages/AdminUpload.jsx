import React, { useState } from 'react';
import axios from 'axios';
import { ArrowLeft, UploadCloud, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import './Admin.css';

const rankOptions = [
    { value: 'free', label: 'Free' },
    { value: 'middle', label: 'Middle' },
    { value: 'top', label: 'Top' }
];

const AdminUpload = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rank, setRank] = useState('free');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [generatedThumbnail, setGeneratedThumbnail] = useState(null); // Base64 or Blob

    const [isUploading, setIsUploading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const generateThumbnail = (file) => {
        return new Promise((resolve) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            video.src = URL.createObjectURL(file);
            video.muted = true; // Required for auto-loading in some browsers
            video.crossOrigin = "anonymous";

            video.onloadedmetadata = () => {
                // Seek to a random time in the video
                video.currentTime = Math.random() * video.duration;
            };

            video.onseeked = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataURL = canvas.toDataURL('image/jpeg', 0.8);
                resolve(dataURL);
            };

            video.onerror = () => {
                resolve(null); // Ensure we don't hang forever
            };
        });
    };

    const handleVideoChange = async (e) => {
        const file = e.target.files[0];
        setVideoFile(file);

        if (file) {
            setMessage('Generating thumbnail from video...');
            const dataUrl = await generateThumbnail(file);
            if (dataUrl) {
                setGeneratedThumbnail(dataUrl);
                setMessage('Thumbnail generated automatically!');
            } else {
                setMessage('');
            }
        }
    };

    const handleRegenerateThumbnail = async () => {
        if (!videoFile) return;
        setMessage('Regenerating new thumbnail...');
        const dataUrl = await generateThumbnail(videoFile);
        if (dataUrl) {
            setGeneratedThumbnail(dataUrl);
            setMessage('New thumbnail generated successfully!');
        } else {
            setMessage('');
            setError('Failed to regenerate thumbnail.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!videoFile) {
            setError('Please select a video file.');
            return;
        }

        setMessage('');
        setError('');
        setIsUploading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('rank', rank);

        // Use external URL if provided, otherwise send the generated base64
        if (thumbnailUrl) {
            formData.append('thumbnailUrl', thumbnailUrl);
        } else if (generatedThumbnail) {
            formData.append('generatedThumbnail', generatedThumbnail);
        }

        formData.append('video', videoFile);

        try {
            await axios.post('/admin/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setMessage(`Uploading... ${percentCompleted}%`);
                }
            });
            setMessage('Video uploaded successfully!');
            // Reset form
            setTitle('');
            setDescription('');
            setRank('free');
            setThumbnailUrl('');
            setVideoFile(null);
            setGeneratedThumbnail(null);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error uploading video');
            setMessage('');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="admin-container">
            <div className="flex-row ai-center gap-2 mb-4">
                <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Upload Video</h1>
            </div>

            <div className="admin-card glass" style={{ maxWidth: '600px', margin: '0' }}>
                {error && <div className="error-message">{error}</div>}
                {message && <div style={{ color: '#10b981', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', marginBottom: '24px' }}>{message}</div>}

                <form onSubmit={handleSubmit} className="flex-column gap-3">
                    <div className="form-group">
                        <label>Video Title *</label>
                        <input
                            type="text"
                            className="input-field"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea
                            className="input-field"
                            rows="4"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="flex-row gap-3">
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Minimum Rank Required *</label>
                            <CustomSelect
                                options={rankOptions}
                                value={rank}
                                onChange={e => setRank(e.target.value)}
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label>Optional Override Thumbnail URL</label>
                            <input
                                type="url"
                                className="input-field"
                                value={thumbnailUrl}
                                onChange={e => setThumbnailUrl(e.target.value)}
                                placeholder="Leaves blank to generate from video"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Video File (MP4) *</label>
                        <div className="file-upload-wrapper">
                            <input
                                type="file"
                                accept="video/*"
                                onChange={handleVideoChange}
                                required
                                className="file-input"
                            />
                        </div>
                        {generatedThumbnail && !thumbnailUrl && (
                            <>
                                <div className="mt-4" style={{ borderRadius: '12px', overflow: 'hidden', height: '140px', width: '250px', border: '1px solid var(--border-color)', position: 'relative' }}>
                                    <img src={generatedThumbnail} alt="Generated Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div className="desktop-thumbnail-overlay" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                        onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                        <button type="button" onClick={handleRegenerateThumbnail} style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <RefreshCw size={16} /> Regenerate
                                        </button>
                                    </div>
                                    <div style={{ textAlign: 'center', fontSize: '12px', background: 'var(--surface-color)', padding: '4px', position: 'absolute', bottom: 0, width: '100%' }}>Auto-Generated Thumbnail Preview</div>
                                </div>
                                <button type="button" className="btn-primary mobile-thumbnail-btn" onClick={handleRegenerateThumbnail}>
                                    <RefreshCw size={16} style={{ marginRight: '8px' }} /> Regenerate
                                </button>
                            </>
                        )}
                    </div>

                    <button type="submit" className="btn-primary mt-4" disabled={isUploading}>
                        {isUploading ? <div className="spinner"></div> : <><UploadCloud size={20} /> Upload to Drive</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminUpload;
