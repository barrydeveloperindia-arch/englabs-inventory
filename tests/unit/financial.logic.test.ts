import { describe, it, expect } from 'vitest';
import { finalPrice, getVATByCategory } from '../../lib/utils';
// Note: We are testing pure logic here, no React components.

/**
 * 🛡️ UNIT TEST: FINANCIAL LOGIC
 * ------------------------------------------------------------------
 * Objective: Verify core financial calculations are mathematically correct.
 * Critical Standards:
 * 1. VAT calculations must handle floating point math correctly.
 * 2. Pricing rounding must follow standard (2 decimal places).
 * 3. Categorization logic must return correct legacy VAT rates.
 */

describe('₹ Financial Logic Kernel', () => {

    describe('finalPrice (GST Calculation)', () => {
        it('calculates 18% GST correctly for standard pricing', () => {
            // 100.00 + 18% = 118.00
            expect(finalPrice(100, 18)).toBe(118.00);
        });

        it('calculates 0% GST correctly', () => {
            expect(finalPrice(10, 0)).toBe(10.00);
        });

        it('handles penny rounding correctly (Standard rounding)', () => {
            // 1.33 + 18% = 1.5694 -> Should round to 1.57
            expect(finalPrice(1.33, 18)).toBe(1.57);
        });
    });

    describe('getVATByCategory (GST Classification)', () => {
        it('returns 0% for Exempt items', () => {
            expect(getVATByCategory('WIP')).toBe(0);
            expect(getVATByCategory('Services')).toBe(0);
        });

        it('returns 18% for taxable assets (Algorithm default)', () => {
            expect(getVATByCategory('Raw Materials')).toBe(18);
            expect(getVATByCategory('Electronics')).toBe(18);
        });
    });
});
