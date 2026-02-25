import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Key, Trash2, Plus, AlertCircle } from 'lucide-react';

const AdminTokensPanel = ({ videoId }) => {
    const [tokens, setTokens] = useState([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [usageCount, setUsageCount] = useState(1);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTokens();
    }, [videoId]);

    const fetchTokens = async () => {
        try {
            const res = await axios.get(`/admin/tokens/${videoId}`);
            setTokens(res.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Failed to load tokens');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setError('');

        try {
            const res = await axios.post('/admin/tokens', {
                videoId,
                remainingUses: parseInt(usageCount, 10)
            });
            // Add new token to the start of the list
            setTokens([res.data, ...tokens]);
            setUsageCount(1); // Reset
        } catch (err) {
            console.error(err);
            setError('Failed to generate token');
        } finally {
            setGenerating(false);
        }
    };

    const handleDelete = async (tokenId) => {
        if (!window.confirm('Are you sure you want to delete this token?')) return;

        try {
            await axios.delete(`/admin/tokens/${tokenId}`);
            setTokens(tokens.filter(t => t._id !== tokenId));
        } catch (err) {
            console.error(err);
            setError('Failed to delete token');
        }
    };

    return (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <h4 className="flex-row ai-center gap-1 mb-2" style={{ color: '#10b981', margin: '0 0 12px 0' }}>
                <Key size={16} /> Token Manager
            </h4>

            {error && (
                <div className="error-banner mb-2" style={{ padding: '8px', fontSize: '0.85rem' }}>
                    <AlertCircle size={14} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                    {error}
                </div>
            )}

            <form onSubmit={handleGenerate} className="flex-row ai-center gap-2 mb-3">
                <div style={{ flex: 1 }}>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        className="input-field"
                        style={{ padding: '8px 12px', height: '36px' }}
                        value={usageCount}
                        onChange={(e) => setUsageCount(e.target.value)}
                        placeholder="Usage count"
                        required
                    />
                </div>
                <button type="submit" className="btn-primary" disabled={generating} style={{ padding: '8px 16px', height: '36px' }}>
                    {generating ? '...' : <><Plus size={16} /> Generate</>}
                </button>
            </form>

            {loading ? (
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>Loading tokens...</div>
            ) : tokens.length === 0 ? (
                <div className="text-muted" style={{ fontSize: '0.85rem' }}>No active tokens for this video.</div>
            ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '6px' }}>Token</th>
                                <th style={{ padding: '6px' }}>Uses</th>
                                <th style={{ padding: '6px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokens.map(token => (
                                <tr key={token._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <td style={{ padding: '8px 6px', fontFamily: 'monospace', letterSpacing: '1px', color: '#60a5fa' }}>
                                        {token.token}
                                    </td>
                                    <td style={{ padding: '8px 6px' }}>
                                        <span className="rank-badge rank-top" style={{ padding: '2px 6px' }}>{token.remainingUses}</span>
                                    </td>
                                    <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                                        <button
                                            onClick={() => handleDelete(token._id)}
                                            style={{ background: 'transparent', color: '#ef4444', padding: '4px', cursor: 'pointer' }}
                                            title="Delete Token"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminTokensPanel;
