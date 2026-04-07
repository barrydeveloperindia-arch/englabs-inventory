import { expect, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';
import '@testing-library/jest-dom';

expect.extend(matchers);

Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

import React from 'react';

// Mock common browser methods that aren't available in JSDOM
window.alert = vi.fn();
window.confirm = vi.fn(() => true);
window.scrollTo = vi.fn();

// Mock window.location features that cause "Not implemented" errors in JSDOM
const originalLocation = window.location;
delete (window as any).location;
(window as any).location = {
    host: 'localhost',
    hostname: 'localhost',
    href: 'http://localhost/',
    origin: 'http://localhost',
    pathname: '/',
    port: '',
    protocol: 'http:',
    reload: vi.fn(),
    assign: vi.fn(),
    replace: vi.fn(),
};

// Mock Recharts to avoid "width/height should be greater than 0" errors
vi.mock('recharts', async () => {
    const React = await import('react');
    return {
        ResponsiveContainer: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-responsive-container' }, children),
        AreaChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-area-chart' }, children),
        Area: () => React.createElement('div', null),
        XAxis: () => React.createElement('div', null),
        YAxis: () => React.createElement('div', null),
        CartesianGrid: () => React.createElement('div', null),
        Tooltip: () => React.createElement('div', null),
        ReferenceLine: () => React.createElement('div', null),
        BarChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-bar-chart' }, children),
        Bar: () => React.createElement('div', null),
        PieChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-pie-chart' }, children),
        Pie: () => React.createElement('div', null),
        Cell: () => React.createElement('div', null),
        Legend: () => React.createElement('div', null),
        LineChart: ({ children }: any) => React.createElement('div', { 'data-testid': 'mock-line-chart' }, children),
        Line: () => React.createElement('div', null),
    };
});

// Mock MediaDevices
if (typeof navigator !== 'undefined') {
    Object.defineProperty(navigator, 'mediaDevices', {
        value: {
            enumerateDevices: vi.fn().mockResolvedValue([
                { kind: 'videoinput', label: 'Facecam 1', deviceId: 'cam1' }
            ]),
            getUserMedia: vi.fn().mockResolvedValue({})
        },
        writable: true,
        configurable: true
    });

    // Mock Credentials
    Object.defineProperty(navigator, 'credentials', {
        value: {
            get: vi.fn(),
            create: vi.fn()
        },
        writable: true,
        configurable: true
    });
}

// Mock PublicKeyCredential
Object.defineProperty(window, 'PublicKeyCredential', {
    value: vi.fn(),
    writable: true,
    configurable: true
});

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// Mock Notification System globally for tests
vi.mock('./components/NotificationProvider', () => ({
    useNotifications: () => ({
        showToast: vi.fn(),
    }),
    NotificationProvider: ({ children }: any) => children,
}));

// Mock Firebase globally for tests
vi.mock('./lib/firebase', () => ({
    auth: {
        onAuthStateChanged: vi.fn((cb) => cb({ uid: 'test-shop-id', email: 'owner@test.com' })),
        currentUser: { uid: 'test-shop-id' }
    },
    db: {},
    storage: {},
    getEnv: vi.fn((key) => {
        if (key === 'VITE_SHOP_ID') return 'test-shop-id';
        return undefined;
    })
}));

import { INITIAL_STAFF, INITIAL_INVENTORY, INITIAL_SUPPLIERS } from './constants';

// ... (existing mocks)

// Mock Firestore globally for tests
vi.mock('./lib/firestore', () => ({
    // Subscriptions
    subscribeToStaff: vi.fn((_, cb) => { cb(INITIAL_STAFF); return () => { }; }),
    subscribeToAttendance: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToTasks: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToNotifications: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToLeaves: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToRota: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToRotaPreferences: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToShopSettings: vi.fn((_, cb) => { cb({ timings: {} }); return () => { }; }),
    subscribeToInventory: vi.fn((_, cb) => { cb(INITIAL_INVENTORY); return () => { }; }),
    subscribeToTransactions: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToDailySales: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToSuppliers: vi.fn((_, cb) => { cb(INITIAL_SUPPLIERS); return () => { }; }),
    subscribeToBills: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToExpenses: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToPurchases: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToDailyChecks: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToExpiryLogs: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToCleaningLogs: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToSalaries: vi.fn((_, cb) => { cb([]); return () => { }; }),
    subscribeToLedger: vi.fn((_, cb) => { cb([]); return () => { }; }),

    // Actions
    processTransaction: vi.fn(),
    logAction: vi.fn(),
    addStaffMember: vi.fn(),
    updateStaffMember: vi.fn(),
    deleteStaffMember: vi.fn(),
    addAttendanceRecord: vi.fn(),
    updateAttendanceRecord: vi.fn(),
    deleteAttendanceRecord: vi.fn(),
    addInventoryItem: vi.fn(),
    updateInventoryItem: vi.fn(),
    deleteInventoryItem: vi.fn(),
    addLeaveRequest: vi.fn(),
    updateLeaveRequest: vi.fn(),
    deleteLeaveRequest: vi.fn(),
    addTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    addNotification: vi.fn(),
    markNotificationRead: vi.fn(),
    deleteNotification: vi.fn(),
    publishRota: vi.fn(),
    saveRotaPreference: vi.fn(),
    updateLeaveStatus: vi.fn(),

    // Refs
    getStaffRef: vi.fn(),
    getStaffDocRef: vi.fn(),
    getInventoryRef: vi.fn(),
    getAttendanceRef: vi.fn(),
    getTasksRef: vi.fn(),
    getNotificationsRef: vi.fn(),
    getRotaRef: vi.fn(),
    getRotaPreferencesRef: vi.fn(),
}));

// Mock Firebase Firestore globally for tests
vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => ({})),
    collection: vi.fn(),
    doc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot: vi.fn((ref, cb, errorCb) => {
        if (typeof cb === 'function') {
            cb({
                empty: true,
                docs: [],
                docChanges: () => [],
                forEach: function (f: any) { this.docs.forEach(f); }
            });
        }
        return () => { };
    }),
    setDoc: vi.fn(),
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
    getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
    serverTimestamp: vi.fn(() => new Date().toISOString()),
    increment: vi.fn(),
    writeBatch: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        commit: vi.fn()
    })),
}));

// Mock Canvas for Recharts/Rendering
(global as any).HTMLCanvasElement.prototype.getContext = vi.fn();

// Mock lucide-react globally with a robust Proxy that handles any icon request
vi.mock('lucide-react', async () => {
    const React = await import('react');
    return new Proxy({}, {
        get: (target, prop) => {
            // Return a simple div for any requested icon
            const IconMock = (props: any) => React.createElement('div', { 
                'data-testid': `lucide-${String(prop).toLowerCase()}`,
                ...props 
            });
            IconMock.displayName = String(prop);
            return IconMock;
        }
    });
});
