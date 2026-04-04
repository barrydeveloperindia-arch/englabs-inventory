import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression Testing', () => {
    test('Dashboard Visual Snapshot', async ({ page }) => {
        // Navigate to the dashboard
        await page.goto('/?test=true#dashboard');

        // Wait for the application to load components
        await page.locator('[data-testid="dashboard-heading"]').waitFor({ state: 'visible', timeout: 30000 });

        // 1. Playwright Native Pixel-Level Comparison
        // This will detect CSS breaks, alignment issues, and color mismatches locally
        await expect(page).toHaveScreenshot('dashboard-master.png', {
            maxDiffPixelRatio: 0.1,
            animations: 'disabled'
        });

        // 2. Percy Integrated Visual Review
        // This pushes the state to Percy for team review and cross-browser validation
        await percySnapshot(page, 'Dashboard Main State');
    });

    test('Staff Registry Visual Snapshot', async ({ page }) => {
        await page.goto('/?test=true#staff'); // Assuming staff view is accessible via hash or similar

        // Fallback navigation if needed
        // await page.click('text=Staff Registry');

        // Wait for staff registry to render
        await page.waitForTimeout(2000);

        await expect(page).toHaveScreenshot('staff-registry.png');
        await percySnapshot(page, 'Staff Registry View');
    });
});
