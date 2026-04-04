# ENGLABS INVENTORY Command OS - Authentication & Login Strategy

## 1. Overview
The application implements a secure, role-based authentication system using **Firebase Authentication**. Access control is managed through a combination of Firebase UID checks and email-based Role-Based Access Control (RBAC).

## 2. Authentication Flow

### 2.1. Login Screen (`AuthView.tsx`)
The entry point of the application is the `AuthView` component.
- **Provider**: Firebase Email/Password Authentication.
- **Methods**:
  - `signInWithEmailAndPassword`: For existing staff.
  - `createUserWithEmailAndPassword`: For registering new operators.

### 2.2. Session Persistence
Firebase Auth automatically handles session persistence (tokens are stored in IndexedDB/LocalStorage). The `App.tsx` component listens for authentication state changes via `onAuthStateChanged`.

---

## 3. Post-Login Authorization Logic

Once a user successfully logs in, the application determines their permissions dynamically in `App.tsx` (`useEffect` hook on line 70).

### 3.1. User Role Resolution
1.  **Auth State Change**: The `user` object is received from Firebase.
2.  **Staff List Matching**:
    - The system fetches the `staff` collection.
    - It compares the logged-in `user.email` against the `email` field of all staff documents.
    - If a match is found, the user inherits the `role` defined in that staff record (e.g., `Owner`, `Manager`, `Cashier`).
3.  **Role Assignment**:
    - `setCurrentUserRole(matchedStaff.role)`
    - This role controls UI visibility (e.g., Inventory Edit buttons, Admin specific settings).

### 3.2. User Registration Flow
When a new user registers via `AuthView`:
1.  A Firebase Auth account is created.
2.  A corresponding **Staff Record** is automatically created in the Firestore `staff` collection.
    - **ID**: Matches the Firebase Auth `uid` (1:1 mapping).
    - **Role**: Defaults to `Owner` (for the first user) or explicitly set in code.
    - **Status**: `Active`.

---

## 4. Multi-User & Concurrent Sessions
The application supports multiple users logging in on different devices simultaneously.

### 4.1. Shared Tenant ID
- The system operates in a **Single-Tenant / Shared Database** mode.
- Regardless of *who* logs in, they all connect to the same Shop Data identified by `VITE_USER_ID` (default: `hop-in-express-`).
- This ensures that a Cashier on Tablet A and a Manager on PC B see the exact same live inventory.

### 4.2. Terminal Identity
- Each session is identified by a `TERMINAL_ID` (currently hardcoded as `50LG-UK-01` in `App.tsx`, but designed to be configurable).
- Audit logs record both the `staffName` (from the matched email) and the `terminalId` to track who did what and where.

## 5. Security Best Practices
- **Least Privilege (Planned)**: While currently set to 'Owner' for development, the logic exists to default unknown users to `Staff` or restricted access.
- **PIN Re-verification (Proposed)**: Critical actions (like Full Inventory Wipe) can be gated behind a secondary 4-digit PIN check, even if logged in.
