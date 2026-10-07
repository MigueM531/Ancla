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
      student.preAlert.status = decision; // "Validada" o "Descartada"
      student.preAlert.tutorNotes = tutorNotes;
      student.preAlert.validatedBy = tutorName;
      student.preAlert.validationDate = new Date().toISOString().replace("T", " ").substring(0, 16);
      
      if (decision === "Descartada") {
        student.riskLevel = "Bajo"; // Se recalibra como falso positivo
      }
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
    const total = students.length;
    const atRisk = students.filter(s => s.riskLevel === "Alto" || s.riskLevel === "Crítico").length;
    const pendingPreAlerts = students.filter(s => s.preAlert && s.preAlert.status === "Pendiente").length;
    const validatedAlerts = students.filter(s => s.preAlert && s.preAlert.status === "Validada").length;
    const avgAttendance = Math.round(students.reduce((acc, s) => acc + s.attendanceRate, 0) / total);
    const avgGPA = (students.reduce((acc, s) => acc + s.averageGrade, 0) / total).toFixed(2);

    return {
      totalMonitored: total,
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
  }
};

