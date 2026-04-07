
import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

/**
 * OfflineBanner Component
 * 
 * Displays a fixed alert at the bottom of the screen when the application loses network connectivity.
 * This is critical for mobile POS systems to warn staff that data syncing is paused.
 * 
 * Behavior:
 * - Listens to 'online' and 'offline' window events.
 * - Shows a red banner with "Offline Mode" text when disconnected.
 * - Automatically hides when connection is restored.
 */
export const OfflineBanner: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (isOnline) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-3 flex items-center justify-center z-[9999] animate-slide-up shadow-lg">
            <WifiOff className="w-5 h-5 mr-2" />
            <span className="font-semibold text-sm">Offline Mode: Data sync paused</span>
        </div>
    );
};
