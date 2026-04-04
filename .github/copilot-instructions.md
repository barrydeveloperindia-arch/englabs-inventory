# Hop-in-Express AI Coding Instructions

## Project Overview
**ENGLABS INVENTORY** is a React+TypeScript retail management OS for a UK convenience store. It's a multi-user dashboard serving Owner/Manager/Accountant/Cashier/Stock Staff roles with real-time Firebase Firestore syncing, AI-powered inventory commands, and financial ledger tracking.

## Architecture

### Core Stack
- **Frontend:** React 19 + TypeScript, Vite (dev server on port 3000), Tailwind CSS + Framer Motion animations
- **Backend:** Express.js server (port 3001) for file uploads and batch operations
- **Database:** Firebase Auth + Firestore (subcollections per `shops/{userId}/inventory|transactions|staff|...`)
- **AI Integration:** Google GenAI API for vision (shelf scans, invoice photos) and natural language commands

### Data Model (`types.ts`)
- **UserRole:** Owner | Manager | Cashier | Accountant | Stock Staff (controls feature visibility)
- **InventoryItem:** Full product record (sku, price, costPrice, stock, vatRate, barcode, shelfLocation)
- **Transaction:** POS entry (staffId, items array, VAT breakdown by rate, payment method)
- **LedgerEntry:** Double-entry accounting (Debit|Credit against LedgerAccount types like "Sales Revenue", "Inventory Asset")
- **Supplier/Bill:** Procurement tracking; bills link purchaseId → amount + status (Unpaid|Partial|Settled)
- **Staff/Attendance/Salary:** Employee records with contract types, monthly/hourly/daily rates

### Firestore Structure
```
shops/{userId}/
  ├─ inventory/ (subscribedTo in App.tsx)
  ├─ transactions/
  ├─ staff/
  ├─ attendance/
  ├─ ledger/
  ├─ suppliers/
  ├─ bills/
  ├─ expenses/
  ├─ purchases/
  └─ snapshots/ (for rollback)
```

## Component Architecture

### Navigation Flow
App.tsx holds global state (inventory, transactions, staff, etc.) and subscriptions. **ViewType** enum routes between:
- Dashboard → financial summaries + 50-day sales trend
- SalesView → POS transactions
- InventoryView → stock management + shelf location
- FinancialsView → Master Ledger (double-entry accounting)
- AICommandCenter → AI commands + vision uploads
- StaffView → attendance + payroll
- PurchasesView → procurement orders + bills

