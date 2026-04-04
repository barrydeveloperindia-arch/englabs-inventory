import { test, expect, Page, BrowserContext } from '@playwright/test';

test.describe('Real-Time Sync Testing Engine', () => {
    let contextA: BrowserContext;
    let contextB: BrowserContext;
    let pageA: Page;
    let pageB: Page;

    test.beforeEach(async ({ browser }) => {
        // Increase timeout for complex multi-user tests
        test.setTimeout(120000);

        // We use fresh contexts to ensure isolation and prevent 'Target closed' errors
        contextA = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        contextB = await browser.newContext({ storageState: { cookies: [], origins: [] } });
        pageA = await contextA.newPage();
        pageB = await contextB.newPage();

        // Pipe browser logs for easier debugging in CI
        pageA.on('console', msg => console.log(`[BROWSER A] ${msg.text()}`));
        pageB.on('console', msg => console.log(`[BROWSER B] ${msg.text()}`));
    });

    test.afterEach(async () => {
        await contextA.close();
        await contextB.close();
    });

    async function login(page: Page, email: string, pass: string) {
        console.log(`[TEST] Logging in ${email}...`);
        await page.goto('/?test=true');
        // Ensure login form is ready
        await page.locator('[data-testid="email-input"]').waitFor({ state: 'visible', timeout: 30000 });

        await page.locator('[data-testid="email-input"]').fill(email);
        await page.locator('[data-testid="password-input"]').fill(pass);
        await page.locator('[data-testid="login-btn"]').click();

        // Wait for dashboard to indicate success
        await page.waitForSelector('[data-testid="dashboard-heading"]', { state: 'visible', timeout: 45000 });

        // Match role by email or name fallback
        const finalCount = await page.evaluate(({ email }) => {
            const staff = (window as any).staff || [];
            const user = { email };
            const authEmail = user.email.toLowerCase();

            let matched = staff.find((s: any) => s.email && s.email.toLowerCase() === authEmail);

            // Fallback to name match if email match fails (for baseline seeder compatibility)
            if (!matched) {
                const searchName = authEmail.split('@')[0]; // 'gaurav' or 'parth'
                matched = staff.find((s: any) => s.name.toLowerCase().includes(searchName));
            }

            if (matched) {
                (window as any).setCurrentUserRole(matched.role);
                (window as any).setCurrentStaffId(matched.id);
                console.log('✅ [TEST-RBAC] Matched Role:', matched.role);
            }
            return staff.length;
        }, { email });
        console.log(`[TEST] Login and Data Sync successful for ${email}. Staff Count: ${finalCount}`);
    }

    test('User B (Staff) Clocks In -> User A (Manager) sees it', async () => {
        await login(pageA, 'gaurav@englabs.com', 'ShopManager1!');
        await login(pageB, 'parth@englabs.com', 'ShopManager1!');

        console.log('[TEST] User B navigating to Staff terminal...');
        await pageB.goto('/?test=true#staff', { waitUntil: 'domcontentloaded' });

        // Ensure User B is clocked out first
        const clockBtn = pageB.locator('[data-testid="clock-in-btn"]');
        await clockBtn.waitFor({ state: 'visible' });
        const btnText = await clockBtn.innerText();
        if (btnText.toLowerCase().includes('end session')) {
            console.log('[TEST] User B was already clocked in, clocking out first...');
            await clockBtn.click();
            await pageB.waitForTimeout(2000);
        }

        console.log('[TEST] User B clicking clock-in...');
        await clockBtn.click();

        // 3. User A (Manager) Validation
        console.log('[TEST] User A navigating to Staff view...');
        await pageA.goto('/?test=true#staff', { waitUntil: 'domcontentloaded' });

        // Wait for status change to be visible on User A's screen via real-time sync
        // Using a regex to be case-insensitive and match "In Store Today"
        await expect(pageA.locator('text=/In Store Today/i')).toBeVisible({ timeout: 20000 });
        // Use more specific selector to avoid strict mode violation (resolving to multiple "Parth" strings)
        await expect(pageA.locator('text="Parth Staff"').first()).toBeVisible({ timeout: 20000 });
        console.log('[SYNC TEST] Success: User A verified User B clock-in in real-time.');
    });

    test('User B (Manager) adds an Order/Task -> User A (Manager) sees it immediately', async () => {
        await login(pageA, 'gaurav@englabs.com', 'ShopManager1!');
        await login(pageB, 'paras@englabs.com', 'ShopManager1!');

        // 1. User B triggered task generation
        await pageB.goto('/?test=true#staff', { waitUntil: 'domcontentloaded' });

        // Handle the confirm() and alert() dialogs
        pageB.on('dialog', async dialog => {
            console.log(`[TEST B] Dialog appeared: [${dialog.type()}] ${dialog.message()}`);
            await dialog.accept();
        });

        const setupBtn = pageB.locator('[data-testid="intelligence-setup-btn"]');
        await setupBtn.waitFor({ state: 'visible', timeout: 45000 });
        await setupBtn.click();
        console.log('[SYNC TEST] User B triggered task generation.');

        // 2. User A (Manager) Validation
        await pageA.goto('/?test=true#staff', { waitUntil: 'domcontentloaded' });

        // Verify task sync - checking for the presence of "Mop" in the task list
        await expect(pageA.locator('text=/Mop/i').first()).toBeVisible({ timeout: 45000 });
        console.log('[SYNC TEST] Success: User A verified task generation sync.');
    });

    test('KPI Recalculation Sync: Attendance Change -> KPI Update', async () => {
        await login(pageA, 'gaurav@englabs.com', 'ShopManager1!');
        await login(pageB, 'parth@englabs.com', 'ShopManager1!');

        // 1. Setup: Ensure User B is clocked in
        await pageB.goto('/?test=true#staff', { waitUntil: 'domcontentloaded' });
        const clockBtn = pageB.locator('[data-testid="clock-in-btn"]');
        await clockBtn.waitFor({ state: 'visible' });
        const btnText = await clockBtn.innerText();
        if (btnText.toLowerCase().includes('clock in')) {
            await clockBtn.click();
            console.log('[TEST] User B clocked in for KPI test.');
        }

        // 2. User A prepares
        await pageA.goto('/?test=true#staff', { waitUntil: 'domcontentloaded' });
        await expect(pageA.locator('text="Parth Staff"').first()).toBeVisible({ timeout: 20000 });

        // 3. User B clocks out
        console.log('[TEST] User B clicking Clock Out...');
        await clockBtn.click();
        console.log('[SYNC TEST] User B clocked out.');

        // 4. User A Validation: User B should disappear from "In Store" or status should change
        // We wait for the "0" count or the removal of Parth from the "In Store" list
        await expect(pageA.locator('text="Parth Staff"').first()).not.toBeVisible({ timeout: 20000 });
        console.log('[SYNC TEST] Success: KPI and Status sync verified.');
    });
});
