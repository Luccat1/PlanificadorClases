# Architecture

## Overview
Single-page React application for academic course scheduling. Users configure a course (name, start date, session days, total hours, hour type) and the app automatically generates a complete session calendar, skipping Chilean national holidays and custom excluded dates. The schedule can be exported to Excel or printed as PDF.

## Architectural Pattern
Component-based SPA with all business logic centralized in `App.jsx`. Presentation components receive data and callbacks via props (no shared state library).

## Key Components

| Component | Responsibility |
|-----------|---------------|
| `App.jsx` | Root orchestrator — holds all state, runs scheduling algorithm, handles exports |
| `CourseForm.jsx` | Left sidebar form — collects course configuration inputs |
| `ScheduleList.jsx` | Schedule display — renders sessions in list or calendar grid view |
| `CalendarGrid.jsx` | Calendar grid sub-view for ScheduleList |

## Data Flow
1. User edits form fields in `CourseForm` → calls `onInputChange` callback
2. `App.jsx` updates `courseData` state → persists to `localStorage`
3. `useEffect` triggers `calculateSchedule()` whenever `courseData` changes
4. `calculateSchedule()` iterates day-by-day, accumulating effective hours until target met
5. Resulting `schedule` array passed down to `ScheduleList` for rendering
6. Stats derived via `useMemo` from `schedule` array

## Scheduling Algorithm (`calculateSchedule` in App.jsx:81)
- Iterates dates forward from `startDate` (safety limit: 1500 iterations)
- Each candidate date is checked against: target weekdays, Sundays, Chilean holidays 2026, custom excluded dates
- Hours accumulate using `getEffectiveHours()` — converts chronological hours to pedagogical (×60/45), DGAI (×60/35), or keeps chronological (×1)
- First N sessions can be "recovery" sessions (+30 min each)
- Mid-course marker detected when accumulated hours cross 50% of total

## State Management
Local React state only (`useState`). Persisted to `localStorage`. No global state library (no Redux, Zustand, Context).
