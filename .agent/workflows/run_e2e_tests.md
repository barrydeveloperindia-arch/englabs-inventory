---
description: Run the Comprehensive Autonomous QA Suite (Level 5)
---

# /clawd-qa: Guardian Sentinel

This workflow triggers the full autonomous QA pipeline with visual regression and self-healing verification.

## Steps

1. **Environmental Readiness**: Verify `npm run dev` is active on port 3000.
2. **Visual Audit**: Run Playwright visual tests `npx playwright test tests/visual/`.
3. **Self-Healing Verification**: Run `tests/visual/self_healing.spec.ts` specifically to check if any locators have "broken" and healed successfully.
4. **Performance Audit**: Run `npm run test:audit` to check Lighthouse/performance metrics.
5. **Reporting**: Collect all screenshots and failure logs into a single `QA_AUDIT_REPORT.md`.

// turbo
6. Run `npx playwright test --reporter=json > qa-results.json`
7. Analyze `qa-results.json` for persistent failures.
