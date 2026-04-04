# ENGLABS INVENTORY Command OS - Backend Schema & Configuration

## 1. Overview
This document serves as the definitive technical reference for the **ENGLABS INVENTORY Command OS** backend architecture. The system relies on **Google Firebase** for backend-as-a-service (BaaS) capabilities, utilizing **Firestore** (NoSQL) for persistence, **Firebase Auth** for identity, and **Firebase Storage** for media assets.

## 2. Backend Configuration
The application is configured using Environment Variables in a Vite-based setup.

### Environment Variables
These values must be present in the `.env` or `.env.local` file for the application to connect to the backend.

| Variable | Description | Required |
| :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | Firebase Project API Key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth Domain (e.g., `project-id.firebaseapp.com`) | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Unique Project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Cloud Storage Bucket URL | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging Sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Web App ID | Yes |
| `VITE_USER_ID` | **Critical**: The "Shop ID" used for multi-tenancy (default: `hop-in-express-`) | Yes |
| `VITE_GOOGLE_GENAI_API_KEY` | Gemini API Key for Smart AI Intake | Yes |

### Firebase Initialization
The backend is initialized in `lib/firebase.ts`. It exports specific instances for services:
- `db`: Firestore Database instance
- `auth`: Firebase Authentication instance
- `storage`: Firebase Cloud Storage instance

## 3. Data Architecture (Multi-Tenancy)
The database follows a **Multi-Tenant / Sharding Pattern** rooted in the `shops` top-level collection.
- **Root Collection**: `shops`
- **Document ID**: `{userId}` (Value from `VITE_USER_ID`)
- **Sub-collections**: All application data resides as sub-collections under this user document.

**Path Structure:**
`shops/{userId}/{collectionName}/{documentId}`

---

## 4. Database Schema (Firestore Collections)

### 4.1. Inventory
**Collection Name**: `inventory`  
**Purpose**: Stores all products, stock levels, and pricing information.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique UUID or Barcode-based ID. |
| `barcode` | `string` | Scanning barcode (EAN/UPC). |
| `sku` | `string` | Stock Keeping Unit (internal). |
| `name` | `string` | Product name. |
| `brand` | `string` | Brand manufacturer. |
| `category` | `string` | Product category (e.g., 'Alcohol'). |
| `stock` | `number` | Current quantity on hand. |
| `minStock` | `number` | Threshold for "Low Stock" alerts. |
| `costPrice` | `number` | Usage for calculating margins. |
| `price` | `number` | Selling price (inc. VAT). |
| `vatRate` | `number` | Percentage tax (0, 5, 20). |
| `status` | `string` | `Active`, `Discontinued`, `Out of Stock`. |
| `unitType` | `string` | `pcs`, `kg`, `g`, etc. |
| `packSize` | `string` | Size description (e.g., '500ml'). |
| `supplierId` | `string` | Reference to `suppliers` collection. |
| `origin` | `string` | Country of origin (default 'UK'). |
| `shelfLocation`| `string` | Physical location code. |
| `expiryDate` | `string` | ISO Date string. |
| `logs` | `AdjustmentLog[]` | **Audit Trail**: Array of changes to this item. |

### 4.2. Transactions (Sales)
**Collection Name**: `transactions`  
**Purpose**: Immutable record of every sale completed at the POS.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Transaction ID. |
| `timestamp` | `string` | ISO Timestamp of sale. |
| `staffId` | `string` | ID of the cashier. |
| `staffName` | `string` | Name of the cashier. |
| `total` | `number` | Final charge amount. |
| `subtotal` | `number` | Amount before VAT/Discount. |
| `vatTotal` | `number` | Total VAT collected. |
| `paymentMethod`| `string` | `Cash` or `Card`. |
| `items` | `Array` | Snapshot of items sold (name, price, qty). |
| `vatBreakdown` | `Object` | Map of VAT collected by rate (0%, 5%, 20%). |

### 4.3. Staff
**Collection Name**: `staff`  
**Purpose**: Personnel records, access control, and HR details.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Staff ID. |
| `name` | `string` | Full Name. |
| `role` | `string` | `Owner`, `Manager`, `Cashier`, etc. |
| `pin` | `string` | 4-digit numeric login code. |
| `hourlyRate` | `number` | Pay per hour (GBP). |
| `monthlyRate` | `number` | Fixed monthly salary (GBP). |
| `niNumber` | `string` | National Insurance Number. |
| `taxCode` | `string` | HMRC Tax Code. |
| `joinedDate` | `string` | Date of employment start. |
| `emergencyContact` | `string` | Contact number for emergencies. |
| `contractType` | `string` | `Full-time`, `Part-time`, etc. |
| `status` | `string` | `Active` or `Inactive`. |

