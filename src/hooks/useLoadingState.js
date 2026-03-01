import { useCallback, useEffect, useRef, useState } from 'react';

const MIN_TIME = 300;

export const useLoadingState = (initialValue = false) => {
    const [loading, setLoading] = useState(initialValue);
    const startedAtRef = useRef(initialValue ? Date.now() : 0);
    const timeoutRef = useRef(null);

    const clearPendingTimeout = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, []);

    const startLoading = useCallback(() => {
        clearPendingTimeout();
        startedAtRef.current = Date.now();
        setLoading(true);
    }, [clearPendingTimeout]);

    const stopLoading = useCallback(() => {
        const elapsed = Date.now() - startedAtRef.current;
        const remaining = Math.max(MIN_TIME - elapsed, 0);

        clearPendingTimeout();

        if (remaining === 0) {
            setLoading(false);
            return;
        }

        timeoutRef.current = setTimeout(() => {
            setLoading(false);
            timeoutRef.current = null;
        }, remaining);
    }, [clearPendingTimeout]);

    useEffect(() => clearPendingTimeout, [clearPendingTimeout]);

    return {
        loading,
        startLoading,
        stopLoading
    };
};

export default useLoadingState;
