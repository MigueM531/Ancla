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
for (const f of ["core/data.js", "core/surveyEngine.js", "core/rulesEngine.js", "core/financialSimulator.js", "core/apiService.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, "..", "js", f), "utf8"), ctx);
}
const { ANCLA_DATA, SurveyEngine, RulesEngine, FinancialSimulator, ApiService, getSavedData } = vm.runInContext("({ ANCLA_DATA, SurveyEngine, RulesEngine, FinancialSimulator, ApiService, getSavedData })", ctx);
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
  "el banco tiene 25+ preguntas válidas: 5 por sector, ids únicos, polaridad y 5 opciones"() {
    const bs = ANCLA_DATA.surveyBatteries;
    const qs = bs.flatMap((b) => b.questions);
    assert.ok(qs.length >= 20 && qs.length === bs.length * 5);
    assert.strictEqual(new Set(qs.map((q) => q.id)).size, qs.length);
    for (const q of qs) {
      assert.ok(["favorable", "adverse"].includes(q.polarity), q.id);
      assert.ok(q.coreDimension in SurveyEngine.HIGH_IS_BAD, q.id);
      assert.strictEqual(JSON.stringify(q.options.map((o) => o.value)), "[1,2,3,4,5]", q.id);
    }
    assert.deepStrictEqual(SurveyEngine.getRotationOrder().sort(), bs.map((b) => b.id).sort());
  },
  "la rotación avanza un sector por envío, nunca repite seguidos y cierra el ciclo"() {
    const st = { surveyRotation: null };
    const order = SurveyEngine.getRotationOrder();
    let prev = null;
    for (let i = 0; i < order.length * 2 + 1; i++) {
      const b = SurveyEngine.getNextBattery(st);
      assert.strictEqual(b.id, order[i % order.length]);
      assert.notStrictEqual(b.id, prev);
      const answers = Object.fromEntries(b.questions.map((q) => [q.id, 3]));
      SurveyEngine.recordCompletion(st, b, SurveyEngine.scoreBattery(b, answers), "2026-10-20");
      prev = b.id;
    }
    assert.strictEqual(SurveyEngine.getCycleProgress(st).completedCycles, 2);
  },
  "la puntuación respeta la polaridad (5 puede ser lo mejor o lo peor)"() {
    const acad = SurveyEngine.getBatteryById("sector_academic");
    const best = { acad_comprehension: 5, acad_workload: 1, acad_procrastination: 1, acad_exam_preparedness: 5, acad_concentration: 5 };
    const worst = { acad_comprehension: 1, acad_workload: 5, acad_procrastination: 5, acad_exam_preparedness: 1, acad_concentration: 1 };
    const b = SurveyEngine.scoreBattery(acad, best).dimensions;
    const w = SurveyEngine.scoreBattery(acad, worst).dimensions;
    assert.deepStrictEqual([b.academicLoad, b.stressLevel], [1, 1]);
    assert.deepStrictEqual([w.academicLoad, w.stressLevel], [5, 5]);
    // en dimensiones "alto = bueno" el sentido es el inverso
    const soc = SurveyEngine.getBatteryById("sector_social");
    const lo = SurveyEngine.scoreBattery(soc, Object.fromEntries(soc.questions.map((q) => [q.id, 1]))).dimensions;
    assert.strictEqual(lo.adaptationLevel, 1);
  },
  "un ítem en su extremo más desfavorable no se diluye en el promedio"() {
    const voc = SurveyEngine.getBatteryById("sector_vocational");
    const a = Object.fromEntries(voc.questions.map((q) => [q.id, 5]));
    a.mot_vocational_clarity = 1; // crisis vocacional; el resto, óptimo
    assert.ok(SurveyEngine.scoreBattery(voc, a).dimensions.emotionalWellbeing <= 2);
  },
  "validateAnswers detecta respuestas faltantes o fuera de rango"() {
    const b = SurveyEngine.getBatteryById("sector_social");
    assert.strictEqual(SurveyEngine.validateAnswers(b, { soc_belonging: 4 }).valid, false);
    const full = Object.fromEntries(b.questions.map((q) => [q.id, 4]));
    assert.strictEqual(SurveyEngine.validateAnswers(b, full).valid, true);
    assert.strictEqual(SurveyEngine.validateAnswers(b, { ...full, soc_belonging: 9 }).valid, false);
  },
  "el ítem de cuidado escala a Crítico con texto neutro y su alerta no se cierra sola"() {
    const emo = SurveyEngine.getBatteryById("sector_emotional");
    const ans = Object.fromEntries(emo.questions.map((q) => [q.id, q.polarity === "adverse" ? 1 : 5]));
    ans.emot_hopelessness = 1;
    const sc = SurveyEngine.scoreBattery(emo, ans);
    assert.strictEqual(sc.safetyFlag, true);
    const s = juan();
    s.attendanceRate = 95;
    s.preAlert = null;
    s.perceptions = { emotionalWellbeing: 5, stressLevel: 1, academicLoad: 1, adaptationLevel: 5, safetyFlag: true };
    const ev = RulesEngine.processPreAlert(s);
    assert.strictEqual(s.riskLevel, "Crítico");
    assert.strictEqual(s.preAlert.safety, true);
    assert.ok(!/da[ñn]o|suicid/i.test(ev.reason));
    s.perceptions.safetyFlag = false; // respuesta tranquilizadora posterior: no cierra la alerta sin revisión humana
    RulesEngine.processPreAlert(s);
    assert.strictEqual(s.preAlert.status, "Pendiente");
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
  async "enviar una encuesta puntúa, actualiza el motor de reglas y rota al sector siguiente"() {
    store.ancla_current_role = "estudiante";
    const id = "EST-2026-084";
    const first = SurveyEngine.getNextBattery(getSavedData().students.find((s) => s.id === id));
    assert.strictEqual(first.id, "sector_academic");
    const worst = Object.fromEntries(first.questions.map((q) => [q.id, q.polarity === "adverse" ? 5 : 1]));

    await assert.rejects(ApiService.submitPerceptions(id, { acad_workload: 5 }, first.id), /INCOMPLETE_SURVEY/);
    await assert.rejects(ApiService.submitPerceptions(id, worst, "sector_inexistente"), /BATTERY_NOT_FOUND/);

    const antes = getSavedData().auditLogs.length;
    const res = await ApiService.submitPerceptions(id, worst, first.id);
    assert.strictEqual(res.nextBattery.id, "sector_emotional");
    assert.strictEqual(res.safetyFlag, false);
    const st = getSavedData().students.find((s) => s.id === id);
    assert.ok(st.perceptions.stressLevel >= 4 && st.perceptions.academicLoad >= 4);
    assert.strictEqual(st.perceptions.emotionalWellbeing, 4); // sin tocar: conserva su último valor
    assert.ok(!("acad_workload" in st.perceptions)); // no se guardan respuestas individuales
    assert.strictEqual(st.riskLevel, "Medio"); // 91% de asistencia + estrés/carga en 5 = 25 pts (sin alerta formal)
    assert.strictEqual(getSavedData().auditLogs.length, antes + 1);
    assert.strictEqual(SurveyEngine.getNextBattery(st).id, "sector_emotional");
  },
  async "revocar el consentimiento borra percepciones y reinicia la rotación"() {
    store.ancla_current_role = "estudiante";
    await ApiService.submitPrivacyConsent("EST-2026-084", false);
    const st = getSavedData().students.find((s) => s.id === "EST-2026-084");
    assert.strictEqual(st.perceptions, null);
    assert.strictEqual(st.surveyRotation, null);
    await assert.rejects(ApiService.submitPerceptions("EST-2026-084", {}, "sector_academic"), /CONSENT_REQUIRED/);
    await ApiService.submitPrivacyConsent("EST-2026-084", true);
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