### Key Components
- **AICommandCenter** ([AICommandCenter.tsx](components/AICommandCenter.tsx#L1)): Google GenAI integration with system instruction for vision tasks (face recognition, shelf counting, invoice parsing). Outputs strict JSON with `modality`, `summary`, `narrativeSummary`.
- **SalesView**: Builds transactions with VAT breakdown by rate (0%, 20% bands). Uses `subscribeToTransactions` for real-time sync.
- **FinancialsView**: Reads LedgerEntry records; double-entry accounting (e.g., sale = debit Cash/Bank + credit Sales Revenue).
- **NavigationSidebar**: Role-based nav item filtering; menu icon toggle for mobile.

## Critical Patterns & Conventions

### Real-Time Data Syncing
Use `onSnapshot` subscriptions in [firestore.ts](lib/firestore.ts#L20-L32):
```typescript
const subscribeToInventory = (userId, callback) => {
  const q = query(getInventoryRef(userId), orderBy('name'));
  return onSnapshot(q, snapshot => callback(snapshot.docs.map(doc => ({...doc.data(), id: doc.id}))));
};
```
**Rule:** Always return unsubscribe function from useEffect cleanup. Store userId from `auth` globally; pass to all firestore calls.

### VAT Handling (`lib/utils.ts`)
- **finalPrice(price, vatPercent):** Returns price including VAT, rounded to 2 decimals.
- **getVATByCategory():** Zero-rate items (Grains, Dairy, Bakery, Essentials) = 0%; others = 20%.
- **Transaction structure:** `vatBreakdown: { 0: VatBandSummary, 20: VatBandSummary }` where each has `{gross, net, vat}`.

### Role-Based Feature Gating
```typescript
const isFinancialRole = role === 'Owner' || role === 'Accountant';
if (isFinancialRole) {
  // Show Master Ledger, VAT reports, profit/loss
} else {
  // Restrict to sales/stock operations
}
```

### Timestamps & Timezone
Always use ISO strings in Firestore: `new Date().toISOString()`. Convert to UK time for display:
```typescript
formatTransactionDate(date) {
  return moment(date).tz("Europe/London").format("YYYY-MM-DD HH:mm:ss");
}
```

### AI Command JSON Output
AICommandCenter expects strict JSON structure:
```json
{
  "modality": "inventory|face|shelf|invoice|temporal",
  "summary": "Brief action taken",
  "narrativeSummary": "Full explanation",
  "data": [{...updated records}],
  "rollbackId": "snapshot-id-if-temporal"
}
```

## Development Workflow

### Setup & Running
```bash
npm install
npm run dev          # Vite on :3000 with React plugin
npm run build        # TypeScript + Vite, outputs dist/
npm run serve        # Node server.js on :3001 (for uploads)
```

### Build Configuration
- **Vite** uses `@vitejs/plugin-react` + `@vitejs/plugin-basic-ssl` (enables HTTPS locally)
- **TypeScript:** Strict mode enabled; see [tsconfig.json](tsconfig.json)
- **Tailwind:** Uses custom config ([tailwind.config.js](tailwind.config.js)) with shop branding colors (teal `#4FD1C5`, indigo `#4F46E5`)

### Environment Variables (`.env.local`)
Required for Firebase + AI:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_GOOGLE_GENAI_API_KEY
VITE_USER_ID              # Shop identifier for Firestore path
```

### Common Tasks
- **Add new Firestore collection:** Create subscriber + CRUD functions in [firestore.ts](lib/firestore.ts). Call subscription in App.tsx `syncInitialData()`.
- **New transaction type:** Extend Transaction in [types.ts](types.ts), update VAT breakdown logic in SalesView.
- **Role-based UI change:** Check `currentUserRole` state in App.tsx; gate component in render.
- **AI vision task:** Update system instruction in AICommandCenter, test JSON output parsing.

## Integration Points

### Firebase Auth Flow
1. `onAuthStateChanged()` listener in App.tsx sets `user` + `uid`
2. `syncInitialData(uid)` subscribes all collections under `shops/{uid}/`
3. Cleanup unsubscribe functions on logout

### Google GenAI Vision
AICommandCenter uses `GoogleGenAI` client:
- Vision tasks: shelf scans (count items), invoice photos (extract Qty/Cost/Price), face detection (attendance)
- Fallback: Manual ledger entry for unavailable modalities

### Server Integration (server.js)
Express app listens on :3001:
- Multer handles file uploads (imports, photos)
- Accesses Firestore for batch updates (currency conversion, reconciliation)
- Currency config loaded from [config/currency.js](config/currency.js)

## Project-Specific Notes

- **Terminal ID:** Hardcoded as "50LG-UK-01" in App.tsx; track installations via this identifier
- **Logo:** EngLabs custom SVG component used throughout (branding element)
- **Audit Trail:** Optional `auditLogs` + `history` (SystemSnapshot) for rollback support
- **Constants:** [constants.tsx](constants.tsx) contains initial staff, suppliers, categories, and shop info; update these to customize instance
- **Barcode Scans:** Supported via html5-qrcode library for quick inventory/staff login

## Testing Notes
- Firebase emulator can be used for offline development (not configured; see server.js for production config)
- Capacitor integration exists for Android build; check [android/](android/) for native configs
- No Jest tests in repo; manual testing required for POS workflows and ledger balancing
