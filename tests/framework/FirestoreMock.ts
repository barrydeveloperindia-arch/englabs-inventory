
import { vi } from 'vitest';

/**
 * Creates a comprehensive mock for Firebase Firestore
 * capable of handling nested paths and returning contextual data.
 */
export const createFirestoreMock = () => {
    return {
        getFirestore: vi.fn(() => ({})),
        collection: vi.fn((db, ...paths) => ({ _path: paths.join('/') })),
        query: vi.fn((coll, ...args) => ({ _path: coll._path })),
        where: vi.fn(() => ({})),
        orderBy: vi.fn(() => ({})),
        limit: vi.fn(() => ({})),
        onSnapshot: vi.fn((query, callback) => {
            const path = query._path || 'unknown';
            // console.log(`[FirestoreMock] onSnapshot: ${path}`);

            let data: any[] = [];

            // Define Mock Data Sets
            if (path.includes('staff')) {
                data = [
                    { id: '1', name: 'John Cashier', role: 'Cashier', pin: '1234', email: 'cashier@test.com' },
                    { id: '2', name: 'Jane Owner', role: 'Owner', pin: '9999', email: 'owner@test.com' },
                    { id: '3', name: 'Mike Manager', role: 'Manager', pin: '5678', email: 'manager@test.com' }
                ];
            } else if (path.includes('transactions')) {
                data = [];
            } else if (path.includes('inventory')) {
                data = [];
            } else if (path.includes('shops') && !path.includes('/')) {
                // Root collection 'shops' or similar? 
                // However, collection(db, 'shops', uid, 'staff') means path includes 'shops'.
                // If checking specifically for Shop Document or collection of shops?
                // subscribeToShopSettings uses doc(db, 'shops', uid, ...)
                // Doc listeners use onSnapshot on doc ref.
                data = [];
            } else {
                data = [];
            }

            // Trigger callback immediately
            callback({
                empty: data.length === 0,
                docs: data.map(d => ({
                    id: d.id,
                    data: () => d
                })),
                docChanges: () => [],
                forEach: (fn: any) => data.forEach(d => fn({ id: d.id, data: () => d })),
                // For document snapshots (if needed)
                exists: () => data.length > 0,
                data: () => data[0] || null,
                id: 'mock-doc-id'
            });

            return () => { };
        }),
        doc: vi.fn((db, ...paths) => ({ _path: paths.join('/') })),
        setDoc: vi.fn(),
        updateDoc: vi.fn(),
        addDoc: vi.fn(),
        deleteDoc: vi.fn(),
        serverTimestamp: vi.fn(),
        writeBatch: vi.fn(() => ({
            set: vi.fn(),
            update: vi.fn(),
            commit: vi.fn()
        }))
    };
};
