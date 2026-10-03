# Regression tests

From the repository root (Node 22.12+ or Node 24):

```sh
npm ci --ignore-scripts
npm test
```

The regression suite needs no `.env` files, database, Next.js server, iOS SDK,
Vitest config changes, DOM environment, or generated Prisma client. The existing
`src/**/*.test.ts` include discovers all tests. `--ignore-scripts` skips the app's
Prisma generation and unrelated native dependency build scripts.

To run only these regressions:

```sh
npm test -- src/components/IngredientPresetPicker.test.ts src/components/ExportCsvButton.test.ts src/test/prisma-config.test.ts
```

- **IngredientPresetPicker (10 cases):** real React state; deferred server actions
  verify busy state, rejected additions followed by retry, null results, trimmed
  names, built-in/custom categories, optimistic item/category removal, rollback
  including the active category and its items, and unaffected other categories.
  Only server actions and next-intl hooks are mocked.
- **ExportCsvButton (6 cases):** browser navigation remains intact; native export
  prevents navigation, blocks duplicate clicks, writes UTF-8 CSV as base64 into
  cache, then shares the returned URI. Fetch/body-read/write/share rejection
  each releases busy and permits retry. Only fetch and Capacitor boundaries are
  mocked; Response, TextEncoder and base64 conversion execute normally.
- **Prisma config (4 cases):** fresh processes load the real config, dotenv and
  Prisma against temporary `.env`/`.env.local` files, verifying local-only loading,
  local precedence over both `.env` and inherited DATABASE_URL, and fallbacks.
  Test connection strings are fixtures; no database connection occurs. Temporary
  files are always removed and the parent process's environment is unchanged.

`react.ts` mounts/unmounts real React components and provides deferred promises.
Rendered handlers are awaited directly so rejected async handlers can be tested
without unhandled DOM event promises. `react-test-renderer` is pinned to the app's
React version; it is deprecated and may emit a warning. This small Node-only
harness intentionally does not test DOM interactions and should be revisited on
React upgrades.

Not covered: real iOS/WKWebView download/share behavior or Swift plugin linkage,
browser download integration, page-to-button wiring, database authorization and
persistence, migrations/seed, concurrent edits during deletion, HTTP error-status
handling, or user-visible error messages. The current handlers propagate add and
export failures after clearing busy; these tests do not add error UI.

Validation on main commit `603c82a95dd171fc43035f1ac234f44f8d2c37c4`:
20 added tests and 36 existing tests pass. Temporarily restoring the pre-fix
picker, bypassing native export, or removing `.env.local` loading makes the
corresponding regression tests fail. Production source files are unchanged.
