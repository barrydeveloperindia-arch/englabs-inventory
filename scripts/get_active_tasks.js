import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore, memoryLocalCache, query, where } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const envPathInitial = path.resolve(process.cwd(), '.env.development');
let dbIdEnv = 'englabs1';
if (fs.existsSync(envPathInitial)) {
    const content = fs.readFileSync(envPathInitial, 'utf-8');
    const match = content.match(/VITE_FIREBASE_DATABASE_ID=(.*)/);
    if (match) dbIdEnv = match[1].trim();
}

const db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
}, dbIdEnv);

// Fallback to local env if needed
const envPath = path.resolve(process.cwd(), '.env.development');
let shopIdEnv = 'hop-in-express-';
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/VITE_USER_ID=(.*)/);
    if (match) shopIdEnv = match[1].trim();
}

const USER_ID = shopIdEnv;

async function fetchTasks() {
    console.log("🔍 Fetching Active Tasks for Today (Feb 19, 2026)...");
    try {
        const tasksRef = collection(db, 'shops', USER_ID, 'tasks');
        // We look for tasks that are not 'completed' or were created recently
        const snapshot = await getDocs(tasksRef);

        let activeTasks = [];
        snapshot.forEach(doc => {
            const task = doc.data();
            if (task.status !== 'completed' && task.status !== 'cancelled') {
                activeTasks.push({ id: doc.id, ...task });
            }
        });

        if (activeTasks.length === 0) {
            console.log("✅ No active automated tasks found in Firestore.");
        } else {
            activeTasks.forEach(task => {
                console.log(`📌 [${task.status.toUpperCase()}] ${task.title} - Priority: ${task.priority}`);
                if (task.description) console.log(`   Description: ${task.description}`);
            });
        }

    } catch (error) {
        console.error("❌ Error fetching tasks:", error.message);
    }
    process.exit();
}

fetchTasks();
