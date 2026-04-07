import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '../lib/utils';

export const ThemeToggle = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        // Initialize from storage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            setTheme('dark');
            document.documentElement.classList.add('dark');
        } else {
            setTheme('light');
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    return (
        <button
            onClick={toggleTheme}
            data-testid="theme-toggle"
            className={cn(
                "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300",
                "text-neutral-500 hover:text-primary-600 hover:bg-neutral-100 dark:hover:bg-white/5",
                theme === 'dark' ? "text-yellow-400" : "text-neutral-600"
            )}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle Theme"
        >
            <div className="relative w-5 h-5">
                <Sun
                    className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-300 transform",
                        theme === 'dark' ? "rotate-90 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"
                    )}
                />
                <Moon
                    className={cn(
                        "absolute inset-0 w-full h-full transition-all duration-300 transform",
                        theme === 'dark' ? "rotate-0 opacity-100 scale-100" : "-rotate-90 opacity-0 scale-50"
                    )}
                />
            </div>
        </button>
    );
};
