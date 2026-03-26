# Project Structure

## Directory Layout

```
PlanificadorClases/
├── index.html              # Vite entry HTML
├── vite.config.js          # Vite config (base path set for gh-pages)
├── tailwind.config.js      # Tailwind CSS config
├── postcss.config.js       # PostCSS config
├── package.json            # Dependencies & scripts
├── AGENTS.md               # AI agent instructions
├── README.md               # Project readme
└── src/
    ├── main.jsx            # React DOM mount point
    ├── App.jsx             # Root component — all state + scheduling logic
    ├── components/
    │   ├── CourseForm.jsx  # Course configuration form (left sidebar)
    │   ├── ScheduleList.jsx # Schedule display (list or calendar mode)
    │   └── CalendarGrid.jsx # Calendar grid view for schedule
    ├── logic/
    │   ├── constants.js    # DAY_NAMES, DAY_MAPPING, CHILEAN_HOLIDAYS_2026
    │   └── utils.js        # getEffectiveHours, formatDateLong, getHolidayName
    └── styles/
        └── index.css       # Global styles (Tailwind directives + print styles)
```

## Entry Points
- `index.html` → imports `src/main.jsx`
- `src/main.jsx` → mounts `<App />` into `#root`

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | All app state, scheduling algorithm, export logic, layout |
| `src/logic/constants.js` | Chilean holidays 2026, day name/number mappings |
| `src/logic/utils.js` | Hour conversion, date formatting, holiday lookup |
| `src/components/CourseForm.jsx` | Input form for all course parameters |
| `src/components/ScheduleList.jsx` | Renders schedule in list or grid view |
| `vite.config.js` | Base path configured for GitHub Pages deployment |

## Module Organization
- `src/logic/` — pure utility functions and static data (no React)
- `src/components/` — presentational components (receive props, no internal state beyond UI)
- `App.jsx` acts as a single "smart" component containing all business logic
