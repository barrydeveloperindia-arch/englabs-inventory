---
description: Automated Execution Workflow (Test-Execute-Verify-Commit)
---

This workflow enforces the user's "Guardian" policy for autonomous, reliable implementation.

### 1. Pre-Implementation Validation
// turbo
1. Run a baseline smoke test to ensure the system is stable before changes.
```powershell
npm test tests/smoke/
```

### 2. Implementation Phase
2. Execute the requested code changes or features.
3. Ensure all new logic follows the established architectural patterns.

### 3. Post-Implementation Verification
// turbo
4. Run the full test suite (or specific relevant modules) to verify the changes.
```powershell
npm test tests/e2e/guardian_system_verification.test.tsx
```

### 4. Automated Synchronization (GitHub)
// turbo
5. If all tests pass, stage, commit, and push the verified updates.
```powershell
git add .
git commit -m "Guardian-Verified: [Task Summary] - Build Stable"
git push origin main
```

### 5. Failure Protocol (Rollback)
6. If any test fails, analyze the error.
7. If the error cannot be immediately resolved, revert the changes to maintain system integrity.
```powershell
git checkout .
```
