import { describe, it, expect } from 'vitest';
import { hasPermission } from '../../lib/rbac';
import { UserRole } from '../../types';

/**
 * 🛡️ UNIT TEST: SECURITY & RBAC
 * ------------------------------------------------------------------
 * Objective: Verify Role-Based Access Control logic is secure.
 * Critical Standards:
 * 1. Low-privilege users (Cashier) must NOT have destructive permissions.
 * 2. High-privilege users (Owner) must have full access.
 * 3. Fallback logic should deny unknown roles.
 */

describe('🔐 Security Kernel (RBAC)', () => {

    describe('Role: Cashier (Low Privilege)', () => {
        const ROLE = 'Cashier' as UserRole;

        it('CAN process sales', () => {
            expect(hasPermission(ROLE, 'sales.process')).toBe(true);
        });

        it('CANNOT delete inventory', () => {
            expect(hasPermission(ROLE, 'inventory.delete')).toBe(false);
        });

        it('CANNOT export reports (Data Leakage Protection)', () => {
            expect(hasPermission(ROLE, 'reports.export')).toBe(false);
        });

        it('CANNOT manage users', () => {
            expect(hasPermission(ROLE, 'users.manage')).toBe(false);
        });
    });

    describe('Role: Manager', () => {
        const ROLE = 'Manager' as UserRole;

        it('CAN manage inventory', () => {
            expect(hasPermission(ROLE, 'inventory.create')).toBe(true);
            expect(hasPermission(ROLE, 'inventory.delete')).toBe(true);
        });

        it('CANNOT manage billing/financials (Financial Control)', () => {
            expect(hasPermission(ROLE, 'financials.manage')).toBe(false);
        });
    });

    describe('Role: Owner (Super Admin)', () => {
        const ROLE = 'Owner' as UserRole;

        it('HAS Omni-access', () => {
            expect(hasPermission(ROLE, 'inventory.delete')).toBe(true);
            expect(hasPermission(ROLE, 'financials.manage')).toBe(true);
            expect(hasPermission(ROLE, 'users.manage')).toBe(true);
        });
    });

    describe('Edge Cases', () => {
        it('Defaults to DENY for unknown roles', () => {
            expect(hasPermission('Hacker' as any, 'inventory.read')).toBe(false);
        });
    });
});
