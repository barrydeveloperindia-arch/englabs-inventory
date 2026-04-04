
import { describe, it, expect } from 'vitest';
import { INITIAL_STAFF } from '../../constants';

/**
 * 🛡️ STAFF DATA INTEGRITY TEST (BASELINE VERSION)
 * This test suite ensures that the staff names and photos remain consistent 
 * with the absolute baseline shop records.
 */
describe('🛡️ Staff Data Integrity', () => {

    it('should match the exact baseline staff list from constants.tsx', () => {
        const expectedStaff = [
            'ENGLABS ADMIN',
            'Bharat Anand',
            'Salil Anand',
            'Gaurav Panchal',
            'Nayan Kumar Godhani',
            'Nisha',
            'Paras',
            'Parth'
        ];
 
        const currentStaffNames = INITIAL_STAFF.map(s => s.name);
 
        expectedStaff.forEach(name => {
            expect(currentStaffNames).toContain(name);
        });
 
        expect(currentStaffNames.length).toBe(8);
    });
 
    it('should have correct roles and valid photos (no empty strings)', () => {
        INITIAL_STAFF.forEach((s: any) => {
            // Updated to be more flexible (logo or unsplash)
            expect(s.photo).toBeTruthy();
            expect(s.photo.length).toBeGreaterThan(5);
        });
 
        const bharat = INITIAL_STAFF.find(s => s.name === 'Bharat Anand');
        expect(bharat?.role).toBe('Owner');
    });
 
    it('should maintain original PINs', () => {
        const pins = INITIAL_STAFF.map(s => ({ name: s.name, pin: s.pin }));
 
        expect(pins).toContainEqual({ name: 'Bharat Anand', pin: '1111' });
        expect(pins).toContainEqual({ name: 'Salil Anand', pin: '4444' });
        expect(pins).toContainEqual({ name: 'Nisha', pin: '9999' });
        expect(pins).toContainEqual({ name: 'ENGLABS ADMIN', pin: '0001' });
    });
});
