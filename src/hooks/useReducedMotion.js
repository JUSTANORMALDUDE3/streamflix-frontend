import { useEffect, useState } from 'react';

const getReducedMotionPreference = () => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
        return false;
    }

    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export const useReducedMotion = () => {
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(getReducedMotionPreference);

    useEffect(() => {
        if (typeof window === 'undefined' || !('matchMedia' in window)) {
            return undefined;
        }

        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
        updatePreference();

        mediaQuery.addEventListener('change', updatePreference);
        return () => mediaQuery.removeEventListener('change', updatePreference);
    }, []);

    return prefersReducedMotion;
};

export default useReducedMotion;
