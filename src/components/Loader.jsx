import React from 'react';

const Loader = ({ fullScreen }) => {
    if (fullScreen) {
        return (
            <div style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)' }}>
                <div className="spinner"></div>
            </div>
        );
    }
    return (
        <div style={{ display: 'flex', width: '100%', padding: '40px', justifyContent: 'center' }}>
            <div className="spinner"></div>
        </div>
    );
};

export default Loader;
