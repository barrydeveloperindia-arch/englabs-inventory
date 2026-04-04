
import path from 'path';
import os from 'os';

// Ensure Android Environment Variables are set
if (!process.env.ANDROID_HOME) {
    const defaultSdkPath = path.join(os.homedir(), 'AppData', 'Local', 'Android', 'Sdk');
    console.log(`Setting ANDROID_HOME to ${defaultSdkPath}`);
    process.env.ANDROID_HOME = defaultSdkPath;
    process.env.ANDROID_SDK_ROOT = defaultSdkPath;
}

// @ts-ignore
export const config = {
    //
    // ====================
    // Runner Configuration
    // ====================
    //
    autoCompileOpts: {
        autoCompile: true,
        tsNodeOpts: {
            transpileOnly: true
        }
    },
    runner: 'local',
    //
    // ==================
    // Specify Test Files
    // ==================
    // Define which test specs should run. The pattern is relative to the directory
    // from which `wdio` was called.
    specs: [
        './tests/native/login.device.test.ts',
        './tests/native/login.gaurav.test.ts',
        './tests/native/**/*.test.ts'
    ],
    // Patterns to exclude.
    exclude: [
        // 'path/to/excluded/files'
    ],
    //
    // ============
    // Capabilities
    // ============
    // Define your capabilities here. WebdriverIO can run multiple capabilities at the same
    // time. Depending on the number of capabilities, WebdriverIO launches several test
    // sessions. Within your capabilities you can overwrite the spec and exclude options in
    // order to group specific specs to a specific capability.
    //
    // First, you can define how many instances should be started at the same time. Let's
    // say you have 3 different capabilities (Chrome, Firefox, and Safari) and you have
    // set maxInstances to 1; wdio will spawn 3 processes. Therefore, if you have 10 spec
    // files and you set maxInstances to 10, all spec files will get tested at the same time
    // and 30 processes will get spawned. The property handles how many capabilities
    // from the same test should run tests.
    //
    maxInstances: 1,
    //
    // If you have trouble getting all important capabilities together, check out the
    // Sauce Labs platform configurator - a great tool to configure your capabilities:
    // https://saucelabs.com/platform/platform-configurator
    //
    capabilities: [{
        // capabilities for local Appium web tests on an Android Emulator
        platformName: 'Android',
        'appium:deviceName': 'emulator-5554',
        'appium:udid': 'emulator-5554', // Local Emulator
        // 'appium:appWaitActivity': 'com.englabs.commandos.MainActivity', // Removed to auto-detect
        'appium:orientation': 'PORTRAIT',
        'appium:automationName': 'UiAutomator2',
        'appium:chromedriverAutodownload': true, // Fix WebView context switching
        // The path to the app
        'appium:app': 'c:/Users/SAM/Documents/Antigravity/hop-in-express---1/android/app/build/outputs/apk/debug/app-debug.apk',
        'appium:appPackage': 'com.englabs.commandos',
        'appium:appActivity': '.MainActivity',
        'appium:noReset': true, // Keep app state (login sessions etc)
        'appium:newCommandTimeout': 240,
        'appium:autoGrantPermissions': true,
    }],
    //
    // ===================
    // Test Configurations
    // ===================
    // Define all options that are relevant for the WebdriverIO instance here
    //
    logLevel: 'debug',
    bail: 0,
    baseUrl: 'http://localhost',
    port: 4723,
    path: '/',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
}
