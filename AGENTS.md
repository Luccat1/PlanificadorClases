# AGENTS.md — Guía para Colaboradores IA

Este documento proporciona contexto y reglas para los agentes de IA (como Antigravity, Cursor, Replit Agent, etc.) que trabajen en este proyecto en el futuro.

## 🧠 Contexto del Proyecto

`Planificador Pro` es una herramienta de planificación académica construida con **React 18** y **Tailwind CSS 3**. La aplicación genera cronogramas de cursos calculando fechas, horas efectivas (pedagógicas, cronológicas y DGAI) y considerando feriados nacionales de Chile obtenidos en tiempo real desde la API de Nager.Date.

### Arquitectura Modular

El código fuente está organizado en una estructura modular dentro de `src/`:

```
src/
├── App.jsx                 # Componente orquestador principal
├── components/             # Componentes de UI (CalendarGrid, CourseForm, ScheduleList)
├── hooks/                  # Custom hooks (useCourseData, useHolidays, useSchedule)
├── logic/                  # Motor de cálculo puro (scheduleEngine, constants, utils)
├── services/               # API wrappers (holidayApi con caché localStorage)
├── mocks/                  # MSW handlers para testing
└── test-setup.js           # Configuración global de Vitest
```

> **Nota**: El archivo `Planificador` en la raíz es el código legacy monolítico original. No se importa desde ningún módulo activo; se conserva solo como referencia histórica.

## 🛠 Directrices para Agentes

### 1. Estructura de Archivos

- **Componentes** van en `src/components/`. Cada componente tiene su archivo `.jsx`.
- **Hooks** van en `src/hooks/`. Los hooks manejan estado, persistencia y derivación de datos.
- **Lógica pura** va en `src/logic/`. Las funciones aquí no deben tener side-effects ni depender de React.
- **Servicios** van en `src/services/`. El wrapper de API incluye caché en `localStorage`.
- **Tests** van en carpetas `__tests__/` colocadas junto al código que prueban.

### 2. Lógica de Cálculo

- El motor principal es `calculateSchedule` en `src/logic/scheduleEngine.js`.
- **DGAI**: Tipo de hora específico (35 min) que requiere el multiplicador `60/35`.
- **Feriados**: Se obtienen dinámicamente desde `date.nager.at` vía `src/services/holidayApi.js`, con caché en `localStorage`. Se consultan siempre 2 años (actual + siguiente) para cubrir cursos multi-año.
- **Intensidad**: Se calcula como `Total Horas / Semanas`. Las semanas se calculan por diferencia de fechas, redondeando hacia arriba.
- **Recovery bonus**: `(courseData.recoveryExtraMinutes ?? 30) / 60` — configurable, no hardcodeado.

### 3. Estado y Persistencia

- `useCourseData` maneja el estado del formulario y lo persiste en `localStorage`.
- `useSchedule` deriva el cronograma con `useMemo` (no `useEffect + setState`) para evitar frames con datos stale.
- `useHolidays` fetcha feriados con loading/error states para UI.
- Patrón `skipNextPersistRef` evita re-persistencia al resetear el estado.

### 4. Estética y Diseño

- El proyecto usa un diseño **Premium** basado en tonos **Indigo** y tipografía **Inter**.
- **Mantén la coherencia**: No rompas el sistema de `shadows`, `rounded-3xl` y la paleta indigo.
- **Modo Oscuro**: Siempre verifica que los nuevos componentes se vean bien con `dark:` utilities de Tailwind.
- El formulario usa validación `touched`-state por campo con errores inline.

### 5. Testing

- **Framework**: Vitest 3 + Testing Library + MSW 2.
- El proyecto tiene **87 tests** en 7 suites.
- Los tests de hooks usan `renderHook` de `@testing-library/react`.
- Los tests de componentes usan el patrón wrapper (real `useState`, no mocks).
- Las fechas en tests usan constructor local `new Date()` (no ISO strings) para evitar bugs UTC en jsdom.
- Ejecutar: `npm test -- --run` (debe dar 0 fallos).

### 6. Tipado

- El proyecto usa anotaciones **JSDoc** `@type` para claridad. No hay TypeScript formal, pero los tipos de `@types/react` están instalados para soporte de IDE.

## 🚀 Comandos Útiles

| Comando | Descripción |
|---|---|
| `npm run dev` | Desarrollo local |
| `npm run lint` | ESLint (0 warnings permitidos) |
| `npm test -- --run` | Tests completos |
| `npm run deploy` | Publicar a GitHub Pages |

## 📋 Próximos Pasos

- Implementación de exportación nativa a `.ics` o Google Calendar.
- Considerar el despliegue automático con cada merge a `main` mediante GitHub Actions.
- Considerar migración a TypeScript para tipos más robustos.

---
*Este proyecto fue iniciado y refinado con la ayuda de Antigravity (Google DeepMind).*
