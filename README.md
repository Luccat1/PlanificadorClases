# Planificador Pro - Gestión Inteligente de Cronogramas Académicos

Un planificador de cursos avanzado y moderno diseñado para facilitar la creación de cronogramas académicos para diplomados, cursos y talleres. Esta herramienta automatiza el cálculo de fechas, horas efectivas y considera feriados nacionales (Chile 2026) y sesiones de recuperación.

![Planificador Pro Mockup](https://raw.githubusercontent.com/lucianocataldo/PlanificadorClases/main/screenshot.png) *(Nota: Reemplazar con una imagen real del proyecto)*

## 🚀 Características Principales

- **Gestión de Horas Personalizable**: Soporte para horas pedagógicas (45 min), cronológicas (60 min) y DGAI (35 min).
- **Cálculo Automático**: Genera el cronograma completo basándose en la fecha de inicio, días de clase y total de horas requeridas.
- **Sesiones de Recuperación**: Configuración de sesiones especiales con tiempo extra (30 min) para avance rápido al inicio del curso.
- **Detección de Feriados**: Integración automática de feriados nacionales chilenos (2026) y posibilidad de añadir fechas excluidas personalizadas.
- **Vistas Duales**:
  - **Vista de Lista**: Detalle sesión por sesión con progreso acumulado.
  - **Vista de Calendario**: Visualización tipo cuadrícula mes a mes.
- **Modo Oscuro/Claro**: Interfaz premium con soporte completo para temas.
- **Persistencia Local**: Guarda automáticamente tu configuración en el navegador (`localStorage`).
- **Exportación Versátil**: Descarga tu cronograma en formato **Excel** o prepáralo para imprimir/guardar como **PDF**.

## 🛠️ Tecnologías Utilizadas

- **React.js**: Biblioteca principal para la interfaz de usuario.
- **Tailwind CSS**: Framework de diseño para una estética moderna y fluida.
- **Lucide React**: Set de iconos elegantes y minimalistas.
- **XLSX (SheetJS)**: Motor para la generación y exportación de archivos Excel.
- **JSDoc**: Documentación de tipos para un código mantenible.

## 📦 Instalación y Uso

1. **Clonar el repositorio**:

   ```bash
   git clone https://github.com/lucianocataldo/PlanificadorClases.git
   ```

2. **Instalar dependencias**:

   ```bash
   npm install
   ```

3. **Ejecutar en desarrollo**:

   ```bash
   npm start
   ```

## 📄 Licencia

Este proyecto fue desarrollado por **Luciano Cataldo** con la asistencia de **Antigravity (Google DeepMind)**.
Licencia MIT.

---
Diseñado con ❤️ para la excelencia académica.
