
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
}, "englabs-dev");

const USER_ID = "hop-in-express-";
const TODAY = "2026-02-13";

async function fetchLogs() {
    try {
        const staffRef = collection(db, 'shops', USER_ID, 'staff');
        const staffSnapshot = await getDocs(staffRef);
        let staffMap = {};
        let gauravId = null;

        staffSnapshot.forEach(doc => {
            const data = doc.data();
            staffMap[doc.id] = data.name;
            if (data.name.toLowerCase().includes('gaurav')) gauravId = doc.id;
        });

        console.log(`\n📋 Attendance Logs (DEV DATABASE) - Today: ${TODAY}`);
        const attendanceRef = collection(db, 'shops', USER_ID, 'attendance');
        const snapshot = await getDocs(attendanceRef);

        console.log(`\n📅 Gaurav's Logs:`);
        snapshot.forEach(doc => {
            const log = doc.data();
            if (log.staffId === gauravId) {
                console.log(`   - Date: ${log.date}, In: ${log.clockIn}, Out: ${log.clockOut || 'IN PROGRESS'}, Hours: ${log.hoursWorked || 0}`);
            }
        });

        console.log(`\n📊 Today's Check-ins (${TODAY}):`);
        let found = false;
        snapshot.forEach(doc => {
            const log = doc.data();
            if (log.date === TODAY) {
                found = true;
                const name = staffMap[log.staffId] || `Unknown (${log.staffId})`;
                console.log(`   - [${name}] In: ${log.clockIn}, Out: ${log.clockOut || 'IN PROGRESS'}`);
            }
        });
        if (!found) console.log("   No staff check-ins recorded for today in DIV database.");

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

fetchLogs();
