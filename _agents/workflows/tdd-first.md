---
description: Assistant TDD-First Skill and Command Workflow
---

# 🛸 TDD-First Protocol

Follow this workflow whenever creating a new skill or executing a command for the USER.

## 🚀 Step 1: Create the Test First
1.  Identify the target directory (e.g., `skills/[skill_name]/tests/` or `_agents/workflows/tests/`).
2.  Create a test script (PowerShell `.Tests.ps1` or Vitest `.test.tsx`).
3.  Define the expected behavior/integrity in the test.
// turbo
4.  Run the test using `Invoke-Pester` or `npx vitest` and observe it fail.

## 🏗️ Step 2: Create the Skill
1.  Create the skill descriptor (`SKILL.md`) or the workflow file.
2.  Implement the logic required to satisfy the test.
// turbo
3.  Run the test again to verify success.

## ⚡ Step 3: Command Guard
1.  Before executing a user-given command, look for a matching test file.
2.  If it doesn't exist, create it.
3.  Run the test.
4.  Execute the original command ONLY if the test passes.

---
*Enforced by Antigravity OS v1.0.0*
