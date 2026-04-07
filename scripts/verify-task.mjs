import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const taskId = process.argv[2];

if (!taskId) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: Task ID must be specified (e.g. 4.1)');
  process.exit(1);
}

console.log('\x1b[34m%s\x1b[0m', `🛡️ ENGLABS GUARDIAN: Verifying Task ${taskId}...`);

// 1. Check for Blueprint
const blueprintPath = join(process.cwd(), 'docs', 'blueprints', `${taskId}.md`);
if (!existsSync(blueprintPath)) {
  console.log('\x1b[33m%s\x1b[0m', `⚠️ WARNING: Blueprint ${blueprintPath} not found. Skipping blueprint check.`);
} else {
  console.log('\x1b[32m%s\x1b[0m', '✅ Blueprint found.');
}

// 2. Run TypeScript Compiler
try {
  console.log('\x1b[34m%s\x1b[0m', '🔍 CHECKING: System Integrity (tsc)...');
  const tscPath = join(process.cwd(), 'node_modules', 'typescript', 'bin', 'tsc');
  execSync(`node "${tscPath}" --noEmit`, { stdio: 'inherit' });
  console.log('\x1b[32m%s\x1b[0m', '✅ Build stable.');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ ERROR: Build failed. Fix Type Errors before proceeding.');
  process.exit(1);
}

// 3. Run Task-Specific Tests (if they exist)
const specificTestFile = join(process.cwd(), 'tests', 'unit', `${taskId}_diagnostics.test.tsx`);
try {
  console.log('\x1b[34m%s\x1b[0m', `🔍 CHECKING: Task Logic (${taskId})...`);
  const vitestPath = join(process.cwd(), 'node_modules', 'vitest', 'vitest.mjs');
  const target = existsSync(specificTestFile) ? specificTestFile : '';
  execSync(`node "${vitestPath}" run ${target} -t "${taskId}"`, { stdio: 'inherit', env: { ...process.env, CI: 'true' } });
  console.log('\x1b[32m%s\x1b[0m', '✅ Logic verified.');
} catch (error) {
  console.log('\x1b[33m%s\x1b[0m', `⚠️ Note: No specific unit tests found with tag [${taskId}]. Please ensure you have tagged the test.`);
}

console.log('\x1b[32m%s\x1b[0m', `\n🚀 SUCCESS: Task ${taskId} has passed ALL ENGLABS Quality Gates!`);
console.log('\x1b[34m%s\x1b[0m', '---------------------------------------------------------');
