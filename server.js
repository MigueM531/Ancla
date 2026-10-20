/**
 * ANCLA - Servidor Web y API REST
 * Universidad de Medellín - Facultad de Ingenierías
 * Sistema de Monitoreo Temprano y Permanencia Estudiantil
 * 
 * Conexión integrada a PostgreSQL Serverless en Neon
 */

require("dotenv").config();
const http = require("http");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const db = require("./db/client");

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "ancla_udemellin_secret_key_2026_permanencia";
const ROOT_DIR = __dirname;
const PUBLIC_DIRS = ["css", "js", "views", "assets"];

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf"
};

const ROUTE_ALIASES = {
  "/": "/index.html",
  "/login": "/index.html",
  "/directivo": "/views/directivo.html",
  "/tutor": "/views/tutor.html",
  "/estudiante": "/views/estudiante.html"
};

const escapeHtml = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function send(res, code, body, type = "text/html; charset=utf-8") {
  res.writeHead(code, {
    "Content-Type": type,
    "X-Content-Type-Options": "nosniff"
  });
  res.end(body);
}

function sendJson(res, code, data) {
  send(res, code, JSON.stringify(data), "application/json; charset=utf-8");
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error("Carga demasiado grande"));
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(new Error("JSON con formato inválido"));
      }
    });
    req.on("error", reject);
  });
}

function verifyAuthToken(req) {
  const authHeader = req.headers["authorization"] || "";
  const match = authHeader.match(/^Bearer\s+(.*)$/i);
  if (!match) return null;
  try {
    return jwt.verify(match[1], JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function notFound(res, pathname) {
  send(
    res,
    404,
    `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>404 - No Encontrado | ANCLA</title>
<style>
  body { font-family: sans-serif; background: #0f1117; color: #f0f2f8; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; }
  h1 { color: #e63946; margin-bottom: 8px; }
  a { color: #ff5e57; text-decoration:none; margin-top: 16px; font-weight: bold; }
</style></head>
<body>
  <h1>404 • Recurso no encontrado</h1>
  <p>La ruta <code>${escapeHtml(pathname)}</code> no existe en el sistema ANCLA.</p>
  <a href="/">← Volver al inicio de sesión</a>
</body></html>`
  );
}

const server = http.createServer(async (req, res) => {
  // CORS Headers para despliegues desacoplados o desarrollo
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return send(res, 400, "400 - Solicitud inválida", "text/plain; charset=utf-8");
  }
  if (pathname.includes("\0")) return send(res, 400, "400 - Solicitud inválida", "text/plain; charset=utf-8");

  // ===================================================================
  // ENDPOINTS DE LA API REST (/api/...)
  // ===================================================================

  // 1. Verificación de salud y estado de Neon PostgreSQL
  if (pathname === "/api/health" && req.method === "GET") {
    const dbStatus = await db.testConnection();
    return sendJson(res, 200, {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "ANCLA - Backend de Permanencia Estudiantil",
      university: "Universidad de Medellín",
      database: dbStatus
    });
  }

  // 2. Inicio de Sesión (Login)
  if (pathname === "/api/auth/login" && req.method === "POST") {
    try {
      const payload = await parseJsonBody(req);
      const user = await db.authenticateUser(payload.email, payload.password);

      const token = jwt.sign(
        {
          id: user.id,
          code: user.code,
          email: user.email,
          role: user.role_code,
          name: user.name
        },
        JWT_SECRET,
        { expiresIn: "8h" }
      );

      return sendJson(res, 200, {
        success: true,
        message: "Autenticación exitosa",
        token,
        user
      });
    } catch (err) {
      return sendJson(res, 401, {
        success: false,
        error: err.message || "Error al autenticar"
      });
    }
  }

  // 3. Usuario en Sesión (Me)
  if (pathname === "/api/auth/me" && req.method === "GET") {
    const decoded = verifyAuthToken(req);
    if (!decoded) {
      return sendJson(res, 401, { success: false, error: "No autenticado o token vencido" });
    }
    const user = await db.getUserById(decoded.id);
    if (!user) {
      return sendJson(res, 404, { success: false, error: "Usuario no encontrado" });
    }
    return sendJson(res, 200, { success: true, user });
  }

  // 4. Cierre de Sesión (Logout)
  if (pathname === "/api/auth/logout" && req.method === "POST") {
    return sendJson(res, 200, { success: true, message: "Sesión cerrada correctamente" });
  }

  // 5. Lista de Usuarios
  if (pathname === "/api/users" && req.method === "GET") {
    try {
      const users = await db.getAllUsers();
      return sendJson(res, 200, { success: true, users });
    } catch (e) {
      return sendJson(res, 500, { success: false, error: e.message });
    }
  }

  // ===================================================================
  // SERVIDO DE ARCHIVOS ESTÁTICOS Y ENRUTAMIENTO DE VISTAS
  // ===================================================================

  if (ROUTE_ALIASES[pathname]) pathname = ROUTE_ALIASES[pathname];

  const rel = path.posix.normalize(pathname).replace(/^\/+/, "");
  const segments = rel.split("/");
  const allowed = rel === "index.html" || PUBLIC_DIRS.includes(segments[0]);
  const filePath = path.join(ROOT_DIR, rel);

  if (!allowed || segments.some((s) => s.startsWith(".")) || !filePath.startsWith(ROOT_DIR + path.sep)) {
    return notFound(res, pathname);
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) return notFound(res, pathname);

    const contentType = MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream";
    const stream = fs.createReadStream(filePath);
    stream.on("error", () => {
      if (!res.headersSent) send(res, 500, "500 - Error interno", "text/plain; charset=utf-8");
      else res.destroy();
    });
    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff"
    });
    stream.pipe(res);
  });
});

server.listen(PORT, async () => {
  console.log("\n========================================================");
  console.log("⚓ ANCLA - Sistema de Monitoreo y Permanencia Estudiantil");
  console.log("   Facultad de Ingenierías • Universidad de Medellín");
  console.log("========================================================");
  console.log(`🚀 Servidor activo en: http://localhost:${PORT}`);
  console.log(`🔐 Inicio de sesión:  http://localhost:${PORT}/login`);
  console.log(`📊 Panel Directivo:   http://localhost:${PORT}/directivo`);
  console.log(`🛡️  Bandeja Tutor:     http://localhost:${PORT}/tutor`);
  console.log(`🎓 Portal Estudiante: http://localhost:${PORT}/estudiante`);

  const dbStatus = await db.testConnection();
  if (dbStatus.connected) {
    console.log(`🟢 Base de datos:     ${dbStatus.provider} (${dbStatus.database})`);
  } else {
    console.log(`🟡 Base de datos:     ${dbStatus.provider}`);
  }
  console.log("========================================================\n");
});

module.exports = server;
