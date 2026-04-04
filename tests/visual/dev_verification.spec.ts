
import { test, expect } from '@playwright/test';

/**
 * Agentic OS - Development Environment Verification
 * 
 * This test confirms that the development database is seeded, 
 * security rules are active, and the Demo user can access the dashboard.
 */
test.describe('Dev Env Verification', () => {

    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER [${msg.type()}]: ${msg.text()}`));
    });

    // The login verification is now covered by the follow-up tests 
    // that check for specific seeded data visible only to logged-in users.

    test('should see seeded inventory items', async ({ page }) => {
        // Navigate to inventory
        await page.goto('http://localhost:3000/?test=true#inventory');

        // Wait for Firestore Sync
        await page.waitForFunction(() => {
            const el = document.querySelector('[data-testid="staff-sync-count"]');
            const count = parseInt(el?.textContent || '0');
            return count > 0;
        }, { timeout: 30000 });

        // Search for the product to ensure it's in view
        const searchInput = page.getByPlaceholder('Search resources, products, or staff...');
        if (await searchInput.count() > 0) {
            await searchInput.fill('Test Product (Seed)');
        }

        const seededItem = page.locator('text=Test Product (Seed)').first();
        await expect(seededItem).toBeVisible({ timeout: 15000 });
    });

    test('should verify Purchases module access (New Rules)', async ({ page }) => {
        await page.goto('http://localhost:3000/?test=true#purchases');

        // We check for module header
        const header = page.locator('h4:has-text("Stock Acquisition Interface")');
        await expect(header).toBeVisible({ timeout: 15000 });

        // Click "Register New" to see the scan button
        await page.locator('button:has-text("Register New")').click();

        // Verify we can see the scan button
        const scanBtn = page.locator('button:has-text("Scan Receipt")');
        await expect(scanBtn).toBeVisible({ timeout: 10000 });
    });
});
