
# Firebase Data Schema Reference & Sync Guide

This document defines the "Golden Schema" for the ENGLABS INVENTORY Command OS.
It serves as the source of truth for all database collections, ensuring synchronization between the React Application (`types.ts`) and Migration/Import Scripts.

**Shop ID Scope:** `shops/{userId}/...`

---

## 1. Inventory Collection
**Path:** `shops/{userId}/inventory/{itemId}`

| Field | Type | App (types.ts) | Excel Import Script | Notes |
|---|---|---|---|---|
| `id` | string | `id` | `id` (barcode) | Primary Key (Barcode/SKU) |
| `barcode` | string | `barcode` | `barcode` | Essential for scanning |
| `sku` | string | `sku` | `sku` | Often same as barcode |
| `name` | string | `name` | `name` | |
| `brand` | string | `brand` | `brand` | Optional |
| `category` | string | `category` | `category` | Default: "Uncategorized" |
| `price` | number | `price` | `price` | **Selling Price** (INC VAT) |
| `costPrice` | number | `costPrice` | `costPrice` | **Cost Price** (EX VAT) |
| `stock` | number | `stock` | `stock` | **Critical Sync Point** (Not `qty`) |
| `vatRate` | number | `vatRate` | `vatRate` | Default: 20% |
| `unitType` | string | `unitType` | `unitType` | Default: 'pcs' |
| `status` | string | `status` | `status` | 'Active', 'Discontinued', etc. |
| `minStock` | number | `minStock` | - | *Missing in script, verify usage* |
| `packSize` | string | `packSize` | - | *Missing in script, verify usage* |
| `supplierId` | string | `supplierId` | - | *Missing in script, verify usage* |

> **Sync Action Required:** 
> - Ensure Excel column is named `Stock` (not Qty) or script maps it correctly (Currently script handles `stock` || `qty`).
> - Ensure Excel column `Cost` maps to `costPrice`.
> - Ensure Excel column `Price` maps to `price`.

---

## 2. Staff Collection
**Path:** `shops/{userId}/staff/{staffId}`

| Field | Type | App (types.ts) | CSV Import Script | Notes |
|---|---|---|---|---|
| `id` | string | `id` | `id` | Generated from Name (lowercase, alphanumeric) |
| `name` | string | `name` | `name` | |
| `role` | string | `role` | `role` | 'Manager', 'Cashier', 'Stock Staff' |
| `pin` | string | `pin` | `pin` | Secure PIN for POS |
| `niNumber` | string | `niNumber` | `niNumber` | National Insurance |
| `taxCode` | string | `taxCode` | `taxCode` | e.g. "1257L" |
| `hourlyRate` | number | `hourlyRate` | `hourlyRate` | Payroll calc |
| `status` | string | `status` | `status` | 'Active' |
| `contractType`| string | `contractType` | `contractType` | 'Full-time', 'Zero-hour' |
| `phone` | string | `phone` | `phone` | |
| `emergencyContact` | string | `emergencyContact` | `emergencyContact` | |
| `joinedDate` | string | `joinedDate` | - | *Missing in CSV script* |

> **Sync Action Required:**
> - Ensure `joinedDate` is populated is critical for tenure calculation? Script currently omits it, or defaults? Script does not set it. Added `updatedAt`.

---

## 3. Attendance Collection
**Path:** `shops/{userId}/attendance/{recordId}`

| Field | Type | App (types.ts) | Excel Import Script | Notes |
|---|---|---|---|---|
| `id` | string | `id` | `id` | Format: `${staffId}_${date}` |
| `staffId` | string | `staffId` | `staffId` | Foreign Key to Staff |
| `date` | string | `date` | `date` | ISO Date "YYYY-MM-DD" |
| `status` | string | `status` | `status` | 'Present', 'Absent', etc. |
| `clockIn` | string | `clockIn` | `clockIn` | "HH:mm" |
| `clockOut` | string | `clockOut` | `clockOut` | "HH:mm" |
| `hoursWorked` | number | `hoursWorked` | - | Calculated field (App typically calcs this) |
| `notes` | string | `notes` | `notes` | "Imported via Excel" |

---

## 4. Ledger & Transactions (Future Scope)
- **DailySales**: `shops/{userId}/daily_sales/{date}`
- **Transactions**: `shops/{userId}/transactions/{txnId}`
- **Ledger**: `shops/{userId}/ledger/{entryId}`

All systems references must strictly adhere to these field names to avoid data mismatch bugs (e.g. `undefined` checks in UI).
