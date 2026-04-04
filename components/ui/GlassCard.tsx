import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'void';
}

export const GlassCard: React.FC<GlassCardProps> = ({ className, variant = 'default', children, ...props }) => {
    return (
        <div
            className={cn(
                "rounded-2xl border backdrop-blur-md transition-all",
                variant === 'default' && "bg-surface-elevated/40 border-white/5 shadow-xl",
                variant === 'void' && "bg-surface-void/80 border-slate-800",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
