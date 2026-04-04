# RFC: Biometric Attendance Workflow

## Objective
Streamline the Staff Clock In/Out process by integrating it directly into the `AccessTerminal` (Lock Screen) authentication flow (PIN/Face/Biometrics).

## The User Request
> "Use Pin/Face/Bio to unlock. If 'Out', Clock them In. If 'In', Clock them Out."

## ⚠️ Critical Analysis: The "Retail Paradox"
In a shop environment, staff lock and unlock the POS terminal dozens of times a day (e.g., between customers, after breaks, or for security).

### Scenario A: Pure Toggle Logic (Risky)
1. **08:00 AM**: Staff arrives. Unlocks Terminal. -> **System Clocks IN**. (Correct)
2. **08:15 AM**: Staff locks terminal to restock shelves.
3. **08:20 AM**: Customer arrives. Staff Unlocks Terminal to sell gum.
4. **Result**: System checks state (Is In?). **System Clocks OUT**.
5. **Impact**: Staff is now working off the clock. Payroll data is corrupted.

## ✅ Proposed Solution: "Smart Entry / Explicit Exit"

We should separate the **"Start of Day"** intent from the **"End of Day"** intent, while keeping the speed of biometrics.

### 1. Auto-Clock IN (The "Smart Entry")
When a staff member authenticates (Unlocks):
- **Check**: Do they have an open shift today?
    - **No**: Automatically **CLOCK IN**. Show Notification: *"Welcome [Name], Shift Started at 08:00."*
    - **Yes**: Just **UNLOCK**. Show Notification: *"Access Granted."*
    
*Result: Staff never forgets to clock in. Frequent unlocks do not disrupt payroll.*

### 2. Explicit Clock OUT
Because "leaving" is a deliberate action, we cannot assume every unlock is a departure.
- **UI Change**: Add a dedicated **"End Shift"** or **"Clock Out"** button on the Lock Screen (AccessTerminal).
- **Workflow**:
    1. Staff taps "End Shift" on the lock screen.
    2. Terminal prompts for Auth (PIN/Face/Bio).
    3. **System Clocks OUT**.
    4. Screen remains locked.

## Implementation Plan
1. **Modify `App.tsx`**: Update `onAuthenticate` callback to check `attendance` state.
2. **Update `AccessTerminal.tsx`**:
    - Add visual feedback logic (e.g., "Clocking In..." vs "Unlocking...").
    - Add the "Clock Out" button to the main selection grid.

## Decision Required
Do you agree with the **Smart Entry / Explicit Exit** approach, or do you still prefer the strict **Toggle** (with its associated risks)?
