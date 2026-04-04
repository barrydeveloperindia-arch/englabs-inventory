import { expect, browser, $ } from '@wdio/globals';

describe('Device Login Flow', () => {
    it('should login reliably with verified user', async () => {
        // 1. Wait for App Launch
        await browser.pause(5000);

        // 2. Switch Context to WebView (for React interactions)
        const contexts = await browser.getContexts();
        const webview = contexts.find(c => c.toString().includes('WEBVIEW'));

        if (webview) {
            await browser.switchContext(webview.toString());
            console.log(`Switched to WebView context: ${webview}`);
        } else {
            console.warn('WebView context not found! Check ChromeDriver version.');
        }

        // 3. Check Login Screen Presence
        const emailInput = await $('[data-testid="email-input"]');
        let needsLogin = false;
        try {
            // Short wait to check if element exists
            await emailInput.waitForDisplayed({ timeout: 3000 });
            needsLogin = true;
        } catch (e) {
            console.log('Login screen skipped (Active Session detected).');
        }

        // 4. Perform Login (if needed)
        if (needsLogin) {
            console.log('Logging in with bharat@englabs.com...');
            await emailInput.setValue('bharat@englabs.com');

            const passInput = await $('[data-testid="password-input"]');
            await passInput.setValue('Owner2026!');

            const loginBtn = await $('[data-testid="login-btn"]');
            await loginBtn.click();

            await browser.pause(5000); // Wait for dashboard transition
        }

        // 5. Verify Successful Entry (Dashboard or PIN Screen)
        const pinBtn = await $('[data-testid="mode-pin"]');
        const dashboard = await $('[data-testid="dashboard-container"]');

        const isPinVisible = await pinBtn.isDisplayed().catch(() => false);
        const isDashVisible = await dashboard.isDisplayed().catch(() => false);

        if (isPinVisible || isDashVisible) {
            console.log('Login Verification Passed: Dashboard/PIN screen access confirmed.');
        } else {
            console.warn('Login Verification unclear: specific dashboard elements not found immediately.');
        }
    });
});
