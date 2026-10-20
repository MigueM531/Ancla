// Pruebas de la lógica de negocio (sin dependencias): npm test
const assert = require("assert");
const fs = require("fs");
const vm = require("vm");
const path = require("path");
const db = require("../db/client");

const store = {};
const ctx = vm.createContext({
  console,
  setTimeout,
  localStorage: { getItem: (k) => store[k] ?? null, setItem: (k, v) => (store[k] = v), removeItem: (k) => delete store[k] }
});
for (const f of ["core/data.js", "core/rulesEngine.js", "core/financialSimulator.js", "core/apiService.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx);
}
const { ANCLA_DATA, RulesEngine, FinancialSimulator, ApiService, getSavedData } = vm.runInContext("({ ANCLA_DATA, RulesEngine, FinancialSimulator, ApiService, getSavedData })", ctx);
const clone = (o) => JSON.parse(JSON.stringify(o));
const juan = () => clone(ANCLA_DATA.students.find((s) => s.name.startsWith("Juan")));

const tests = {
  "la semilla coincide con el motor de reglas"() {
    for (const s of ANCLA_DATA.students) assert.strictEqual(RulesEngine.evaluateStudent(s).riskLevel, s.riskLevel, s.name);
  },
  "un descarte no se revierte si los indicadores no cambian"() {
    const s = juan();
    s.preAlert.status = "Descartada";
    s.preAlert.dismissedSignature = RulesEngine.signature(RulesEngine.evaluateStudent(s));
    RulesEngine.processPreAlert(s);
    assert.strictEqual(s.preAlert.status, "Descartada");
    assert.strictEqual(s.riskLevel, "Crítico"); // el riesgo real no se oculta
  },
  "un descarte se reabre si los indicadores empeoran"() {
    const s = juan();
    s.preAlert.status = "Descartada";
    s.preAlert.dismissedSignature = "otra|huella";
    RulesEngine.processPreAlert(s);
    assert.strictEqual(s.preAlert.status, "Pendiente");
  },
  "una alerta pendiente se cierra si el estudiante se recupera"() {
    const s = juan();
    Object.assign(s, { attendanceRate: 95 });
    s.perceptions = { emotionalWellbeing: 5, stressLevel: 1, academicLoad: 1, adaptationLevel: 5 };
    RulesEngine.processPreAlert(s);
    assert.strictEqual(s.riskLevel, "Bajo");
    assert.strictEqual(s.preAlert.status, "Descartada");
  },
  "sin consentimiento (perceptions = null) el motor no falla"() {
    const s = juan();
    s.perceptions = null;
    assert.doesNotThrow(() => RulesEngine.processPreAlert(s));
  },
  "el simulador muestra beneficio neto negativo y costo N/D"() {
    const r = FinancialSimulator.calculateImpact({ totalStudents: 500, baselineDropoutRate: 5, semesterTuitionCOP: 3000000, interventionSuccessRate: 10, annualPlatformCostCOP: 80000000 });
    assert.ok(r.netEconomicBenefit < 0 && r.roiPercentage < 0);
    assert.strictEqual(FinancialSimulator.calculateImpact({ interventionSuccessRate: 0 }).costPerRetainedStudent, null);
  },
  "los costos del desglose suman la operación anual"() {
    const c = ANCLA_DATA.costBreakdown;
    assert.strictEqual(c.items.reduce((s, i) => s + i.annualCOP, 0), c.annualOperationalTotalCOP);
  },
  "la matriz de roles tiene claves únicas y el motor devuelve 'reason' (BPMN)"() {
    const keys = ANCLA_DATA.roleMatrix.map((r) => r.key);
    assert.ok(keys.every(Boolean) && new Set(keys).size === keys.length);
    const ev = RulesEngine.evaluateStudent({ attendanceRate: 74, perceptions: { stressLevel: 5, academicLoad: 5, emotionalWellbeing: 2, adaptationLevel: 2 } });
    assert.ok(typeof ev.reason === "string" && ev.reason.split(" • ").length > 1);
  }
};

const asyncTests = {
  async "un tutor valida alertas, un estudiante no, y queda auditado"() {
    store.ancla_current_role = "estudiante";
    await assert.rejects(ApiService.validatePreAlert("EST-2026-102", "PAL-001", "Validada", "x", "t"), /PERMISSION_DENIED/);
    store.ancla_current_role = "tutor";
    const antes = getSavedData().auditLogs.length;
    await ApiService.validatePreAlert("EST-2026-102", "PAL-001", "Descartada", "x", "t");
    assert.strictEqual(getSavedData().auditLogs.length, antes + 1);
  },
  async "sincronizar: solo con permiso y sin reabrir descartes"() {
    store.ancla_current_role = "tutor";
    await assert.rejects(ApiService.syncAcademicData(), /PERMISSION_DENIED/);
    store.ancla_current_role = "directivo";
    await ApiService.syncAcademicData();
    const juan = getSavedData().students.find((s) => s.id === "EST-2026-102");
    assert.strictEqual(juan.preAlert.status, "Descartada");
  },
  async "solo la persona titular cambia el consentimiento"() {
    store.ancla_current_role = "directivo";
    await assert.rejects(ApiService.submitPrivacyConsent("EST-2026-084", false), /PERMISSION_DENIED/);
  },
  async "el servicio de autenticación valida los 3 perfiles principales (Estudiante, Tutor, Directivo)"() {
    const est = await db.authenticateUser("aescobar@udemellin.edu.co", "Estudiante2026*");
    assert.strictEqual(est.role_code, "estudiante");
    assert.strictEqual(est.code, "EST-2026-084");

    const tut = await db.authenticateUser("cvalderrama@udemellin.edu.co", "Tutor2026*");
    assert.strictEqual(tut.role_code, "tutor");
    assert.strictEqual(tut.code, "TUT-104");

    const dir = await db.authenticateUser("rrestrepo@udemellin.edu.co", "Directivo2026*");
    assert.strictEqual(dir.role_code, "directivo");
    assert.strictEqual(dir.code, "DIR-002");
  },
  async "un login con contraseña errónea o usuario inexistente es rechazado"() {
    await assert.rejects(db.authenticateUser("aescobar@udemellin.edu.co", "clave_invalida"), /Credenciales inválidas/);
    await assert.rejects(db.authenticateUser("fantasma@udemellin.edu.co", "cualquiera"), /Credenciales inválidas/);
  }
};

(async () => {
  let fail = 0;
  const all = [...Object.entries(tests), ...Object.entries(asyncTests)];
  for (const [name, fn] of all) {
    try { await fn(); console.log("✓", name); } catch (e) { fail++; console.log("✗", name, "\n   ", e.message); }
  }
  process.exit(fail ? 1 : 0);
})();
