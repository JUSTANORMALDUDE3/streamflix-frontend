import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Transition.css';

const TransitionWrapper = ({ children }) => {
    const location = useLocation();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('fadeIn');

    useEffect(() => {
        if (location !== displayLocation) {
            setTransitionStage('fadeOut');

            // Preserve scroll position mapping for the old route if needed
            // Wait 150ms for fadeOut css animation to finish before unmounting old DOM
            const timeout = setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                setDisplayLocation(location);
                setTransitionStage('fadeIn');
            }, 150);

            return () => clearTimeout(timeout);
        }
    }, [location, displayLocation]);

    return (
        <div className={`route-transition ${transitionStage}`}>
            {/* Render the cached displayLocation to delay the unmount */}
            <div key={displayLocation.pathname}>
                {children}
            </div>
        </div>
    );
};

export default TransitionWrapper;
