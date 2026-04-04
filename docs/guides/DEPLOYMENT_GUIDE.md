# 🚀 Deployment Guide

## 🌐 Vercel Deployment (Web)

Since your project contains **two applications** in one repository, you need to configure Vercel to recognize them separately.

### 1. Command OS (Manager App)
*This is likely already working if you connected the repo.*
*   **Root Directory**: `./` (Default)
*   **Build Command**: `npm run build`
*   **Output Directory**: `dist`
*   **URL**: `https://hop-in-express.vercel.app`

### 2. Customer App (Client App) - **🔴 REQUIRES SETUP TO FIX 404**
Because this app lives in a subfolder, Vercel doesn't see it automatically. You must create a **second project** in Vercel.

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Import the **same repository** (`hop-in-express`).
4.  **⚡ CRITICAL STEP**: In the "Configure Project" screen, look for **"Root Directory"**.
    *   Click **Edit**.
    *   Select the folder: `hop-in-express-customerApp`.
5.  Click **Deploy**.

*Once you do this, Vercel will build the Customer App separately and give you a working link (e.g., `hop-in-express-clientapp.vercel.app`).*

---

## 🤖 Android (Google Play Store)

## 🤖 Android (Google Play Store)

Since you are on Windows, you can fully build the Android App yourself.

### Step 1: Prepare the Project
1. Open your terminal in the project folder.
2. Run the following command to prepare the latest code:
   ```powershell
   npm run android
   ```
   *This will build your web code, sync it to the Android project, and open Android Studio.*

### Step 2: Build the APK (Installer File)
1. Wait for **Android Studio** to open.
2. Go to the top menu: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
3. Wait for the build to finish (progress bar at the bottom right).
4. Click **"locate"** in the popup notification to find your `.apk` file.
   *   *You can now send this `.apk` file to your employees' Android phones via WhatsApp, Email, or Drive. They can install it directly!*

### Step 3: Publish to Google Play (Optional)
1. To publish to the store, you need a [Google Play Console Developer Account](https://play.google.com/console) ($25 one-time fee).
2. Instead of "Build APK", choose **Build** > **Generate Signed Bundle / APK**.
3. Follow the wizard to create an `.aab` (Android App Bundle).
4. Upload this `.aab` file to the Google Play Console.

---

## 🍎 iOS (Apple App Store)

**⚠️ Important Requirement:** Building a native iOS App (`.ipa`) **requires a generic Mac Computer (MacBook/iMac)**. This is an Apple restriction; it cannot be done on Windows.

### Option A: The "Web App" Method (Instant & Free)
This is the fastest way for your iPhone-using employees to use the app immediately without a Mac.
1. Send them the link to your website (e.g., `https://hops-in-express.web.app`).
2. Tell them to open it in **Safari**.
3. Tap the **Share Icon** (Square with an arrow pointing up).
4. Scroll down and tap **"Add to Home Screen"**.
5. The app will appear on their main screen just like a Store app.

### Option B: If you have access to a Mac
1. Copy this entire project folder to the Mac.
2. Run:
   ```bash
   npm install
   npm run build
   npx cap add ios
   npx cap open ios
   ```
3. Use **Xcode** (which opens automatically) to build and archive the app for the App Store.

### Option C: Cloud Build Services
If you don't have a Mac, you can use a paid service like **Ionic Appflow** or **Eas Build** which rents a Mac in the cloud to build your app for you.

---

## 🔐 Managing Staff Logins

Your app is already set up for multi-user access.

1. **Admin/Owner**: You log in with your main account.
2. **New Staff**:
   *   On the Login Screen, select **"Request New Operator Access"**.
   *   Enter their **Name**, **Email**, and a **Password**.
   *   Click Register.
3. **Roles**:
   *   Once they are registered, go to the **Staff View** in your app.
   *   You can edit their role (e.g., promote to Manager, restrict to Cashier).

---

## 🛠️ Troubleshooting & Updates

### 🔧 Fix for Android Image Uploads (January 2026)
If you previously experienced an issue where **uploading images would get stuck on "Processing..."** without completing, this has been resolved in the latest update.

**Cause:** The Android environment had trouble loading the image compression library dynamically and connecting to Firebase Storage secure uploads.
**Fix:** 
1. The app now stores images directly in the database as compressed text (Base64), bypassing the upload network connection entirely.
2. Code loading has been optimized to prevent hangs on older Android devices.

**How to Apply the Fix:**
1. Connect your Android device to your PC.
2. Run the update command in your terminal:
   ```powershell
   npx cap sync android
   ```
3. Open the project in Android Studio:
   ```powershell
   npx cap open android
   ```
4. Click **Run** (Play Button) to reinstall the application on your device.
