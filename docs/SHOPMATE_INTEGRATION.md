# ShopMate Till Integration & Backward Compatibility

## Overview
This document outlines the compatibility strategy between the new **ENGLABS INVENTORY HR & Payroll System** and the existing **ShopMate EPoS System**.

## Current Integration Status
- **Inventory & Sales**: The system currently supports importing ShopMate data via CSV exports. This ensures that sales figures and inventory levels can be synchronized without direct API integration.
- **Staff Management**: ShopMate handles basic staff logins for till access. Our new HR system handles comprehensive staff management (Shift planning, Payroll, Leaves).

## Backward Compatibility Analysis
### 1. Staff Identifiers
- **ShopMate**: Uses simple Clerk IDs or Usernames.
- **ENGLABS INVENTORY**: Uses Firebase Auth UIDs and Staff IDs.
- **Strategy**: We can map ShopMate Clerk IDs to our Staff IDs in the `StaffMember` profile (e.g., adding a `shopmateId` field). This allows us to attribute sales imported from ShopMate CSVs to the correct staff member for performance tracking.

### 2. Payroll Data
- ShopMate does not manage complex payroll (Tax/NI/Pension).
- **No Conflict**: Our Payroll module is additive. It does not interfere with ShopMate operations. ShopMate remains the source of truth for *Sales Cash*, while ENGLABS INVENTORY becomes the source of truth for *Staff Costs*.

### 3. Workflow Coexistence
- **Till Operation**: Staff continue to use ShopMate for sales.
- **Clock-In/Out**: Staff use the ENGLABS INVENTORY Terminal (Tablet) for attendance.
- **Reconciliation**: Managers reconcile ShopMate "Z-Read" totals with ENGLABS INVENTORY "Cash Up" declarations.

## Future Roadmap: API Integration
- Investigate ShopMate API availability for real-time sales syncing.
- Automate "Z-Read" ingestion.
- Sync Staff Pins between systems (if supported).

## Conclusion
The new Payroll features are fully backward compatible as they operate in a parallel data layer. No changes are required on the ShopMate till configuration.
