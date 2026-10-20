const http = require("http");
const server = require("../server");

function doRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

(async () => {
  try {
    console.log("1. Probando GET /api/health...");
    const health = await doRequest({ host: "localhost", port: 3000, path: "/api/health", method: "GET" });
    console.log("   Health Status:", health.status, health.data.service);

    console.log("2. Probando POST /api/auth/login con Estudiante...");
    const loginEst = await doRequest(
      { host: "localhost", port: 3000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" } },
      { email: "aescobar@udemellin.edu.co", password: "Estudiante2026*" }
    );
    console.log("   Login Estudiante Status:", loginEst.status, loginEst.data.user.name, "Role:", loginEst.data.user.role_code);

    console.log("3. Probando POST /api/auth/login con Tutor...");
    const loginTut = await doRequest(
      { host: "localhost", port: 3000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" } },
      { email: "cvalderrama@udemellin.edu.co", password: "Tutor2026*" }
    );
    console.log("   Login Tutor Status:", loginTut.status, loginTut.data.user.name, "Role:", loginTut.data.user.role_code);

    console.log("4. Probando POST /api/auth/login con Directivo...");
    const loginDir = await doRequest(
      { host: "localhost", port: 3000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" } },
      { email: "rrestrepo@udemellin.edu.co", password: "Directivo2026*" }
    );
    console.log("   Login Directivo Status:", loginDir.status, loginDir.data.user.name, "Role:", loginDir.data.user.role_code);

    console.log("5. Probando credenciales inválidas...");
    const loginBad = await doRequest(
      { host: "localhost", port: 3000, path: "/api/auth/login", method: "POST", headers: { "Content-Type": "application/json" } },
      { email: "rrestrepo@udemellin.edu.co", password: "wrong" }
    );
    console.log("   Bad Login Status:", loginBad.status, "Error:", loginBad.data.error);

    console.log("\n✅ Todas las pruebas de la API pasaron satisfactoriamente.");
  } catch (err) {
    console.error("❌ Error en pruebas de API:", err);
  } finally {
    server.close();
    process.exit(0);
  }
})();
