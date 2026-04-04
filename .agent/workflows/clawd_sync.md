---
description: Synchronize core types and constants between Command OS and Client App
---

# /clawd-sync: Cross-Platform Bridge

This workflow ensures that shared business logic, types, and constants are consistent across the Web and Mobile ecosystems.

## Steps

1. **Scan Source Types**: Read `c:\Users\SAM\Documents\Antigravity\hop-in-express---1\types.ts` to identify changes in the business schema.
2. **Scan Destination Types**: Read `c:\Users\SAM\Documents\Antigravity\hop-in-express---1\hop-in-express-customerApp\src\types\index.ts` (or equivalent).
3. **Identify Discrepancies**: Use `grep` or manual comparison to find missing types or interface updates.
4. **Mirror Constants**: Ensure `constants.tsx` values (VAT rates, Shop IDs, roles) are updated in both locations.
5. **Validation**: Run a TypeScript check on both projects to ensure zero type errors after the sync.

// turbo
6. Run `npm run test:types` in both directories to verify integrity.
