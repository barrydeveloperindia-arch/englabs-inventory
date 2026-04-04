
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotifications } from '../../components/NotificationProvider';

vi.unmock('../../components/NotificationProvider');

const TestComponent = ({ message }: { message: string }) => {
    const { showToast } = useNotifications();
    return (
        <button onClick={() => showToast(message, 'success', 'Test Toast')}>
            Show Toast
        </button>
    );
};

describe('Notification System (Toast)', () => {
    it('should render children correctly', () => {
        render(
            <NotificationProvider>
                <div data-testid="child">Hello World</div>
            </NotificationProvider>
        );
        expect(screen.getByTestId('child')).toBeDefined();
    });

    it('should show toast notification when triggered', async () => {
        render(
            <NotificationProvider>
                <TestComponent message="Operation Successful" />
            </NotificationProvider>
        );

        const button = screen.getByText('Show Toast');
        await act(async () => {
            button.click();
        });

        expect(screen.getByText('Operation Successful')).toBeDefined();
        expect(screen.getByText('Test Toast')).toBeDefined();
    });

    it('should remove toast after timeout', async () => {
        vi.useFakeTimers();
        render(
            <NotificationProvider>
                <TestComponent message="Disappearing message" />
            </NotificationProvider>
        );

        const button = screen.getByText('Show Toast');
        await act(async () => {
            button.click();
        });

        expect(screen.getByText('Disappearing message')).toBeDefined();

        // Fast-forward 6 seconds (timeout is 5s)
        await act(async () => {
            vi.advanceTimersByTime(6000);
        });

        expect(screen.queryByText('Disappearing message')).toBeNull();
        vi.useRealTimers();
    });
});
