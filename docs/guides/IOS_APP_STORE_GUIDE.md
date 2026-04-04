# 🍏 App Store Submission Guide (iOS)

This guide walks you through deploying **ENGLABS INVENTORY Command OS** to the Apple App Store.

## ⚠️ Prerequisites (Mac Required)
Because Apple requires Xcode, **you cannot build the final .ipa file on Windows**.
You must perform the "Build & Archive" steps on a Mac (your own, a colleague's, or a cloud service like MacInCloud).

1.  **Apple Developer Account**: [Enroll here](https://developer.apple.com/programs/) ($99/year).
2.  **Mac Computer** with **Xcode** installed (Free from Mac App Store).

---

## Part 1: Prepare the Project (Do this on Windows)
I have already installed the iOS platform for you. Run these commands to make sure everything is ready to transfer:

```powershell
npm run build
npx cap add ios
npx cap sync ios
```

Now, **copy the entire project folder** to your Mac.

---

## Part 2: Open in Xcode (Do this on Mac)
1.  On the Mac, open Terminal in the project folder.
2.  Run: `npx cap open ios`
3.  This will launch **Xcode**.

## Part 3: Configure Signing & Capabilities
1.  In Xcode, click the **App Project** (Blue icon on the top left file tree).
2.  Select the **App** Target.
3.  Go to the **Signing & Capabilities** tab.
4.  **Team**: Select your Apple Developer Account (Log in if needed).
5.  **Bundle Identifier**: Ensure it is `com.englabs.commandos` (Must match what you create in App Store Connect).
6.  **Fix Issues**: If Xcode complains about "Provisioning Profiles", click **"Try Again"** or ensure your Team is selected to let Xcode auto-manage signing.

## Part 4: App Icons
1.  Open the file `App/App/Assets.xcassets`.
2.  Drag and drop your App Icon (1024x1024) into the **AppIcon** slot.
    *   *Tip: Use a tool like "App Icon Generator" to fill all the smaller sizes automatically.*

## Part 5: Create Listing in App Store Connect
1.  Go to [App Store Connect](https://appstoreconnect.apple.com/).
2.  **My Apps** > **+** > **New App**.
3.  **Platform**: iOS.
4.  **Name**: ENGLABS INVENTORY Command OS.
5.  **Primary Language**: English (UK).
6.  **Bundle ID**: Select `com.englabs.commandos` (If not there, register it in the [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list) first).
7.  **SKU**: `COMMAND_OS_001`.
8.  Click **Create**.

## Part 6: Build & Upload
1.  In Xcode, ensure the destination (top bar) is set to **"Any iOS Device (arm64)"**.
2.  Menu > **Product** > **Archive**.
3.  Wait for the build to finish. The "Organizer" window will open.
4.  Select the latest archive and click **"Distribute App"**.
5.  Select **App Store Connect** > **Upload** > Next > Next.
6.  Wait for the upload to complete.
7.  **Success!** The build is now processing on Apple's servers.

## Part 7: Submit for Review
1.  Go back to **App Store Connect**.
2.  Wait (~10-30 mins) for the build to appear under "Build" section in the TestFlight or App Store tab.
3.  **Fill in Metadata**:
    *   Screenshots (iPhone 6.5" and 5.5").
    *   Description, Keywords, Support URL.
    *   **Copyright**: 2026 ENGLABS INVENTORY.
4.  **Submit for Review**: Click the button at the top right.
5.  **Review Time**: Usually 24-48 hours.

---

## 🔒 Internal Distribution (Alternative)
If you do NOT want the public to find this app:
1.  Use **Apple Business Manager** (VPP) for private distribution.
2.  OR use **TestFlight** only (Invited users only, builds expire every 90 days).

Good luck! 🚀
