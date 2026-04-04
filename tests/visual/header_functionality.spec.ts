
import { test, expect } from '@playwright/test';

test.describe('Header Navigation & Global Search (Feb 17 Update)', () => {
    test.beforeEach(async ({ page }) => {
        // Increase timeout for each test
        test.setTimeout(60000);

        // Navigate to the local dev environment with testing bypass
        await page.goto('/?test=true');

        // Wait for the app to initialize by checking for the dashboard heading
        await page.waitForSelector('[data-testid="dashboard-heading"]', { state: 'visible', timeout: 45000 });

        // Wait for data sync to complete (ensures search results found)
        await page.waitForFunction(() => {
            const el = document.querySelector('[data-testid="staff-sync-count"]');
            return parseInt(el?.textContent || '0') > 0;
        }, { timeout: 30000 });
    });

    test('Quick Actions should navigate to correct views', async ({ page }) => {
        // 1. Verify New Transaction (Sales) shortcut
        const salesBtn = page.getByTestId('header-new-transaction');
        await expect(salesBtn).toBeVisible();
        await salesBtn.click();

        // Wait for SalesView to mount and display identifying text
        await expect(page.getByTestId('pos-interface')).toBeVisible({ timeout: 15000 });

        // 2. Verify Add Inventory shortcut
        const inventoryBtn = page.getByTestId('header-add-inventory');
        await expect(inventoryBtn).toBeVisible();
        await inventoryBtn.click();

        // Wait for InventoryView to mount
        await expect(page.getByTestId('inventory-view-container')).toBeVisible({ timeout: 15000 });
    });

    test('Global Search should find staff and navigate', async ({ page }) => {
        // We look for help-support-view as a secondary check or ensure search is focused
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        // Type a known staff member name from the synced prod data
        await searchInput.clear();
        await searchInput.type('SALIL', { delay: 100 });

        // Verify the search results popover appears
        const resultsPopover = page.locator('text=SALIL ANAND');
        await expect(resultsPopover).toBeVisible({ timeout: 15000 });

        // Click the result and verify navigation to Staff Management
        await resultsPopover.click();

        // Verify we are on Staff Management view
        await expect(page.locator('text=Master Register')).toBeVisible({ timeout: 15000 });
    });

    test('Global Search should find navigation results', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');
        await searchInput.clear();
        await searchInput.type('Support', { delay: 100 });

        // Verify direct navigation shortcut in search results
        const supportLink = page.locator('text=Go to Support');
        await expect(supportLink).toBeVisible({ timeout: 10000 });

        await supportLink.click();

        // Verify we are on Support view
        await expect(page.getByTestId('support-view-container')).toBeVisible({ timeout: 10000 });
    });

    test('Keyboard shortcut (Ctrl+K) should focus search bar', async ({ page }) => {
        // Ensure input is not focused initially
        await page.click('body');

        const isFocusedBefore = await page.evaluate(() => {
            return document.activeElement?.tagName === 'INPUT';
        });
        expect(isFocusedBefore).toBe(false);

        // Trigger Ctrl+K / Cmd+K
        const isMac = process.platform === 'darwin';
        const modifier = isMac ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+k`);

        // Check if focuses the search input
        const isFocusedAfter = await page.evaluate(() => {
            const el = document.activeElement;
            return el?.tagName === 'INPUT' && (el as HTMLInputElement).placeholder.includes('Search');
        });
        expect(isFocusedAfter).toBe(true);
    });

    test('Theme Toggle should switch visual state', async ({ page }) => {
        const themeBtn = page.getByTestId('theme-toggle');

        // Get initial class state
        const initialClass = await page.evaluate(() => document.documentElement.className);

        // Click to toggle
        await themeBtn.click();

        // Small wait for class transition
        await page.waitForTimeout(500);

        const finalClass = await page.evaluate(() => document.documentElement.className);
        expect(finalClass).not.toBe(initialClass);
    });
});
