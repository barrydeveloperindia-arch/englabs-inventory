import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

interface FluxButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    loading?: boolean;
}

export const FluxButton: React.FC<FluxButtonProps> = ({
    className,
    variant = 'primary',
    loading,
    children,
    ...props
}) => {
    const baseStyles = "relative overflow-hidden group font-bold rounded-xl transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2";

    const variants = {
        primary: "bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-900/20 hover:scale-[1.02] hover:shadow-primary-500/30",
        secondary: "bg-surface-elevated text-slate-200 border border-slate-700 hover:bg-slate-700 hover:border-slate-600",
        ghost: "text-slate-400 hover:text-primary-400 hover:bg-primary-500/10",
        danger: "bg-gradient-to-br from-rose-600 to-rose-700 text-white shadow-lg shadow-rose-900/20 hover:scale-[1.02] hover:shadow-rose-500/30"
    };

    const sizes = "px-6 py-3 text-sm";

    return (
        <button
            className={cn(baseStyles, variants[variant], sizes, className)}
            disabled={loading || props.disabled}
            {...props}
        >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            <span className="relative z-10">{children}</span>
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-surface-elevated/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            )}
        </button>
    );
};
