import { expect, driver, $ } from '@wdio/globals';

describe('Verify Current Week Updates (Native)', () => {

    const findText = async (text: string) => {
        return $(`android=new UiSelector().textContains("${text}")`);
    };

    it('should verify Team Availability for Week of 2/9/2026', async () => {
        console.log('--- Starting Week Verification ---');

        // 1. Verify we are on "My Availability" or "Team Availability"
        // The header says "Team Availability Overview"
        const header = await findText("Team Availability Overview");
        if (!(await header.isDisplayed())) {
            // Try clicking the tab "My Availability"
            const tab = await findText("My Availability");
            if (await tab.isDisplayed()) {
                await tab.click();
                await (driver as any).pause(2000);
            }
        }

        // 2. Verify "Week of 2/9/2026"
        const weekText = await findText("Week of 2/9/2026");
        expect(await weekText.isDisplayed()).toBe(true);
        console.log("Confirmed: Week of 2/9/2026 is displayed.");

        // 3. Verify Nayan is listed
        const nayan = await findText("NAYAN");
        expect(await nayan.isDisplayed()).toBe(true);
        console.log("Confirmed: Nayan is listed.");

        // 4. Verify Mon/Tue status (Visual check via text might be hard if they are icons)
        // We can check for "Available" text if the legend is active or accessible.
        // The screenshot shows "AVAILABLE", "PARTIAL", "UNAVAILABLE" legend.

        // Let's verify the "Team" tab is accessible too
        const teamTab = await findText("Team");
        expect(await teamTab.isDisplayed()).toBe(true);

        console.log('--- Current Week Verification Complete ---');
    });
});
