import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, ScanSearch, HardDrive, RefreshCcw,
    CheckCircle2, AlertCircle, FileVideo, Save, RefreshCw
} from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import './Admin.css';
import './AdminDriveScanner.css';

const rankOptions = [
    { value: 'free', label: 'Free' },
    { value: 'middle', label: 'Middle' },
    { value: 'top', label: 'Top' },
];

const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Generate a thumbnail by fetching the stream via axios (sends auth token),
// converting to a blob object URL, then seeking and capturing a canvas frame.
const generateThumbnailFromFileId = async (fileId, previousTimestamps = []) => {
    try {
        const res = await axios.get(`/admin/drive/stream/${fileId}`, {
            responseType: 'blob',
            headers: { Range: 'bytes=0-8388607' },
        });
        const blobUrl = URL.createObjectURL(res.data);

        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        video.muted = true;
        video.crossOrigin = "anonymous";
        video.setAttribute('playsinline', '');
        video.preload = "metadata";
        video.src = blobUrl;

        await new Promise((resolve, reject) => {
            let timeout = setTimeout(() => reject("Metadata timeout"), 3000);
            video.onloadedmetadata = () => {
                clearTimeout(timeout);
                resolve();
            };
            video.onerror = () => {
                clearTimeout(timeout);
                reject("Video error");
            };
        }).catch(() => null);

        const dur = video.duration || 0;
        let attempt = 0;
        const maxRetries = 5;

        // Pick a random starting point within the first 10 seconds
        // Ensure the selected time hasn't been used before (within 1 second)
        let baseSeekTime = 1;
        let attemptsTimestamp = 0;

        do {
            if (dur > 2) {
                baseSeekTime = Math.min((0.01 + Math.random() * 0.08) * dur, 8); // max 8s
            } else if (dur > 0) {
                baseSeekTime = dur / 2;
            }
            attemptsTimestamp++;
        } while (
            attemptsTimestamp < 20 &&
            previousTimestamps.some(t => Math.abs(t - baseSeekTime) < 1)
        );

        while (attempt < maxRetries) {
            attempt++;

            let seekTime = baseSeekTime;
            if (dur > 2) {
                seekTime = Math.min(baseSeekTime + attempt, dur - 0.5); // step 1 second forward
            } else if (dur > 0) {
                seekTime = dur / 2;
            }

            try {
                const dataUrl = await new Promise((resolve, reject) => {
                    let timeoutId = setTimeout(() => reject("Seek timeout"), 3000);

                    video.onseeked = () => {
                        clearTimeout(timeoutId);
                        canvas.width = video.videoWidth || 1280;
                        canvas.height = video.videoHeight || 720;
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                        // Pixel Variance Check for solid colors
                        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                        let isSolid = true;
                        if (frameData.length > 0) {
                            const r = frameData[0], g = frameData[1], b = frameData[2];
                            for (let i = 0; i < frameData.length; i += 400) {
                                if (Math.abs(frameData[i] - r) > 5 ||
                                    Math.abs(frameData[i + 1] - g) > 5 ||
                                    Math.abs(frameData[i + 2] - b) > 5) {
                                    isSolid = false;
                                    break;
                                }
                            }
                        }

                        if (isSolid && attempt < maxRetries) {
                            reject("SOLID_COLOR");
                        } else {
                            resolve(canvas.toDataURL('image/jpeg', 0.8));
                        }
                    };

                    video.onerror = () => {
                        clearTimeout(timeoutId);
                        reject("Video error");
                    };

                    video.currentTime = seekTime;
                });

                URL.revokeObjectURL(blobUrl);
                return {
                    dataUrl,
                    timestamp: seekTime
                };
            } catch (err) {
                if (err !== "SOLID_COLOR") {
                    URL.revokeObjectURL(blobUrl);
                    return null;
                }
            }
        }

        URL.revokeObjectURL(blobUrl);
        return null;
    } catch (err) {
        console.error('Thumbnail generation failed:', err);
        return null;
    }
};

