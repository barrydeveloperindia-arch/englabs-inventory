# Environment Strategy & Multi-Database Setup

To ensure operational safety and prevent test data from corrupting the Production environment (`englabs1`), we have implemented a **Multi-Database Environment Strategy**.

## 1. Environment Overview

We now support three distinct environments. Each environment points to a separate **Firestore Database** within the same Firebase Project.

| Environment | Mode | Config File | Database ID | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Development** | `development` | `.env.development` | `englabs_dev` | **Safety Sandbox.** For coding, testing new features, and breaking things. Data here is disposable. |
| **Staging** | `staging` | `.env.staging` | `englabs_staging` | **Pre-Release.** For final verification before "Going Live". Data resembles Prod but is safe to modify. |
| **Production** | `production` | `.env.production` | `englabs1` | **LIVE BUSINESS DATA.** Strict Read/Write controls. Only stable code should run here. |

## 2. 🚨 CRITICAL SETUP ACTION (You must do this once)

I have updated the code to look for these databases, but **YOU MUST CREATE THEM** in the Firebase Console:

1.  Go to the [Firebase Console](https://console.firebase.google.com/project/hop-in-express-b5883/firestore).
2.  Click the **Databases** dropdown (at the top of the Data tab).
3.  Click **( + ) Create database**.
4.  Enter Database ID: `englabs_dev`.
5.  Select Location: **europe-west2** (London) - *Must match your Prod location*.
6.  Security Rules: Start in **Test Mode** (or copy Prod rules).
7.  **Repeat** for `englabs_staging`.

**If you do not create these databases, the app will show a blank screen or connection error in Dev/Staging modes.**

## 3. How to Run

### Development (Default)
Runs against `englabs_dev`. Safe for coding.
```bash
npm run dev
# OR
npm start
```

### Staging
Runs against `englabs_staging`. Use to verify builds.
```bash
npm run build:staging
npm run preview:staging
```

### Production
Runs against `englabs1`. **Use with caution.**
```bash
npm run build
npm run preview
```

## 4. Backend Server (`server.js`)
The automation server has also been updated to respect these files.
- By default, `npm run serve` loads `.env.development`.
- To run against prod: `set NODE_ENV=production && npm run serve`.

## 5. File Structure
- `.env.development`: Contains `VITE_FIREBASE_DATABASE_ID=englabs_dev`
- `.env.staging`: Contains `VITE_FIREBASE_DATABASE_ID=englabs_staging`
- `.env.production`: Contains `VITE_FIREBASE_DATABASE_ID=englabs1`
- `.env.local.backup`: Your previous configuration (preserved for safety).

## 6. UI Differentiation

To prevent accidental actions in the wrong environment, the application now includes visual indicators:

- **Development**: Displays an **AMBER** banner at the top: `🚧 DEVELOPMENT ENVIRONMENT - DATA IS DISPOSABLE 🚧`
- **Staging**: Displays an **INDIGO** banner at the top: `🧪 STAGING ENVIRONMENT - PRE-PRODUCTION VERIFICATION 🧪`
- **Production**: No banner is displayed. The UI remains clean for business operations.
