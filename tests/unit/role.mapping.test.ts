
import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../lib/rbac';
import { UserRole } from '../../types';

describe('🛡️ Unit: Role Permission Mapping', () => {

    it('Grants Business Coordinator full financial permissions', () => {
        const role: UserRole = 'Business Coordinator';
        expect(hasPermission(role, 'financials.manage')).toBe(true);
        expect(hasPermission(role, 'users.manage')).toBe(true);
        expect(hasPermission(role, 'reports.export')).toBe(true);
    });

    it('Grants Shop Assistant basic inventory and sales access', () => {
        const role: UserRole = 'Shop Assistant';
        expect(hasPermission(role, 'sales.process')).toBe(true);
        expect(hasPermission(role, 'inventory.read')).toBe(true);
        expect(hasPermission(role, 'inventory.update')).toBe(true);
    });

    it('Denies Shop Assistant admin privileges', () => {
        const role: UserRole = 'Shop Assistant';
        expect(hasPermission(role, 'financials.manage')).toBe(false);
        expect(hasPermission(role, 'users.manage')).toBe(false);
    });
});
