# How to Generate Signed APK (Android)

## 1. Open Android Studio
Run this command in your terminal:
```powershell
npx cap open android
```
*Wait for Android Studio to fully load and sync.*

## 2. Build the Signed APK
1.  In the top menu bar, click **Build** > **Generate Signed Bundle / APK...**.
2.  Select **APK** and click **Next**.
3.  **Key Store Path**:
    *   Click **"Create new..."**.
    *   **Path**: Choose a safe place (e.g., your Desktop) and name it `englabs.jks`.
    *   **Password**: Creates a strong password (e.g., `Englabs2026!`).
    *   **Key Alias**: Type `key0` (or anything).
    *   **Key Password**: Same as above (`Englabs2026!`).
    *   **Validity**: Leave as 25 years.
    *   Fill in "First and Last Name" (e.g., "Englabs Admin") and click **OK**.
4.  Back in the wizard, confirm the passwords are filled in.
5.  Check **"Remember passwords"** (optional).
6.  Click **Next**.
7.  Select **release**.
8.  Click **Create**.

## 3. Locate the File
*   Android Studio will work for a minute or two.
*   A notification will appear at the bottom right: *"APK(s) generated successfully"*.
*   Click the blue **"locate"** link.
*   You will see `app-release.apk`.

## 4. Install on Staff Phones
1.  **WhatsApp / Email**: Send this `app-release.apk` file to your staff.
2.  **Install**: They tap the file -> "Settings" -> "Allow from this source" -> "Install".

---

# Verification of Multi-User Logic

### ✅ Separate Logins
Every staff member uses their own **Email** and **Password**.
*   **To Add Staff**:
    1.  On the Login Screen, click **"Request New Operator Access"**.
    2.  Enter their Email and Password.
    3.  **Result**: This creates their account AND adds them to the "Staff List" automatically.

### ✅ Role-Based Access
*   **Default Role**: 'Cashier' (Can sell, cannot edit stock/prices).
*   **Admin Control**:
    1.  Log in as Owner/Admin.
    2.  Go to **Staff View**.
    3.  Select the employee.
    4.  Change Role to 'Manager', 'Stock Clerk', etc.
    5.  Save.
*   The next time they open the app, they will have the new permissions.
