
import React, { useState, useEffect, ReactNode } from 'react';

const StatusBarMock = ({ children }: { children?: ReactNode }) => (children as any) || null;
(StatusBarMock as any).setBarStyle = () => { };
(StatusBarMock as any).currentHeight = 20;
(StatusBarMock as any).setBackgroundColor = () => { };
(StatusBarMock as any).setTranslucent = () => { };

// Shared state
let __netInfoState = {
    type: 'wifi',
    isInternetReachable: true,
    isConnected: true,
    details: { isConnectionExpensive: false }
};

const __netInfoListeners = new Set<(state: any) => void>();

export const updateNetInfoState = (newState: any) => {
    console.log('[reactNativeMock] updateNetInfoState called with', JSON.stringify(newState));
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

export const addEventListener = (handler: (state: any) => void) => {
    __netInfoListeners.add(handler);
    handler(__netInfoState);
    return () => __netInfoListeners.delete(handler);
};

export const fetch = async () => __netInfoState;

interface NetInfoInstance {
    addEventListener: typeof addEventListener;
    fetch: typeof fetch;
    useNetInfo: typeof useNetInfo;
}

// NetInfo Hook
export const useNetInfo = () => {
    const [state, setState] = useState(__netInfoState);

    useEffect(() => {
        const handler = (newState: any) => {
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

export const View = ({ children, style }: any) => React.createElement('div', { style }, children);
export const Text = ({ children, style }: any) => React.createElement('span', { style }, children);
export const Image = ({ children, style }: any) => React.createElement('img', { src: 'mock.png', style }, children);
export const TouchableOpacity = ({ children, onPress, style }: any) => React.createElement('button', { onClick: onPress, style }, children);
export const ScrollView = ({ children, style }: any) => React.createElement('div', { style: { overflow: 'scroll', ...style } }, children);
export const TextInput = ({ children }: any) => children;
export const StyleSheet = { create: (obj: any) => obj };
export const Platform = { OS: 'web' as const, select: (obj: any) => obj.web || obj.default };
export const Dimensions = { get: () => ({ width: 375, height: 812 }) };
export const Animated = {
    View: ({ children }: any) => children,
    Text: ({ children }: any) => children,
    createAnimatedComponent: (c: any) => c,
    timing: () => ({ start: (cb?: any) => cb && cb() }),
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

const ExportObject = {
    StatusBar,
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StyleSheet,
    Platform,
    Dimensions,
    Animated,
    Easing,
    ActivityIndicator,
    Alert,
    Linking,
    AppState,
    PixelRatio,
    preventAutoHideAsync,
    hideAsync,
    useFonts,
    isLoaded,
    isLoading,
    loadAsync,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    __setNetInfo: updateNetInfoState,
    updateNetInfoState,
    useNetInfo,
    addEventListener,
    fetch,
    setItem: async () => { },
    getItem: async () => null,
    removeItem: async () => { },
    clear: async () => { },
    getAllKeys: async () => [],
    multiGet: async () => [],
    multiSet: async () => { },
    multiRemove: async () => { },
};

export default ExportObject;
