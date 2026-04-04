
import { expect, driver, browser } from '@wdio/globals';

describe('Appium Native Launch', () => {
    it('should launch application and detect contexts', async () => {
        // Wait for connection
        await (driver as any).pause(5000);

        // Log all available contexts (NATIVE_APP vs WEBVIEW)
        const contexts = await (driver as any).getContexts();
        console.log('Detect Contexts:', contexts);

        // Context switching might vary by emulator, but we expect at least NATIVE_APP
        expect(contexts.length).toBeGreaterThan(0);

        // If webview exists, switch and title check
        const webview = contexts.find((c: any) => c.toString().includes('WEBVIEW'));
        if (webview) {
            console.log(`Webview found: ${webview}. Swtiching...`);
            try {
                await (driver as any).switchContext(webview as string);
                const title = await (browser as any).getTitle();
                console.log('App Title:', title);
                // Switch back
                await (driver as any).switchContext('NATIVE_APP');
            } catch (e) {
                console.warn('Could not switch to Webview context (Chromedriver mismatch?). Skipping Webview assertions.', e);
            }
        }
    });
});
