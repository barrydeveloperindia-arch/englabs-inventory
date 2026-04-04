import { useState, useEffect, useCallback, useMemo } from 'react';
import { UserProfile, UserProfileState } from '../types/user-profile';
import { userService } from '../services/userService';

export const useUserProfile = (staffId: string | null) => {
    const [state, setState] = useState<UserProfileState>({
        data: null,
        loading: false,
        error: null
    });

    const fetchProfile = useCallback(async () => {
        if (!staffId) return;

        setState(prev => ({ ...prev, loading: true, error: null }));
        try {
            const profile = await userService.fetchProfile(staffId);
            setState({ data: profile, loading: false, error: null });
        } catch (err: any) {
            setState({ data: null, loading: false, error: err.message || 'Failed to fetch profile' });
        }
    }, [staffId]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleLogout = useCallback(async () => {
        try {
            await userService.logout();
            window.location.reload(); // Simple way to clear app state
        } catch (err) {
            console.error('Logout failed:', err);
        }
    }, []);

    // Memoized actions to prevent re-renders
    const actions = useMemo(() => ({
        logout: handleLogout,
        refetch: fetchProfile
    }), [handleLogout, fetchProfile]);

    return { ...state, actions };
};
