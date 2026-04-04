
import React, { useState, useEffect } from 'react';

let __state = {
    type: 'wifi',
    isInternetReachable: true,
    isConnected: true,
    details: { isConnectionExpensive: false }
};

const __listeners = new Set();

export const addEventListener = (handler) => {
    __listeners.add(handler);
    handler(__state);
    return () => __listeners.delete(handler);
};

export const fetch = async () => __state;

export const useNetInfo = () => {
    const [state, setState] = useState(__state);
    useEffect(() => {
        const handler = (s) => setState(s);
        __listeners.add(handler);
        return () => __listeners.delete(handler);
    }, []);
    return state;
};

// Internal helper for tests
export const __setNetInfo = (newState) => {
    __state = { ...__state, ...newState };
    __listeners.forEach(l => l(__state));
};

export default {
    addEventListener,
    fetch,
    useNetInfo,
    __setNetInfo
};
