# ANCLA
### Sistema de Monitoreo Temprano, Análisis y Alerta para la Permanencia Estudiantil
**Proyecto de Ingeniería I (2026-2) — Proyecto # 5**  
**Facultad de Ingenierías, Universidad de Medellín**

---

## Integrantes y Docente
* **Integrantes:**
  * Alejandra Escobar Chavarriaga
  * Miguel Ángel Martínez Tamayo
  * Juan José Martínez Acosta
  * Cristian David Toro Arboleda
* **Profesora:** Duby Sulay Castellano Cárdenas

---

## Arquitectura Modular del Proyecto

El proyecto está organizado de manera modular y escalable, dividiendo las vistas, la lógica de negocio, los servicios de autenticación y la capa de datos en PostgreSQL (Neon):

```
Ancla/
│
├── index.html                   # Pantalla de inicio de sesión institucional integrada con BD
├── server.js                    # Servidor Node.js con API REST y conexión a Neon PostgreSQL
├── package.json                 # Scripts de inicio, pruebas y migración de BD
├── NEON_SETUP.md                # Guía paso a paso para Neon DB y despliegue en la nube
├── render.yaml / Procfile       # Configuraciones de despliegue en Render y Railway
├── Dockerfile / .dockerignore   # Configuración de despliegue en contenedores Docker
│
├── db/                          # Capa de Base de Datos PostgreSQL (Neon)
│   ├── client.js                # Cliente de conexión con Pool, SSL y fallback local
│   ├── init.js                  # Script de migración y aprovisionamiento automático
│   ├── schema.sql               # Esquema DDL (roles, users, students, pre_alerts, etc.)
│   └── seed.sql                 # Datos semilla con usuarios de los 3 roles y contraseñas hasheadas
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
    ├── shared.js                # Lógica compartida (sesión activa, cierre de sesión, navegación)
    │
    ├── core/                    # Capa central de datos y motores de cálculo
    │   ├── data.js              # Semilla de datos estructurados y persistencia
    │   ├── surveyEngine.js      # Rotación de sectores de la encuesta y puntuación por dimensión (HU04)
    │   ├── rulesEngine.js       # Motor determinista de reglas por umbrales (HU05)
    │   ├── financialSimulator.js# Motor de cálculo financiero de retención y ROI (HU09, HU10)
    │   └── apiService.js        # Servicio API con endpoints de login/logout y transacciones
    │
    └── modules/                 # Controladores específicos de cada dashboard
        ├── directivo.js         # Lógica interactiva del panel directivo y simulador
        ├── tutor.js             # Lógica interactiva de alertas y validación/descarte
        └── estudiante.js        # Lógica interactiva de la encuesta Typeform y consentimiento
```

---

## 👥 Usuarios y Credenciales Demo

El sistema cuenta con tres perfiles principales registrados en la base de datos:

| Rol Institucional | Nombre | Correo Institucional | Contraseña |
| :--- | :--- | :--- | :--- |
| **Estudiante** | Alejandra Escobar | `aescobar@udemellin.edu.co` | `Estudiante2026*` |
| **Tutor / Bienestar** | Dr. Carlos Valderrama | `cvalderrama@udemellin.edu.co` | `Tutor2026*` |
| **Directivo / Coordinador** | Ing. Roberto Restrepo | `rrestrepo@udemellin.edu.co` | `Directivo2026*` |

*En la pantalla de inicio de sesión (`index.html`) se dispone de botones de 1 clic para autenticar con cualquiera de los tres perfiles.*

---

## ¿Cómo ejecutar el proyecto localmente?

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Iniciar el servidor:
   ```bash
   npm start
   ```
3. Abrir en el navegador:
   * **Inicio de Sesión:** [http://localhost:3000](http://localhost:3000)
   * **Directivo:** [http://localhost:3000/directivo](http://localhost:3000/directivo)
   * **Tutor:** [http://localhost:3000/tutor](http://localhost:3000/tutor)
   * **Estudiante:** [http://localhost:3000/estudiante](http://localhost:3000/estudiante)

---

## 🐘 Conexión con Neon PostgreSQL

Para conectar la base de datos Serverless en Neon:

1. Obtén tu cadena de conexión en [https://neon.tech](https://neon.tech).
2. Pégala en el archivo `.env`:
   ```env
   DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Ejecuta la migración automática:
   ```bash
   npm run db:setup
   ```
4. Comprueba la conexión:
   ```bash
   npm run db:test
   ```

*Para más detalles y opciones de despliegue en la nube (Render, Railway, Docker), consulta la guía detallada en [NEON_SETUP.md](file:///c:/Users/Cristian%20Toro/Documents/Universidad%20de%20Medellín/26-2/Proyecto%20de%20Ingeniería%20I/Proyecto/Ancla/NEON_SETUP.md).*

---

## 🔄 Encuesta de bienestar rotativa (HU04)

El banco tiene **25 preguntas en 5 sectores de 5** (ver [`docs/BANCO_PREGUNTAS.md`](docs/BANCO_PREGUNTAS.md)). Cuando un estudiante envía una batería, la siguiente encuesta cambia de inmediato al sector siguiente: Académico → Emocional → Social → Vocacional → Hábitos de vida → (reinicia). El orden se configura en `ANCLA_DATA.surveyRotation.order` (`js/core/data.js`).

* Cada pregunta declara su `polarity` (`favorable`: 5 = mejor, `adverse`: 5 = peor) y la dimensión que alimenta en el motor de reglas.
* Solo se guardan puntajes agregados por dimensión, no respuestas individuales; al revocar el consentimiento se borran junto con el historial de rotación.
* El ítem de cuidado (`emot_hopelessness`) genera una alerta Crítica con texto neutro y muestra al estudiante un mensaje de apoyo. **Ajusta `ANCLA_DATA.supportResources` con las líneas oficiales de la institución.**

---

## 🧪 Pruebas Unitarias y de API

Para correr la suite completa de pruebas:
```bash
npm test
```
