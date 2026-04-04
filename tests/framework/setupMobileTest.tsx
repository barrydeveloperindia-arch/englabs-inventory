
import { vi } from 'vitest';
import { createFirestoreMock } from './FirestoreMock';
import * as validation from './MobileTestUtils';

export const setupMobileTestEnv = () => {
    // 1. Mock Timer Environment
    vi.useFakeTimers();

    // 2. Mock Firebase Auth
    vi.mock('firebase/auth', () => ({
        getAuth: vi.fn(),
        onAuthStateChanged: vi.fn((auth, callback) => {
            // Default to Owner for general tests
            callback({ uid: 'owner-uid', email: 'owner@test.com' });
            return () => { };
        }),
        signOut: vi.fn()
    }));

    // 3. Mock Firestore (Smart Mock)
    vi.mock('firebase/firestore', () => createFirestoreMock());

    // 4. Mock Recharts
    vi.mock('recharts', async () => {
        const Original = await vi.importActual('recharts');
        return {
            ...Original,
            ResponsiveContainer: ({ children }: any) => <div style={ { width: '100%', height: 400 } }> { children } </div>
    };
});

return {
    resize: validation.resizeWindow,
    viewports: validation.MOBILE_VIEWPORTS
};
};

export const cleanupMobileTestEnv = () => {
    vi.clearAllMocks();
    vi.useRealTimers();
};
