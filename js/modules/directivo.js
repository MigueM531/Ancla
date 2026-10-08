/**
 * ANCLA - Controlador de Vista Directivo / Decanatura
 * Universidad de Medellín - Facultad de Ingenierías
 * 
 * Funcionalidades:
 * - Panel ejecutivo de retención y métricas de permanencia
 * - Simulador financiero de retorno de inversión (ROI)
 * - Padrón institucional de estudiantes en monitoreo
 */

document.addEventListener("DOMContentLoaded", () => {
  DirectivoApp.init();
});

const DirectivoApp = {
  titleMap: {
    "view-executive": "Panel Directivo y Métricas de Permanencia",
    "view-financial": "Simulador de Impacto Económico y Retorno (ROI)",
    "view-students-table": "Monitoreo Integral de Estudiantes"
  },

  init() {
    SharedApp.init("directivo", this.titleMap);
    this.bindSimulatorSliders();
    this.renderExecutiveView();
    this.updateFinancialSimulation();
    this.renderStudentsTable();
  },

  /**
   * Vincula los controles interactivos del simulador financiero
   */
  bindSimulatorSliders() {
    const sliders = [
      "simStudents",
      "simDropoutRate",
      "simTuition",
      "simRetentionRate",
      "simPlatformCost"
    ];
    sliders.forEach((id) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", () => this.updateFinancialSimulation());
      }
    });
  },

  /**
   * Carga y renderiza métricas ejecutivas consolidadas
   */
  async renderExecutiveView() {
    try {
      const summary = await ApiService.getDashboardSummary();

      // KPIs principales
      document.getElementById("kpiTotalMonitored").textContent = summary.totalMonitored.toLocaleString("es-CO");
      document.getElementById("kpiAtRisk").textContent = summary.studentsAtRisk;
      document.getElementById("kpiPendingAlerts").textContent = summary.pendingPreAlerts;
      document.getElementById("kpiAvgAttendance").textContent = `${summary.avgAttendance}%`;
      document.getElementById("kpiAvgGPA").textContent = summary.avgGPA;

      // Distribución por nivel de riesgo
      document.getElementById("distCritico").textContent = `${summary.riskDistribution.critico} casos`;
      document.getElementById("distAlto").textContent = `${summary.riskDistribution.alto} casos`;
      document.getElementById("distMedio").textContent = `${summary.riskDistribution.medio} casos`;
      document.getElementById("distBajo").textContent = `${summary.riskDistribution.bajo} casos`;
    } catch (err) {
      console.error("Error al cargar métricas ejecutivas:", err);
      SharedApp.showToast("Error al cargar indicadores ejecutivos", "danger");
    }
  },

  /**
   * Ejecuta el motor matemático del simulador financiero
   */
  updateFinancialSimulation() {
    const totalStudents = parseInt(document.getElementById("simStudents").value, 10);
    const baselineDropoutRate = parseFloat(document.getElementById("simDropoutRate").value);
    const semesterTuitionCOP = parseInt(document.getElementById("simTuition").value, 10);
    const interventionSuccessRate = parseInt(document.getElementById("simRetentionRate").value, 10);
    const annualPlatformCostCOP = parseInt(document.getElementById("simPlatformCost").value, 10);

    // Actualizar etiquetas en la interfaz
    document.getElementById("valSimStudents").textContent = totalStudents.toLocaleString("es-CO");
    document.getElementById("valSimDropoutRate").textContent = `${baselineDropoutRate.toFixed(1)}%`;
    document.getElementById("valSimTuition").textContent = FinancialSimulator.formatCOP(semesterTuitionCOP);
    document.getElementById("valSimRetentionRate").textContent = `${interventionSuccessRate}%`;
    document.getElementById("valSimPlatformCost").textContent = FinancialSimulator.formatCOP(annualPlatformCostCOP);

    // Calcular modelo
    const result = FinancialSimulator.calculateImpact({
      totalStudents,
      baselineDropoutRate,
      semesterTuitionCOP,
      interventionSuccessRate,
      annualPlatformCostCOP
    });

    // Renderizar tarjetas de retorno económico
    document.getElementById("resRoiPercentage").textContent = `${result.roiPercentage}%`;
    document.getElementById("resRetainedStudents").textContent = `${result.studentsRetained} estudiantes`;
    document.getElementById("resRevenuePreserved").textContent = FinancialSimulator.formatCOP(result.annualRevenuePreserved);
    document.getElementById("resNetBenefit").textContent = FinancialSimulator.formatCOP(result.netEconomicBenefit);
    document.getElementById("resAnnualLoss").textContent = FinancialSimulator.formatCOP(result.annualLossWithoutIntervention);
    document.getElementById("resCostPerRetained").textContent = FinancialSimulator.formatCOP(result.costPerRetainedStudent);
  },

  /**
   * Renderiza el padrón de monitoreo de estudiantes
   */
  async renderStudentsTable() {
    const tbody = document.getElementById("allStudentsTableBody");
    if (!tbody) return;

    try {
      const students = await ApiService.getStudents();
      tbody.innerHTML = students
        .map((s) => {
          return `
          <tr>
            <td>
              <div class="student-col">
                <div class="user-avatar" style="width:32px; height:32px; font-size:0.75rem;">${s.name.slice(0, 2).toUpperCase()}</div>
                <div class="student-col-info">
                  <h5>${s.name}</h5>
                  <span>${s.id} • ${s.program}</span>
                </div>
              </div>
            </td>
            <td><strong>${s.averageGrade.toFixed(1)}</strong> / 5.0</td>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <span>${s.attendanceRate}%</span>
                <div style="width:50px; height:4px; background:var(--bg-badge-gray); border-radius:2px; overflow:hidden;">
                  <div style="width:${s.attendanceRate}%; height:100%; background:${s.attendanceRate < 80 ? 'var(--red-primary)' : 'var(--status-low)'};"></div>
                </div>
              </div>
            </td>
            <td>
              <div style="font-size:0.78rem; color:var(--text-secondary);">
                Estrés: ${s.perceptions ? s.perceptions.stressLevel : '-'} / 5 | 
                Carga: ${s.perceptions ? s.perceptions.academicLoad : '-'} / 5
              </div>
            </td>
            <td>
              <span class="badge-risk ${s.riskLevel.toLowerCase()}">${s.riskLevel}</span>
            </td>
          </tr>
        `;
        })
        .join("");
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
    }
  }
};
