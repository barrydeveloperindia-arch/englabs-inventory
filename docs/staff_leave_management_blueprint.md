# Staff Leave & Vacation Management System - Blueprint

## 1. Overview
A comprehensive system to manage staff holidays, sick leave, and planned request absences. This integrates directly with the existing **Roster Calendar** and **Attendance** modules.

## 2. Data Architecture

### A. New Types (`types.ts`)

```typescript
export type LeaveType = 'Annual' | 'Sick' | 'Unpaid' | 'Compassionate';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export interface LeaveRequest {
  id: string;
  staffId: string;
  type: LeaveType;
  startDate: string; // ISO Date
  endDate: string;   // ISO Date
  totalDays: number;
  status: LeaveStatus;
  reason?: string;
  approvedBy?: string; // Manager ID
  approvedAt?: string;
  createdAt: string;
}
```

### B. Extended `StaffMember` Interface
Already exists partially, but needs formalization:
- `holidayEntitlement`: number (default 28 for full-time UK)
- `holidayTaken`: number
- `holidayRemaining`: number (Computed)

## 3. User Workflows

### A. Staff Member (Request Flow)
1.  **Dashboard Widget**: "Book Time Off" button on Personal Dashboard.
2.  **Form**:
    *   Select Dates (Range Picker).
    *   Select Type (Holiday/Sick).
    *   Add Note.
3.  **Validation**: Prevent booking if insufficient allowance (optional warning).
4.  **Submission**: notification sent to Manager.

### B. Manager (Approval Flow)
1.  **Notification**: "New Leave Request from [Name]".
2.  **Registry/Admin View**: "Leave Requests" tab.
3.  **Action**: Approve or Reject with comment.
4.  **Outcome**:
    *   **Approved**: Added to `Leave` collection, deducts from Staff entitlement, appears on Roster.
    *   **Rejected**: Status updated, Staff notified.

## 4. UI Implementation Plan

### A. Personal Dashboard Updates
- Add **"Annual Leave"** Card to the Bottom KPI row.
  - Shows: "12 / 28 Days Left".
  - Action: "Book" button.

### B. Calendar Integration (`StaffView.tsx`)
- **Visuals**:
  - `renderCalendar` currently maps `attendance` for "Present".
  - **Update**: Fetch `leaves` collection.
  - Check if date falls within `startDate` and `endDate` of an approved leave.
  - **Render**:
    - **Holiday**: 🏖️ Purple pill / stripe background.
    - **Sick**: 🤒 Pink pill.
    - **Unpaid**: ⚪ Grey pill.

### C. Backend Automation (Cloud Functions / Logic)
- **Conflict Check**: Warn if >2 staff are off on the same day.
- **Payroll**: Sync "Unpaid" leave to Payroll module (future).

## 5. Development Steps
1.  Define `LeaveRequest` schema in Firestore.
2.  Create `LeaveRequestModal` component.
3.  Update `StaffView` to fetch and display Leaves on Calendar.
4.  Implement "Approve/Reject" UI for Managers.
