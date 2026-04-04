import { test, expect } from '@playwright/test';

test.describe('Visual Cortex Financial & Performance Engine', () => {
    test('Verify Financial Telemetry', async ({ page }) => {
        test.setTimeout(120000);

        console.log('[TEST] Navigating to Command Center...');
        await page.goto('/?test=true#command-center');

        console.log('[TEST] Checking for Activation Button...');
        const activateBtn = page.getByTestId('deploy-agents-btn').first();
        await activateBtn.waitFor({ state: 'visible', timeout: 45000 });
        await activateBtn.click();
        console.log('[TEST] Activation Button Clicked.');

        console.log('[TEST] Waiting for Sales Dashboard...');
        await page.waitForSelector('[data-testid="sales-velocity-dashboard"]', { state: 'visible', timeout: 60000 });

        console.log('[TEST] Validating Metrics...');
        const revenue = page.locator('[data-testid="cortex-total-revenue"]');
        await expect(revenue).toContainText('£', { timeout: 30000 });

        const gpuLatency = page.locator('[data-testid="cortex-gpu-latency"]');
        await expect(gpuLatency).toBeVisible();

        console.log('[TEST] Success: Visual Cortex telemetry verified.');
    });
});
