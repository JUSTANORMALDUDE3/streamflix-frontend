import axios from 'axios';

const MAX_CONCURRENT_PREFETCHES = 3;
const PREFETCH_TTL_MS = 2 * 60 * 1000;
const PREVIEW_PREFETCH_BYTE_RANGE = 'bytes=0-262143';
const homeCache = new Map();
const videoCache = new Map();
const previewCache = new Map();
const highPriorityQueue = [];
const normalQueue = [];
const pausedPreviewTasks = [];
const activePrefetchesMeta = new Set();
let activePrefetches = 0;
let previewResumeTimer = null;

const now = () => Date.now();

const getConnection = () => {
    if (typeof navigator === 'undefined') return null;
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
};

export const canPrefetch = () => {
    const connection = getConnection();
    if (!connection) return true;
    if (connection.saveData) return false;
    return !['slow-2g', '2g'].includes(connection.effectiveType);
};

const isFresh = (entry) => entry && entry.data && (now() - entry.timestamp < PREFETCH_TTL_MS);

const takeNextTask = () => {
    if (highPriorityQueue.length) return highPriorityQueue.shift();
    if (normalQueue.length) return normalQueue.shift();
    return null;
};

const pumpQueue = () => {
    while (activePrefetches < MAX_CONCURRENT_PREFETCHES) {
        const nextTask = takeNextTask();
        if (!nextTask) break;

        activePrefetches += 1;
        activePrefetchesMeta.add(nextTask);

        nextTask.run()
            .catch(() => null)
            .finally(() => {
                activePrefetchesMeta.delete(nextTask);
                activePrefetches -= 1;
                pumpQueue();
            });
    }
};

const enqueuePrefetch = (runner, meta = {}) => new Promise((resolve, reject) => {
    const task = {
        ...meta,
        run: () => runner().then(resolve).catch(reject),
    };

    if (meta.priority === 'high') {
        highPriorityQueue.push(task);
    } else {
        normalQueue.push(task);
    }

    pumpQueue();
});

const moveQueuedBackgroundPreviewTasksToPaused = () => {
    for (let index = normalQueue.length - 1; index >= 0; index -= 1) {
        const task = normalQueue[index];
        if (task.kind === 'preview' && task.priority === 'normal') {
            pausedPreviewTasks.unshift(task);
            normalQueue.splice(index, 1);
        }
    }
};

const pauseActiveBackgroundPreviewTasks = () => {
    activePrefetchesMeta.forEach((task) => {
        if (task.kind === 'preview' && task.priority === 'normal') {
            pausedPreviewTasks.push({ ...task, run: task.restart });
            task.controller?.abort();
        }
    });
};

const scheduleResumePausedPreviewTasks = (delayMs = 1200) => {
    if (previewResumeTimer) {
        window.clearTimeout(previewResumeTimer);
        previewResumeTimer = null;
    }

    if (pausedPreviewTasks.length === 0) return;

    previewResumeTimer = window.setTimeout(() => {
        while (pausedPreviewTasks.length) {
            normalQueue.push(pausedPreviewTasks.shift());
        }
        previewResumeTimer = null;
        pumpQueue();
    }, delayMs);
};

export const buildHomeCacheKey = ({ cursor = null, limit = 20, rangeDays = 30 } = {}) => (
    JSON.stringify({ cursor, limit, rangeDays })
);

export const getPrefetchedHomePage = (params) => {
    const entry = homeCache.get(buildHomeCacheKey(params));
    return isFresh(entry) ? entry.data : null;
};

export const prefetchHomePage = (params = {}) => {
    if (!canPrefetch()) return Promise.resolve(null);

    const key = buildHomeCacheKey(params);
    const existing = homeCache.get(key);
    if (isFresh(existing)) return Promise.resolve(existing.data);
    if (existing?.promise) return existing.promise;

    const promise = enqueuePrefetch(() => axios.get('/home', { params })
        .then((response) => {
            homeCache.set(key, { data: response.data, timestamp: now() });
            return response.data;
        }));

    homeCache.set(key, { promise, timestamp: now() });
    return promise;
};

export const primeHomePage = (params, data) => {
    homeCache.set(buildHomeCacheKey(params), { data, timestamp: now() });
};

export const getPrefetchedVideoDetail = (videoId) => {
    const entry = videoCache.get(String(videoId));
    return isFresh(entry) ? entry.data : null;
};

