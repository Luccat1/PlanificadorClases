# Planificador Pro

> Gestión inteligente de cronogramas académicos para diplomados, cursos y talleres.

[![Deploy Status](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://luccat1.github.io/PlanificadorClases/)
[![Tests](https://img.shields.io/badge/tests-87%20passing-brightgreen?style=flat-square)](#-testing)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**[🌐 Demo en vivo →](https://luccat1.github.io/PlanificadorClases/)**

---

## ✨ Características

| Funcionalidad | Detalle |
|---|---|
| **Tipos de hora** | Pedagógica (45 min), Cronológica (60 min), DGAI (35 min) |
| **Cálculo automático** | Genera el cronograma completo a partir de fecha de inicio, días de clase y total de horas |
| **Sesiones de recuperación** | Sesiones especiales con minutos extra configurables al inicio del curso |
| **Feriados en tiempo real** | Integración con [Nager.Date API](https://date.nager.at/) + caché local (`localStorage`) |
| **Soporte multi-año** | Cursos que cruzan de año consultan feriados de ambos años automáticamente |
| **Vista Lista / Calendario** | Dos modos de visualización: tabla detallada y cuadrícula mensual |
| **Modo oscuro / claro** | Tema premium con soporte completo `dark:` |
| **Persistencia local** | Configuración guardada automáticamente en `localStorage` |
| **Exportación Excel** | Descarga el cronograma como `.xlsx` con metadatos del curso |
| **Exportación PDF** | Impresión optimizada con estilos `@media print` |
| **Validación en línea** | Errores en tiempo real con estados `touched` por campo |
| **Metadatos del curso** | Semestre, nombre del profesor/a y email de contacto |

---

## 🏗 Arquitectura

```
src/
├── App.jsx                         # Componente principal (orquestador)
├── main.jsx                        # Entry point
├── components/
│   ├── CalendarGrid.jsx            # Vista calendario mes a mes
│   ├── CourseForm.jsx              # Formulario de configuración del curso
│   ├── ScheduleList.jsx            # Vista lista del cronograma
│   └── __tests__/                  # Tests de componentes
├── hooks/
│   ├── useCourseData.js            # Estado del curso + persistencia localStorage
│   ├── useHolidays.js              # Fetching de feriados con caché
│   ├── useSchedule.js              # Derivación del cronograma (useMemo)
│   └── __tests__/                  # Tests de hooks
├── logic/
│   ├── constants.js                # DAY_MAPPING, DAY_NAMES
│   ├── scheduleEngine.js           # calculateSchedule — motor de planificación
│   ├── utils.js                    # getEffectiveHours, formatDateLong, etc.
│   └── __tests__/                  # Tests unitarios de lógica
├── services/
│   ├── holidayApi.js               # Wrapper de Nager.Date API + localStorage cache
│   └── __tests__/                  # Tests de servicios (MSW)
├── mocks/
│   ├── handlers.js                 # MSW request handlers
│   └── server.js                   # MSW server setup
└── test-setup.js                   # Configuración global de Vitest
```

---

## 🛠 Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **UI** | [React 18](https://react.dev/) |
| **Estilos** | [Tailwind CSS 3](https://tailwindcss.com/) |
| **Iconos** | [Lucide React](https://lucide.dev/) |
| **Excel** | [SheetJS (xlsx)](https://sheetjs.com/) |
| **Bundler** | [Vite 7](https://vite.dev/) |
| **Testing** | [Vitest 3](https://vitest.dev/) + [Testing Library](https://testing-library.com/) + [MSW 2](https://mswjs.io/) |
| **Linting** | [ESLint 8](https://eslint.org/) |
| **Deploy** | [GitHub Pages](https://pages.github.com/) via `gh-pages` |

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** ≥ 18
- **npm** ≥ 9

### Instalación

```bash
git clone https://github.com/Luccat1/PlanificadorClases.git
cd PlanificadorClases
npm install
```

### Desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

### Otros Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite) |
| `npm run build` | Build de producción |
| `npm run preview` | Previsualización del build |
| `npm run lint` | Ejecutar ESLint |
| `npm test` | Tests en modo watch (Vitest) |
| `npm test -- --run` | Tests una sola ejecución |
| `npm run test:coverage` | Tests con reporte de cobertura |
| `npm run deploy` | Publicar a GitHub Pages |

---

## 🧪 Testing

El proyecto cuenta con **87 tests** organizados en 7 suites:

| Suite | Archivo | Tests |
|---|---|---|
| Motor de planificación | `logic/__tests__/calculateSchedule.test.js` | Generación, feriados, recuperación |
| Horas efectivas | `logic/__tests__/getEffectiveHours.test.js` | Multiplicadores ped/crono/dgai |
| Hook: datos del curso | `hooks/__tests__/useCourseData.test.js` | Persistencia localStorage |
| Hook: feriados | `hooks/__tests__/useHolidays.test.js` | Fetching + caché + errores (MSW) |
| Hook: cronograma | `hooks/__tests__/useSchedule.test.js` | Derivación + validación |
| Componente: formulario | `components/__tests__/CourseForm.test.jsx` | Campos, validación, interacción |
| Componente: lista | `components/__tests__/ScheduleList.test.jsx` | Renderizado de sesiones |

```bash
npm test -- --run
```

---

## 📋 Roadmap

- [x] **v1.0** — MVP completo (Fases 1–5), shipped 2026-03-27
  - Extracción del motor de cálculo
  - Infraestructura de tests
  - Hooks y persistencia
  - Integración API de feriados
  - Validación, exportación y UX
- [ ] **v1.1** — Mejoras planificadas
  - Enforcement de `sessionsPerWeek` en UI
  - Polish adicional de interfaz

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crea tu rama: `git checkout -b feature/mi-mejora`
3. Commit: `git commit -m "feat: descripción de la mejora"`
4. Push: `git push origin feature/mi-mejora`
5. Abre un Pull Request

> **Nota**: Ejecuta `npm run lint` y `npm test -- --run` antes de enviar tu PR.

---

## 📄 Licencia

[MIT](LICENSE) — Desarrollado por **Luciano Cataldo** con la asistencia de **Antigravity (Google DeepMind)**.

---

<p align="center">Diseñado con ❤️ para la excelencia académica</p>
