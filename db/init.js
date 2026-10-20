/**
 * PROYECTO ANCLA - Script de Inicialización y Migración a Neon PostgreSQL
 * Facultad de Ingenierías - Universidad de Medellín
 * 
 * Uso:
 *   npm run db:setup
 *   o: node db/init.js "postgresql://user:pass@ep-xyz.neon.tech/neondb?sslmode=require"
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

async function main() {
  const dbUrl = process.argv[2] || process.env.DATABASE_URL;

  console.log("\n==========================================================");
  console.log("⚓ ANCLA - Inicializador de Base de Datos PostgreSQL (Neon)");
  console.log("   Universidad de Medellín - Facultad de Ingenierías");
  console.log("==========================================================\n");

  if (!dbUrl || dbUrl.trim() === "") {
    console.error("❌ ERROR: No se ha detectado la URL de conexión de Neon.");
    console.error("   Debes configurar DATABASE_URL en el archivo .env");
    console.error("   O ejecutar: node db/init.js \"tu_cadena_de_conexion_neon\"\n");
    console.log("ℹ️  Pasos para obtener tu URL de Neon:");
    console.log("   1. Ingresa a https://neon.tech y crea un proyecto gratuito (ej. 'ancla-db').");
    console.log("   2. En el Dashboard, copia la 'Connection string' (URI con opción psql o pooled).");
    console.log("   3. Pégala en tu archivo .env en la variable DATABASE_URL.\n");
    process.exit(1);
  }

  const isSsl = dbUrl.includes("sslmode=require") || dbUrl.includes("neon.tech");
  const client = new Client({
    connectionString: dbUrl,
    ssl: isSsl ? { rejectUnauthorized: false } : false
  });

  try {
    console.log("📡 Conectando a Neon Serverless PostgreSQL...");
    await client.connect();
    console.log("✅ Conexión establecida exitosamente con Neon.");

    // 1. Ejecutar Schema DDL
    const schemaPath = path.join(__dirname, "schema.sql");
    console.log(`📄 Leyendo esquema DDL desde: ${schemaPath}`);
    const schemaSql = fs.readFileSync(schemaPath, "utf-8");
    console.log("⚙️  Creando tablas (roles, users, students, pre_alerts, audit_logs)...");
    await client.query(schemaSql);
    console.log("✅ Tablas e índices creados correctamente en Neon.");

    // 2. Ejecutar Seeds DML
    const seedPath = path.join(__dirname, "seed.sql");
    console.log(`🌱 Leyendo datos semilla desde: ${seedPath}`);
    const seedSql = fs.readFileSync(seedPath, "utf-8");
    console.log("⚙️  Insertando roles institucionales y usuarios demo...");
    await client.query(seedSql);
    console.log("✅ Datos semilla insertados exitosamente.");

    // 3. Verificación
    const usersCount = await client.query("SELECT COUNT(*) FROM users;");
    const rolesCount = await client.query("SELECT COUNT(*) FROM roles;");
    const studentsCount = await client.query("SELECT COUNT(*) FROM students;");

    console.log("\n----------------------------------------------------------");
    console.log("📊 RESUMEN DE LA BASE DE DATOS EN NEON:");
    console.log(`   - Roles registrados:        ${rolesCount.rows[0].count}`);
    console.log(`   - Usuarios con credenciales: ${usersCount.rows[0].count}`);
    console.log(`   - Estudiantes monitoreados:  ${studentsCount.rows[0].count}`);
    console.log("----------------------------------------------------------");
    console.log("\n👥 USUARIOS HABILITADOS PARA LOGIN:");
    console.log("   1. Estudiante:  aescobar@udemellin.edu.co    / Estudiante2026*");
    console.log("   2. Tutor:       cvalderrama@udemellin.edu.co  / Tutor2026*");
    console.log("   3. Directivo:   rrestrepo@udemellin.edu.co    / Directivo2026*");
    console.log("\n🎉 ¡Tu base de datos en Neon está 100% lista para producción!\n");

  } catch (err) {
    console.error("\n❌ Error durante la inicialización de la base de datos:");
    console.error(err.message);
    if (err.detail) console.error("Detalle:", err.detail);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
