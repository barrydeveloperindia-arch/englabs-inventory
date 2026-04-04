
import fs from 'fs';
import path from 'path';

const FILES_TO_CLEAN = [
    'Untitled-1.txt',
    'Untitled-2.txt',
    'bugreport-*.zip',
    'social_media_post*.txt',
    'invoice_ingestion_report.json',
    '*.log'
];

const DIRS_TO_CLEAN = [
    'android_logs',
    'crash_reports'
];

function deleteFile(filePath) {
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`✅ Deleted file: ${filePath}`);
    }
}

function deleteFolderRecursive(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file) => {
            const curPath = path.join(directoryPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(directoryPath);
        console.log(`✅ Deleted directory: ${directoryPath}`);
    }
}

function cleanup() {
    console.log('🚀 Starting Workspace Hygiene Cleanup...');
    const root = process.cwd();

    // Clean specific files and patterns
    const allFiles = fs.readdirSync(root);
    allFiles.forEach(file => {
        FILES_TO_CLEAN.forEach(pattern => {
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
                if (regex.test(file)) {
                    deleteFile(path.join(root, file));
                }
            } else if (file === pattern) {
                deleteFile(path.join(root, file));
            }
        });
    });

    // Clean specific directories
    DIRS_TO_CLEAN.forEach(dir => {
        deleteFolderRecursive(path.join(root, dir));
    });

    console.log('⭐ Cleanup Complete. Workspace is now healthy.');
}

cleanup();
