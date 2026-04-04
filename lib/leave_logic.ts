
import { LeaveRequest, StaffMember } from '../types';

/**
 * LEAVE MANAGEMENT LOGIC
 * Core business logic for leave requests, validation, and status transitions.
 * Decoupled from React components for testing.
 */

// ------------------------------------------------------------------
// 1. VALIDATION LOGIC
// ------------------------------------------------------------------

export const validateLeaveRequest = (
    startDate: string,
    endDate: string,
    existingRequests: LeaveRequest[] = []
): { isValid: boolean; error?: string; totalDays?: number } => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate date comparison

    // 1. Basic Date Logic
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { isValid: false, error: 'Invalid dates format' };
    }

    if (end < start) {
        return { isValid: false, error: 'End date cannot be before start date' };
    }

    if (start < today) {
        return { isValid: false, error: 'Cannot request leave in the past' };
    }

    // 2. Overlap Check
    const hasOverlap = existingRequests.some(req => {
        if (req.status === 'Rejected' || req.status === 'Cancelled') return false; // Ignore inactive
        const reqStart = new Date(req.startDate);
        const reqEnd = new Date(req.endDate);

        // Logic: (StartA <= EndB) and (EndA >= StartB)
        return start <= reqEnd && end >= reqStart;
    });

    if (hasOverlap) {
        return { isValid: false, error: 'Request overlaps with an existing leave request' };
    }

    // 3. Calculation
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return { isValid: true, totalDays };
};

// ------------------------------------------------------------------
// 2. STATUS TRANSITIONS
// ------------------------------------------------------------------

export const canTransitionStatus = (
    currentStatus: LeaveRequest['status'],
    newStatus: LeaveRequest['status'],
    userRole: string,
    isOwnRequest: boolean
): boolean => {
    // Defines allowed transitions based on current state

    // 1. Cancellation (User cancels own request)
    if (newStatus === 'Cancelled') {
        if (isOwnRequest && currentStatus === 'Pending') return true;
        return false;
    }

    // 2. Approval/Rejection (Admin Logic)
    const isAdmin = ['Owner', 'Director', 'Manager'].includes(userRole);
    if (!isAdmin) return false;

    if (currentStatus === 'Pending') {
        return newStatus === 'Approved' || newStatus === 'Rejected';
    }

    // Allow Admin to revoke approval (Approved -> Rejected)
    if (currentStatus === 'Approved' && newStatus === 'Rejected') {
        return true;
    }

    return false;
};
