# ANCLA ⚓
### Sistema de Monitoreo Temprano, Análisis y Alerta para la Permanencia Estudiantil
**Proyecto de Ingeniería I (2026-2) — Proyecto # 5**  
**Facultad de Ingenierías, Universidad de Medellín**

---

## 👥 Integrantes y Docente
* **Integrantes:**
  * Alejandra Escobar Chavarriaga
  * Miguel Ángel Martínez Tamayo
  * Juan José Martínez Acosta
  * Cristian David Toro Arboleda
* **Profesora:** Duby Sulay Castellano Cárdenas

---

## 🎨 Paleta de Color Institucional
El diseño visual está fundamentado en una estética técnica, sobria y de alto contraste:
* **Grises Oscuros:** `#0b0c0e` (fondo base), `#111317` (sidebar/headers), `#171a21` (tarjetas), `#2f3545` (bordes estructurales).
* **Blanco Puro:** `#ffffff` (títulos de impacto, cifras principales y textos de alto contraste) y `#f2f4f8` (texto de lectura).
* **Rojo Ancla:** `#e63946` (acento primario de identidad), `#ff4d5b` (hover y acentos vivos), `#9e1422` (alertas críticas y contrastes).

---

## 📍 ¿Dónde colocar el Logo Oficial?
El proyecto incluye un logo vectorial moderno predeterminado en `assets/logo.svg`.
Para utilizar el logo oficial de la institución o del equipo:

1. **Ubicación del archivo:**  
   Guarda tu imagen de logo en la carpeta `assets/` (por ejemplo: `assets/logo-ancla.png` o `assets/logo-ancla.svg`).
2. **Ubicación en el código (`index.html`):**  
   En la cabecera del menú lateral (`.sidebar-logo-area`), dentro del contenedor `.logo-badge` (alrededor de la línea 26):
   ```html
   <!-- CONTENEDOR DEL LOGO PRINCIPAL -->
   <div class="logo-badge" title="Logo Oficial del Sistema ANCLA">
     <img src="assets/logo.svg" alt="Logo Ancla" id="mainAppLogo">
   </div>
   ```
   También puedes actualizar el `favicon` en la línea 7 de `index.html`:
   ```html
   <link rel="icon" type="image/svg+xml" href="assets/logo.svg">
   ```

---

## 🏛️ Arquitectura del Frontend (Tres Capas y Monolito Modular)

```
Ancla/
│
├── index.html                   # Capa de Presentación (HTML5 Semántico y Accesible)
├── README.md                    # Documentación del proyecto
│
├── assets/
│   └── logo.svg                 # Logo oficial vectorial (Ancla geométrica con acento rojo)
│
├── css/
│   └── styles.css               # Sistema de diseño, variables CSS, temas oscuro y componentes
│
└── js/
    ├── data.js                  # Semilla de datos estructurados (Estudiantes, Percepciones, Roles)
    ├── rulesEngine.js           # Capa de Lógica: Motor determinista por umbrales (HU05)
    ├── financialSimulator.js    # Capa de Lógica: Modelo financiero y simulador de ROI (HU09, HU10)
    ├── apiService.js            # Capa de Comunicación: Endpoints listos para conectar Backend / BD
    └── app.js                   # Controlador interactivo, gestión de eventos y vistas por rol
```

---

## 🚀 Funcionalidades Clave del Prototipo Frontend

### 1. Control de Acceso y Vistas por Rol (HU02)
Permite alternar interactivamente entre los 3 actores principales mediante el menú desplegable en la barra lateral:
* **🎓 Estudiante:**
  * **Consentimiento Informado (HU01):** Banner transparente con opción de aceptar o revocar el tratamiento de datos socioemocionales.
  * **Encuesta de Bienestar Typeform (HU04):** Flujo ágil de micro-preguntas (1 por pantalla) para medir estado anímico, sobrecarga académica y estrés con escalas intuitivas y emojis.
  * **Resumen Académico (HU03):** Visualización no punitiva de notas y asistencia porcentual.
* **🛡️ Tutor / Profesional de Bienestar:**
  * **Bandeja de Pre-Alertas (HU06, HU08):** Lista filtrable de casos detectados automáticamente por el motor de reglas.
  * **Validación Humana Obligatoria (HU06):** Modal interactivo para inspeccionar la traza causal, ingresar notas de acompañamiento y **confirmar la alerta** o **descartarla como falso positivo**.
  * **Monitoreo Integral:** Padrón consolidado de estudiantes con métricas cruzadas (cuantitativas + cualitativas).
* **📊 Directivo / Coordinador Académico:**
  * **Dashboard de Indicadores (HU07):** KPIs agregados de permanencia, estudiantes en riesgo y distribución por nivel (Crítico, Alto, Medio, Bajo).
  * **Simulador Financiero de Retención (HU09, HU10):** 5 controles deslizantes (sliders) interactivos que recalculan en tiempo real:
    * Retorno sobre la Inversión (**ROI %**).
    * Estudiantes retenidos al año.
    * Ingresos por matrículas preservadas (**$ COP**).
    * Pérdida anual evitada vs. costo operativo del sistema SaaS.

---

## 🔌 Preparación para Conexión con Backend y Base de Datos
El archivo `js/apiService.js` implementa funciones asíncronas (`async/await`) listas para producción. Cuando se construya la API REST (Node.js/Express, Python/FastAPI, Spring Boot, etc.), simplemente se descomentan las líneas `fetch(BASE_URL + ...)` señalizadas dentro del archivo.

---

## 💻 ¿Cómo abrir y visualizar el prototipo?
Basta con abrir el archivo `index.html` en cualquier navegador web moderno (Google Chrome, Microsoft Edge, Firefox, Safari).  
No requiere dependencias externas ni compiladores complejos.