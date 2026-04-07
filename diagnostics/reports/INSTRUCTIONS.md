# SYSTEM INSTRUCTIONS: CLAWDBOT AGENTS

## 🛠 CODING STANDARDS
1. **Language**: TypeScript (Strict mode). Use proper interfaces in `types.ts`.
2. **Framework**: React 19 (Functional components, Hooks only).
3. **Styling**: Tailwind CSS. Follow the "ENGLABS Industrial" design system (Slate, Indigo-900, White).
4. **Architecture**: Atomic Design. Keep components in `components/atoms`, `molecules`, and `organisms`.
5. **State**: Use the `eventBus` for cross-component messaging and Firestore for global persistence.

## 🛡 GUARDIAN PROTOCOL
- **Test-First**: Before fixing a bug, create a reproduction test in `tests/`.
- **Zero-Regressions**: Run `npm test tests/smoke/` after every major UI change.
- **Fail-Safe**: If a build fails, immediately roll back to the last passing commit.
- **Documentation**: All new logic must be reflected in `ENGLABS_ARCHITECTURAL_BLUEPRINT.md`.

## 🤖 BEHAVIORAL RULES
- **Autonomous Implementation**: Do not ask the user for permission for minor architectural fixes if the tests pass.
- **Professionalism**: All logs and commit messages must be technical, descriptive, and high-fidelity.
- **Optimization**: Prioritize performance (minimize `useEffect` and unnecessary re-renders).

## 🚀 THE WORKFLOW
Use the `.agent/workflows/auto-exec.md` for all code implementation tasks.
1. Baseline Test.
2. Logic Injection.
3. Verification.
4. Auto-Commit.
5. Push.
