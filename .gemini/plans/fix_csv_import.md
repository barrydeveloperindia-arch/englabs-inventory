# Bug Fix: Daily Sales CSV Import Not Updating

The application uses a shared Shop ID (`hop-in-express-`) defined in environment variables for most core collections (Inventory, Transactions, etc.). However, several newly added or refactored modules (Financials, Purchases, Registers) were incorrectly using `auth.currentUser.uid` as the primary key for Firestore paths. This caused data to be written to and read from user-specific nodes instead of the shared shop node, leading to data invisibility and sync issues.

## Root Cause
In `FinancialsView.tsx`, the `SalesLedger` component and other functions used `auth.currentUser.uid` directly without falling back to the global `shopId`. When a user logs in (e.g., anonymously or via a new session), their UID changes, making previously imported data inaccessible and causing new imports to go to the wrong location.

## Changes

### 1. `App.tsx`
- Pass the consistent `shopId` (derived from `VITE_USER_ID`) as a `userId` prop to all major view components.

### 2. `components/FinancialsView.tsx`
- Add `userId` to `FinancialsViewProps`.
- Pass `userId` down to sub-components: `SalesLedger`, `ExpenseManager`, `PayrollBridge`.
- Replace all occurrences of `auth.currentUser.uid` with the passed `userId`.

### 3. `components/PurchasesView.tsx`
- Add `userId` to `PurchasesViewProps`.
- Replace all occurrences of `auth.currentUser.uid` (and internal fallbacks) with the passed `userId`.

### 4. `components/InventoryView.tsx`
- Add `userId` to `InventoryViewProps`.
- Replace internal `userId` calculation logic with the passed prop for consistency.

### 5. `components/RegistersView.tsx`
- Add `userId` to `RegistersViewProps`.
- Replace all occurrences of `auth.currentUser.uid` and environment fallbacks with the passed `userId`.

## Verification Plan
1. **Manual Test**: Import a Daily Sales CSV in the Financials > Sales Ledger tab.
2. **Expectation**: Data should appear immediately in the table and persist across sessions.
3. **Automated Test**: Run existing E2E tests to ensure no regressions in permissions or data flow.
