
import { test, expect } from '@playwright/test';

test.describe('SOTA Vision (Visual Cortex) Verification', () => {

    test.beforeEach(async ({ page }) => {
        // Go to Command Center
        await page.goto('/?test=true#command-center');

        // Check if the Command Center header or a key element is visible
        await expect(page.locator('text=HERO_SENSOR: VISUAL_CORTEX')).toBeVisible({ timeout: 15000 });
    });

    test('should activate Visual Cortex and show live feed', async ({ page }) => {
        // Targeted click for activation
        const activateBtn = page.locator('[data-testid="activate-visual-cortex-btn"]');
        await activateBtn.click();

        // Verify "LIVE FEED" status appears in the header
        const status = page.locator('[data-testid="visual-cortex-status"]');
        await expect(status).toContainText('LIVE FEED', { timeout: 15000 });

        // Verify video element is rendering
        const video = page.locator('[data-testid="visual-cortex-video"]');
        await expect(video).toBeVisible({ timeout: 15000 });

        // Verify ONNX performance metrics are visible
        await expect(page.locator('[data-testid="inference-metrics"]')).toBeVisible({ timeout: 15000 });
    });

    test('should switch between camera sensors', async ({ page }) => {
        // Activate first
        await page.locator('[data-testid="activate-visual-cortex-btn"]').click();

        // Wait for sensors to be interactive
        await page.waitForSelector('text=Aisle 1');
        await page.click('text=Aisle 1');

        // Verify the sensor is active (cyan background)
        const sensorLabel = page.locator('[data-testid="sensor-SENS_AISLE_01"]');
        await expect(sensorLabel).toHaveClass(/bg-cyan-500/);
    });

    test('should bridge camera feed', async ({ page }) => {
        await page.locator('[data-testid="activate-visual-cortex-btn"]').click();

        const bridgeBtn = page.locator('button:has-text("Bridge Feed")');
        await expect(bridgeBtn).toBeVisible();
        await expect(bridgeBtn).not.toBeDisabled();
    });
});
