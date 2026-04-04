# Workforce Management Logic

## 1. Multiple Shifts (Same Day)
The system supports multiple shifts per day for a single staff member.
This is achieved by treating each "Clock In -> Clock Out" cycle as a distinct **Attendance Session**.

### Logic
- **Check In:** Creates a new `AttendanceRecord` in Firestore with a unique ID.
- **Check Out:** Finds the *currently open* record (where `clockOut` is null) and closes it.
- **Re-Entry:** If a staff member returns later the same day, the system detects no *open* record and creates a **new** distinct record.

**Example Data Structure:**
```json
// Morning Shift
{ "id": "uuid-1", "date": "2023-10-27", "clockIn": "09:00", "clockOut": "13:00", "hours": 4 }

// Evening Shift
{ "id": "uuid-2", "date": "2023-10-27", "clockIn": "17:00", "clockOut": "21:00", "hours": 4 }
```
**Total Daily Hours:** Sum of all records for that date (8 Hours).

## 2. Breaks
### "Between Shifts" (Unpaid)
If a staff member Clocks Out completely (e.g., for lunch or split shift), this is an **Unpaid Break**. No hours are accrued while clocked out.

### "During Shift" (Paid)
The "Start Break" / "End Break" button toggles a status flag.
- Currently, the generic `calculateHours` function `(End - Start)` **INCLUDES** break time (Paid Break).
- To switch to **Unpaid Breaks**, the calculation logic in `StaffView.tsx` needs to subtract the break duration.

## 3. Lateness Logic
Lateness is calculated based on the **First Shift** of the day.
- **Grace Period:** 5 Minutes.
- If `First ClockIn > 09:05`, status is marked 'Late'.

## 4. Midnight & Cross-Day Shifts (Updated Feb 2026)
To support overnight shifts (e.g., Hospitality/Bar closing at 2 AM), the logic handles time wrapping:
- **Clock Out Logic**: Searches for *any* open shift for the user, ignoring the `date` constraint (allows closing a shift started effectively "Yesterday").
- **Hour Calculation**: uses a modulo-24 logic:
  ```javascript
  let diff = (endMin - startMin);
  if (diff < 0) diff += (24 * 60); // Handle midnight wrapping
  ```
- **Constraint**: Shifts cannot exceed 24 hours in duration.

## 5. Notification System
### Deep Linking
Notifications support a `link` property to redirect users to specific modules upon interaction.
- **Payload**: `{ title: "Staff Update", link: "staff", ... }`
- **Behavior**: Clicking the notification triggers `setActiveView('staff')` and auto-closes the notification dropdown.
- **Accessibility**: Notification bell includes `aria-label="Notifications"` for screen readers and testing.