### 4.4. Attendance
**Collection Name**: `attendance`  
**Purpose**: Daily clock-in/out records for payroll.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Record ID. |
| `staffId` | `string` | Reference to `staff` collection. |
| `date` | `string` | ISO Date (YYYY-MM-DD). |
| `status` | `string` | `Present`, `Absent`, `Late`, etc. |
| `clockIn` | `string` | Time string (HH:MM). |
| `clockOut` | `string` | Time string (HH:MM). |
| `hoursWorked` | `number` | Calculated drift. |
| `notes` | `string` | Optional daily notes. |

### 4.5. Ledger (General Ledger)
**Collection Name**: `ledger`  
**Purpose**: Double-entry bookkeeping records for all financial movements.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Entry ID. |
| `account` | `string` | Account name (e.g. `Sales Revenue`). |
| `type` | `string` | `Debit` or `Credit`. |
| `amount` | `number` | Value in GBP. |
| `category` | `string` | `Sales`, `Adjustment`, etc. |
| `referenceId` | `string` | ID of related Transaction or Bill. |
| `timestamp` | `string` | ISO Timestamp. |

### 4.6. Daily Sales
**Collection Name**: `daily_sales`  
**Purpose**: End-of-day Z-Report summaries.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Date string (YYYY-MM-DD). |
| `date` | `string` | ISO Date (YYYY-MM-DD). |
| `totalSales` | `number` | Gross sales for the day. |
| `cashTaken` | `number` | Total cash payments. |
| `cardTaken` | `number` | Total card payments. |
| `netBalance` | `number` | Final balance (Sales - Purchases). |
| `categoryBreakdown` | `Object` | Sales totals grouped by category. |

### 4.7. Suppliers
**Collection Name**: `suppliers`  
**Purpose**: Vendor directory for stock procurement.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Vendor ID. |
| `name` | `string` | Company Name. |
| `contactName` | `string` | Representative Name. |
| `totalSpend` | `number` | Lifetime spend value. |
| `outstandingBalance` | `number` | Amount currently owed. |

### 4.8. Bills
**Collection Name**: `bills`  
**Purpose**: Accounts Payable / Invoices received.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Bill ID. |
| `supplierId` | `string` | Link to `suppliers`. |
| `amount` | `number` | Due amount. |
| `dueDate` | `string` | Date payment is required. |
| `status` | `string` | `Unpaid`, `Settled`. |

### 4.9. Snapshots
**Collection Name**: `snapshots`  
**Purpose**: Full system backups for rollback functionality.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | `string` | Unique Snapshot ID. |
| `timestamp` | `string` | Backup creation time. |
| `inventory` | `Array` | Full dump of inventory collection. |
| `transactions` | `Array` | Full dump of transactions. |
| `ledgerEntries` | `Array` | Full dump of operations. |

---

## 5. Image Storage Strategy

### 5.1. Current Implementation: Base64 (Firestore)
The application currently uses a **Base64 String** storage strategy where image data is embedded directly into Firestore documents.
- **Rationale**: This approach was adopted to bypass CORS (Cross-Origin Resource Sharing) restrictions often encountered in hybrid mobile (Capacitor/WebView) environments when fetching authenticated resources from external storage buckets.
- **Fields**: Images are stored in the `imageUrl`, `photo`, or `photoUrl` fields of documents (e.g., `inventory` items).

### 5.2. Compression Pipeline
To prevent hitting Firestore document size limits (1MB), all images undergo strict client-side compression before saving:
1. **Input**: User selects file via standard input or camera.
2. **Compression**: `lib/storage_utils.ts` `compressImage()` function resizing the image.
   - **Max Dimensions**: 512x512 pixels.
   - **Quality**: 0.5 (JPEG artifacts).
3. **Encoding**: The compressed Blob is converted to a Base64 Data URL string.
4. **Persistence**: The string is written to the Firestore document.

### 5.3. Legacy / Future Cloud Storage
The codebase contains a `lib/storage_utils.ts` utility designed for Firebase Cloud Storage (using `uploadBytes`, `getDownloadURL`).
- **Status**: Currently inactive in the primary `InventoryView` and `SmartAIIntakeView` workflows in favor of the Base64 strategy.
- **Intended Path Structure**: `shops/{userId}/{collection}/{itemId}.jpg`
