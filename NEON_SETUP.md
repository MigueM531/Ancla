# ⚓ ANCLA - Guía de Configuración de Base de Datos en Neon y Despliegue

Este documento explica cómo configurar la base de datos **PostgreSQL en Neon (neon.tech)**, subir la estructura completa con datos iniciales para los tres roles institucionales (**Estudiante**, **Tutor** y **Directivo**), y desplegar la aplicación completa.

---

## 📌 1. ¿Qué es Neon y cómo se conecta con ANCLA?

* **Neon (`https://neon.tech`)**: Es una plataforma de base de datos **PostgreSQL Serverless** en la nube. Neon gestiona el almacenamiento, copias de seguridad automáticas, ramificaciones (*branching*) y escalado automático.
* **Aplicación ANCLA**: Es un servidor Node.js que sirve la interfaz web y la API REST. Se conecta a Neon a través de la variable de entorno `DATABASE_URL` mediante el cliente nativo de PostgreSQL (`pg`) con soporte para SSL.

> [!NOTE]
> **Neon aloja la base de datos PostgreSQL**, mientras que el código de la aplicación Node.js se puede ejecutar localmente o desplegar en servicios en la nube gratuitos o de bajo costo como **Render**, **Railway**, **Koyeb** o **Vercel**, conectándose directamente a tu base de datos en Neon.

---

## 🚀 2. Paso a Paso: Crear la Base de Datos en Neon

