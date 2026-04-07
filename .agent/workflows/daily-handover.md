---
description: Daily Handover SOP: Standard Procedure for Ending a Production Session
---
// turbo-all

The following steps MUST be executed at the end of every production session (Shift End) to ensure continuity for the next Autonomous Agent.

### 1. **Registry Synchronization**
Update the `MASTER_TASK_REGISTER.md` to reflect the absolute current state:
- Mark completed Phase and Task IDs with `[x]`.
- Update Task Status to 🟢 STABLE, 🔘 ACTIVE, or ⚪ PENDING.
- Ensure the B-T-G-A (Build-Test-Grit-Audit) criteria are updated.

### 2. **Context Preservation (`HANDOVER_NOTES.md`)**
Overwrite or create `HANDOVER_NOTES.md` in the project root containing:
- **Major Structural Changes**: Folder shifts, domain refactors, or dependency updates.
- **Persistent Blockers**: Items that were not resolved and why.
- **The "Next Target"**: The specific Task ID from the Master Register that the next agent should initiate.
- **Known Ghosts**: Any lingering lint errors or type-registry ambiguities.

### 3. **Chain of Custody (Push)**
Stage and commit all changes to the remote repository:
1. `git add .`
2. `git commit -m "[Industrial Closure] Shift Completion: Tasks X.X to Y.Y"`
3. `git push origin main`

### 4. **Self-Verification Audit**
Run the task verification script for the most recently edited module:
- `node scripts/verify-task.mjs [CurrentTaskID]`
Confirm that the session is concluding in a "Passing" state before disconnection.

### 5. **Clean Slate Protocol**
- Close all temporary `/tmp/` files.
- Ensure no "Ghost Terminals" are left running in the background if possible.
- Provide a high-precision summary of the day's "Industrial Wins" in the final chat message.
