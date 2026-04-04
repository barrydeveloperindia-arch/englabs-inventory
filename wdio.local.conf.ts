// @ts-ignore
export const config = {
    runner: 'local',
    specs: [
        './tests/native/login.gaurav.test.ts'
    ],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'emulator-5554',
        'appium:orientation': 'PORTRAIT',
        'appium:automationName': 'UiAutomator2',
        'appium:appPackage': 'com.englabs.commandos',
        'appium:appActivity': 'com.englabs.commandos.MainActivity',
        'appium:noReset': true,
        'appium:newCommandTimeout': 240,
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    path: '/',
    port: 4726,
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: [],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
}
