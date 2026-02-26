import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code2, Save, Eye, RefreshCw, ImageOff, CheckCircle } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import './Admin.css';

const rankOptions = [
    { value: 'free', label: 'Free' },
    { value: 'middle', label: 'Middle' },
    { value: 'top', label: 'Top' },
];

const parseIframeSrc = (code) => {
    const m = code.match(/src=["']([^"']+)["']/i);
    return m ? m[1] : null;
};

const AdminEmbedVideo = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rank, setRank] = useState('free');
    const [iframeCode, setIframeCode] = useState('');
    const [manualThumbnailUrl, setManualThumbnailUrl] = useState('');

    // Auto-detected thumbnail state
    const [detectedThumb, setDetectedThumb] = useState(null);
    const [thumbLoading, setThumbLoading] = useState(false);
    const [thumbChecked, setThumbChecked] = useState(false);

    // Extracted direct video URL (highest quality)
    const [extractedVideoUrl, setExtractedVideoUrl] = useState(null);
    const [extractedQuality, setExtractedQuality] = useState(null);
    const [urlLoading, setUrlLoading] = useState(false);
    const [urlChecked, setUrlChecked] = useState(false);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const debounceRef = useRef(null);

    const previewSrc = parseIframeSrc(iframeCode);

    // Final thumbnail to use — manual overrides auto
    const effectiveThumbnail = manualThumbnailUrl || detectedThumb || '';

    // When the parsed src changes, auto-fetch thumbnail AND direct video URL
    useEffect(() => {
        if (!previewSrc) {
            setDetectedThumb(null); setThumbChecked(false);
            setExtractedVideoUrl(null); setExtractedQuality(null); setUrlChecked(false);
            return;
        }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setThumbLoading(true); setUrlLoading(true);
            setDetectedThumb(null); setThumbChecked(false);
            setExtractedVideoUrl(null); setExtractedQuality(null); setUrlChecked(false);

            // Run both in parallel
            const [thumbRes, urlRes] = await Promise.allSettled([
                axios.get(`/admin/embed/thumbnail?src=${encodeURIComponent(previewSrc)}`),
                axios.get(`/admin/embed/video-url?src=${encodeURIComponent(previewSrc)}`),
            ]);

            if (thumbRes.status === 'fulfilled') setDetectedThumb(thumbRes.value.data.thumbnailUrl || null);
            setThumbLoading(false); setThumbChecked(true);

            if (urlRes.status === 'fulfilled' && urlRes.value.data.videoUrl) {
                setExtractedVideoUrl(urlRes.value.data.videoUrl);
                setExtractedQuality(urlRes.value.data.quality || 'auto');
            }
            setUrlLoading(false); setUrlChecked(true);
        }, 800);
    }, [previewSrc]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        setError('');
        try {
            await axios.post('/admin/embed', {
                title,
                description,
                rank,
                iframeCode,
                thumbnailUrl: effectiveThumbnail,
                // If we extracted a direct video URL, override the embed src with it
                // so the Watch page can use the custom player
                directVideoUrl: extractedVideoUrl || null,
            });
            setMessage('Embed video saved successfully!');
            setTitle('');
            setDescription('');
            setRank('free');
            setIframeCode('');
            setManualThumbnailUrl('');
            setDetectedThumb(null);
            setThumbChecked(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save embed video.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="admin-container">
            <div className="flex-row ai-center gap-2 mb-4">
                <Link to="/admin" className="btn-icon text-muted"><ArrowLeft /></Link>
                <h1 className="admin-title" style={{ marginBottom: 0 }}>Embed Video</h1>
            </div>
            <p className="text-muted" style={{ marginBottom: '28px' }}>
                Paste an iframe embed code from any site — thumbnail is auto-detected, preview loads instantly.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

                {/* ── LEFT: Form ── */}
                <div className="admin-card glass" style={{ margin: 0 }}>
                    {error && <div className="error-message">{error}</div>}
                    {message && (
                        <div style={{ color: '#10b981', padding: '12px 16px', background: 'rgba(16,185,129,0.1)', borderRadius: '12px', marginBottom: '20px' }}>
                            ✅ {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="flex-column gap-3">

                        {/* Iframe paste */}
                        <div className="form-group">
                            <label>Iframe Code <span style={{ color: '#ef4444' }}>*</span></label>
                            <textarea
                                className="input-field"
                                rows={5}
                                value={iframeCode}
                                onChange={e => setIframeCode(e.target.value)}
                                placeholder={'<iframe src="https://example.com/embed/123" width="640" height="360" allowfullscreen></iframe>'}
                                required
                                style={{ fontFamily: 'monospace', fontSize: '0.82rem', resize: 'vertical' }}
                            />
                            {previewSrc && (
                                <p style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px', wordBreak: 'break-all' }}>
                                    ✅ src detected: <strong>{previewSrc}</strong>
                                </p>
                            )}
                            {iframeCode && !previewSrc && (
                                <p style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: '4px' }}>
                                    ⚠️ Could not detect src — make sure the code contains src="..."
                                </p>
                            )}
                        </div>

                        {/* Title */}
                        <div className="form-group">
                            <label>Video Title <span style={{ color: '#ef4444' }}>*</span></label>
                            <input
                                type="text"
                                className="input-field"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Enter a display title"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                className="input-field"
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Optional description..."
                            />
                        </div>

                        <div className="flex-row gap-3">
                            {/* Rank */}
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Minimum Rank <span style={{ color: '#ef4444' }}>*</span></label>
                                <CustomSelect
                                    options={rankOptions}
                                    value={rank}
                                    onChange={e => setRank(e.target.value)}
                                />
                            </div>

                            {/* Manual Thumbnail */}
                            <div className="form-group" style={{ flex: 1 }}>
                                <label>Thumbnail URL <span className="text-muted" style={{ fontWeight: 400 }}>(overrides auto)</span></label>
                                <input
                                    type="url"
                                    className="input-field"
                                    value={manualThumbnailUrl}
                                    onChange={e => setManualThumbnailUrl(e.target.value)}
                                    placeholder="Leave blank to auto-detect"
                                />
                            </div>
                        </div>

                        {/* Auto-thumbnail status */}
                        {previewSrc && !manualThumbnailUrl && (
                            <div className="form-group">
                                <label>Auto-Detected Thumbnail</label>
                                {thumbLoading && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Detecting thumbnail…
                                    </div>
                                )}
                                {!thumbLoading && thumbChecked && detectedThumb && (
                                    <div style={{ position: 'relative', display: 'inline-block', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(16,185,129,0.4)' }}>
                                        <img
                                            src={detectedThumb}
                                            alt="Auto-detected thumbnail"
                                            style={{ width: '250px', height: '140px', objectFit: 'cover', display: 'block' }}
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                        <div style={{ position: 'absolute', top: '6px', left: '6px', background: 'rgba(16,185,129,0.9)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <CheckCircle size={11} /> Auto-detected
                                        </div>
                                    </div>
                                )}
                                {!thumbLoading && thumbChecked && !detectedThumb && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '7px' }}>
                                        <ImageOff size={15} /> Could not auto-detect — paste a thumbnail URL above.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Video URL extraction status */}
                        {previewSrc && (
                            <div className="form-group">
                                <label>Direct Video URL (for custom player)</label>
                                {urlLoading && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Extracting highest quality URL…
                                    </div>
                                )}
                                {!urlLoading && urlChecked && extractedVideoUrl && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                        <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', padding: '4px 12px', fontSize: '0.82rem', fontWeight: 600 }}>
                                            ✅ {extractedQuality?.toUpperCase() || 'AUTO'} quality found
                                        </span>
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', wordBreak: 'break-all', flex: 1 }}>{extractedVideoUrl.slice(0, 70)}{extractedVideoUrl.length > 70 ? '…' : ''}</span>
                                    </div>
                                )}
                                {!urlLoading && urlChecked && !extractedVideoUrl && (
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        ℹ️ No direct video file found — will use iframe embed (external player controls).
                                    </div>
                                )}
                            </div>
                        )}

                        <button type="submit" className="btn-primary mt-4" disabled={saving || !previewSrc}>
                            {saving ? <div className="spinner" /> : <><Save size={18} /> Save Embed Video</>}
                        </button>
                    </form>
                </div>

                {/* ── RIGHT: Live preview ── */}
                <div>
                    <div className="admin-card glass" style={{ margin: 0, padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            <Eye size={15} /> Live Preview
                        </div>
                        {previewSrc ? (
                            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: '8px', overflow: 'hidden', background: '#000' }}>
                                <iframe
                                    src={previewSrc}
                                    title="Embed preview"
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                    allowFullScreen
                                    allow="autoplay; fullscreen; picture-in-picture"
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '180px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px dashed var(--border-color)', gap: '10px', color: 'var(--text-muted)' }}>
                                <Code2 size={32} style={{ opacity: 0.4 }} />
                                <span style={{ fontSize: '0.85rem' }}>Paste iframe code to see a live preview</span>
                            </div>
                        )}
                    </div>

                    {/* Thumbnail preview card */}
                    {effectiveThumbnail && (
                        <div className="admin-card glass" style={{ margin: '16px 0 0', padding: '16px' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Thumbnail to Save</div>
                            <img
                                src={effectiveThumbnail}
                                alt="thumbnail"
                                style={{ width: '100%', borderRadius: '8px', objectFit: 'cover', maxHeight: '130px' }}
                                onError={e => e.target.style.display = 'none'}
                            />
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (max-width: 900px) { .admin-container > div[style*="grid"] { grid-template-columns: 1fr !important; } }
            `}</style>
        </div>
    );
};

export default AdminEmbedVideo;
