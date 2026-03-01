import React from 'react';
import { X, Keyboard } from 'lucide-react';
import './ConfirmModal.css';

const KeyboardHelpModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { key: 'Space / K', desc: 'Play / Pause video' },
        { key: 'Left Arrow', desc: 'Rewind 10 seconds' },
        { key: 'Right Arrow', desc: 'Fast forward 10 seconds' },
        { key: 'F', desc: 'Toggle Fullscreen' },
        { key: 'M', desc: 'Toggle Mute' },
        { key: 'N', desc: 'Next Video in Playlist' },
        { key: 'Shift + ?', desc: 'Show this Help Menu' }
    ];

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 99999 }}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '90%' }}>
                <div className="modal-header flex-row ai-center jc-between" style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                    <div className="flex-row ai-center gap-2">
                        <Keyboard size={24} className="primary-color" />
                        <h3 style={{ margin: 0 }}>Keyboard Shortcuts</h3>
                    </div>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <div className="shortcuts-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {shortcuts.map((sc, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: idx < shortcuts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{sc.desc}</span>
                            <kbd style={{ background: 'var(--bg-color)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-main)', boxShadow: '0 2px 0 rgba(0,0,0,0.2)' }}>
                                {sc.key}
                            </kbd>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onClose}
                    className="btn-primary"
                    style={{ width: '100%', marginTop: '2rem', padding: '10px' }}
                >
                    Got it
                </button>
            </div>
        </div>
    );
};

export default KeyboardHelpModal;
