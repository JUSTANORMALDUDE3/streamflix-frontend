import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import './ConfirmModal.css';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, isLoading }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal-overlay">
            <div className="modal-content glass flex-column gap-3">
                <div className="modal-header flex-row ai-center jc-between">
                    <div className="flex-row ai-center gap-2" style={{ color: '#ef4444' }}>
                        <AlertTriangle size={24} />
                        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{title}</h2>
                    </div>
                    <button className="modal-close-btn text-muted" onClick={onClose} disabled={isLoading}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body text-muted" style={{ lineHeight: '1.5' }}>
                    {message}
                </div>

                <div className="modal-footer flex-row gap-3 mt-2" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </button>
                    <button
                        className="btn-danger flex-row ai-center gap-2"
                        onClick={onConfirm}
                        disabled={isLoading}
                    >
                        {isLoading ? <div className="spinner-small"></div> : null}
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ConfirmModal;
