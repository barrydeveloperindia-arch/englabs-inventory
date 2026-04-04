
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app); // Default database

const USER_ID = "hop-in-express-";

async function fetchLogs() {
    try {
        console.log(`\n📋 Checking DEFAULT Firestore Database for recent logs...`);
        const attendanceRef = collection(db, 'shops', USER_ID, 'attendance');
        const snapshot = await getDocs(attendanceRef);

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ ...doc.data(), id: doc.id });
        });

        if (logs.length === 0) {
            console.log("   No logs found in default database.");
            process.exit();
        }

        logs.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

        logs.slice(0, 5).forEach(log => {
            console.log(`   - Date: ${log.date}, In: ${log.clockIn}, Out: ${log.clockOut || 'IN PROGRESS'}, ID: ${log.id}`);
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

fetchLogs();
