import React, { useState, useEffect } from 'react';

const StatusBarMock = ({ children }) => children || null;
StatusBarMock.setBarStyle = () => { };
StatusBarMock.currentHeight = 20;
StatusBarMock.setBackgroundColor = () => { };
StatusBarMock.setTranslucent = () => { };

// Shared state
let __netInfoState = {
    type: 'wifi',
    isInternetReachable: true,
    isConnected: true,
    details: { isConnectionExpensive: false }
};

const __netInfoListeners = new Set();

export const updateNetInfoState = (newState) => {
    // console.log('[reactNativeMock] updateNetInfoState called with', JSON.stringify(newState));
    const isReachable = newState.isInternetReachable !== undefined ? newState.isInternetReachable : true;
    const fullState = {
        type: isReachable ? 'wifi' : 'none',
        isInternetReachable: isReachable,
        isConnected: isReachable,
        details: { isConnectionExpensive: false },
        ...newState
    };
    __netInfoState = fullState;
    __netInfoListeners.forEach(l => l(fullState));
};

// Bind to window events if available (JSDOM)
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        updateNetInfoState({ isInternetReachable: true });
    });
    window.addEventListener('offline', () => {
        updateNetInfoState({ isInternetReachable: false });
    });
}

// NetInfo Hook
export const useNetInfo = () => {
    const [state, setState] = useState(__netInfoState);

    useEffect(() => {
        const handler = (newState) => {
            setState(newState);
        };
        __netInfoListeners.add(handler);
        // Sync
        setState(__netInfoState);
        return () => {
            __netInfoListeners.delete(handler);
        };
    }, []);

    return state;
};

export const View = ({ children }) => React.createElement('div', {}, children);
export const Text = ({ children }) => React.createElement('span', {}, children);
export const Image = ({ children }) => React.createElement('img', { src: 'mock.png' }, children);
export const TouchableOpacity = ({ children, onPress }) => React.createElement('button', { onClick: onPress }, children);
export const ScrollView = ({ children }) => React.createElement('div', { style: { overflow: 'scroll' } }, children);
export const TextInput = ({ children }) => children;
export const StyleSheet = { create: (obj) => obj };
export const Platform = { OS: 'web', select: (obj) => obj.web || obj.default };
export const Dimensions = { get: () => ({ width: 375, height: 812 }) };
export const Animated = {
    View: ({ children }) => children,
    Text: ({ children }) => children,
    createAnimatedComponent: (c) => c,
    timing: () => ({ start: (cb) => cb && cb() }),
    Value: class { setValue() { } interpolate() { return 0; } }
};
export const Easing = { inOut: () => { } };
export const ActivityIndicator = () => null;
export const Alert = { alert: () => { } };
export const Linking = { openURL: () => { } };
export const AppState = { addEventListener: () => ({ remove: () => { } }) };
export const StatusBar = StatusBarMock;
export const PixelRatio = { get: () => 1 };

// Expo
export const preventAutoHideAsync = async () => { };
export const hideAsync = async () => { };
export const useFonts = () => [true, null];
export const isLoaded = () => true;
export const isLoading = () => false;
export const loadAsync = async () => { };
export const PlayfairDisplay_700Bold = 'PlayfairDisplay_700Bold';
export const Inter_400Regular = 'Inter_400Regular';

// Test Helper Alias
export const __setNetInfo = updateNetInfoState;

// Async Storage
export const setItem = async () => { };
export const getItem = async () => null;
export const removeItem = async () => { };
export const clear = async () => { };
export const getAllKeys = async () => [];
export const multiGet = async () => [];
export const multiSet = async () => { };
export const multiRemove = async () => { };
