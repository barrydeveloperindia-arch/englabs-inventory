
import { db } from '../lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

console.log('Starting deletion script...');

const deleteStaff = async (id: string) => {
    try {
        // Hardcoding 'shop_1' as it seems to be the default user ID in dev environment if not specified
        // Adjust if needed based on .env
        const userId = process.env.VITE_USER_ID || 'shop_1';
        await deleteDoc(doc(db, 'shops', userId, 'staff', id));
        console.log(`Deleted staff ID: ${id}`);
    } catch (e) {
        console.error(`Failed to delete staff ID ${id}`, e);
    }
};

(async () => {
    // 7 = Harsh, 12 = Smit
    await Promise.all([
        deleteStaff('7'),
        deleteStaff('12')
    ]);
    console.log('Done');
    process.exit(0);
})();
