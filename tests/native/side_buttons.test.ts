import { remote } from 'webdriverio';
import { join } from 'path';

// Capabilities for Android
// Ensure Appium server is running on port 4726
const capabilities = {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Medium_Phone_API_36', // Update if needed
    'appium:appPackage': 'com.englabs.commandos', // Ensure this matches build
    'appium:appActivity': '.MainActivity',
    'appium:noReset': true, // Don't reset app state (keep login if possible)
    'appium:newCommandTimeout': 3600
};

const wdioOptions = {
    hostname: '127.0.0.1',
    port: 4726,
    path: '/',
    capabilities
};

async function runTest() {
    let driver;
    try {
        console.log("Initializing WebDriver...");
        driver = await remote(wdioOptions);

        console.log("App launched.");

        // Helper to find element by testID (React Native maps testID to resource-id or content-desc depending on layout usually, but on web/hybrid matches vary)
        // For hybrid (WebView), we might need to switch context.
        // Assuming Native view first or Hybrid?
        // "Command OS" is hybrid but container is native likely?
        // Actually, this app uses Capacitor/webview.
        // We should ideally context switch to WEBVIEW.

        // Get contexts
        const contexts = await driver.getContexts();
        console.log("Available contexts:", contexts);

        // Switch to WebView if available
        const webview = contexts.find((c: any) => typeof c === 'string' && c.includes('WEBVIEW'));
        if (webview) {
            console.log(`Switching to context: ${webview}`);
            await driver.switchContext(webview as string);
        } else {
            console.warn("No WEBVIEW context found. Continuing in NATIVE_APP context.");
        }

        // --- TEST CASE 1: VERIFY HEADER MENU BUTTON ---
        console.log("Checking for Header Menu Button...");
        // Using CSS selector as we are likely in WebView
        const headerBtn = await driver.$('[data-testid="header-menu-button"]');

        // Wait for it to be displayed
        await headerBtn.waitForDisplayed({ timeout: 10000 });
        console.log("✅ Header Menu Button FOUND.");

        // --- TEST CASE 2: VERIFY FLOATING MENU BUTTON ---
        console.log("Checking for Floating Menu Button (FAB)...");
        const fabBtn = await driver.$('[data-testid="fab-menu-button"]');
        await fabBtn.waitForDisplayed({ timeout: 10000 });
        console.log("✅ Floating Menu Button FOUND.");

        // --- TEST CASE 3: INTERACTION & PERSISTENCE ---
        console.log("Testing Interaction: Opening Menu via Header Button...");
        await headerBtn.click();

        // Wait for Sidebar to appear (check for a known sidebar item)
        const dashboardLink = await driver.$('button=Command Center'); // Text match
        await dashboardLink.waitForDisplayed({ timeout: 5000 });
        console.log("✅ Sidebar Opened (Command Center link visible).");

        // Close menu by clicking overlay or a link
        // Let's click 'Terminal Sales' to navigate
        console.log("Navigating to Sales...");
        const salesLink = await driver.$('button=Terminal Sales');
        await salesLink.click();

        // Wait for Sales View
        // Check for unique element in Sales View
        const salesHeader = await driver.$('h1=Smart Register'); // Assuming specific text 
        // Wait, SalesView header might prompt login or lock?
        // Or just "Terminal Sales" text in header?
        // Let's just wait a bit.
        await driver.pause(2000);

        // Verify Buttons still exist in Sales View
        console.log("Verifying buttons persist in Sales View...");
        await headerBtn.waitForDisplayed({ timeout: 5000 });
        console.log("✅ Header Button visible in Sales View.");

        await fabBtn.waitForDisplayed({ timeout: 5000 });
        console.log("✅ FAB visible in Sales View.");

        console.log("🎉 ALL SIDE BUTTON TESTS PASSED.");

    } catch (error) {
        console.error("❌ Test Failed:", error);
    } finally {
        if (driver) {
            // await driver.deleteSession(); // Keep open for debugging if needed
            console.log("Session ending.");
        }
    }
}

runTest();
