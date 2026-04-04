import { describe, it, expect } from 'vitest';
import { calculateHours, calculateHoursWithBreak, checkLateness } from '../../lib/workforce_logic';

/**
 * 🛡️ UNIT TEST: WORKFORCE LOGIC
 * ------------------------------------------------------------------
 * Objective: Verify logic defined in docs/WORKFORCE_LOGIC.md
 */

describe('🛠️ Workforce Logic Kernel', () => {

    describe('calculateHours (Basic)', () => {
        it('calculates duration correctly', () => {
            expect(calculateHours('09:00', '13:00')).toBe(4.00);
        });

        it('handles partial hours', () => {
            expect(calculateHours('09:00', '09:30')).toBe(0.50);
            expect(calculateHours('09:00', '09:15')).toBe(0.25);
        });

        it('returns 0 if end is before start', () => {
            expect(calculateHours('13:00', '09:00')).toBe(0);
        });
    });

    describe('Breaks (Paid vs Unpaid)', () => {
        it('INCLUDES break time if Paid (Default)', () => {
            // 9-13 (4 hours), 30 min break. Paid = 4 hours paid.
            expect(calculateHoursWithBreak('09:00', '13:00', 30, true)).toBe(4.00);
        });

        it('SUBTRACTS break time if Unpaid', () => {
            // 9-13 (4 hours), 30 min break. Unpaid = 3.5 hours paid.
            expect(calculateHoursWithBreak('09:00', '13:00', 30, false)).toBe(3.50);
        });
    });

    describe('Lateness Logic', () => {
        // Spec: Grace Period 5 Mins. Standard Start 09:00.

        it('is NOT late if clocked in exactly at start', () => {
            const result = checkLateness('09:00', '09:00');
            expect(result.isLate).toBe(false);
        });

        it('is NOT late if within grace period (09:05)', () => {
            const result = checkLateness('09:05', '09:00');
            expect(result.isLate).toBe(false);
        });

        it('IS late if 1 minute past grace period (09:06)', () => {
            const result = checkLateness('09:06', '09:00');
            expect(result.isLate).toBe(true);
            expect(result.minutesLate).toBe(6);
        });

        it('calculates large delays correctly', () => {
            const result = checkLateness('10:00', '09:00');
            expect(result.isLate).toBe(true);
            expect(result.minutesLate).toBe(60);
        });
    });

});
