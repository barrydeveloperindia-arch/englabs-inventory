import { test, expect } from '@playwright/test';
import { smartClick } from '../../lib/self_healing';

test.describe('Self-Healing Automation Demonstration', () => {
    test('Login with potentially broken selectors', async ({ browser }) => {
        // Create a fresh context without storage state for the login demo
        const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        const page = await context.newPage();

        await page.goto('/?test=true');
        // Wait for Splash screen to dismiss (3s)
        await page.waitForTimeout(5000);
        await smartClick(page, '#broken-email-selector', {
            role: 'textbox',
            name: 'Fleet Identity',
            text: 'commander@englabs.com',
            tagName: 'INPUT'
        });

        await page.fill('[data-testid="email-input"]', 'gaurav@englabs.com');
        await context.close();
    });

    test('Navigation with self-healing', async ({ page }) => {
        await page.goto('/?test=true');
        await page.waitForTimeout(5000);

        // Simulate navigation to a view using a selector that might change
        // Target: "Point of Sale" text in the sidebar
        await smartClick(page, '.old-nav-class', {
            text: 'Point of Sale',
            role: 'button'
        });

        // Verify we navigated to the Point of Sale view
        await expect(page.getByText(/Settle Cash/i)).toBeVisible({ timeout: 15000 });
    });
});
