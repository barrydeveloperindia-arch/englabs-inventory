import { Permission, RoleDefinition, UserRole } from '../types';

// Default Role Permissions Matrix based on User Requirements
// 1. Owner: Full Access
// 2. Manager: Inventory (Full), Reports (Read), NO Users/Billing
// 3. Staff: POS, Stock View, NO Delete/Export

export const DEFAULT_ROLES: RoleDefinition[] = [
    {
        id: 'owner',
        role: 'Owner',
        description: 'Full administrative access across all modules.',
        permissions: [
            'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
            'sales.process', 'sales.read', 'sales.refund',
            'users.manage',
            'reports.view', 'reports.export',
            'billing.manage',
            'financials.manage',
            'terminal.unlock',
            'rota.plan'
        ]
    },
    {
        id: 'director', // Mapping Director to Owner-level permissions as they are typically Owners too
        role: 'Director',
        description: 'Director - Full access alias.',
        permissions: [
            'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
            'sales.process', 'sales.read', 'sales.refund',
            'users.manage',
            'reports.view', 'reports.export',
            'billing.manage',
            'financials.manage',
            'terminal.unlock',
            'rota.plan'
        ]
    },
    {
        id: 'manager',
        role: 'Manager',
        description: 'Full control over Inventory; Read-only Reports; No User/Billing access.',
        permissions: [
            'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
            'sales.process', 'sales.read', 'sales.refund',
            'reports.view',
            'terminal.unlock',
            'rota.plan',
            'users.manage'
            // EXCLUDED: billing.manage, reports.export (if interpreted as "No Export capabilities")
        ]
    },
    {
        id: 'staff',
        role: 'Cashier', // Maps to "Staff"
        description: 'Restricted access: POS and Stock View only. No Delete/Export.',
        permissions: [
            'sales.process',
            'inventory.read' // Viewing Stock levels only
            // EXCLUDED: inventory.create/update/delete, reports.*, etc.
        ]
    },
    // Mapping other legacy roles to "Staff" equivalent or "Manager" equivalent
    {
        id: 'store_in_charge',
        role: 'Store In-charge',
        description: 'Store In-charge - Manager Level',
        permissions: [
            'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
            'sales.process', 'sales.read', 'sales.refund',
            'reports.view',
            'terminal.unlock',
            'rota.plan'
        ]
    },
    {
        id: 'assistant',
        role: 'Assistant',
        description: 'Assistant - Staff Level',
        permissions: [
            'sales.process',
            'inventory.read'
        ]
    },
    {
        id: 'inventory_staff',
        role: 'Inventory Staff',
        description: 'Inventory Management Staff',
        permissions: [
            'inventory.create', 'inventory.read', 'inventory.update',
            'inventory.delete'
        ]
    },
    {
        id: 'till_manager',
        role: 'Till Manager',
        description: 'Till Supervisor',
        permissions: [
            'sales.process', 'sales.read', 'sales.refund',
            'inventory.read'
        ]
    },
    {
        id: 'store_management',
        role: 'Store Management',
        description: 'Store Management Team',
        permissions: [
            'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
            'sales.process', 'sales.read', 'sales.refund',
            'reports.view',
            'terminal.unlock',
            'rota.plan',
            'users.manage'
        ]
    },
    {
        id: 'business_coordinator',
        role: 'Business Coordinator',
        description: 'Business Coordinator - Owner Level',
        permissions: [
            'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
            'sales.process', 'sales.read', 'sales.refund',
            'users.manage',
            'reports.view', 'reports.export',
            'billing.manage',
            'financials.manage',
            'terminal.unlock',
            'rota.plan'
        ]
    },
    {
        id: 'shop_assistant',
        role: 'Shop Assistant',
        description: 'Shop Assistant - Sales & Inventory',
        permissions: [
            'sales.process',
            'inventory.read', 'inventory.update', 'inventory.create'
        ]
    },
    {
        id: 'accounts_officer',
        role: 'Accounts Officer',
        description: 'Accounts Officer - Financial & Payroll Management',
        permissions: [
            'financials.manage',
            'billing.manage',
            'reports.view', 'reports.export',
            'users.manage' // Required to edit Staff Timesheets
        ]
    }
];

// Helper to check permissions
export const hasPermission = (userRole: UserRole, requiredPermission: Permission): boolean => {
    const roleDef = DEFAULT_ROLES.find(r => r.role.toLowerCase() === String(userRole).toLowerCase());
    if (!roleDef) return false;

    // Owners/Directors typically have bypass, but checking explicit list is safer for RBAC
    return roleDef.permissions.includes(requiredPermission);
};

// Helper to get all permissions for a role (frontend usage)
export const getRolePermissions = (role: UserRole): Permission[] => {
    return DEFAULT_ROLES.find(r => r.role === role)?.permissions || [];
};
