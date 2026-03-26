# Integrations

**Analysis Date:** 2026-03-26

## External APIs

None. The application is fully client-side with no outbound HTTP calls to external APIs.

## Third-Party Services

**Analytics:** None — no tracking scripts, no analytics SDK.

**Error Monitoring:** None — no Sentry, Datadog, or similar.

**Auth / Identity:** None — no authentication layer; the app is fully public and stateless beyond `localStorage`.

## Data Sources

**Browser Storage:**
- `localStorage` — used to persist course configuration between sessions
- Key: `'courseData'` — stores the full `courseData` object as JSON
- Read on app init via lazy `useState` initializer in `src/App.jsx`
- Written on every `courseData` state change via `useEffect`

**Hardcoded Data:**
- Chilean public holidays for 2026 — defined as a static array in `src/logic/constants.js` (`CHILEAN_HOLIDAYS_2026`)
- No external calendar or holiday API is used; data must be manually updated for other years

**File Output (client-side only):**
- `.xlsx` files generated in-browser using `xlsx` (SheetJS) and downloaded via `XLSX.writeFile()`
- No server-side file storage; files are written directly to the user's local machine
- PDF export uses the browser's native `window.print()` — no PDF library or server

## CDN / External Package Source

**SheetJS (xlsx):**
- Loaded from SheetJS's own CDN: `https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`
- This is a non-standard npm source; the package resolves to the latest tarball at install time
- No API key required; public CDN

## Deployment

**Hosting:** GitHub Pages
- Static site deployment; no server-side runtime
- Deploy target: `dist/` directory (Vite production build output)
- Deployment tool: `gh-pages` npm package (`npm run deploy`)
- Vite `base: './'` in `vite.config.js` ensures asset paths work under a GitHub Pages subdirectory URL

**CI/CD:** None — deployment is manual via `npm run deploy` from a developer machine. No GitHub Actions or other pipeline configured.

**Build Output:**
- `dist/index.html` — entry point
- `dist/assets/` — hashed JS and CSS bundles

## Webhooks & Callbacks

**Incoming:** None.
**Outgoing:** None.

---

*Integration audit: 2026-03-26*
