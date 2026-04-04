# Production Refactor Handover Report
**Date:** 2026-02-01
**Status:** Ready for Deployment

## 1. Production Readiness & Security
- **RBAC Enforcement:**
  - Removed "Demo Only" overrides that forced users to 'Owner' role.
  - New user signups now default to `'Assistant'` (Least Privilege).
  - Admins must manually promote users via the Console or Firestore.
- **Credential Cleanup:**
  - Removed hardcoded "demo" email/password from `AuthView`.
  - Removed "mock brain" functions from `MarcoAssistant`. AI now enforces valid API keys.
- **YTD Calculation:**
  - Switched salary logic to strict UK Tax Year (April-April) aggregation instead of simple estimates.

## 2. Mobile Responsiveness (Critical Fixes)
- **Access Terminal:**
  - **Layout:** Switched to a Vertical Stack layout on mobile.
  - **Branding:** Added centered `EngLabsLogo` above the title. Removed mobile borders for seamless "floating" effect on black backgrounds.
- **Staff Rota View:**
  - **Stacked Layout:** The "Staff List" and "Rota Calendar" now stack vertically on mobile (Staff List on top, Rota below), fixing the squashed side-by-side view.
  - **Scroll:** Added horizontal scrolling to the Rota Header and Timeline to prevent page blowout on small screens.
- **Navigation:**
  - Fixed syntax errors in the Mobile Menu trigger button.

## 3. Architecture & Code Quality
- **Circular Dependencies Resolved:**
  - Extracted shared `EngLabsLogo` component to `components/Logo.tsx`.
  - Updated `App.tsx`, `NavigationSidebar`, `AccessTerminal`, `LockScreen`, and `AuthView` to reference the clean export.
- **Tests Implemented:**
  - Added `tests/smoke.test.tsx` to verify critical component rendering (`AccessTerminal`, `Logo`, `Sidebar`).
  - Patched `setupTests.ts` with `matchMedia` mock to support generic UI tests.
  - Fixed `StaffView` unit test props (`setStaff` missing).

## 4. Pending / Next Steps
- **Production Config:** Ensure `.env.production` has valid `VITE_GOOGLE_GENAI_API_KEY` and Firebase config.
- **Admin Promotion:** Verify the manual process for promoting the first "Owner" if not already set (use Firebase Console or the provided "Backdoor" if strictly necessary, but prefer Console).
