
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore, memoryLocalCache, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAyzMBc68JbPs7CaysjR1n7ItyYsCPSJmQ",
    authDomain: "hop-in-express-b5883.firebaseapp.com",
    projectId: "hop-in-express-b5883",
    storageBucket: "hop-in-express-b5883.appspot.com",
    messagingSenderId: "188740558519",
    appId: "1:188740558519:web:db33eb0d6b90ef29aab732"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {
    localCache: memoryLocalCache(),
}, "englabs1");

const USER_ID = "hop-in-express-";

async function fetchLogs() {
    try {
        const staffRef = collection(db, 'shops', USER_ID, 'staff');
        const staffSnapshot = await getDocs(staffRef);
        let staffMap = {};
        staffSnapshot.forEach(doc => { staffMap[doc.id] = doc.data().name; });

        console.log(`\n📋 All Recent Attendance Logs:`);
        const attendanceRef = collection(db, 'shops', USER_ID, 'attendance');
        const snapshot = await getDocs(attendanceRef);

        const logs = [];
        snapshot.forEach(doc => {
            logs.push({ ...doc.data(), id: doc.id });
        });

        // Sort by date descending
        logs.sort((a, b) => b.date.localeCompare(a.date));

        logs.slice(0, 20).forEach(log => {
            const name = staffMap[log.staffId] || `Unknown (${log.staffId})`;
            console.log(`   - Date: ${log.date}, Name: ${name}, In: ${log.clockIn}, Out: ${log.clockOut || 'IN PROGRESS'}, ID: ${log.id}`);
        });

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

fetchLogs();