const AdminDriveScanner = () => {
    /* ─── Scan state ─── */
    const [files, setFiles] = useState([]);
    const [scanning, setScanning] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [scanError, setScanError] = useState('');

    /* ─── Selected file & form ─── */
    const [selected, setSelected] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rank, setRank] = useState('free');
    const [tags, setTags] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [generatedThumbnail, setGeneratedThumbnail] = useState(null);
    const [thumbLoading, setThumbLoading] = useState(false);
    const [usedTimestamps, setUsedTimestamps] = useState([]);

    /* ─── Register state ─── */
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState('');
    const [saveError, setSaveError] = useState('');
    const [doneIds, setDoneIds] = useState(new Set());

    /* ─── Scan ─── */
    const handleScan = async () => {
        setScanning(true);
        setScanError('');
        setScanned(false);
        setFiles([]);
        setSelected(null);
        setDoneIds(new Set());
        try {
            const res = await axios.get('/admin/drive/unregistered');
            setFiles(res.data);
            setScanned(true);
        } catch (err) {
            setScanError(err.response?.data?.message || 'Scan failed.');
        } finally {
            setScanning(false);
        }
    };

    /* ─── Pick file → pre-fill form + auto-generate thumbnail ─── */
    const handleSelect = async (file) => {
        setSelected(file);
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
        setDescription('');
        setRank(file.rank || 'free');
        setTags('');
        setThumbnailUrl('');
        setGeneratedThumbnail(null);
        setUsedTimestamps([]);
        setSaveMsg('');
        setSaveError('');

        // Auto-generate thumbnail via admin stream proxy (uses axios so auth token is sent)
        setThumbLoading(true);
        const result = await generateThumbnailFromFileId(file.fileId, []);
        if (result && result.dataUrl) {
            setGeneratedThumbnail(result.dataUrl);
            setUsedTimestamps([result.timestamp]);
        }
        setThumbLoading(false);
    };

    const handleRegenerate = async () => {
        if (!selected) return;
        setThumbLoading(true);
        const result = await generateThumbnailFromFileId(selected.fileId, usedTimestamps);
        if (result && result.dataUrl) {
            setGeneratedThumbnail(result.dataUrl);
            setUsedTimestamps(prev => [...prev, result.timestamp]);
        }
        setThumbLoading(false);
    };

    /* ─── Register ─── */
    const handleRegister = async (e) => {
        e.preventDefault();
        if (!selected) return;
        setSaving(true);
        setSaveMsg('');
        setSaveError('');
        try {
            await axios.post('/admin/drive/register', {
                fileId: selected.fileId,
                folderId: selected.folderId,
                title,
                description,
                rank,
                tags,
                // Use manual URL first, else the auto-generated base64
                thumbnailUrl: thumbnailUrl || generatedThumbnail || '',
            });
            setSaveMsg(`✅ "${title}" registered successfully!`);
            setDoneIds(prev => new Set([...prev, selected.fileId]));
            // Remove from list after animation
            setTimeout(() => {
                setFiles(prev => prev.filter(f => f.fileId !== selected.fileId));
                setSelected(null);
            }, 1600);
        } catch (err) {
            setSaveError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setSaving(false);
        }
    };

    const rankBadge = (r) => `rank-tag rank-${r}`;

    return (
        <div className="admin-container">
            {/* ── Page header ── */}
            <div className="flex-row ai-center gap-2 mb-4">
                <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Drive Scanner</h1>
            </div>
            <p className="text-muted" style={{ marginBottom: '28px' }}>
                Detect Google Drive video files that aren't registered in the database and add them to the platform.
            </p>

            {/* ── Scan button ── */}
            <button
                className="btn-primary ds-scan-btn"
                onClick={handleScan}
                disabled={scanning}
                style={{ marginBottom: '28px' }}
            >
                {scanning
                    ? <><RefreshCcw size={18} className="ds-spin" /> Scanning Drive folders…</>
                    : <><HardDrive size={18} /> Scan for Unregistered Videos</>}
            </button>

            {scanError && (
                <div className="error-message" style={{ marginBottom: '20px' }}>
                    <AlertCircle size={16} style={{ marginRight: 6 }} />{scanError}
                </div>
            )}

            {/* ── Two-column layout ── */}
            {scanned && (
                <div className="ds-two-col">

                    {/* ── LEFT: file list ── */}
                    <div className="ds-file-list">
                        <div className="ds-list-header">
                            <ScanSearch size={16} />
                            <span>
                                {files.length === 0
                                    ? 'All files are registered'
                                    : `${files.length} unregistered file${files.length !== 1 ? 's' : ''}`}
                            </span>
                        </div>

                        {files.length === 0 && (
                            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                <CheckCircle2 size={36} style={{ color: '#10b981', marginBottom: 10 }} />
                                <p>Every video in your Drive is already on the platform.</p>
                            </div>
                        )}

                        {files.map(file => {
                            const isDone = doneIds.has(file.fileId);
                            const isActive = selected?.fileId === file.fileId;
                            return (
                                <button
                                    key={file.fileId}
                                    className={`ds-file-row ${isActive ? 'ds-file-row--active' : ''} ${isDone ? 'ds-file-row--done' : ''}`}
                                    onClick={() => !isDone && handleSelect(file)}
                                    disabled={isDone}
                                >
                                    <FileVideo size={18} className="ds-file-icon" />
                                    <div className="ds-file-meta">
                                        <span className="ds-file-name" title={file.name}>{file.name}</span>
                                        <div className="ds-file-sub">
                                            <span className={rankBadge(file.rank)}>{file.rank?.toUpperCase()}</span>
                                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>{formatSize(file.size)}</span>
                                        </div>
                                    </div>
                                    {isDone && <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />}
                                </button>
                            );
                        })}
                    </div>

                    {/* ── RIGHT: registration form ── */}
                    <div className="ds-form-panel">
                        {!selected ? (
                            <div className="ds-form-placeholder">
                                <ScanSearch size={40} style={{ color: 'var(--border-color)', marginBottom: 12 }} />
                                <p>Select a file on the left to register it.</p>
                            </div>
                        ) : (
                            <div className="admin-card glass" style={{ margin: 0 }}>
                                <h2 style={{ marginBottom: 4, fontSize: '1.1rem', fontWeight: 700 }}>
                                    Register Video
                                </h2>
                                <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '20px', wordBreak: 'break-all' }}>
                                    📄 {selected.name}
                                </p>

                                {saveMsg && (
                                    <div style={{ color: '#10b981', padding: '12px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', marginBottom: '20px', fontSize: '0.9rem' }}>
                                        {saveMsg}
                                    </div>
                                )}
                                {saveError && (
                                    <div className="error-message">{saveError}</div>
                                )}

                                <form onSubmit={handleRegister} className="flex-column gap-3">
                                    <div className="form-group">
                                        <label>Video Title *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            required
                                            placeholder="Enter a display title"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={tags}
                                            onChange={e => setTags(e.target.value)}
                                            placeholder="e.g. action, tutorial, vlog"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea
                                            className="input-field"
                                            rows="4"
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Optional description..."
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
                                            <label>Override Thumbnail URL <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span></label>
                                            <input
                                                type="url"
                                                className="input-field"
                                                value={thumbnailUrl}
                                                onChange={e => setThumbnailUrl(e.target.value)}
                                                placeholder="Leave blank to use auto-generated"
                                            />
                                        </div>
                                    </div>

                                    {/* Auto-generated thumbnail preview */}
                                    {!thumbnailUrl && (
                                        <div className="form-group">
                                            <label>Auto-Generated Thumbnail</label>
                                            {thumbLoading && (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px 0' }}>
                                                    <RefreshCcw size={14} className="ds-spin" style={{ marginRight: 6 }} />
                                                    Generating thumbnail from video…
                                                </div>
                                            )}
                                            {!thumbLoading && generatedThumbnail && (
                                                <div style={{ position: 'relative', display: 'inline-block', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                    <img
                                                        src={generatedThumbnail}
                                                        alt="Generated thumbnail"
                                                        style={{ width: '250px', height: '140px', objectFit: 'cover', display: 'block' }}
                                                        referrerPolicy="no-referrer"
                                                    />
                                                    <div
                                                        className="desktop-thumbnail-overlay"
                                                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                                                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                        onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                                    >
                                                        <button type="button" onClick={handleRegenerate} style={{ background: 'var(--primary-color)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <RefreshCw size={16} /> Regenerate
                                                        </button>
                                                    </div>
                                                    <div style={{ textAlign: 'center', fontSize: '11px', background: 'var(--surface-color)', padding: '3px', position: 'absolute', bottom: 0, width: '100%' }}>Auto-Generated Preview</div>
                                                </div>
                                            )}
                                            {/* Mobile-only Regenerate button (hover not available on touch) */}
                                            {!thumbLoading && generatedThumbnail && (
                                                <button type="button" className="btn-primary mobile-thumbnail-btn" onClick={handleRegenerate}>
                                                    <RefreshCw size={16} style={{ marginRight: '8px' }} /> Regenerate
                                                </button>
                                            )}
                                            {!thumbLoading && !generatedThumbnail && (
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Could not generate thumbnail from this video.</div>
                                            )}
                                        </div>
                                    )}

                                    <button type="submit" className="btn-primary mt-4" disabled={saving}>
                                        {saving
                                            ? <div className="spinner" />
                                            : <><Save size={18} /> Save to Platform</>}
                                    </button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDriveScanner;
