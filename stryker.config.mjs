/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
    _comment:
        "This config was generated using a preset. Please see the guide for more information: https://stryker-mutator.io/docs/stryker-js/guides/vitest",
    packageManager: "npm",
    reporters: ["html", "clear-text", "progress"],
    testRunner: "vitest",
    testRunner_static_config: {
        config: "vite.config.ts",
    },
    checkerNodeArgs: ["--max-old-space-size=4096"],
    checkers: ["typescript"],
    tsconfigFile: "tsconfig.json",
    mutate: [
        "{src,lib,components}/**/*.ts",
        "{src,lib,components}/**/*.tsx",
        "!{src,lib,components}/**/__tests__/*",
        "!{src,lib,components}/**/*.spec.ts",
        "!{src,lib,components}/**/*.test.ts",
        "!{src,lib,components}/**/*.test.tsx",
    ],
    thresholds: { high: 80, low: 60, break: 0 },
};
