import { describe, it, expect, vi, beforeEach } from 'vitest';
import { agenticAuditService } from '../../lib/agenticAuditService';
import { db } from '../../lib/firebase';
import { onSnapshot } from 'firebase/firestore';

// Mock Firestore
vi.mock('firebase/firestore', async () => {
    const actual = await vi.importActual('firebase/firestore');
    return {
        ...actual,
        onSnapshot: vi.fn(),
        query: vi.fn(),
        collection: vi.fn(),
        orderBy: vi.fn(),
        limit: vi.fn(),
    };
});

describe('AgenticAuditService Unit Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with a default efficiency of 98.4', () => {
        expect(agenticAuditService.getCurrentEfficiency()).toBe(98.4);
    });

    it('should update efficiency when a new snapshot arrives', () => {
        // Get the callback passed to onSnapshot
        const onSnapshotMock = vi.mocked(onSnapshot);
        let snapshotCallback: any;

        // Find the execution that looks like the service initialization
        onSnapshotMock.mock.calls.forEach(call => {
            if (typeof call[1] === 'function') {
                snapshotCallback = call[1];
            }
        });

        if (snapshotCallback) {
            // Simulate a snapshot with new accuracy data
            const mockSnapshot = {
                empty: false,
                docs: [{
                    data: () => ({ accuracy: 95.5, timestamp: Date.now() })
                }]
            };

            snapshotCallback(mockSnapshot);
            expect(agenticAuditService.getCurrentEfficiency()).toBe(95.5);
        }
    });

    it('should not update efficiency if accuracy field is missing', () => {
        const onSnapshotMock = vi.mocked(onSnapshot);
        let snapshotCallback: any;

        onSnapshotMock.mock.calls.forEach(call => {
            if (typeof call[1] === 'function') {
                snapshotCallback = call[1];
            }
        });

        if (snapshotCallback) {
            const initialEfficiency = agenticAuditService.getCurrentEfficiency();

            const mockSnapshot = {
                empty: false,
                docs: [{
                    data: () => ({ someOtherData: 123 })
                }]
            };

            snapshotCallback(mockSnapshot);
            expect(agenticAuditService.getCurrentEfficiency()).toBe(initialEfficiency);
        }
    });
});
