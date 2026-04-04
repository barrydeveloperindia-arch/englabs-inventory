# Cloud Deployment Strategy: ENGLABS INVENTORY Command OS
**Objective**: Transition the application from a Local-Hybrid architecture (running on `localhost`) to a fully accessible Cloud Web Application (e.g., `app.englabs.com`), ensuring global access for owners and staff.

---

## 🏗️ Architecture Shift

| Feature | Current Implementation (Local) | Cloud Target (Prod) | Action Required |
| :--- | :--- | :--- | :--- |
| **Hosting** | `localhost:3000` (Vite Dev Server) | **Vercel / Netlify** | 🚀 **Deploy Frontend** |
| **Database** | Firebase Firestore (Cloud) | Firebase Firestore (Cloud) | ✅ Ready (No Change) |
| **Authentication** | Firebase Auth | Firebase Auth | ✅ Ready (No Change) |
| **Image Storage** | Local Disk (`server.js` /uploads) | **Firebase Storage** | 🛠️ **Refactor Code** |
| **Admin API** | Local Express API (`server.js`) | **Client-Side Logic** | 🛠️ **Refactor Code** |
| **Shelf Scanner** | CLI Command on Host Machine | **Edge Agent (Local Only)** | ⚠️ **Limitations Apply** |

---

## 🗓️ Phase 1: Code Decoupling (The "Serverless" Migration)
*Goal: Remove the dependency on `server.js` so the frontend can run independently.*

### 1. Refactor Image Uploads
*   **Current**: `InventoryView.tsx` and `StaffView.tsx` post images to `http://localhost:3001/api/proxy-upload`.
*   **Change**: Update `handlePhotoUpload` to use the Firebase Storage SDK (`uploadBytes`, `getDownloadURL`).
*   **Benefit**: Images are stored securely in Google Cloud, accessible from any device, anywhere.

### 2. Port Admin Logic to Client
*   **Current**: Product and Staff verification calls `fetch('/admin/verify-...')`.
*   **Change**: Move the verification logic (writing to Firestore `status: 'LIVE'`) directly into the React components, guarded by strict `isAdmin` checks.
*   **Benefit**: Removes the need for a backend API server.

---

## 🗓️ Phase 2: Deployment Infrastructure

### 1. Select a Host
*   **Recommendation**: **Vercel** (Best for React/Vite apps).
*   **Cost**: Free tier is sufficient for proof-of-concept.

### 2. Environment Configuration
You must configure the following Environment Variables in the Vercel Dashboard (copy from your `.env.local`):
*   `VITE_FIREBASE_API_KEY`
*   `VITE_FIREBASE_AUTH_DOMAIN`
*   `VITE_FIREBASE_PROJECT_ID`
*   `VITE_FIREBASE_STORAGE_BUCKET`
*   `VITE_FIREBASE_MESSAGING_SENDER_ID`
*   `VITE_FIREBASE_APP_ID`
*   `VITE_USER_ID` (If you want to force a specific Shop ID)

---

## 🗓️ Phase 3: Hardware & Local Integration (The "Hybrid" Reality)

### The "Shelf Scan" Issue
The `Antigravity Shelf Scan` feature relies on a physical command-line tool running on a computer connected to scanners/cameras.
*   **Cloud Limitation**: A website running on Vercel cannot run commands on your shop floor computer.
*   **Solution**:
    *   **Keep One "Bridge" Computer**: Keep one laptop running `server.js` in the shop IF you need to run automated shelf scans.
    *   **Cloud Mode**: On the cloud website, hide/disable the "Start Shelf Scan" button, or make it trigger a "Request" in Firestore that the shop computer listens for.

---

## 🚀 Execution Plan (Next Steps)

1.  **Stop** using `server.js` for uploads (I can refactor this now if requested).
2.  **Verify** that adding inventory/staff works without the express server running.
3.  **Push** your code to GitHub.
4.  **Connect** GitHub to Vercel and hit "Deploy".

### Estimated Time to Cloud Ready: ~1 Hour
(Primarily for refactoring the Upload Logic).
