# RBAC Implementation & Security Hardening

## Overview
This document outlines the final implementation of Role-Based Access Control (RBAC) for the ENGLABS INVENTORY Command OS. The system has moved from accurate simple Role checks to a granular **Permission-Based Architecture**.

## 1. Authentication & Authorization Concept
- **Identity**: Managed via Firebase Auth.
- **Role Assignment**: `UserRole` linked to Staff Profile.
- **Authorization**: Components check specific **Permissions** (e.g., `inventory.create`) rather than Roles (`isAdmin`).

## 2. Default Access Control Matrix (Source: `lib/rbac.ts`)

| Feature Area | Permission ID | Owner / Director | Manager | Staff / Cashier |
| :--- | :--- | :---: | :---: | :---: |
| **User Mgmt** | `users.manage` | ✅ | ❌ | ❌ |
| **Inventory Edit** | `inventory.update` | ✅ | ✅ | ❌ |
| **Inventory View** | `inventory.read` | ✅ | ✅ | ✅ |
| **Sales POS** | `sales.process` | ✅ | ✅ | ✅ |
| **Reports Export** | `reports.export` | ✅ | ❌ | ❌ |
| **Financials** | `financials.manage`| ✅ | ❌ | ❌ |

## 3. Specific Role Constraints

### A. Owners (Core Management)
- **Full Access**: Can manage Users, Finances, Inventory, and Settings.
- **Sync Capability**: Can force sync Roles to Firestore.

### B. Managers (Management Support)
- **Operational Focus**: Full control over Inventory (Stock, Prices, Products).
- **Restricted**:
  - **Cannot** Add/Edit/Delete Staff members (`users.manage` denied).
  - **Cannot** Export Data (`reports.export` denied).
  - **Cannot** Access sensitive Financial configurations.

### C. Staff (Cashiers, Assistants)
- **Task Focus**: Sales Processing & Terminal Operations.
- **Restricted**:
  - **Read-Only** Access to Inventory (Stock check).
  - **No Delete**: Cannot remove items from Inventory.
  - **No Export**: Cannot download CSVs.

## 4. Technical Implementation
- **Definition**: Roles and Permissions defined in `lib/rbac.ts`.
- **Enforcement**:
  - `hasPermission(role, permission)` helper used in UI components.
  - **StaffView**: `users.manage` guards "Add Staff", "Sync Roles", and "Edit" buttons.
  - **InventoryView**: `inventory.update` guards Edit Modal; `reports.export` guards CSV Export.
  - **Navigation**: Sidebar items filtered by base accessibility.

## 5. Security Hardening Measures
- **Principle of Least Privilege**: Default roles (e.g., Cashier) have stripped-down permissions.
- **Fail-Safe**: If a user role is undefined, it defaults to **No Permissions** in the RBAC logic.
- **Audit Ready**: Architecture supports logging permission checks (future scope: `logAction` integration for Access Denied events).

## 6. Next Steps
- **Database Seeding**: The `DEFAULT_ROLES` structure is ready to be seeded into a dedicated `roles` collection in Firestore for dynamic admin updates.
- **Audit Logging**: Enhance `logAction` to record failed permission attempts.
