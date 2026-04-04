
import { describe, it, expect } from 'vitest';

describe('Global Environment Check', () => {
    it('crypto.randomUUID is available', () => {
        expect(typeof crypto !== 'undefined').toBe(true);
        expect(typeof crypto.randomUUID).toBe('function');
        const uuid = crypto.randomUUID();
        expect(uuid).toMatch(/^[0-9a-f-]{36}$/i);
    });
});
