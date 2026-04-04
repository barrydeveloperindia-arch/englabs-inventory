import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { isExpired, checkExpiryRisk } from '../../lib/utils'; // Assuming these functions exist

/**
 * 🛡️ UNIT TEST: CORE UTILITIES
 * ------------------------------------------------------------------
 * Objective: Verify date handling and risk assessment logic.
 */

describe('⚙️ Core Utils', () => {

    // Freeze time for consistent date testing
    beforeEach(() => {
        vi.useFakeTimers();
        // Set "Today" to Jan 1st 2024
        const date = new Date(2024, 0, 1);
        vi.setSystemTime(date);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    describe('isExpired', () => {
        it('returns TRUE for past dates', () => {
            // Expired yesterday (Dec 31 2023)
            const past = '2023-12-31';
            expect(isExpired(past)).toBe(true);
        });

        it('returns FALSE for future dates', () => {
            // Expires tomorrow (Jan 2 2024)
            const future = '2024-01-02';
            expect(isExpired(future)).toBe(false);
        });

        it('handles undefined input gracefully', () => {
            expect(isExpired(undefined)).toBe(false);
        });
    });

    describe('checkExpiryRisk (Alerting)', () => {
        it('warns if expiry is within 7 days', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            // Expires in 3 days (Jan 4 2024)
            const product = { name: 'Milk', expiryDate: '2024-01-04' };

            checkExpiryRisk(product);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Expiry soon'));
        });

        it('does NOT warn if expiry is safe (> 7 days)', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

            // Expires in 20 days
            const product = { name: 'Honey', expiryDate: '2024-01-21' };

            checkExpiryRisk(product);

            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });
});
