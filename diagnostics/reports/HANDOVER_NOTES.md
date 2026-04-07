# EngLabs Agentic OS: Handover & Architectural Blueprint (v1.0.0)

> [!IMPORTANT]
> ARCHITECTURAL SHIFT DETECTED: The project has been refactored to industry-standard `src/` structure. Do NOT move files back to the root unless strictly required for platform config.

## 🏗️ The New Structure (`src/`)
- **`src/components/`**: Standard UI components (e.g., `StaffView`, `InventoryView`).
- **`src/features/`**: Domain-specific isolated logic (e.g., `src/features/staff/components/AttendanceSystem`).
- **`src/types/`**: NEW CENTERED REGISTRY. Collision between `types.ts` and `types/` has been resolved by using `src/types/index.ts` as the entry point.
- **`src/lib/`**: All service layers (Firestore, Firebase, Monitoring).

## 🛡️ Legacy Isolation (`legacy/hopin_express/`)
- All assets, reports, and blueprints related to "Hop-In Express" have been moved to this silo to ensure brand purity for **EngLabs**. 
- Scanned for 100+ PNGs and legacy status reports—do not re-inject them into the production root.

## 🛠️ Infrastructure Re-Links
- **`index.html`**: Entry point is now `/src/index.tsx`.
- **`vite.config.ts`**: Updated with the `@` alias pointing to `./src`. 
- **`tsconfig.json`**: Restricted compilation to `src/` to prevent type collisions with legacy modules.

## 🏁 Current Status & Next Steps
1. **Staff Lifecycle (STABLE)**: `StaffView.tsx` has been modularized. The Workforce Ledger is fully operational and type-safe.
2. **Inventory Module (PENDING)**: Task **5.3** requires the same treatment for `InventoryView.tsx`.
3. **Persistence (PENDING)**: Task **4.2** requires implementing `src/lib/agenticHistory.ts`.

## ⚠️ Warning: Import Ambiguity
If you see "Cannot find name 'staff'" or similar prop errors in a renderer, it is usually a ghost linting issue. The registry at `src/types/index.ts` is the definitive source of truth and must always be imported using the relative path or the `@/types` alias.
