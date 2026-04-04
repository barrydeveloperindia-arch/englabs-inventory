import { spawn } from 'child_process';
import { onCommandComplete } from './antigravity-sync/hook.js';

const commandToRun = process.argv[2];
const commandName = process.argv[3] || commandToRun;

if (!commandToRun) {
    console.error("Usage: node scripts/auto-run.js <command_to_execute> [human_readable_name]");
    process.exit(1);
}

console.log(`> Executing: ${commandToRun}`);
const start = Date.now();

// Execute the command string (very basic shell execution)
// Note: windows compatibility might need 'shell: true'
const child = spawn(commandToRun, {
    stdio: 'inherit',
    shell: true
});

child.on('close', async (code) => {
    const duration = Date.now() - start;
    if (code === 0) {
        console.log(`> Command '${commandName}' success (${duration}ms). Triggering Auto-Sync...`);
        const payload = {
            exitCode: code,
            duration,
            timestamp: new Date().toISOString()
        };
        await onCommandComplete(commandName, payload);
    } else {
        console.error(`> Command '${commandName}' failed with code ${code}. Skipping Auto-Sync.`);
        process.exit(code);
    }
});
