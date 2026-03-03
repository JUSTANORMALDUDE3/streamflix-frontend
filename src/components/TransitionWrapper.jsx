import React, { useEffect, useState } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import './Transition.css';

const TransitionWrapper = ({ children }) => {
    const location = useLocation();
    const navigationType = useNavigationType();
    const [displayLocation, setDisplayLocation] = useState(location);
    const [transitionStage, setTransitionStage] = useState('fadeIn');

    useEffect(() => {
        if (location !== displayLocation) {
            setTransitionStage('fadeOut');

            const timeout = setTimeout(() => {
                if (navigationType !== 'POP') {
                    window.scrollTo({ top: 0, behavior: 'auto' });
                }
                setDisplayLocation(location);
                setTransitionStage('fadeIn');
            }, 150);

            return () => clearTimeout(timeout);
        }

        return undefined;
    }, [location, displayLocation, navigationType]);

    return (
        <div className={`route-transition ${transitionStage}`}>
            <div key={displayLocation.pathname}>
                {children}
            </div>
        </div>
    );
};

export default TransitionWrapper;
