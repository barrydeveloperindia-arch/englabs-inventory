import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MOCK DB Implementation - Replaces "DB.commands.insert"
// In a real scenario, replace this with your actual MongoDB/SQL connection.
class LocalDB {
    constructor(basePath) {
        this.basePath = basePath;
        if (!fs.existsSync(this.basePath)) fs.mkdirSync(this.basePath, { recursive: true });
        this.commandsPath = path.join(this.basePath, 'db_commands.json');
        this.failedPath = path.join(this.basePath, 'db_failed_push.json');
    }

    async insert(collection, record) {
        const file = collection === 'commands' ? this.commandsPath : this.failedPath;
        let data = [];
        try {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                data = content ? JSON.parse(content) : [];
            }
        } catch (e) {
            console.error("DB Read Error:", e);
        }

        data.push(record);
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    }
}

const DB = {
    commands: new LocalDB(path.join(__dirname, '../../local_db_storage')),
    failed_push: {
        insert: (record) => DB.commands.insert('failed_push', record)
    }
};

export async function saveToDatabase(commandName, payload) {
    const record = {
        command: commandName,
        data: payload,
        executedAt: new Date(),
        status: "COMPLETED"
    };

    console.log(`[DB] Saving record for: ${commandName}`);
    await DB.commands.insert('commands', record);
}

export async function logFailure(commandName, error) {
    await DB.failed_push.insert({
        command: commandName,
        error: error.message,
        retry: true,
        timestamp: new Date()
    });
}
