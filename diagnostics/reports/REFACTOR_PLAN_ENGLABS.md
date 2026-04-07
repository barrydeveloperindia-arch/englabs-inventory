# EngLabs Structural Refactor & Brand Isolation Plan (v1.0.0)

## Objective
- Refactor the codebase to follow industry-standard directory structures (Atomic/Feature Design).
- Explicitly separate legacy Hop-In Express assets and logic from the EngLabs Inventory system.
- Standardize naming conventions for files and directories.

## Proposed Directory Structure

### 1. **Core Application (`src/`)**
Move all primary source code into a `src/` directory (the standard for modern Vite/React apps):
- `src/components/shared/` - Generic UI components (Buttons, Modals, Inputs).
- `src/features/` - Feature-specific modules:
  - `src/features/englabs/inventory/`
  - `src/features/englabs/staff/`
  - `src/features/englabs/procurement/`
  - `src/features/englabs/reporting/`
- `src/hooks/` - Global hooks.
- `src/lib/` - Service layers (Firestore, Firebase, Utils).
- `src/types/` - Global type definitions.
- `src/styles/` - CSS and Design Tokens.
- `src/assets/englabs/` - Images, logos, and icons specific to EngLabs.

### 2. **Legacy Isolation (`legacy/hopin_express/`)**
Create a dedicated silo for all assets tied to the previous brand:
- `legacy/hopin_express/backups/`
- `legacy/hopin_express/reports/` (CSV, Excel)
- `legacy/hopin_express/assets/` (Old logos, images)
- `legacy/hopin_express/docs/` (Old version logs)

### 3. **Infrastructure & Tooling**
- `scripts/` - Maintain for build and maintenance tools.
- `tests/` - Keep for Vitest and E2E (Playwright) suites.
- `config/` - For environment-specific configuration files.

## Renaming & Rebranding Strategy
1. **Bundle IDs**: Update IOS/Android bundle IDs from `com.hopinexpress` to `com.englabs.mes`.
2. **Component Titles**: Scan and replace remaining UI strings referencing "HopIn Express" with "EngLabs Modular Architecture".
3. **Internal Logic**: Standardize `lib/firebase.js` and `lib/firestore.js` to consistent naming.

## Execution Steps
1. **Step 1**: Create the `src/` directory and move `App.tsx`, `index.tsx`, `index.css`, `types.ts`, `constants.tsx`, and `lib/`.
2. **Step 2**: Suture the component and hook directories into `src/`.
3. **Step 3**: Identify and move all legacy CSV/Excel and specific MD files into `legacy/hopin_express/`.
4. **Step 4**: Update all import paths globally to reflect the new `src/` root.
5. **Step 5**: Run Vitest and build checks to ensure zero regressions.
