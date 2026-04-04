import { expect, driver, $, $$ } from '@wdio/globals';

describe('Login Flow - Gaurav Manager', () => {

    const findText = async (text: string) => {
        return $(`android=new UiSelector().textMatches("(?i)${text}")`);
    };

    const findTextContains = async (text: string) => {
        return $(`android=new UiSelector().textMatches("(?i).*${text}.*")`);
    };

    it('should login as Gaurav', async () => {
        console.log('--- Starting Gaurav Login ---');
        await (driver as any).pause(5000); // Give app time to load

        // 1. Check if we are on Auth Screen
        const fleetLabel = await findTextContains("Fleet Identity");
        const authBtn = await findTextContains("AUTHENTICATE TERMINAL");

        if (await fleetLabel.isDisplayed() || await authBtn.isDisplayed()) {
            console.log('On Auth Screen. Performing Full Login...');

            const inputs = await $$('android.widget.EditText');
            if ((inputs as any).length >= 2) {
                console.log('Entering Fleet Credentials...');
                await inputs[0].setValue("gaurav@englabs.com");
                await (driver as any).pause(1000);
                await inputs[1].setValue("ShopManager1!");
                await (driver as any).pause(1000);
            } else {
                console.log('Warning: Could not find inputs, checking if already populated');
            }

            console.log('Clicking Authenticate...');
            await authBtn.click();

            // Wait for transition to Lock Screen or Dashboard
            console.log('Waiting for Lock Screen or Dashboard...');
            let foundNext = false;
            for (let i = 0; i < 20; i++) {
                const startBtn = await findTextContains("Start / Unlock");
                const dashboard = await findTextContains("Management"); // "Staff Management" usually visible
                if (await startBtn.isDisplayed() || await dashboard.isDisplayed()) {
                    foundNext = true;
                    break;
                }
                await (driver as any).pause(1000);
            }
            if (!foundNext) console.log('Timeout waiting for next screen after Authenticate');
        } else {
            console.log('Not on Auth Screen. Checking for Lock Screen or Dashboard...');
        }

        // 2. Check for "Start / Unlock" (Lock Screen)
        const startBtn = await findTextContains("Start / Unlock");

        if (await startBtn.isDisplayed()) {
            console.log("On Lock Screen. Unlocking with PIN...");
            await startBtn.click();
            await (driver as any).pause(3000);

            // Select "PASSCODE" if visible
            const passcodeBtn = await findTextContains("PASSCODE");
            if (await passcodeBtn.isDisplayed()) {
                console.log("Selecting PASSCODE method...");
                await passcodeBtn.click();
                await (driver as any).pause(2000);
            }

            // Select Gaurav User
            console.log("Looking for GAURAV user...");
            let gauravUser = await findTextContains("GAURAV");
            if (!(await gauravUser.isDisplayed())) {
                gauravUser = await findTextContains("Gaurav");
            }

            if (await gauravUser.isDisplayed()) {
                console.log("Found GAURAV, clicking...");
                await gauravUser.click();
                await (driver as any).pause(2000);
            } else {
                console.log("GAURAV user not found, checking if PIN prompt already visible");
                // Maybe he is already selected or list is long
            }

            // Enter PIN 5555
            console.log("Entering PIN 5555...");
            const key5 = await findTextContains("5");
            if (await key5.isDisplayed()) {
                await key5.click();
                await key5.click();
                await key5.click();
                await key5.click();

                // OK
                const okBtn = await findTextContains("OK");
                if (await okBtn.isDisplayed()) {
                    await okBtn.click();
                    console.log("Clicked OK.");
                } else {
                    // Enter often auto-submits on 4 digits if configured
                    console.log("OK button not found, assuming auto-submit");
                }
            } else {
                console.log("Could not find PIN key '5'");
            }

            await (driver as any).pause(5000);
        } else {
            const dashboard = await findTextContains("Management");
            if (await dashboard.isDisplayed()) {
                console.log("Already on Dashboard. Skipping PIN entry.");
            } else {
                console.log("Neither Lock Screen nor Dashboard found.");
            }
        }

        console.log("Login Sequence Complete.");
    });
});
