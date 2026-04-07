import { describe, it, expect } from 'vitest';

describe('System Sanity Check', () => {
    it('should pass basic math', () => {
        expect(1 + 1).toBe(2);
    });

    it('should have a clean environment', () => {
        expect(process.env.NODE_ENV).toBeDefined();
    });
});
