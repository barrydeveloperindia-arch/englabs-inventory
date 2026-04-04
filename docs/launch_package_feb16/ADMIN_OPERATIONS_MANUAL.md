# Command OS: Administrator Operations Manual
**System Configuration, Monitoring, and Security**

---

## 🔐 Security Configuration

### Role-Based Access Control (RBAC)
Command OS uses granular role definitions in `lib/rbac.ts`. Ensure users are assigned correct roles:
*   **Owner**: Full access. Can modify system settings.
*   **Manager**: Can edit Rota, Approve Leave, View Audit Logs.
*   **Cashier**: Sales only. Cannot view financial reports or modify stock.
*   **Assistant**: Restricted access. View tasks only.

### Biometric Enrollment (Face Auth)
1.  Navigate to **Staff > Profile > Security**.
2.  Tap "Enroll Face".
3.  Ensure good lighting. Capture front, left, right angles.
4.  Test unlock immediately.

---

## 💾 Data Management (Firestore)

### Backup Strategy
*   **Automated**: Firestore handles daily snapshots (Standard Google Cloud Backup).
*   **Wait**: Do not solely rely on snapshots.
*   **Manual Export**:
    1.  Go to **Project Settings > Integrations**.
    2.  Select "Export Data" (Download JSON).
    3.  Store securely offline (e.g., Encrypted USB).

### Reporting
*   **BigQuery Export**: (Planned Phase 2) Auto-sync for heavy analytics.
*   **Performance Monitoring**: Check Firebase Console > Performance tab weekly.

---

## 🛠️ Troubleshooting & Support

### Common Issues
*   **"Permission Denied"**: Check user role in `StaffView`. Ensure strict equality (e.g., 'Manager' vs 'manager').
*   **Sync Conflicts**: If multiple devices edit the same record offline, "Last Write Wins". Train staff to sync frequently.
*   **Camera Failure**: Ensure browser has camera permissions allowed (HTTPS context required).

---

## 🚀 Future Roadmap (ML Integration)
See `docs/ML_ROADMAP.md` for detailed plans on:
1.  Predictive Inventory Replenishment.
2.  Smart Rota Optimization.
3.  Computer Vision Shelf Audits.
