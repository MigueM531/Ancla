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

## 🏛️ Arquitectura Modular del Proyecto

El proyecto está organizado de manera modular y escalable, dividiendo las vistas, la lógica de negocio y los servicios centrales para facilitar el mantenimiento y la demostración ante clientes o directivas:

```
Ancla/
│
├── index.html                   # Launcher institucional y enrutador inteligente de inicio
├── server.js                    # Servidor local HTTP nativo (localhost:3000, 0 dependencias)
├── package.json                 # Configuración de arranque con npm start
├── README.md                    # Documentación del proyecto
│
├── assets/
│   └── logo.svg                 # Logo oficial vectorial de ANCLA
│
├── css/
│   └── styles.css               # Sistema de diseño, variables, paleta visual y componentes
│
├── views/                       # Vistas divididas e independientes por rol de usuario
│   ├── directivo.html           # Dashboard Directivo (KPIs, distribución de riesgo, simulador ROI)
│   ├── tutor.html               # Bandeja de Pre-Alertas (supervisión humana, filtros, padrón)
│   └── estudiante.html          # Portal del Estudiante (encuesta Typeform, materias, privacidad)
│
└── js/
    ├── shared.js                # Lógica compartida (navegación, selector de rol, modales, toasts)
    │
    ├── core/                    # Capa central de datos y motores de cálculo
    │   ├── data.js              # Semilla de datos estructurados y persistencia localStorage
    │   ├── rulesEngine.js       # Motor determinista de reglas por umbrales (HU05)
    │   ├── financialSimulator.js# Motor de cálculo financiero de retención y ROI (HU09, HU10)
    │   └── apiService.js        # Capa de servicio preparada para backend REST / Base de datos
    │
    └── modules/                 # Controladores específicos de cada dashboard
        ├── directivo.js         # Lógica interactiva del panel directivo y simulador
        ├── tutor.js             # Lógica interactiva de alertas y validación/descarte
        └── estudiante.js        # Lógica interactiva de la encuesta Typeform y consentimiento
```

---

## 🚀 ¿Cómo ejecutar el proyecto?

### Opción 1: Servidor Local (Recomendado para la presentación)
Puedes ejecutar el servidor localhost nativo de Node.js (no requiere instalar dependencias adicionales):

```bash
npm start
```
O directamente:
```bash
node server.js
```

El servidor quedará disponible en:
👉 **`http://localhost:3000`**

Rutas directas amigables:
* 📊 **Directivo:** `http://localhost:3000/directivo`
* 🛡️ **Tutor / Bienestar:** `http://localhost:3000/tutor`
* 🎓 **Estudiante:** `http://localhost:3000/estudiante`

### Opción 2: Sin servidor (Doble clic)
El proyecto también funciona abriendo directamente cualquier archivo `.html` en tu navegador (`index.html` o los archivos dentro de `views/`), ya que utiliza rutas relativas universales y almacenamiento en `localStorage`.

---

## 🔄 Conexión y Sincronización entre Dashboards

Los dashboards comparten un almacén de datos (`localStorage`). Los cambios se ven al navegar entre vistas y, con varias pestañas abiertas, se actualizan solos (evento `storage`). En modo `file://` algunos navegadores (p. ej. Firefox) aíslan el almacenamiento por archivo: para la demo usa `npm start`.

### Módulos integrados desde la rama Branch2A (pestañas del panel Directivo)
Se mantiene el flujo original de navegación (selector de rol + pestañas internas). El panel Directivo incluye: **Dashboard** (permanencia por programa y casos críticos), **Gestión Financiera & ROI** (HU09/HU10: costos y escenarios), **Padrón Académico & DB** (HU03: filtros y sincronización simulada), **Privacidad & Roles** (HU01/HU02: matriz de permisos aplicada por `ApiService` y auditoría) y **Arquitectura & BPMN**. El rol Administrador consta en la matriz, pero el prototipo no incluye una vista para él.

Pruebas de la lógica de negocio: `npm test`.

Detalle de la sincronización:
1. **Selector de Rol en el Sidebar:** En cualquier dashboard puedes usar el menú desplegable para cambiar entre Directivo, Tutor y Estudiante; la interfaz navegará automáticamente a la vista correspondiente.
2. **Sincronización de Datos:**
   * Si el **Tutor** valida o descarta una pre-alerta como "Falso Positivo" en su bandeja, al pasar a la vista de **Directivo** los KPIs y la distribución de riesgo se actualizan inmediatamente.
   * Si el **Estudiante** completa su encuesta de bienestar, el motor de reglas re-evalúa sus indicadores y las nuevas alertas se reflejan al instante en la bandeja del **Tutor**.
