
import { expect, driver, $ } from '@wdio/globals';

describe('Nayan Timesheet Verification (Native)', () => {

    // Helper: Wait for element and click
    const click = async (selector: string) => {
        const el = await $(`android=${selector}`)
        await el.waitForDisplayed({ timeout: 10000 });
        await el.click();
    };

    const findText = async (text: string) => {
        return $(`android=new UiSelector().textContains("${text}")`);
    };

    it('should login as Nayan and verify Feb 10-12 timesheet', async () => {
        console.log('--- Starting Nayan Verification ---');

        // 1. Wait for App Load (Start / Unlock)
        const startBtn = await findText("Start / Unlock");
        await startBtn.waitForDisplayed({ timeout: 20000 });
        await startBtn.click();

        // 2. Select Method: Passcode
        const pinBtn = await findText("Passcode");
        await pinBtn.click();

        // 3. Select Nayan (Verify he appears in list)
        // He should be visible if seeded correctly.
        // We might need to scroll if list is long, but let's assume he's visible or we can find text.
        const nayanUser = await findText("Nayan");
        await nayanUser.waitForDisplayed({ timeout: 5000 });
        await nayanUser.click();

        // 4. Enter PIN (8888)
        // Keypad buttons usually have text "8"
        const key8 = await findText("8");
        await key8.click();
        await key8.click();
        await key8.click();
        await key8.click();

        // Click OK
        const okBtn = await findText("OK");
        await okBtn.click();

        // 5. Navigate to Staff Management
        // Dashboard should be visible.
        // Nayan is "Shop Assistant", might default to Sales.
        // Need to find "Staff Management" (or Hamburger -> Staff).
        // Let's assume on Dashboard or Menu.
        // If Sales view, there might be a "Back" or "Menu".
        // For now, let's wait and see if we can find "Staff" text.

        // Wait for dashboard load
        await (driver as any).pause(3000);

        // Try to find "Staff Management"
        let staffNav = await findText("Staff Management");
        if (!(await staffNav.isDisplayed())) {
            // Maybe specific navigation logic needed here.
            console.log("Staff Management not immediately visible.");
        } else {
            await staffNav.click();
        }

        // 6. Verify "Monthly Activity Log"
        const logHeader = await findText("Monthly Activity Log");
        await logHeader.waitForDisplayed({ timeout: 10000 });
        expect(await logHeader.isDisplayed()).toBe(true);

        // 7. Verify Dates (Feb 10, 11, 12)
        // In native view, these might be in a list/grid.
        // We can search for text "10", "11", "12" near "Feb" or just checking existence.

        const date10 = await findText("10");
        const date11 = await findText("11");
        const date12 = await findText("12");

        expect(await date10.isDisplayed()).toBe(true);
        expect(await date11.isDisplayed()).toBe(true);
        expect(await date12.isDisplayed()).toBe(true);

        // 8. Verify Hours (6.0)
        const hours = await findText("6.0");
        expect(await hours.isDisplayed()).toBe(true);

        console.log('--- Nayan Verification Complete ---');
    });
});
