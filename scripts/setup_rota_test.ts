
// @ts-ignore
import { initializeApp } from 'firebase/app';
// @ts-ignore
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';

// Hardcoded config for TEST SCRIPT ONLY 
const firebaseConfig = {
    apiKey: "dummy_key_not_needed_for_simple_db_test_if_security_rules_allow",
    authDomain: "hop-in-express-1.firebaseapp.com",
    projectId: "hop-in-express-1",
    storageBucket: "hop-in-express-1.appspot.com",
    messagingSenderId: "dummy",
    appId: "dummy"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data Types
interface StaffMember {
    id: string;
    name: string;
    role: 'Owner' | 'Manager' | 'Till Manager' | 'Inventory Staff' | 'Cashier' | 'Driver';
    email: string;
    phone: string;
    hourlyRate: number;
    contractType: string;
    pin: string;
    active: boolean;
    joinedDate: string;
}

interface RotaPreference {
    id: string;
    staffId: string;
    weekStart: string;
    targetBoardHours: number;
    availability?: any;
}

const USERS_TO_CREATE = [
    { name: 'Alice Baker', role: 'Cashier' },
    { name: 'Bob Carter', role: 'Inventory Staff' },
    { name: 'Charlie Davis', role: 'Cashier' },
    { name: 'David Evans', role: 'Driver' },
    { name: 'Eve Foster', role: 'Manager' },
    { name: 'Frank Green', role: 'Cashier' },
    { name: 'Grace Hill', role: 'Till Manager' },
    { name: 'Harry Irwin', role: 'Cashier' },
    { name: 'Ivy Jones', role: 'Inventory Staff' },
    { name: 'Jack Kelly', role: 'Owner' }
];

const WEEK_START = '2026-02-02';
const USER_ID = 'user_2s6hReiX3d4P0o9v2b5n8M7k1L';

async function setupTestScenario() {
    console.log('--- STARTING TEST SCENARIO SETUP ---');
    console.log('Target Shop ID:', USER_ID);

    const staffIds: string[] = [];

    // Create Staff
    for (const user of USERS_TO_CREATE) {
        const id = `staff_${user.name.split(' ')[0].toLowerCase()}`;
        const staffRef = doc(db, 'shops', USER_ID, 'staff', id);
        const staffData: StaffMember = {
            id,
            name: user.name,
            role: user.role as any,
            email: `${user.name.split(' ')[0].toLowerCase()}@englabs.com`,
            phone: '07000000000',
            hourlyRate: 11.50,
            contractType: 'Part-time',
            pin: '1234',
            active: true,
            joinedDate: new Date().toISOString()
        };

        await setDoc(staffRef, staffData);
        staffIds.push(id);
        console.log(`Created staff: ${user.name} (${id})`);
    }

    // Create Preferences
    for (const staffId of staffIds) {
        const availability: any = {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        days.forEach(day => {
            const rand = Math.random();
            if (rand < 0.1) {
                availability[day] = { status: 'unavailable' };
            } else if (rand < 0.3) {
                availability[day] = { status: 'specific', start: '10:00', end: '16:00' };
            } else {
                availability[day] = { status: 'available' };
            }
        });

        const prefId = `pref_${staffId}_${WEEK_START}`;
        const prefRef = doc(db, 'shops', USER_ID, 'rota_preferences', prefId);

        const prefData: RotaPreference = {
            id: prefId,
            staffId: staffId,
            weekStart: WEEK_START,
            targetBoardHours: Math.floor(Math.random() * 20) + 20,
            availability
        };

        await setDoc(prefRef, prefData);
        console.log(`Created pref for: ${staffId}`);
    }

    console.log('--- SETUP COMPLETE ---');
}

setupTestScenario().catch(console.error);
