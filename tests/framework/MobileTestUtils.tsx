
import { vi } from 'vitest';
import { act } from '@testing-library/react';

// Mock generic specific dimensions
export const resizeWindow = (width: number, height: number) => {
    // Determine type of event to dispatch based on environment
    // In JSDOM, resize event on window is standard
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });

    act(() => {
        window.dispatchEvent(new Event('resize'));
    });
};

export const emulateNetworkCondition = (online: boolean) => {
    Object.defineProperty(navigator, 'onLine', {
        value: online,
        configurable: true
    });
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
};

export const MOBILE_VIEWPORTS = {
    IPHONE_SE: { width: 375, height: 667 },
    IPHONE_14_PRO: { width: 393, height: 852 },
    IPAD_MINI: { width: 768, height: 1024 }, // Tablet/Mobile boundary
    PIXEL_7: { width: 412, height: 915 }
};

// Mock Firebase and Firestore helpers - moved to individual tests for control
export const setupMobileTestAuth = () => {
    // vi.mock calls removed to avoid hoisting conflicts
};
