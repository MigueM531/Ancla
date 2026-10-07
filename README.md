# ⚓ Ancla - Sistema de Monitoreo Temprano y Retención Estudiantil
**Facultad de Ingenierías — Universidad de Medellín (2026-2)**  
*Proyecto de Ingeniería I*

---

## 📖 Descripción del Proyecto
**Ancla** es un sistema tecnológico de detección temprana, análisis preventivo y alerta diseñado para contrarrestar la deserción estudiantil en los primeros semestres de los programas de ingeniería de la Universidad de Medellín.

A diferencia de modelos sancionadores tradicionales, Ancla implementa un **enfoque preventivo y no punitivo**, combinando:
1. **Seguimiento Cuantitativo:** Notas parciales y porcentaje de inasistencias (<80%).
2. **Percepción Cualitativa (Benchmarking Typeform):** Pulsómetro de bienestar emocional y carga académica percibida con encuestas de micro-interacción de una sola pregunta a la vez.
3. **Supervisión Humana Obligatoria:** Las pre-alertas generadas por el motor de reglas determinista deben ser auditadas y validadas por un tutor o profesional de bienestar antes de considerarse casos oficiales, mitigando falsos positivos (Matriz DOFA).
4. **Sostenibilidad Financiera:** Simulador interactivo de impacto económico y retorno de inversión (ROI) por matrícula retenida.

---

## 🎨 Paleta de Colores del Sistema
El diseño visual está implementado con una estética sobria, moderna y de alto contraste:
- **Grises Oscuros:**
  - Fondo general: `#0e1114`
  - Paneles y barras laterales: `#13171c` y `#151a21`
  - Tarjetas y contenedores: `#191e26` y `#232a35`
- **Blanco y Textos:**
  - Texto principal y métricas: `#ffffff` y `#f1f3f6`
  - Texto secundario y etiquetas: `#9aa4b2` y `#647082`
- **Rojo Institucional y Alertas:**
  - Rojo primario: `#dc2626`
  - Acento hover / interacción: `#ef4444` y `#b91c1c`
  - Acentos de fondo sutil (chips de alerta crítica): `rgba(220, 38, 38, 0.12)`

---

## 📍 ¿Dónde colocar los Logos? (Indicaciones de Ubicación)

El prototipo ya cuenta con marcadores vectoriales (SVG) diseñados a medida y comentarios explícitos en el código HTML:

### 1. Logo Principal de Ancla (Marca del Proyecto)
- **Ubicación en el código:** [`index.html`](file:///home/migue/TOSHII/universidad/Ancla/index.html) dentro del contenedor `<div class="sidebar-brand">`.
- **Ruta del archivo actual:** [`assets/logo-ancla.svg`](file:///home/migue/TOSHII/universidad/Ancla/assets/logo-ancla.svg)
- **Reemplazo con tu archivo oficial:**
  Guarda tu logo en `assets/` (por ejemplo `assets/logo-ancla.png` o `.svg`) y en `index.html` actualiza la etiqueta:
  ```html
  <!-- UBICACIÓN DEL LOGO #1: LOGO PRINCIPAL ANCLA -->
  <a href="#" class="logo-container">
    <img src="assets/tu-logo-ancla.png" alt="Logo Ancla" class="logo-img">
  </a>
  ```
- **Dimensiones sugeridas:** Altura recomendada entre 36px y 42px (proporción horizontal aproximada de 200x48 px).

### 2. Logo Institucional (Universidad de Medellín / Facultad de Ingenierías)
- **Ubicación en el código:** [`index.html`](file:///home/migue/TOSHII/universidad/Ancla/index.html) en el pie de la barra lateral (`<div class="sidebar-footer">`).
- **Ruta del archivo actual:** [`assets/logo-udem.svg`](file:///home/migue/TOSHII/universidad/Ancla/assets/logo-udem.svg)
- **Reemplazo con tu archivo oficial:**
  ```html
  <!-- UBICACIÓN DEL LOGO #2: LOGO INSTITUCIONAL UdeM -->
  <div class="institutional-logo-zone">
    <img src="assets/tu-logo-udem.png" alt="Logo Universidad de Medellín" class="inst-logo-img">
  </div>
  ```
- **Dimensiones sugeridas:** Altura aproximada de 28px a 32px.

---

## 🚀 Estructura del Proyecto

```text
Ancla/
├── index.html           # Estructura semántica HTML5 y vistas por roles (HU01-HU10)
├── css/
│   └── styles.css       # Hoja de estilos (Grises oscuros, blanco, rojo, responsive)
├── js/
│   └── app.js           # Lógica interactiva, control de roles, Typeform y simulador financiero
├── assets/
│   ├── logo-ancla.svg   # Placeholder vectorial del logo Ancla
│   └── logo-udem.svg    # Placeholder vectorial institucional UdeM
└── README.md            # Documentación del prototipo
```

---

## 🛠️ Cómo Probar y Ejecutar el Prototipo

No requiere instalación de frameworks pesados ni dependencias:
1. **Abrir directamente:** Haz doble clic sobre [`index.html`](file:///home/migue/TOSHII/universidad/Ancla/index.html) en tu navegador preferido (Chrome, Firefox, Edge, Safari).
2. **Servidor local (opcional):**
   ```bash
   python3 -m http.server 8000
   ```
   Luego ingresa a `http://localhost:8000`.

### Funcionalidades Interactivas Listas para Demostración:
- **Selector de Rol (Barra Superior):** Cambia entre **Estudiante**, **Tutor** y **Directivo** para explorar cada historia de usuario.
- **En Rol Estudiante:**
  - Consulta el **Consentimiento Informado (HU01)** haciendo clic en *"Gestionar Privacidad"*.
  - Responde la **Micro-encuesta Typeform (HU04)** (Paso 1: Emociones, Paso 2: Carga, Paso 3: Apoyo). Al seleccionar agobio extremo y enviar, se disparará una pre-alerta en la bandeja del tutor.
  - Revisa tus materias y el semáforo de notas y asistencia (<80%).
- **En Rol Tutor / Bienestar:**
  - Visualiza las **Pre-alertas deterministas (HU05)** con desglose de causales.
  - Ejecuta la **Supervisión Humana Obligatoria (HU06)**: Haz clic en *"Supervisar Caso"* para **Validar** con concepto profesional o **Descartar como Falso Positivo**.
- **En Rol Directivo:**
  - Explora los **Indicadores Clave y Gráficos (HU07)** de permanencia.
  - Interactúa con el **Simulador Financiero (HU09, HU10)**: Mueve los sliders de estudiantes retenidos y costo de matrícula para recalcular ingresos protegidos, beneficio neto y ROI en vivo.

---

## 🔌 Próxima Fase: Integración con Backend y Base de Datos
El código en [`js/app.js`](file:///home/migue/TOSHII/universidad/Ancla/js/app.js) y el modal *"Arquitectura & API"* documentan los endpoints REST listos para conectar:
- `POST /api/v1/auth/consent` (HU01)
- `POST /api/v1/perceptual-data` (HU04)
- `GET /api/v1/rules-engine/pre-alerts` (HU05)
- `PATCH /api/v1/alerts/:id/validate` (HU06)
- `GET /api/v1/finance/roi-simulation` (HU10)