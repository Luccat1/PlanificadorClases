# Technology Stack

**Analysis Date:** 2026-03-26

## Core Technologies

**Primary Language:**
- JavaScript (ES Modules) — all source files use `.jsx` / `.js` with `"type": "module"` in `package.json`

**Runtime:**
- Node.js (development only; production output is static HTML/JS/CSS)

**Framework:**
- React 18.3.1 — UI rendering, component model
- JSX — component syntax throughout `src/`

## Build & Tooling

**Bundler:**
- Vite 7.3.1 — dev server and production bundler
- Config: `vite.config.js`
- Base path set to `'./'` for relative asset resolution (GitHub Pages compatibility)
- Plugin: `@vitejs/plugin-react` 4.3.1 for JSX transform

**CSS Processing:**
- Tailwind CSS 3.4.13 — utility-first styling
- Config: `tailwind.config.js` — scans `./index.html` and `./src/**/*.{js,ts,jsx,tsx}`; dark mode via `'class'` strategy
- PostCSS 8.4.47 — CSS pipeline runner; config: `postcss.config.js`
- Autoprefixer 10.4.20 — vendor prefix injection

**Linting:**
- ESLint 8.57.0
- Plugins: `eslint-plugin-react` 7.34.3, `eslint-plugin-react-hooks` 4.6.2, `eslint-plugin-react-refresh` 0.4.7
- Run: `npm run lint` (zero max-warnings enforced)

**Deployment:**
- `gh-pages` 6.1.1 — publishes `dist/` to GitHub Pages branch
- Run: `npm run deploy` (runs `predeploy` build step first)

## Key Dependencies

**UI Components:**
- `lucide-react` 0.446.0 — icon library; used extensively in `src/App.jsx` (Calendar, Download, Printer, Moon, Sun, etc.)

**Spreadsheet Export:**
- `xlsx` — loaded from SheetJS CDN tarball (`https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`), not from npm registry
- Used in `src/App.jsx` via `import * as XLSX from 'xlsx'` for `.xlsx` file generation and download

## Dev Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@vitejs/plugin-react` | ^4.3.1 | JSX transform for Vite |
| `@types/react` | ^18.3.3 | TypeScript type hints (JSDoc usage) |
| `@types/react-dom` | ^18.3.0 | TypeScript type hints |
| `autoprefixer` | ^10.4.20 | PostCSS vendor prefixes |
| `eslint` | ^8.57.0 | Static analysis |
| `eslint-plugin-react` | ^7.34.3 | React-specific lint rules |
| `eslint-plugin-react-hooks` | ^4.6.2 | Hooks rules enforcement |
| `eslint-plugin-react-refresh` | ^0.4.7 | HMR lint rules |
| `gh-pages` | ^6.1.1 | GitHub Pages deployment |
| `postcss` | ^8.4.47 | CSS transformation pipeline |
| `tailwindcss` | ^3.4.13 | Utility-first CSS framework |
| `vite` | ^7.3.1 | Dev server and bundler |

## Package Management

- **Manager:** npm
- **Lockfile:** `package-lock.json` — present and committed
- **Module system:** ESM (`"type": "module"`)

## Scripts

```bash
npm run dev        # Vite dev server with HMR
npm run build      # Production build → dist/
npm run preview    # Preview production build locally
npm run lint       # ESLint with zero-warning policy
npm run deploy     # Build then publish to GitHub Pages via gh-pages
```

---

*Stack analysis: 2026-03-26*
