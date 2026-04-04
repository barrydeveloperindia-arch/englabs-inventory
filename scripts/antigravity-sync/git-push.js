import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../');

const git = simpleGit(ROOT_DIR);

export async function pushToGithub(commandName, payload) {
    // Ensure logs directory exists
    const logDir = path.join(ROOT_DIR, 'logs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const fileName = path.join(logDir, `${commandName}_${Date.now()}.json`);
    fs.writeFileSync(fileName, JSON.stringify(payload, null, 2));

    console.log(`[Git] Staging and Committing: ${commandName}`);

    try {
        await git.add('.');
        await git.commit(`AUTO: ${commandName} completed`);
        await git.push('origin', 'main');
        console.log(`[Git] Push Successful`);
    } catch (e) {
        throw e;
    }
}
