/**
 * ANCLA - Servidor Local de Desarrollo (Zero-Dependencies)
 * Universidad de Medellín - Facultad de Ingenierías
 *
 * Sirve únicamente index.html y las carpetas css/, js/, views/ y assets/.
 * No expone server.js, package.json, .git ni archivos ocultos.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
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
  "/directivo": "/views/directivo.html",
  "/tutor": "/views/tutor.html",
  "/estudiante": "/views/estudiante.html"
};

const escapeHtml = (v) =>
  String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function send(res, code, body, type = "text/html; charset=utf-8") {
  res.writeHead(code, { "Content-Type": type, "X-Content-Type-Options": "nosniff" });
  res.end(body);
}

function notFound(res, pathname) {
  send(res, 404, `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>404 - No Encontrado | ANCLA</title>
<style>
  body { font-family: sans-serif; background: #0f1117; color: #f0f2f8; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; }
  h1 { color: #e63946; margin-bottom: 8px; }
  a { color: #55efc4; text-decoration:none; margin-top: 16px; font-weight: bold; }
</style></head>
<body>
  <h1>404 • Recurso no encontrado</h1>
  <p>La ruta <code>${escapeHtml(pathname)}</code> no existe en el proyecto.</p>
  <a href="/">← Volver al inicio de ANCLA</a>
</body></html>`);
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  } catch (e) {
    return send(res, 400, "400 - Solicitud inválida", "text/plain; charset=utf-8");
  }
  if (pathname.includes("\0")) return send(res, 400, "400 - Solicitud inválida", "text/plain; charset=utf-8");

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

server.listen(PORT, () => {
  console.log("\n⚓ ANCLA - Sistema de Monitoreo y Permanencia");
  console.log(`👉 http://localhost:${PORT}`);
  console.log(`   /directivo  /tutor  /estudiante\n`);
});
