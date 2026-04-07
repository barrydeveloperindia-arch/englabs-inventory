# 🛡️ SKILL: World-Class Task Validator (ENGLABS-SOP)
> This skill enforces the "B-T-G-A" (Blueprint-Test-Guardian-Audit) workflow for all ENGLABS development tasks.

## 📋 VALIDATION CHECKLIST
Before any task is marked as [COMMITTED] or [STABLE], this skill must be invoked to verify the following:

### 🏦 1. BLUEPRINT [B]
- [ ] Does a corresponding `docs/blueprints/TASK_ID.md` file exist?
- [ ] Does it define clear "Success Criteria"?
- [ ] Is it approved by the USER?

### 🧪 2. TDD [T]
- [ ] Has a `.test.tsx` or `.test.ts` file been created/updated for this specific task?
- [ ] Does the test pass with `npx vitest run <test_path>`?
- [ ] Does it cover at least one "Critical Edge Case"?

### 💂‍♂️ 3. GUARDIAN BUILD [G]
- [ ] Does `npx tsc` pass without any Type Errors in the project?
- [ ] Does `npm run build` (or a smoke test) pass on the dashboard?
- [ ] Is the "Industrial Clean" aesthetic maintained (Uses correct color tokens)?

### 🤖 4. AGENTIC AUDIT [A]
- [ ] Has Agent Beta (Clawdbot) scanned the code for logic flaws?
- [ ] Is the "Efficiency Index" on the dashboard updated?

---

## 🚀 EXECUTION COMMAND
Whenever a task is ready for verification, the Assistant must run:
`node scripts/verify-task.mjs <TASK_ID>`
