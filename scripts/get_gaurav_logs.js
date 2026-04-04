
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, initializeFirestore, memoryLocalCache, query, where } from "firebase/firestore";

// Config from .env.local (extracted from count_staff.js)
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
const TODAY = "2026-02-13";

async function fetchLogs() {
    console.log(`\n🔍 Connecting to Firestore Project: ${firebaseConfig.projectId}`);

    try {
        // 1. Find Gaurav's ID
        const staffRef = collection(db, 'shops', USER_ID, 'staff');
        const staffSnapshot = await getDocs(staffRef);
        let gauravId = null;
        let staffMap = {};

        staffSnapshot.forEach(doc => {
            const data = doc.data();
            staffMap[doc.id] = data.name;
            if (data.name.toLowerCase().includes('gaurav')) {
                gauravId = doc.id;
                console.log(`✅ Found Gaurav: ID=${gauravId}, Role=${data.role}`);
            }
        });

        if (!gauravId) {
            console.log("⚠️ Gaurav not found in staff list.");
        }

        // 2. Fetch Gaurav's Logs
        if (gauravId) {
            console.log(`\n📋 Attendance Logs for GAURAV:`);
            const attendanceRef = collection(db, 'shops', USER_ID, 'attendance');
            const gauravQuery = query(attendanceRef, where('staffId', '==', gauravId));
            const gauravLogs = await getDocs(gauravQuery);

            if (gauravLogs.size > 0) {
                gauravLogs.forEach(doc => {
                    const log = doc.data();
                    console.log(`   - Date: ${log.date}, In: ${log.clockIn}, Out: ${log.clockOut || 'IN PROGRESS'}, Hours: ${log.hoursWorked || 0}`);
                });
            } else {
                console.log("   No logs found for Gaurav.");
            }
        }

        // 3. Fetch Today's Logs (Feb 13, 2026)
        console.log(`\n📅 Today's Logbook (${TODAY}):`);
        const attendanceRef = collection(db, 'shops', USER_ID, 'attendance');
        const todayQuery = query(attendanceRef, where('date', '==', TODAY));
        const todayLogs = await getDocs(todayQuery);

        if (todayLogs.size > 0) {
            todayLogs.forEach(doc => {
                const log = doc.data();
                const name = staffMap[log.staffId] || `Unknown (${log.staffId})`;
                console.log(`   - [${name}] In: ${log.clockIn}, Out: ${log.clockOut || 'IN PROGRESS'}, ID: ${doc.id}`);
            });
        } else {
            console.log("   No staff check-ins recorded for today.");
        }

    } catch (error) {
        console.error("❌ Error:", error.message);
    }
    process.exit();
}

fetchLogs();
