import React from 'react';
import { cn } from '../../lib/utils';

interface NeonInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const NeonInput: React.FC<NeonInputProps> = ({ className, label, id, ...props }) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label htmlFor={inputId} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                className={cn(
                    "w-full bg-slate-950/50 border border-slate-800 text-slate-100 placeholder:text-ink-muted rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all focus:border-primary-500 focus:shadow-neon disabled:opacity-50",
                    className
                )}
                {...props}
            />
        </div>
    );
};
