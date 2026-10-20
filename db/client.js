/**
-- ===================================================================
-- PROYECTO ANCLA - CLIENTE DE BASE DE DATOS (POSTGRESQL / NEON)
-- Facultad de Ingenierías - Universidad de Medellín
-- ===================================================================
*/

require("dotenv").config();
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");

// Fallback users para desarrollo local sin conexión a Neon
const LOCAL_FALLBACK_USERS = [
  {
    id: 1,
    code: "EST-2026-084",
    name: "Alejandra Escobar",
    email: "aescobar@udemellin.edu.co",
    password_hash: "$2b$10$e.Eb6SK9JKMLr/KbqQUerush4zieSz5CBWL6DUAN4curYXUTdxa.2", // Estudiante2026*
    role_code: "estudiante",
    role_label: "Estudiante",
    department: "Facultad de Ingenierías",
    program: "Ingeniería de Sistemas",
    semester: 2,
    avatar: "AE",
    privacy_consent_accepted: true,
    consent_date: "2026-02-10 08:30"
  },
  {
    id: 2,
    code: "TUT-104",
    name: "Dr. Carlos Valderrama",
    email: "cvalderrama@udemellin.edu.co",
    password_hash: "$2b$10$WlPxO/EYDxXsZIDurd9CYuf/3BwJ0mfjJ7i8QKBPQ5FZVyDeeRXUC", // Tutor2026*
    role_code: "tutor",
    role_label: "Tutor / Profesional de Bienestar",
    department: "Bienestar Universitario & Consejería",
    program: "Facultad de Ingenierías",
    semester: null,
    avatar: "CV",
    privacy_consent_accepted: true,
    consent_date: "2026-01-15 09:00"
  },
  {
    id: 3,
    code: "DIR-002",
    name: "Ing. Roberto Restrepo",
    email: "rrestrepo@udemellin.edu.co",
    password_hash: "$2b$10$chWo/MIijbcncqjz6t8UQOm8HDRkWX8g5OlV89Cni3Yh4W/XgUIF.", // Directivo2026*
    role_code: "directivo",
    role_label: "Directivo / Coordinador Académico",
    department: "Decanatura de Ingenierías",
    program: "Facultad de Ingenierías",
    semester: null,
    avatar: "RR",
    privacy_consent_accepted: true,
    consent_date: "2026-01-10 07:30"
  }
];

let pool = null;

function getPool() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.trim() === "") {
    return null;
  }
  if (!pool) {
    const isSsl = dbUrl.includes("sslmode=require") || dbUrl.includes("neon.tech");
    pool = new Pool({
      connectionString: dbUrl,
      ssl: isSsl ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on("error", (err) => {
      console.error("⚠️ Error inesperado en el Pool de Neon PostgreSQL:", err.message);
    });
  }
  return pool;
}

/**
 * Ejecuta una consulta SQL en Neon PostgreSQL (o en modo fallback)
 */
async function query(text, params = []) {
  const p = getPool();
  if (p) {
    return await p.query(text, params);
  }
  return null;
}

/**
 * Verifica si Neon está configurado y accesible
 */
async function testConnection() {
  const p = getPool();
  if (!p) {
    return {
      connected: false,
      provider: "Local Mock (DATABASE_URL no configurada en .env)",
      detail: "Configura DATABASE_URL con tu URI de Neon para activar PostgreSQL."
    };
  }
  try {
    const result = await p.query("SELECT current_database(), current_user, version();");
    return {
      connected: true,
      provider: "Neon Serverless PostgreSQL",
      database: result.rows[0].current_database,
      user: result.rows[0].current_user,
      version: result.rows[0].version
    };
  } catch (err) {
    return {
      connected: false,
      provider: "Error de Conexión a Neon",
      error: err.message
    };
  }
}

/**
 * Autentica un usuario por email y contraseña
 */
async function authenticateUser(email, password) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanPass = String(password || "").trim();

  if (!cleanEmail || !cleanPass) {
    throw new Error("Debe ingresar correo y contraseña.");
  }

  const p = getPool();

  if (p) {
    try {
      const res = await p.query(
        "SELECT id, code, name, email, password_hash, role_code, role_label, department, program, semester, avatar, privacy_consent_accepted, consent_date, is_active FROM users WHERE LOWER(email) = $1",
        [cleanEmail]
      );

      if (res.rows.length === 0) {
        throw new Error("Credenciales inválidas. Correo o contraseña incorrectos.");
      }

      const user = res.rows[0];
      if (!user.is_active) {
        throw new Error("La cuenta se encuentra inactiva. Contacte a la decanatura.");
      }

      const match = await bcrypt.compare(cleanPass, user.password_hash);
      if (!match) {
        throw new Error("Credenciales inválidas. Correo o contraseña incorrectos.");
      }

      // Devolvemos el usuario sin el hash de contraseña
      const { password_hash, ...safeUser } = user;
      return safeUser;
    } catch (err) {
      if (err.message.includes("Credenciales") || err.message.includes("inactiva")) {
        throw err;
      }
      console.warn("⚠️ Fallo en consulta a Neon, probando fallback local:", err.message);
    }
  }

  // Fallback a los usuarios locales
  const fallback = LOCAL_FALLBACK_USERS.find((u) => u.email.toLowerCase() === cleanEmail);
  if (!fallback) {
    throw new Error("Credenciales inválidas. Correo o contraseña incorrectos.");
  }

  const match = await bcrypt.compare(cleanPass, fallback.password_hash);
  if (!match) {
    throw new Error("Credenciales inválidas. Correo o contraseña incorrectos.");
  }

  const { password_hash, ...safeFallback } = fallback;
  return safeFallback;
}

/**
 * Obtiene un usuario por ID
 */
async function getUserById(id) {
  const p = getPool();
  if (p) {
    try {
      const res = await p.query(
        "SELECT id, code, name, email, role_code, role_label, department, program, semester, avatar, privacy_consent_accepted, consent_date FROM users WHERE id = $1",
        [id]
      );
      if (res.rows.length > 0) return res.rows[0];
    } catch (e) {
      console.warn("Error consultando usuario por ID:", e.message);
    }
  }
  const fallback = LOCAL_FALLBACK_USERS.find((u) => u.id === Number(id));
  if (fallback) {
    const { password_hash, ...u } = fallback;
    return u;
  }
  return null;
}

/**
 * Obtiene la lista de usuarios (para información administrativa)
 */
async function getAllUsers() {
  const p = getPool();
  if (p) {
    try {
      const res = await p.query(
        "SELECT id, code, name, email, role_code, role_label, department, program, semester, avatar, is_active FROM users ORDER BY id ASC"
      );
      return res.rows;
    } catch (e) {
      console.warn("Error consultando usuarios en Neon:", e.message);
    }
  }
  return LOCAL_FALLBACK_USERS.map(({ password_hash, ...u }) => u);
}

module.exports = {
  getPool,
  query,
  testConnection,
  authenticateUser,
  getUserById,
  getAllUsers,
  LOCAL_FALLBACK_USERS
};
