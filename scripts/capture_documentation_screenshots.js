import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IMAGES_DIR = path.join(__dirname, '../docs/launch_package_feb16/images');

if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

(async () => {
    console.log("Starting Screenshot Capture...");
    const browser = await chromium.launch(); // Headless
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }, // Desktop view
        deviceScaleFactor: 2, // High DPI for crisp PDFs
    });
    const page = await context.newPage();

    try {
        // 1. Login Screen
        console.log("Navigating to Login...");
        await page.goto('http://localhost:5174/', { waitUntil: 'networkidle', timeout: 60000 });

        // Wait for AccessTerminal to appear (it's a modal or main screen)
        // Assuming App starts with AccessTerminal open if locked?
        // Or "Enter PIN" screen.
        await page.screenshot({ path: path.join(IMAGES_DIR, '01_login_screen.png') });
        console.log("Captured: 01_login_screen.png");

        // 2. Authenticate
        // A. Click PIN Mode
        console.log("Selecting PIN Mode...");
        await page.getByTestId('mode-pin').click().catch(() => console.log("PIN Mode button not found (might already be in mode?)"));
        await page.waitForTimeout(1000);

        // B. Select User
        console.log("Selecting User...");
        await page.waitForTimeout(2000);

        let targetPin = "1234"; // Default fallback

        // Try to find "Bharat" first
        const bharatBtn = page.locator('button').filter({ hasText: /Bharat/i }).first();
        const adminBtn = page.locator('button').filter({ hasText: /Admin/i }).first();

        if (await bharatBtn.isVisible()) {
            console.log("Found Bharat Anand...");
            await bharatBtn.click();
            targetPin = "1111";
        } else if (await adminBtn.isVisible()) {
            console.log("Found Admin User...");
            await adminBtn.click();
            targetPin = "1234";
        } else {
            // Fallback
            console.log("Clicking first available staff...");
            await page.locator('[data-testid^="staff-select-"]').first().click();
        }
        await page.waitForTimeout(1000);

        // C. Enter PIN
        console.log(`Entering PIN ${targetPin}...`);
        for (const digit of targetPin) {
            await page.getByTestId(`pin-pad-${digit}`).click();
            await page.waitForTimeout(100);
        }

        // D. Click OK (if needed, auto-submit might handle it but OK exists)
        await page.getByTestId('pin-pad-ok').click().catch(() => { });

        // Click "Unlock" or "Start Shift"
        // Try "Unlock" first (Admin)
        const unlockBtn = page.getByText('Unlock', { exact: false });
        if (await unlockBtn.count() > 0) {
            await unlockBtn.click();
        } else {
            // Try "Start Shift"
            await page.getByText('Start', { exact: false }).first().click();
        }

        await page.waitForTimeout(2000); // Wait for transition

        // 3. Dashboard
        await page.screenshot({ path: path.join(IMAGES_DIR, '02_dashboard_owner.png') });
        console.log("Captured: 02_dashboard_owner.png");

        // 4. Verification / Compliance Tab
        // Click "Registers" or "Compliance"?
        // In previous conversation: "Audit Trail integrated as a sub-tab within RegistersView"
        // So User clicks "Registers" (nav) -> "Audit Trail" (tab)

        // Click "Registers" in Nav
        await page.getByText('Registers', { exact: false }).first().click().catch(e => console.log("Nav to Registers failed"));
        await page.waitForTimeout(1000);

        // Click "Audit Trail" tab
        await page.getByText('Audit Trail', { exact: false }).click().catch(e => console.log("Tab Audit failed"));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(IMAGES_DIR, '03_audit_log.png') });
        console.log("Captured: 03_audit_log.png");

        // 5. Inventory
        await page.getByText('Inventory', { exact: false }).first().click().catch(e => console.log("Nav to Inventory failed"));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(IMAGES_DIR, '04_inventory_list.png') });
        console.log("Captured: 04_inventory_list.png");

        // 6. Rota / Staff
        await page.getByText('Staff', { exact: false }).first().click().catch(e => console.log("Nav to Staff failed"));
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(IMAGES_DIR, '05_staff_rota.png') });
        console.log("Captured: 05_staff_rota.png");

    } catch (err) {
        console.error("Screenshot capture failed:", err);
    } finally {
        await browser.close();
    }
})();