1. **Crear cuenta en Neon**:
   * Ingresa a [https://neon.tech](https://neon.tech) y regístrate gratuitamente con tu cuenta de GitHub, Google o correo.

2. **Crear un nuevo proyecto**:
   * Haz clic en **"Create Project"** o **"New Project"**.
   * **Project name**: `ancla-db` (o el nombre que prefieras).
   * **Database name**: déjalo como `neondb` (por defecto).
   * **Region**: Selecciona la región más cercana (ej. `US East (Ohio / N. Virginia)`).
   * Haz clic en **"Create Project"**.

3. **Copiar la cadena de conexión (`DATABASE_URL`)**:
   * En el Dashboard de tu proyecto recién creado, verás la sección **Connection Details**.
   * Asegúrate de seleccionar **URI** y que la opción **Pooled connection** esté marcada (recomendada para Serverless) o sin pooler.
   * La cadena de conexión tiene este formato:
     ```
     postgresql://neondb_owner:TU_PASSWORD@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   * Copia esa URL completa.

4. **Pegar la URL en tu archivo `.env` local**:
   * Abre el archivo `.env` en la raíz del proyecto.
   * Pega tu URL en la variable `DATABASE_URL`:
     ```env
     PORT=3000
     NODE_ENV=development
     JWT_SECRET=ancla_udemellin_secret_key_2026_permanencia
     DATABASE_URL=postgresql://neondb_owner:TU_PASSWORD@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```

---

## 📦 3. Cómo Subir la Estructura y los Datos a Neon

Dispones de **dos métodos** sencillos:

### Opción A: Subida Automática con 1 Comando (Recomendada)

Desde la terminal del proyecto, ejecuta:

```bash
npm run db:setup
```

*El script leerá `db/schema.sql` y `db/seed.sql`, creará las 6 tablas, índices y los usuarios iniciales en Neon automáticamente, y te mostrará un resumen del conteo.*

Para verificar la conexión en cualquier momento:
```bash
npm run db:test
```

---

### Opción B: Subida Manual desde la Consola Web de Neon

Si prefieres ejecutar el SQL directamente en la web de Neon sin usar la terminal:

1. En el panel de control de Neon, en el menú lateral izquierdo, haz clic en **"SQL Editor"**.
2. Abre en tu editor el archivo [`db/schema.sql`](file:///c:/Users/Cristian%20Toro/Documents/Universidad%20de%20Medellín/26-2/Proyecto%20de%20Ingeniería%20I/Proyecto/Ancla/db/schema.sql), copia todo el contenido, pégalo en el SQL Editor de Neon y presiona **"Run"**.
3. Abre el archivo [`db/seed.sql`](file:///c:/Users/Cristian%20Toro/Documents/Universidad%20de%20Medellín/26-2/Proyecto%20de%20Ingeniería%20I/Proyecto/Ancla/db/seed.sql), copia el contenido, pégalo en el SQL Editor de Neon y presiona **"Run"**.
4. ¡Listo! En la pestaña **"Tables"** de Neon verás las tablas `roles`, `users`, `students`, `wellness_perceptions`, `pre_alerts` y `audit_logs`.

---

## 👥 4. Credenciales de Acceso para los Tres Perfiles Principales

Los tres usuarios están registrados en la base de datos con contraseñas hasheadas mediante **Bcrypt** (10 rondas de salting):

| Rol Institucional | Nombre Completo | Correo Institucional | Contraseña | Vista Asignada |
| :--- | :--- | :--- | :--- | :--- |
| **Estudiante** | Alejandra Escobar | `aescobar@udemellin.edu.co` | `Estudiante2026*` | `views/estudiante.html` |
| **Tutor / Bienestar** | Dr. Carlos Valderrama | `cvalderrama@udemellin.edu.co` | `Tutor2026*` | `views/tutor.html` |
| **Directivo / Coordinador** | Ing. Roberto Restrepo | `rrestrepo@udemellin.edu.co` | `Directivo2026*` | `views/directivo.html` |

> [!TIP]
> En la pantalla de inicio de sesión (`index.html`) se incluyó una sección de **"Acceso Rápido por Perfil (1 Clic)"**. Al pulsar cualquiera de los tres botones demo, el sistema completa los campos y autentica de inmediato contra la base de datos.

---

## 🌐 5. Cómo Desplegar la Aplicación Completa en Producción

El proyecto ya incluye los archivos de configuración listos para producción:
* `render.yaml`: Despliegue en 1 clic en Render.
* `Procfile`: Para plataformas PaaS estándar (Railway, Heroku, Dokku).
* `Dockerfile`: Para contenedores Docker en cualquier nube (Fly.io, Koyeb, AWS).

### Opción 1: Despliegue en Render (Recomendado y Gratuito)

1. Sube tu proyecto a un repositorio en **GitHub** o **GitLab**.
2. Entra a [https://render.com](https://render.com) y crea una cuenta.
3. Haz clic en **"New"** -> **"Web Service"**.
4. Conecta tu repositorio de GitHub.
5. Configuración:
   * **Name**: `ancla-udemellin`
   * **Runtime**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
6. En la sección **"Environment Variables"**, añade:
   * `NODE_ENV`: `production`
   * `JWT_SECRET`: (escribe una frase secreta segura)
   * `DATABASE_URL`: (pega tu cadena de conexión de Neon obtenida en el Paso 2)
7. Haz clic en **"Create Web Service"**.
8. En 2 minutos tendrás tu URL pública (ejemplo: `https://ancla-udemellin.onrender.com`) funcionando en la nube y conectada en tiempo real a Neon.

---

### Opción 2: Despliegue en Railway

1. Entra a [https://railway.app](https://railway.app).
2. Haz clic en **"New Project"** -> **"Deploy from GitHub repo"**.
3. Selecciona el repositorio de ANCLA.
4. En **Variables**, añade `DATABASE_URL` con tu URI de Neon.
5. Railway detectará automáticamente el archivo `Procfile` y desplegará la aplicación.

---

## 🧪 6. Ejecución y Pruebas Locales

Para iniciar la aplicación localmente:
```bash
npm start
```
Luego abre tu navegador en:
* **Pantalla de Inicio de Sesión**: [http://localhost:3000](http://localhost:3000)
* **Panel Directivo**: [http://localhost:3000/directivo](http://localhost:3000/directivo)
* **Bandeja Tutor**: [http://localhost:3000/tutor](http://localhost:3000/tutor)
* **Portal Estudiante**: [http://localhost:3000/estudiante](http://localhost:3000/estudiante)

Para correr la suite de pruebas unitarias y de API:
```bash
npm test
```
