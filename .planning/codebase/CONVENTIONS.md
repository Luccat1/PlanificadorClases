# Conventions

## Code Style
- Language: JavaScript (JSX) — no TypeScript
- Indentation: 4 spaces
- Quotes: single quotes for JS strings
- Semicolons: present
- File naming: PascalCase for components (`CourseForm.jsx`), camelCase for logic (`utils.js`, `constants.js`)
- Component files match component name exactly

## Component Patterns
- Functional components only (no class components)
- Props destructured in function signature
- JSDoc `@param` comments on exported components describing each prop
- Presentational components: pure props-in, render-out (no internal business logic)
- Single component per file, default export at bottom
- Internal UI-only state (e.g. `newExcludedDate`) kept inside presentational component, not lifted

## State Patterns
- All app state lives in `App.jsx` (single source of truth)
- State initialized from `localStorage` with try/catch fallback
- `useCallback` for functions passed as props (to stabilize references)
- `useMemo` for derived/computed values (stats)
- `useEffect` for side effects: persistence to localStorage, triggering recalculation

## Error Handling
- Algorithm has a safety counter (max 1500 iterations) to prevent infinite loops
- `localStorage` access wrapped in try/catch
- Input parsing uses `|| 0` fallback for numeric fields (e.g. `parseInt(e.target.value) || 0`)
- No error boundary components present

## Import/Export Patterns
- Named exports from logic modules (`constants.js`, `utils.js`)
- Default exports from components
- Lucide React icons imported by name from `lucide-react`
- XLSX imported as namespace (`import * as XLSX from 'xlsx'`)

## Styling
- Tailwind CSS utility classes throughout
- Dark mode via conditional className — `darkMode` boolean state toggles `dark:` variants
- Responsive breakpoints: `sm:` and `lg:` used in grid layouts
- Print styles via `no-print` CSS class and `print-overflow-visible` utility
- Custom scrollbar class `custom-scrollbar` defined in global CSS
