import React from 'react';

const Loader = ({ fullScreen }) => {
    if (fullScreen) {
        return (
            <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-height))', width: '100%', alignItems: 'center', justifyContent: 'center' }}>
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
