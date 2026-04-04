# Access Control Verification Report

## 1. Overview
This document outlines the Access Control Matrix for the **ENGLABS INVENTORY** application. It explicitly defines which specific application modules and views are accessible to each User Role. The primary focus is to verify that frontline staff (Shop Assistants, Cashiers) have necessary access to operational tools (Sales, Staff Check-in) while restricted from administrative functions.

## 2. User Roles
The system recognizes the following hierarchical roles (defined in `types.ts`):
- **Executive**: `Owner`, `Director`
- **Management**: `Business Coordinator`, `Manager`, `Store In-charge`, `Store Management`
- **Operational**: `Till Manager`, `Inventory Staff`
- **Frontline**: `Shop Assistant`, `Cashier`, `Assistant`

## 3. Access Matrix (Sidebar Navigation)

The following matrix verifies the visible navigation tabs for each role.

| Module | ID | Executive | Management | Operational | Frontline (Shop Assistant/Cashier) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Command Center** | `dashboard` | ✅ | ✅ | ❌ | ❌ |
| **Terminal Sales** | `sales` | ✅ | ✅ | ✅ | ✅ |
| **Inventory** | `inventory` | ✅ | ✅ | ✅ (Inventory Staff) | ✅ (Shop Asst/Assistant) / ❌ (Cashier*) |
| **Staff Management** | `staff` | ✅ | ✅ | ✅ | ✅ |
| **Financials** | `financials` | ✅ | ❌ | ❌ | ❌ |
| **Procurement** | `purchases` | ✅ | ✅ | ❌ | ❌ |
| **Master Sales** | `sales-ledger` | ✅ | ✅ | ❌ | ❌ |
| **Supply Chain** | `suppliers` | ✅ | ✅ | ❌ | ❌ |
| **AI Intake** | `smart-intake` | ✅ | ✅ | ❌ | ❌ |

*\*Note: Cashiers are typically restricted from Inventory editing, but Sidebar access logic currently groups 'Assistant` and 'Inventory Staff'.*

## 4. Current Findings & Fixes
**Incident**: Staff Member "Nisha" (Role: `Shop Assistant`) reported missing access to **Staff Management** and **Terminal Sales**.
**Root Cause**: The `NavigationSidebar.tsx` component explicitly listed `Assistant` but omitted `Shop Assistant` in the `roleLimit` arrays.
**Resolution**: The Sidebar logic has been updated to explicitly include `Shop Assistant` in the allowed roles for:
- Terminal Sales
- Inventory
- Staff Management

## 5. Verification Test Plan
A dedicated UI test suite (`tests/rbac/sidebar_access.test.tsx`) has been created to validate:
1.  **Shop Assistant Access**: Verifies `Shop Assistant` sees 'Terminal Sales', 'Inventory', and 'Staff Management'.
2.  **Manager Access**: Verifies `Manager` sees 'Command Center', 'Procurement', etc.
3.  **Restriction Check**: Verifies `Shop Assistant` generally does NOT see 'Financials' or 'Command Center'.
