# AGENTS.md - Guía para Colaboradores IA

Este documento proporciona contexto y reglas para los agentes de IA (como Antigravity, Cursor, Replit Agent, etc.) que trabajen en este proyecto en el futuro.

## 🧠 Contexto del Proyecto

`Planificador Pro` es una herramienta de lógica compleja escrita en un único archivo (`Planificador`) que maneja estado, lógica de cálculo y UI. Utiliza React y Tailwind CSS.

## 🛠 Directrices para Agentes

### 1. Manejo del Archivo Principal

- El archivo `Planificador` contiene toda la lógica. Al modificarlo, mantén el estilo de importaciones y la estructura de componentes dividida en:
  - Constantes y Tipos JSDoc.
  - Funciones de utilidad (fuera del componente principal).
  - El componente principal `CourseScheduler` con sus sub-componentes internos (ej. `CalendarGrid`).

### 2. Lógica de Cálculo

- El corazón del proyecto es `calculateSchedule`. Cualquier cambio en la lógica de horas o fechas debe probarse cuidadosamente.
- **DGAI**: Es un tipo de hora específico (35 min) que requiere el multiplicador `60/35`.
- **Feriados**: Se basan en el array `CHILEAN_HOLIDAYS_2026`. Para años futuros, este array debe ser expandido o dinamizado.

### 3. Estética y Diseño

- El proyecto utiliza un diseño "Premium" basado en Indigo e Inter.
- **Mantén la coherencia**: No rompas el sistema de `shadows` y `rounded-3xl` que define la interfaz.
- **Modo Oscuro**: Siempre verifica que los nuevos componentes se vean bien con el selector `.dark` (usando `dark:bg-...`, etc.).

### 4. Tipado y Errores

- El archivo se trata como `.tsx` por el linter del IDE, aunque no tenga extensión. Usa anotaciones **JSDoc** `@type` para mantener la claridad y evitar errores de "implicit any".

## 🚀 Próximos pasos recomendados

- Migrar el archivo único a una estructura de carpetas `src/components`, `src/utils`, etc.
- Implementar soporte multi-año para feriados usando una API o librería de calendarios.
- Añadir tests unitarios para `getEffectiveHours` y `calculateSchedule`.

---
*Este proyecto fue iniciado y refinado con la ayuda de Antigravity (Google DeepMind).*
