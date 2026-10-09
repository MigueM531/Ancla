/**
 * ANCLA - Capa de Servicio API (Preparada para Conexión Backend / REST / Base de Datos)
 * Arquitectura Monolítica Modular de Tres Capas - Capa de Presentación
 * 
 * En este prototipo, las llamadas simulan peticiones asíncronas con retardo controlado
 * y leen/escriben en el estado local persistido (localStorage).
 * Para conectar el backend real, únicamente se descomentan las llamadas `fetch(BASE_URL + ...)`.
 */

const ApiService = {
  // Configuración de endpoint para cuando se monte el backend (Node.js / Python / Spring / etc.)
  BASE_URL: "http://localhost:3000/api/v1", // <-- Cambiar por la URL del servidor en producción
  SIMULATED_DELAY_MS: 300,

  /**
   * Helper para simular latencia de red
   */
  _simulateLatency() {
    return new Promise(resolve => setTimeout(resolve, this.SIMULATED_DELAY_MS));
  },

  /**
   * HU01: Obtener y registrar consentimiento informado de privacidad
   */
  async submitPrivacyConsent(studentId, accepted) {
    await this._simulateLatency();
    /* Conexión API real:
    const res = await fetch(`${this.BASE_URL}/privacy/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, accepted, date: new Date().toISOString() })
    });
    return await res.json();
    */
    const state = getSavedData();
    if (state.users.student.id === studentId) {
      state.users.student.privacyConsentAccepted = accepted;
      state.users.student.consentDate = new Date().toISOString().replace("T", " ").substring(0, 16);
      if (!accepted) {
        // Revocar implica dejar de conservar datos emocionales y recalcular solo con datos académicos
        const st = state.students.find(s => s.id === studentId);
        if (st) { st.perceptions = null; RulesEngine.processPreAlert(st); }
      }
      persistData(state);
    }
    return { success: true, accepted };
  },

  /**
   * HU04: Ingesta de datos perceptuales / Encuesta Typeform de Bienestar
   */
  async submitPerceptions(studentId, perceptionsData) {
    await this._simulateLatency();
    /* Conexión API real:
    const res = await fetch(`${this.BASE_URL}/students/${studentId}/perceptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perceptionsData)
    });
    return await res.json();
    */
    const state = getSavedData();
    if (state.users.student.id === studentId && !state.users.student.privacyConsentAccepted) {
      throw new Error("CONSENT_REQUIRED");
    }
    const student = state.students.find(s => s.id === studentId);
    if (student) {
      student.perceptions = {
        ...student.perceptions,
        ...perceptionsData,
        lastSurveyDate: new Date().toISOString().split("T")[0]
      };
      // Ejecución determinista del motor de reglas ante nuevos datos
      RulesEngine.processPreAlert(student);
      persistData(state);
      return { success: true, student };
    }
    throw new Error("Estudiante no encontrado");
  },

  /**
   * HU03 & HU07: Obtener lista de estudiantes con indicadores
   */
  async getStudents(filters = {}) {
    await this._simulateLatency();
    /* Conexión API real:
    const res = await fetch(`${this.BASE_URL}/students?risk=${filters.risk || ''}`);
    return await res.json();
    */
    const state = getSavedData();
    let list = [...state.students];
    if (filters.risk && filters.risk !== "all") {
      list = list.filter(s => s.riskLevel.toLowerCase() === filters.risk.toLowerCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.program.toLowerCase().includes(q));
    }
    return list;
  },

  /**
   * HU06: Validación humana obligatoria de una Pre-Alerta por un tutor
   */
  async validatePreAlert(studentId, alertId, decision, tutorNotes, tutorName) {
    await this._simulateLatency();
    /* Conexión API real:
    const res = await fetch(`${this.BASE_URL}/alerts/${alertId}/validate`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, tutorNotes, tutorName })
    });
    return await res.json();
    */
    const state = getSavedData();
    const student = state.students.find(s => s.id === studentId);
    if (student && student.preAlert) {
      const pa = student.preAlert;
      if (pa.status !== "Pendiente") throw new Error("Alerta ya resuelta");
      pa.status = decision; // "Validada" o "Descartada"
      pa.tutorNotes = tutorNotes;
      pa.validatedBy = tutorName;
      pa.validationDate = new Date().toISOString().replace("T", " ").substring(0, 16);
      if (decision === "Descartada") {
        // Se registra la huella: no se regenera mientras los indicadores no cambien.
        // El nivel de riesgo real NO se modifica.
        pa.dismissedSignature = RulesEngine.signature(RulesEngine.evaluateStudent(student));
      }
      (pa.history = pa.history || []).push({ date: pa.validationDate, status: decision, by: tutorName, notes: tutorNotes });
      persistData(state);
      return { success: true, student };
    }
    throw new Error("Alerta no encontrada");
  },

  /**
   * HU07: Métricas para el Dashboard directivo
   */
  async getDashboardSummary() {
    await this._simulateLatency();
    /* Conexión API real:
    const res = await fetch(`${this.BASE_URL}/dashboard/summary`);
    return await res.json();
    */
    const state = getSavedData();
    const students = state.students;
    const totalMonitored = students.length;

    const atRisk = students.filter(s => s.riskLevel === "Alto" || s.riskLevel === "Crítico").length;
    const pendingPreAlerts = students.filter(s => s.preAlert && s.preAlert.status === "Pendiente").length;
    const validatedAlerts = students.filter(s => s.preAlert && s.preAlert.status === "Validada").length;
    const avgAttendance = Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / (totalMonitored || 1));
    const avgGPA = (students.reduce((acc, s) => acc + s.averageGrade, 0) / (totalMonitored || 1)).toFixed(2);

    return {
      totalMonitored,
      studentsAtRisk: atRisk,
      pendingPreAlerts,
      validatedAlerts,
      avgAttendance,
      avgGPA,
      riskDistribution: {
        bajo: students.filter(s => s.riskLevel === "Bajo").length,
        medio: students.filter(s => s.riskLevel === "Medio").length,
        alto: students.filter(s => s.riskLevel === "Alto").length,
        critico: students.filter(s => s.riskLevel === "Crítico").length
      }
    };
  },

  // ---- HU02: permisos por rol y trazabilidad (la matriz de roles ahora se APLICA) ----
  _currentRole() { return localStorage.getItem("ancla_current_role"); },

  _assertPermission(key) {
    const matrix = getSavedData().roleMatrix || ANCLA_DATA.roleMatrix;
    const row = matrix.find((r) => r.key === key);
    if (row && row[this._currentRole()] !== true) throw new Error("PERMISSION_DENIED");
  },

  _audit(state, action) {
    const map = { directivo: "executive", tutor: "tutor", estudiante: "student", admin: "admin" };
    const user = state.users[map[this._currentRole()]];
    if (!state.auditLogs) state.auditLogs = JSON.parse(JSON.stringify(ANCLA_DATA.auditLogs));
    state.auditLogs.unshift({
      date: new Date().toISOString().replace("T", " ").substring(0, 16),
      user: user ? user.name : "Desconocido",
      action,
      ip: "N/D (prototipo)"
    });
    state.auditLogs.length = Math.min(state.auditLogs.length, 100);
  },

  async getFinancialCosts() { await this._simulateLatency(); return getSavedData().costBreakdown || ANCLA_DATA.costBreakdown; },
  async getFinancialScenarios() { await this._simulateLatency(); return getSavedData().financialScenarios || ANCLA_DATA.financialScenarios; },
  async getRoleMatrix() { await this._simulateLatency(); return getSavedData().roleMatrix || ANCLA_DATA.roleMatrix; },
  async getAuditLogs() { await this._simulateLatency(); return getSavedData().auditLogs || ANCLA_DATA.auditLogs; },

  /**
   * HU03: sincronización institucional (SIMULADA): reevalúa las reglas de todo el padrón.
   * Respeta los descartes del tutor (no reabre alertas cuyos indicadores no cambiaron).
   */
  async syncAcademicData() {
    this._assertPermission("sync_db");
    await this._simulateLatency();
    const state = getSavedData();
    state.students.forEach((s) => RulesEngine.processPreAlert(s));
    this._audit(state, "Sincronización institucional simulada: notas y asistencias reevaluadas (HU03)");
    persistData(state);
    return { success: true, studentsCount: state.students.length };
  }
};

// Permiso + auditoría para las operaciones sensibles
const _AUDITED = {
  submitPrivacyConsent: { perm: "own_consent", msg: (a) => `Consentimiento informado ${a[1] ? "autorizado" : "revocado"} (HU01)` },
  submitPerceptions: { perm: "survey", msg: () => "Micro-encuesta de bienestar registrada (HU04)" },
  validatePreAlert: { perm: "validate_alerts", msg: (a) => `Pre-alerta de ${a[0]} ${a[2] === "Validada" ? "validada" : "descartada"} (HU06)` }
};
Object.entries(_AUDITED).forEach(([name, cfg]) => {
  const original = ApiService[name].bind(ApiService);
  ApiService[name] = async (...args) => {
    ApiService._assertPermission(cfg.perm);
    const result = await original(...args);
    const state = getSavedData();
    ApiService._audit(state, cfg.msg(args));
    persistData(state);
    return result;
  };
});
