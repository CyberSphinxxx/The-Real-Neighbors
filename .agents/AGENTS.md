# Agent Guidelines for The Real Neighbors

- **Graphify First:** Always use the graphify skill to understand the architecture and dependencies *before* writing code.
- **Check Side Effects:** Before modifying or refactoring a hook/component, find where it is imported to ensure you don't break parent components.
- **Singleton Subscriptions:** NEVER put Firebase subscriptions (`subscribeToCollection` / `onValue`) inside list items or deeply nested components. Always centralize them in a Zustand store (`src/stores/`) or global hook.
- **Strict Theming:** No hardcoded styling or arbitrary hex codes. You MUST use the CSS variables defined in our theme system (`src/themes/`).
- **Use Existing Tools:** Check `src/utils` and `src/components/ui` for existing helpers/components before reinventing the wheel.
- **Security:** Never expose `.env` contents. Always ensure Firestore/RTDB rules strictly enforce `isAuthenticated()`.
- **Mandatory Build Check:** Always run `npm run build` in the background and verify it completes with 0 TypeScript/build errors before finishing a task or committing.
