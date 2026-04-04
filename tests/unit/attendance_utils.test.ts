
import { describe, it, expect } from 'vitest';
import { checkAutoCheckout, calculateWorkedHours } from '../../lib/attendance_utils';

describe('Auto-Checkout Safety Net', () => {

    it('should checkout if shift is from previous day', () => {
        const today = new Date('2026-02-12T10:00:00Z');
        const shiftDate = '2026-02-11';

        const result = checkAutoCheckout(
            shiftDate,
            '09:00',
            '2026-02-12',
            today,
            '23:00'
        );

        expect(result.shouldCheckOut).toBe(true);
        expect(result.reason).toBe('Previous Day');
    });

    it('should NOT checkout if shift is today and within normal hours', () => {
        const today = new Date('2026-02-12T14:00:00Z'); // 2 PM
        const shiftDate = '2026-02-12';

        const result = checkAutoCheckout(
            shiftDate,
            '09:00',
            '2026-02-12',
            today,
            '23:00'
        );

        expect(result.shouldCheckOut).toBe(false);
    });

    it('should checkout if shift is today but 4+ hours past closing time', () => {
        // Mock "Current Time" as 3:00 AM the NEXT day effectively, but dated same day for logic
        // Wait... the logic compares times. 
        // If current time is 03:00 (Next Day technically), but logic runs based on date strings?
        // Ah, the code handles "Today" logic using `now.getTime()`.

        // Scenario: Shop Closes at 23:00.
        // Current Time: 03:01 AM (Next Day). 
        // Date String for "Today" would be Next Day. And Date String for Shift would be Previous Day.
        // So Scenario 1 covers it.

        // Scenario: Shop Closes at 18:00 (6 PM).
        // Current Time: 23:00 (11 PM). Buffer is 4 hours (10 PM).
        // Shift Date: Today.

        const today = new Date('2026-02-12T23:00:00'); // 11 PM
        const shiftDate = '2026-02-12';

        const result = checkAutoCheckout(
            shiftDate,
            '09:00',
            '2026-02-12',
            today,
            '18:00' // Closing at 6 PM
        );

        // 18:00 + 4 hours = 22:00.
        // 23:00 > 22:00 -> TRUE
        expect(result.shouldCheckOut).toBe(true);
        expect(result.reason).toBe('Past Closing Limit');
    });

    it('should calculate hours correctly', () => {
        const h = calculateWorkedHours('09:00', '17:30'); // 8.5 hours
        expect(h).toBeCloseTo(8.5);
    });
});
