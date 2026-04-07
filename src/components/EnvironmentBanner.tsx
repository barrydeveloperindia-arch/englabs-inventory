import React, { useEffect } from 'react';

export const EnvironmentBanner: React.FC = () => {
    const mode = import.meta.env.MODE;

    useEffect(() => {
        if (mode && mode !== 'production') {
            document.title = `[${mode.toUpperCase()}] ENGLABS Inventory Management`;
        }
    }, [mode]);

    if (mode === 'production') return null;

    const getBannerStyle = () => {
        switch (mode) {
            case 'development':
                return 'bg-amber-500 text-white';
            case 'staging':
                return 'bg-primary-600 text-white';
            default:
                return 'bg-gray-800 text-white';
        }
    };

    const getBannerText = () => {
        switch (mode) {
            case 'development':
                return '🚧 DEVELOPMENT ENVIRONMENT - DATA IS DISPOSABLE 🚧';
            case 'staging':
                return '🧪 STAGING ENVIRONMENT - PRE-PRODUCTION VERIFICATION 🧪';
            default:
                return `ENVIRONMENT: ${mode.toUpperCase()}`;
        }
    };

    return (
        <div className={`w-full py-1 text-center text-xs font-black tracking-widest uppercase relative z-40 ${getBannerStyle()}`}>
            {getBannerText()}
        </div>
    );
};
