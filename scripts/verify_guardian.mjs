
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function runGuardianLiveTest() {
    console.log("🚀 [Guardian-Test] Starting Live Verification...");

    const criticalFiles = [
        'package.json',
        'firestore.rules',
        'lib/firebase.ts'
    ];

    // 1. Verify File Structure
    console.log("\n📁 Checking Agent Folder Structure...");
    const agentPaths = [
        'lib/agents/guardian/GuardianCore.ts',
        'lib/agents/guardian/StabilityShield.ts',
        'lib/agents/guardian/WorkflowMonitor.ts',
        'lib/agents/guardian/GitSync.ts'
    ];

    agentPaths.forEach(p => {
        if (fs.existsSync(p)) {
            console.log(`✅ ${p} exists.`);
        } else {
            console.error(`❌ ${p} MISSING!`);
        }
    });

    // 2. Simulate StabilityShield.generateDynamicTest() locally
    console.log("\n🛡️ Verifying Test Generation logic...");
    const testContent = `
import { describe, it, expect } from 'vitest';
import fs from 'fs';

describe('🚀 SYSTEM_STABILITY_AUDIT (LIVE)', () => {
    it('should verify critical system files are intact', () => {
        const criticalFiles = [${criticalFiles.map(p => `'${p}'`).join(', ')}];
        criticalFiles.forEach(file => {
            expect(fs.existsSync(file)).toBe(true);
        });
    });
});
`;
    const testPath = 'tests/guardian/live_stability.test.ts';
    if (!fs.existsSync('tests/guardian')) fs.mkdirSync('tests/guardian', { recursive: true });
    fs.writeFileSync(testPath, testContent);
    console.log(`✅ Dynamic test generated at ${testPath}`);

    // 3. Run the generated test
    console.log("\n🧪 Running generated stability audit...");
    try {
        const output = execSync('npx vitest run tests/guardian/live_stability.test.ts', { encoding: 'utf-8' });
        console.log(output);
        console.log("✅ Stability Audit Passed.");
    } catch (err) {
        console.error("❌ Stability Audit Failed!");
        console.error(err.stdout);
    }

    // 4. Test Git Connectivity (Dry Run)
    console.log("\n📂 Testing Git Connectivity...");
    try {
        const status = execSync('git status --short', { encoding: 'utf-8' });
        console.log("Git Status Out:\n", status || "No changes.");
        console.log("✅ Git repository detected and healthy.");
    } catch (err) {
        console.error("❌ Git check failed.");
    }

    console.log("\n🏁 Live Verification Complete.");
}

runGuardianLiveTest();
