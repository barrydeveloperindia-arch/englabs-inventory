
import { describe, it, expect } from 'vitest';
import { validateLeaveRequest, canTransitionStatus } from '../../lib/leave_logic';
import { LeaveRequest } from '../../types';

/**
 * 🛡️ UNIT TEST: LEAVE MANAGEMENT LOGIC
 * ------------------------------------------------------------------
 * Objective: Verify validation rules and workflow transitions.
 */

describe('🏖️ Leave Logic Kernel', () => {

    describe('validateLeaveRequest', () => {
        const today = new Date();
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const dayAfter = new Date(today); dayAfter.setDate(today.getDate() + 2);

        const validStart = tomorrow.toISOString().split('T')[0];
        const validEnd = dayAfter.toISOString().split('T')[0];

        it('Rejects end date before start date', () => {
            const result = validateLeaveRequest('2026-05-05', '2026-05-01');
            expect(result.isValid).toBe(false);
            expect(result.error).toMatch(/before start date/);
        });

        it('Rejects past dates', () => {
            const past = new Date(); past.setDate(past.getDate() - 5);
            const pastStr = past.toISOString().split('T')[0];
            const result = validateLeaveRequest(pastStr, pastStr);
            expect(result.isValid).toBe(false);
            expect(result.error).toMatch(/past/);
        });

        it('Calculates days correctly (Inclusive)', () => {
            const result = validateLeaveRequest('2026-05-01', '2026-05-05');
            expect(result.isValid).toBe(true);
            expect(result.totalDays).toBe(5);
        });

        it('Detects Overlaps', () => {
            const existing: LeaveRequest[] = [
                { id: '1', startDate: '2026-05-01', endDate: '2026-05-05', status: 'Approved' } as any
            ];

            // Overlap Case: 2026-05-04 to 2026-05-06
            const result = validateLeaveRequest('2026-05-04', '2026-05-06', existing);
            expect(result.isValid).toBe(false);
            expect(result.error).toMatch(/overlaps/);
        });

        it('Ignores Rejected/Cancelled requests for Overlap', () => {
            const existing: LeaveRequest[] = [
                { id: '1', startDate: '2026-05-01', endDate: '2026-05-05', status: 'Rejected' } as any
            ];

            const result = validateLeaveRequest('2026-05-04', '2026-05-06', existing);
            expect(result.isValid).toBe(true);
        });
    });

    describe('Workflow Transitions (canTransitionStatus)', () => {

        it('Allows User to CANCEL their own PENDING request', () => {
            expect(canTransitionStatus('Pending', 'Cancelled', 'Cashier', true)).toBe(true);
        });

        it('Prevents User from CANCELLING an APPROVED request', () => {
            expect(canTransitionStatus('Approved', 'Cancelled', 'Cashier', true)).toBe(false);
        });

        it('Allows Manager to APPROVE Pending request', () => {
            expect(canTransitionStatus('Pending', 'Approved', 'Manager', false)).toBe(true);
        });

        it('Allows Manager to REJECT Pending request', () => {
            expect(canTransitionStatus('Pending', 'Rejected', 'Manager', false)).toBe(true);
        });

        it('Prevents Cashier from APPROVING requests', () => {
            expect(canTransitionStatus('Pending', 'Approved', 'Cashier', false)).toBe(false);
        });

    });

});
