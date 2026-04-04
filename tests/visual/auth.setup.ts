import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
    await page.goto('/?test=true');

    // Fill in login credentials
    await page.locator('[data-testid="email-input"]').waitFor({ state: 'visible', timeout: 30000 });
    await page.fill('[data-testid="email-input"]', 'gaurav@englabs.com');
    await page.fill('[data-testid="password-input"]', 'ShopManager1!');
    await page.click('[data-testid="login-btn"]');

    // Wait for the app to load the dashboard (which confirms login success)
    await page.waitForSelector('[data-testid="dashboard-heading"]', { state: 'visible', timeout: 45000 });

    // Storage state session
    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
