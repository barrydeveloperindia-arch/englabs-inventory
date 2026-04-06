import { test as setup, expect } from '@playwright/test';

setup('authenticate', async ({ page }) => {
    await page.goto('/?test=true');

    // Enter PIN '1111' using the on-screen terminal keypad
    const btn1 = page.getByRole('button', { name: '1', exact: true });
    await btn1.waitFor({ state: 'visible', timeout: 30000 });
    await btn1.click();
    await btn1.click();
    await btn1.click();
    await btn1.click();

    // Wait for the app to load the dashboard (which confirms login success)
    await page.waitForSelector('[data-testid="dashboard-heading"]', { state: 'visible', timeout: 45000 });

    // Storage state session
    await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
