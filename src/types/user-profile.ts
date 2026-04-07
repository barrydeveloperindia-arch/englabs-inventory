import { UserRole } from '../types';

export interface UserProfile {
    id: string;
    name: string;
    role: UserRole;
    email: string;
    employeeId: string;
    status: 'Active' | 'Offline';
    lastLogin: string;
    department?: string;
    photo?: string;
}

export interface UserProfileState {
    data: UserProfile | null;
    loading: boolean;
    error: string | null;
}
