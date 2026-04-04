import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export const useTheme = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        // Check local storage or system preference
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved as 'light' | 'dark';
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'dark'; // Default
    });

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    };

    return { theme, toggleTheme };
};

export const ThemeToggle: React.FC<{ className?: string }> = ({ className }) => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`relative p-2 rounded-full transition-all duration-300 overflow-hidden group ${theme === 'dark'
                    ? 'bg-slate-800 text-amber-400 hover:bg-slate-700'
                    : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                } ${className}`}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
            <div className="relative z-10">
                {theme === 'dark' ? (
                    <Moon className="w-5 h-5 animate-in rotate-90 duration-300" />
                ) : (
                    <Sun className="w-5 h-5 animate-in rotate-90 duration-300" />
                )}
            </div>
        </button>
    );
};
