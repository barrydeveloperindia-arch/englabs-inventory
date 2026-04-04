import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Antigravity Autonomous DevOps Orchestrator
 * Trigger: node scripts/antigravity_orchestrator.js "task description" "command string"
 * 
 * Flow:
 * 1. PRE-TEST: Run current project test suites (Vitest/Playwright).
 * 2. EXECUTE: Run the requested command string (e.g. npx ..., git commit...).
 * 3. POST-TEST: Run suites again to ensure no regressions.
 * 4. PUSH: Automatic commit and push to GitHub on PASS.
 */

async function runAutonomousCycle() {
  const taskDescription = process.argv[2] || 'System Refresh';
  const command = process.argv[3];

  console.log(`🛸 UNLOCKING ORCHESTRATOR: ${taskDescription}`);
  
  try {
    // Phase 1: PRE-COMMAND AUDIT
    console.log('--- Phase 1: PRE-COMMAND AUDIT ---');
    try {
      execSync('npm run test', { stdio: 'inherit' });
      console.log('✅ Pre-Command Audit: PASSED');
    } catch (e) {
      console.error('❌ Pre-Command Audit: FAILED. Aborting Cycle.');
      process.exit(1);
    }

    // Phase 2: COMMAND EXECUTION
    if (command) {
        console.log(`--- Phase 2: EXECUTING COMMAND: ${command} ---`);
        try {
          execSync(command, { stdio: 'inherit' });
          console.log('✅ Command Execution: SUCCESS');
        } catch (e) {
          console.error('❌ Command Execution: FAILED. Manual intervention required.');
          process.exit(1);
        }
    } else {
        console.log('--- Phase 2: SKIPPED (No command provided) ---');
    }

    // Phase 3: POST-COMMAND VERIFICATION
    console.log('--- Phase 3: POST-COMMAND VERIFICATION ---');
    try {
      execSync('npm run test', { stdio: 'inherit' });
      console.log('✅ Post-Command Verification: PASSED');
    } catch (e) {
      console.error('❌ Post-Command Verification: FAILED (Regressions detected).');
      process.exit(1);
    }

    // Phase 4: AUTO-COMMIT & PUSH
    console.log('--- Phase 4: AUTOMATIC RELEASE (GITHUB) ---');
    try {
      const commitMessage = `Autonomous Verified Release: ${taskDescription}`;
      execSync(`git add .`, { stdio: 'inherit' });
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      execSync(`git push origin main`, { stdio: 'inherit' });
      console.log(`🚀 RELEASE COMPLETE: ${commitMessage}`);
    } catch (e) {
      console.error('❌ Release: FAILED (Git sync error).');
      process.exit(1);
    }

  } catch (globalError) {
    console.error('👽 Critical Orchestrator Failure:', globalError);
  }
}

runAutonomousCycle();
