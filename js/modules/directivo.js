/**
 * ANCLA - Controlador de Vista Directivo / Decanatura (HU07, HU08)
 * Facultad de Ingenierías - Universidad de Medellín
 * 
 * Funcionalidades:
 * - Panel ejecutivo de métricas de permanencia y retención estudiantil
 * - Distribución determinista de riesgo (Crítico, Alto, Medio, Bajo)
 * - Desglose de permanencia por programa de ingeniería
 * - Resumen ejecutivo de alertas de acompañamiento
 */

document.addEventListener("DOMContentLoaded", () => {
  DirectivoApp.init();
});

const DirectivoApp = {
  titleMap: {
    "view-executive": "Panel Directivo y Métricas de Permanencia",
    "view-financial": "Gestión Financiera, Viabilidad y Simulador ROI",
    "view-students-table": "Base de Datos y Monitoreo Académico Institucional",
    "view-privacy": "Privacidad, Consentimiento y Roles",
    "view-architecture": "Modelo Arquitectónico Monolítico Modular y BPMN"
  },

  init() {
    SharedApp.init("directivo", this.titleMap);
    this.renderExecutiveView();
    this.renderProgramBreakdown();
    this.renderCriticalAlertsSummary();
    // Pestañas (módulos integrados de la rama Branch2A)
    FinancieroApp.init();
    AcademicoApp.init();
    PrivacidadApp.init();
    ArquitecturaApp.init();
    document.addEventListener("ancla:data-changed", () => {
      this.renderExecutiveView();
      this.renderProgramBreakdown();
      this.renderCriticalAlertsSummary();
      AcademicoApp.loadAndRenderStudents();
      PrivacidadApp.init();
    });
  },

  /**
   * Carga y renderiza métricas ejecutivas consolidadas (HU07)
   */
  async renderExecutiveView() {
    try {
      const summary = await ApiService.getDashboardSummary();

      // KPIs principales
      const kpiTotal = document.getElementById("kpiTotalMonitored");
      const kpiAtRisk = document.getElementById("kpiAtRisk");
      const kpiPending = document.getElementById("kpiPendingAlerts");
      const kpiAttendance = document.getElementById("kpiAvgAttendance");
      const kpiGPA = document.getElementById("kpiAvgGPA");

      if (kpiTotal) kpiTotal.textContent = summary.totalMonitored.toLocaleString("es-CO");
      if (kpiAtRisk) kpiAtRisk.textContent = summary.studentsAtRisk;
      if (kpiPending) kpiPending.textContent = summary.pendingPreAlerts;
      if (kpiAttendance) kpiAttendance.textContent = `${summary.avgAttendance}%`;
      if (kpiGPA) kpiGPA.textContent = summary.avgGPA;

      // Distribución por nivel de riesgo
      const distCritico = document.getElementById("distCritico");
      const distAlto = document.getElementById("distAlto");
      const distMedio = document.getElementById("distMedio");
      const distBajo = document.getElementById("distBajo");

      if (distCritico) distCritico.textContent = SharedApp.plural(summary.riskDistribution.critico, "caso", "casos");
      if (distAlto) distAlto.textContent = SharedApp.plural(summary.riskDistribution.alto, "caso", "casos");
      if (distMedio) distMedio.textContent = SharedApp.plural(summary.riskDistribution.medio, "caso", "casos");
      if (distBajo) distBajo.textContent = SharedApp.plural(summary.riskDistribution.bajo, "caso", "casos");
    } catch (err) {
      console.error("Error al cargar métricas ejecutivas:", err);
      SharedApp.showToast("Error al cargar indicadores ejecutivos", "danger");
    }
  },

  /**
   * Renderiza el desglose de permanencia por programas de la Facultad
   */
  async renderProgramBreakdown() {
    const container = document.getElementById("programBreakdownContainer");
    if (!container) return;

    try {
      const students = await ApiService.getStudents();
      const programs = {};

      students.forEach((s) => {
        if (!programs[s.program]) {
          programs[s.program] = { total: 0, atRisk: 0, sumGPA: 0, sumAtt: 0 };
        }
        programs[s.program].total++;
        if (s.riskLevel === "Crítico" || s.riskLevel === "Alto") {
          programs[s.program].atRisk++;
        }
        programs[s.program].sumGPA += s.averageGrade;
        programs[s.program].sumAtt += s.attendanceRate;
      });

      container.innerHTML = Object.entries(programs)
        .map(([progName, data]) => {
          const avgGpa = (data.sumGPA / data.total).toFixed(1);
          const avgAtt = Math.round(data.sumAtt / data.total);
          const riskRatio = Math.round((data.atRisk / data.total) * 100);

          return `
          <div class="finance-item">
            <div>
              <span style="color:var(--text-white); font-weight:600;">${SharedApp.escapeHtml(progName)}</span>
              <div style="font-size:0.75rem; color:var(--text-secondary);">
                ${data.total} estudiantes • GPA Promedio: ${avgGpa} • Asistencia: ${avgAtt}%
              </div>
            </div>
            <div style="text-align:right;">
              <span class="badge-risk ${riskRatio > 30 ? 'critico' : 'bajo'}">
                ${data.atRisk} en riesgo (${riskRatio}%)
              </span>
            </div>
          </div>
        `;
        })
        .join("");
    } catch (err) {
      console.error("Error al calcular programas:", err);
    }
  },

  /**
   * Renderiza casos críticos destacados que requieren atención
   */
  async renderCriticalAlertsSummary() {
    const container = document.getElementById("criticalSummaryContainer");
    if (!container) return;

    try {
      const students = await ApiService.getStudents();
      const criticalStudents = students.filter((s) => s.riskLevel === "Crítico" || s.riskLevel === "Alto");

      if (criticalStudents.length === 0) {
        container.innerHTML = `
          <div style="color:var(--status-low); font-size:0.85rem; padding:12px;">
            ✓ No se registran casos de riesgo crítico en este momento.
          </div>
        `;
        return;
      }

      container.innerHTML = criticalStudents
        .slice(0, 3)
        .map(
          (s) => `
        <div class="finance-item">
          <div>
            <div style="font-weight:600; color:var(--text-white); font-size:0.88rem;">${SharedApp.escapeHtml(s.name)} (${SharedApp.escapeHtml(s.program)})</div>
            <div style="font-size:0.76rem; color:var(--red-hover);">
              Promedio: ${s.averageGrade} • Asistencia: ${s.attendanceRate}% • ${s.preAlert ? SharedApp.escapeHtml(s.preAlert.ruleTriggered) : 'Alerta preventiva'}
            </div>
          </div>
          <div>
            <span class="badge-risk ${SharedApp.riskClass(s.riskLevel)}">${SharedApp.escapeHtml(s.riskLevel)}</span>
          </div>
        </div>
      `
        )
        .join("");
    } catch (err) {
      console.error("Error al cargar casos críticos:", err);
    }
  }
};
