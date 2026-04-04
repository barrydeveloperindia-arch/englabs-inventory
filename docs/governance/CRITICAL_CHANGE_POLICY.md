# Critical Change Control Policy

## 1. Protected Configuration Items
The following files and configurations are deemed **CRITICAL** and must not be modified without explicit confirmation and permission from the User.

### 1.1. Database Connection (`lib/firebase.ts`)
- **Target Database**: `englabs1`
- **Variable**: `VITE_FIREBASE_DATABASE_ID` (in `.env.local` and `lib/firebase.ts`)
- **Risk**: Modifying this connection creates a "Split Brain" scenario where the app connects to an empty `(default)` database, causing apparent data wipe for all users.
- **Rule**: ANY modification to the `getFirestore` initialization line requires a pause and separate confirmation.

### 1.2. Authentication Logic
- **Tenant ID**: `hop-in-express-` (Shared User ID)
- **Risk**: Changing the Tenant ID disconnects users from their shared organizational data.

## 2. Protocol for AI Agents
If you are an AI Agent working on this codebase:
1.  **Check**: Before editing `lib/firebase.ts`, read the top-level comment.
2.  **Verify**: Does your change alter the `dbId` or `getFirestore` arguments?
3.  **Halt**: If yes, STOP. Ask the user:
    > "I am about to modify the database connection settings. This is a protected action. Do I have your permission to proceed?"

## 3. History of Incidents
- **2026-01-21**: Accidental regression during Cloud Storage migration reverted DB to `(default)`, causing 3 days of "missing data".
- **2026-01-24**: Restored connection to `englabs1` and established this policy.
