/**
 * ANCLA - Servidor Local de Desarrollo (Zero-Dependencies)
 * Universidad de Medellín - Facultad de Ingenierías
 * 
 * Permite levantar el proyecto en http://localhost:3000 con soporte completo
 * de rutas limpias, tipos MIME y conexión entre dashboards sin necesidad
 * de librerías externas o comandos complejos.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const url = require("url");

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

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

// Rutas amigables para navegación directa
const ROUTE_ALIASES = {
  "/": "/index.html",
  "/directivo": "/views/directivo.html",
  "/tutor": "/views/tutor.html",
  "/estudiante": "/views/estudiante.html"
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // Aplicar alias de rutas si existe
  if (ROUTE_ALIASES[pathname]) {
    pathname = ROUTE_ALIASES[pathname];
  }

  // Prevenir ataques de Directory Traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, "");
  let filePath = path.join(ROOT_DIR, safePath);

  // Si es un directorio, buscar index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, "index.html");
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>404 - No Encontrado | ANCLA</title>
          <style>
            body { font-family: sans-serif; background: #0f1117; color: #f0f2f8; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; margin:0; }
            h1 { color: #e63946; margin-bottom: 8px; }
            a { color: #55efc4; text-decoration:none; margin-top: 16px; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>404 • Recurso no encontrado</h1>
          <p>La ruta <code>${pathname}</code> no existe en el proyecto.</p>
          <a href="/">← Volver al inicio de ANCLA</a>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-cache, no-store, must-revalidate"
    });

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log("\n========================================================");
  console.log(" ⚓ ANCLA - Sistema de Monitoreo y Permanencia");
  console.log(" Facultad de Ingenierías • Universidad de Medellín");
  console.log("========================================================");
  console.log(` Servidor localhost iniciado con éxito en:`);
  console.log(` 👉 http://localhost:${PORT}`);
  console.log("========================================================");
  console.log(" Vistas directas:");
  console.log(` • Directivo:  http://localhost:${PORT}/directivo`);
  console.log(` • Tutor:      http://localhost:${PORT}/tutor`);
  console.log(` • Estudiante: http://localhost:${PORT}/estudiante`);
  console.log("========================================================\n");
});
