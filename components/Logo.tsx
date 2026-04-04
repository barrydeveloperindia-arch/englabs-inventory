import React from 'react';

export const BrandLogo: React.FC<{ light?: boolean; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ light = false, size = 'md', className = "" }) => {
    const isSm = size === 'sm';
    const isLg = size === 'lg';

    // Size mapping
    const dim = isSm ? "w-10 h-10" : isLg ? "w-32 h-32" : "w-20 h-20";

    return (
        <div className={`flex flex-col items-center justify-center gap-2 leading-none select-none ${className}`}>
            <img
                src="/assets/englabs_logo.png?v=2026.04.01"
                alt="ENGLABS Inventory"
                className={`${dim} object-contain`}
                onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/shop_logo.png'; // Fallback
                }}
            />
        </div>
    );
};
