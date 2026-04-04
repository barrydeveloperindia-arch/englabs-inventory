import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile } from '../types/user-profile';
import { StaffMember } from '../types';

export const userService = {
    async fetchProfile(staffId: string): Promise<UserProfile> {
        const shopId = import.meta.env.VITE_USER_ID || 'englabs-enterprise';
        const docRef = doc(db, 'shops', shopId, 'staff', staffId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as StaffMember;
            return {
                id: data.id,
                name: data.name,
                role: data.role,
                email: data.email || '',
                employeeId: data.niNumber || data.id,
                status: 'Active', // Assuming active if they are logged in
                lastLogin: new Date().toISOString(), // This should ideally come from a login log
                department: data.department,
                photo: data.photo
            };
        } else {
            throw new Error('User profile not found');
        }
    },

    async logout() {
        await auth.signOut();
        // Clear any local storage if necessary
        localStorage.removeItem('englabs_session');
        localStorage.removeItem('englabs_identity');
        // Session cookies are usually handled by Firebase Auth
    }
};
