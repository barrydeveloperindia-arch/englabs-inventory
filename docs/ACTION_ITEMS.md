# ENGLABS INVENTORY - Action Items

## Immediate
- [ ] **Setup Windows Task Scheduler for Shop Hours**
  - **Goal:** Automate the synchronization of Shop Hours from the script logic.
  - **Script:** `scripts/sync_shop_hours.ts`
  - **Frequency:** Every Monday at 5:00 AM.
  - **Action:** Open Task Scheduler -> Create Basic Task -> Trigger: Weekly (Mon @ 5AM) -> Action: `npx tsx scripts/sync_shop_hours.ts` (Ensure execution directory is project root).

## Future
- [ ] Integrate Google Places API for real-time scraping (bypassing manual script updates).
