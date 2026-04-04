import { vi, describe, it, expect, beforeEach } from 'vitest';
import { logAudit } from '../../lib/audit';
import { db } from '../../lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

// Mock Firebase
vi.mock('../../lib/firebase', () => ({
    db: {},
    auth: { currentUser: { uid: 'test-shop' } }
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(),
    collection: vi.fn(),
    addDoc: vi.fn(),
    serverTimestamp: vi.fn(() => 'MOCK_TIMESTAMP')
}));

describe('Audit Logger', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('writes a valid audit log entry to Firestore', async () => {
        const mockDetails = { price: 10, newPrice: 12 };

        await logAudit(
            'shop-123',
            'INVENTORY_UPDATE',
            'user-456',
            'Manager',
            mockDetails,
            'item-789'
        );

        // Verify Collection Reference
        expect(collection).toHaveBeenCalledWith(db, 'shops', 'shop-123', 'audit_logs');

        // Verify Document Write
        expect(addDoc).toHaveBeenCalledWith(undefined, {
            action: 'INVENTORY_UPDATE',
            actorId: 'user-456',
            actorType: 'Manager',
            resourceId: 'item-789',
            details: mockDetails,
            timestamp: 'MOCK_TIMESTAMP', // Verified via mock implementation
            deviceInfo: expect.any(String)
        });
    });

    it('handles generic system logs correctly', async () => {
        await logAudit(
            'shop-123',
            'SYSTEM_CONFIG_CHANGE',
            'system',
            'System' as any,
            { message: 'Backup complete' }
        );

        expect(addDoc).toHaveBeenCalledWith(undefined, expect.objectContaining({
            action: 'SYSTEM_CONFIG_CHANGE',
            actorId: 'system'
        }));
    });
});
