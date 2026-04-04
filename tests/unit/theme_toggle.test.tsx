
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import React from 'react';
import { ThemeToggle } from '../../components/ThemeToggle';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

describe('ThemeToggle Integration', () => {

    it('renders the toggle button', () => {
        render(<ThemeToggle />);
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    });

    it('defaults to light mode', () => {
        render(<ThemeToggle />);
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('toggles to dark mode on click', async () => {
        render(<ThemeToggle />);
        const button = screen.getByTestId('theme-toggle');

        fireEvent.click(button); // Switch to Dark

        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('toggles back to light mode on second click', async () => {
        render(<ThemeToggle />);
        const button = screen.getByTestId('theme-toggle');

        // Assuming previous test state might persist in JSDOM unless cleaned, but let's click twice
        // Reset check
        if (document.documentElement.classList.contains('dark')) {
            fireEvent.click(button); // Reset to Light if started Dark
        }

        fireEvent.click(button); // To Dark
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        fireEvent.click(button); // To Light
        expect(document.documentElement.classList.contains('dark')).toBe(false);
        expect(localStorage.getItem('theme')).toBe('light');
    });
});
