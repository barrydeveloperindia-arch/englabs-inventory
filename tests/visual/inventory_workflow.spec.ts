
import { test, expect } from '@playwright/test';

test.describe('Inventory Management Workflow (Feb 17 Update)', () => {
    test.beforeEach(async ({ page }) => {
        test.setTimeout(120000);
        console.log(`[TEST] Starting beforeEach for: ${test.info().title}`);
        console.log(`[TEST] Navigating to: /?test=true`);
        await page.goto('/?test=true');

        console.log(`[TEST] Waiting for login screen or dashboard...`);
        const loginScreen = page.getByTestId('login-screen');
        const dashboard = page.getByTestId('dashboard-heading');

        await Promise.race([
            loginScreen.waitFor({ state: 'visible', timeout: 30000 }).catch(() => { }),
            dashboard.waitFor({ state: 'visible', timeout: 30000 }).catch(() => { })
        ]);

        if (await loginScreen.isVisible()) {
            console.log(`[TEST] Login screen detected. Filling credentials...`);
            await page.fill('[data-testid="email-input"]', 'gaurav@englabs.com');
            await page.fill('[data-testid="password-input"]', 'ShopManager1!');
            await page.click('[data-testid="login-btn"]');
            console.log(`[TEST] Login clicked. Waiting for dashboard...`);
            await expect(dashboard).toBeVisible({ timeout: 45000 });
        } else if (await dashboard.isVisible()) {
            console.log(`[TEST] Dashboard detected (already authenticated).`);
        } else {
            console.log(`[TEST] Neither login nor dashboard visible. Current URL: ${page.url()}`);
            // Check if there is some other screen (e.g. error)
            const bodyText = await page.innerText('body');
            console.log(`[TEST] Body snippet: ${bodyText.substring(0, 100)}`);
        }

        console.log(`[TEST] Verifying Role element...`);
        const roleLocator = page.locator('.text-right p:first-child');

        await page.waitForFunction(() => {
            const el = document.querySelector('.text-right p:first-child');
            const text = el?.textContent?.trim().toLowerCase() || '';
            return text && text !== 'initializing' && text !== 'auth';
        }, { timeout: 20000 }).catch(() => console.log("[TEST] Role text wait timed out"));

        const roleText = await roleLocator.innerText().catch(() => 'NOT_FOUND');
        console.log(`[TEST] Current User Role: ${roleText}`);

        console.log(`[TEST] Clicking Inventory link...`);
        const inventoryLink = page.getByTestId('header-add-inventory');
        await expect(inventoryLink).toBeVisible({ timeout: 15000 });
        await inventoryLink.click();

        console.log(`[TEST] Waiting for Inventory View container...`);
        await expect(page.getByTestId('inventory-view-container')).toBeVisible({ timeout: 20000 });
        console.log(`[TEST] Inventory View Loaded Successfully.`);
    });

    test('Should create a new inventory item with unit and pack size', async ({ page }) => {
        // Handle dialogs (alerts)
        page.on('dialog', async dialog => {
            console.log(`[DIALOG] ${dialog.message()}`);
            await dialog.accept();
        });

        // 1. Open New Item Modal
        const newBtn = page.getByTestId('new-item-btn');
        await expect(newBtn).toBeVisible({ timeout: 10000 });
        await newBtn.click();

        // 2. Fill in Item Details
        const brandInput = page.getByTestId('item-brand-input');
        const nameInput = page.getByTestId('item-name-input');
        const stockInput = page.getByTestId('item-stock-input');
        const priceInput = page.getByTestId('item-price-input');
        const unitSelect = page.getByTestId('item-unit-select');
        const packSizeInput = page.getByTestId('item-pack-size-input');

        await expect(brandInput).toBeVisible({ timeout: 10000 });

        const testName = `TEST PRODUCT ${Math.floor(Math.random() * 10000)}`;
        await brandInput.fill('TEST BRAND');
        await nameInput.fill(testName);
        await stockInput.fill('100');
        await priceInput.fill('1.99');

        await unitSelect.selectOption('litre');
        await packSizeInput.fill('500ml x 12');

        // 3. Save Item
        const saveBtn = page.getByTestId('save-item-btn');
        await saveBtn.click();
        console.log(`[TEST] Save clicked for ${testName}. Waiting for success feedback...`);

        // 4. Verify in List
        const searchInput = page.getByTestId('inventory-search-input');
        await expect(searchInput).toBeVisible({ timeout: 15000 });
        await searchInput.clear();
        await searchInput.fill(testName);

        // Wait for search results
        // Use .first() or a more specific container to avoid strict mode violation (global search match)
        await expect(page.locator(`text=${testName}`).first()).toBeVisible({ timeout: 20000 });
        await expect(page.locator('text=TEST BRAND').first()).toBeVisible();

        // Check for the Unit display
        console.log(`[TEST] Verifying unit display for ${testName}...`);
        await expect(page.locator(`text=Current: 100 litre`).first()).toBeVisible({ timeout: 10000 });
        console.log(`✅ Verified unit display: "100 litre" for ${testName}`);
    });

    test('Should filter inventory by stock health', async ({ page }) => {
        const lowStockFilter = page.locator('button:has-text("Low")');
        await expect(lowStockFilter).toBeVisible({ timeout: 10000 });
        await lowStockFilter.click();

        // Verify UI responds
        await expect(lowStockFilter).toHaveClass(/bg-surface-elevated/);
        console.log(`✅ Filtered by Low Stock.`);
    });
});
