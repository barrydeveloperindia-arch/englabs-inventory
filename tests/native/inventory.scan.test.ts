
import { expect, browser, $, $$ } from '@wdio/globals';

describe('Inventory Scan Functionality', () => {
    it('should login, navigate to inventory, and trigger scanner', async () => {
        // --- 1. INITIAL SETUP ---
        await browser.pause(5000);

        // Switch to WebView Context (if available) for React interacting
        const contexts = await browser.getContexts();
        const webview = contexts.find(c => c.toString().includes('WEBVIEW'));

        if (webview) {
            await browser.switchContext(webview.toString());
            console.log(`Switched to WebView: ${webview}`);
        } else {
            console.warn('WebView context not found! Running in Native mode (Selectors might fail).');
        }

        // --- 2. LOGIN (If needed) ---
        // Check for login screen elements
        const emailInput = await $('[data-testid="email-input"]');
        if (await emailInput.isDisplayed()) {
            console.log('Logging in...');
            await emailInput.setValue('bharat@englabs.com');
            await $('[data-testid="password-input"]').setValue('Owner2026!');
            await $('[data-testid="login-btn"]').click();
            await browser.pause(5000); // Wait for dashboard load
        } else {
            console.log('Already logged in or login screen not detected.');
        }

        // Verify Dashboard Access (PIN if needed)
        const pinBtn = await $('[data-testid="mode-pin"]');
        if (await pinBtn.isDisplayed()) {
            await pinBtn.click();
            await $('[data-testid="staff-select-bharat"]').click(); // Select Staff
            // Enter 1111
            const btn1 = await $('[data-testid="pin-pad-1"]');
            await btn1.click(); await btn1.click(); await btn1.click(); await btn1.click();
            await browser.pause(3000);
        }

        // --- 3. NAVIGATE TO INVENTORY ---
        console.log('Navigating to Inventory...');
        const inventoryLink = await $('span=Inventory');

        // If sidebar is collapsed (Mobile), open menu first
        // if (!await inventoryLink.isDisplayed()) {
        //     console.log('Sidebar hidden. Toggling menu...');
        //     // Locate Menu Button (Generic approach: First button in header usually)
        //     const buttons = await $$('button');
        //     if (buttons.length > 0) {
        //         await buttons[0].click();
        //         await browser.pause(1000);
        //     }
        // }

        await inventoryLink.waitForDisplayed({ timeout: 10000 });
        await inventoryLink.click();
        await browser.pause(2000);

        // --- 4. START SCANNER ---
        console.log('Starting Scanner...');
        const scanBtn = await $('button=Scan');
        await scanBtn.waitForDisplayed();
        await scanBtn.click();

        // --- 5. HANDLE NATIVE PERMISSIONS ---
        console.log('Handling Native Permissions...');
        await browser.switchContext('NATIVE_APP');
        await browser.pause(1000);

        try {
            // Android Permission Dialog (Native)
            const allowBtn = await $('//*[@text="While using the app"] | //*[@text="Allow"]');
            if (await allowBtn.isDisplayed()) {
                await allowBtn.click();
                console.log('Permission Granted.');
            }
        } catch (e) {
            console.log('Permission dialog not found (already granted).');
        }

        // --- 6. VERIFY SCANNER ACTIVE ---
        if (webview) await browser.switchContext(webview.toString());
        await browser.pause(1000);

        const modal = await $('//*[contains(text(), "Asset Scanner")]');
        await modal.waitForDisplayed({ timeout: 5000 });

        expect(await modal.isDisplayed()).toBe(true);
        console.log('Inventory Scan Test Passed!');
    });
});
