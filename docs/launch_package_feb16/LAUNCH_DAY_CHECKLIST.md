# Command OS: Launch Day Checklist
**Monday, 16th February 2026**

---

## 🕒 T-Minus 24 Hours (Sunday 15th)

*   [ ] **Hardware Check**:
    *   [ ] Tablet/PC Cameras functional (for Face & Shelf Audits).
    *   [ ] Bluetooth Scanners paired & charged.
    *   [ ] Internet connectivity verified (Ping test).
    *   [ ] Receipt Printers loaded with paper rolls.

*   [ ] **Software Verification**:
    *   [ ] Run `npm run test` locally (Unit Tests Pass - **CRITICAL**).
    *   [ ] Verify "Assistant" vs "Associate" role fix is applied to deployed version.
    *   [ ] Log in as each role (Staff, Manager, Owner) to confirm permissions.
    *   [ ] Create a test Leave Request and approve it.
    *   [ ] Ensure `Launch Package` docs are printed/emailed.

*   [ ] **Permissions Audit**:
    *   [ ] Go to `StaffView`.
    *   [ ] Ensure all active staff have correct `UserRole`.
    *   [ ] Deactivate redundant accounts.

---

## 🚀 Launch Day (Monday 16th)

### 06:00 AM - Early Shift Arrival
*   [ ] **Stand-up Briefing (10 mins)**:
    *   Announce "Command OS is LIVE".
    *   Demonstrate Clock-In (Pin/Bio).
    *   Show "Tasks" tab.

### 08:00 AM - Manager Shift Start
*   [ ] **First Audit Check**:
    *   Navigate to **Complinace > Audit Trail**.
    *   Verify early shift clock-ins are logged correctly.
    *   Any errors? Note them in `fail-detail.json` or support ticket.

### 12:00 PM - Midday Review
*   [ ] **Sync Check**:
    *   Check if offline transactions have synced.
    *   Verify Inventory counts match roughly.
    *   Gather staff feedback ("Is it faster?").

### 05:00 PM - Closing Shift Handover
*   [ ] **Closing Tasks**:
    *   Ensure closing checklist is digital (no paper forms).
    *   Manager reviews daily sales report in **Financials**.

---

## 🛠️ Post-Launch Support
*   **Urgent Bug?**: Revert to paper logs immediately. Contact Developer.
*   **Feature Request?**: Add to `backlog.md`.