export const prefetchVideoDetail = (videoId) => {
    if (!videoId || !canPrefetch()) return Promise.resolve(null);

    const key = String(videoId);
    const existing = videoCache.get(key);
    if (isFresh(existing)) return Promise.resolve(existing.data);
    if (existing?.promise) return existing.promise;

    const promise = enqueuePrefetch(() => axios.get(`/videos/${videoId}`)
        .then((response) => {
            videoCache.set(key, { data: response.data, timestamp: now() });
            return response.data;
        }), { kind: 'detail', priority: 'high' });

    videoCache.set(key, { promise, timestamp: now() });
    return promise;
};

export const primeVideoDetail = (videoId, data) => {
    if (!videoId || !data) return;
    videoCache.set(String(videoId), { data, timestamp: now() });
};

const buildPreviewCacheKey = (videoId, token = '') => `${videoId}:${token}`;

const buildPreviewStreamUrl = (videoId, token = '') => {
    const encodedToken = token ? encodeURIComponent(token) : '';
    return `${import.meta.env.VITE_API_URL}/videos/stream/${videoId}${encodedToken ? `?token=${encodedToken}` : ''}`;
};

const requestPreviewStream = (videoId, token = '', priority = 'normal') => {
    const key = buildPreviewCacheKey(videoId, token);
    const existing = previewCache.get(key);
    if (isFresh(existing)) return Promise.resolve(true);
    if (existing?.promise && priority !== 'high') return existing.promise;

    const controller = new AbortController();

    const runner = async () => {
        const response = await fetch(buildPreviewStreamUrl(videoId, token), {
            method: 'GET',
            credentials: 'include',
            headers: {
                Range: PREVIEW_PREFETCH_BYTE_RANGE,
            },
            signal: controller.signal,
        });

        if (!response.ok && response.status !== 206) {
            throw new Error(`Preview warmup failed with status ${response.status}`);
        }

        if (response.body?.cancel) {
            await response.body.cancel();
        }

        previewCache.set(key, { data: true, timestamp: now() });
        return true;
    };

    const promise = enqueuePrefetch(runner, {
        kind: 'preview',
        priority,
        controller,
        restart: () => requestPreviewStream(videoId, token, 'normal'),
    }).catch((error) => {
        if (error?.name === 'AbortError') {
            return false;
        }
        throw error;
    });

    previewCache.set(key, { promise, timestamp: now() });
    return promise;
};

export const prefetchPreviewStream = (videoId, token = '') => {
    if (!videoId || !canPrefetch()) return Promise.resolve(false);
    return requestPreviewStream(videoId, token, 'normal');
};

export const prioritizePreviewStream = (videoId, token = '') => {
    if (!videoId || !canPrefetch()) return Promise.resolve(false);

    moveQueuedBackgroundPreviewTasksToPaused();
    pauseActiveBackgroundPreviewTasks();

    return requestPreviewStream(videoId, token, 'high')
        .finally(() => {
            if (typeof window !== 'undefined') {
                scheduleResumePausedPreviewTasks(900);
            }
        });
};

export const prefetchPreviewBatch = (videos = [], token = '', limit = 6) => {
    if (!Array.isArray(videos) || videos.length === 0 || !canPrefetch()) {
        return Promise.resolve([]);
    }

    const uniqueIds = [...new Set(videos.map((video) => video?._id).filter(Boolean))].slice(0, limit);
    return Promise.allSettled(uniqueIds.map((videoId) => prefetchPreviewStream(videoId, token)));
};

export const scheduleIdlePrefetch = (callback, timeout = 1200) => {
    if (!canPrefetch()) return () => {};

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        const id = window.requestIdleCallback(callback, { timeout });
        return () => window.cancelIdleCallback(id);
    }

    const timeoutId = window.setTimeout(callback, timeout);
    return () => window.clearTimeout(timeoutId);
};

export const saveScrollPosition = (pathname, scrollY = window.scrollY) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(`scroll:${pathname}`, String(scrollY));
};

export const restoreScrollPosition = (pathname) => {
    if (typeof window === 'undefined') return false;
    const value = sessionStorage.getItem(`scroll:${pathname}`);
    if (value === null) return false;

    window.requestAnimationFrame(() => {
        window.scrollTo({ top: Number(value) || 0, behavior: 'auto' });
    });
    return true;
};
