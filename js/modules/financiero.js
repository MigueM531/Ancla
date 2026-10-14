/**
 * ANCLA - Controlador de Gestión Financiera y Sostenibilidad (HU09, HU10)
 * Facultad de Ingenierías - Universidad de Medellín
 * 
 * Funcionalidades:
 * - Análisis de costos de diseño, implementación y operación del sistema (HU09)
 * - Simulador interactivo de beneficios económicos y retorno de inversión ROI (HU10)
 * - Escenarios preconfigurados (Conservador, Moderado, Óptimo)
 */


const FinancieroApp = {
  titleMap: {
    "view-financial": "Gestión Financiera, Viabilidad y Simulador ROI"
  },

  async init() {
    this.bindSimulatorSliders();
    this.bindScenarioButtons();
    await this.renderCostBreakdown();
    this.updateFinancialSimulation();
  },

  /**
   * Carga el desglose de costos operativos y diseño (HU09)
   */
  async renderCostBreakdown() {
    try {
      const costs = await ApiService.getFinancialCosts();
      const container = document.getElementById("costItemsContainer");
      if (!container) return;

      container.innerHTML = costs.items
        .map(
          (item) => `
        <div class="cost-breakdown-card">
          <div class="cost-card-category">${SharedApp.escapeHtml(item.category)}</div>
          <div class="cost-card-value">${FinancialSimulator.formatCOP(item.annualCOP)}<span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;"> / año</span></div>
          <div style="font-weight:600; color:var(--text-white); font-size:0.85rem; margin-bottom:4px;">${SharedApp.escapeHtml(item.name)}</div>
          <div class="cost-card-desc">${SharedApp.escapeHtml(item.description)}</div>
        </div>
      `
        )
        .join("");

      const initialEl = document.getElementById("valInitialCost");
      const annualEl = document.getElementById("valAnnualOpCost");
      if (initialEl) initialEl.textContent = FinancialSimulator.formatCOP(costs.initialInvestmentCOP);
      if (annualEl) annualEl.textContent = FinancialSimulator.formatCOP(costs.annualOperationalTotalCOP);
    } catch (err) {
      console.error("Error al cargar desglose de costos:", err);
    }
  },

  /**
   * Vincula los controles de los sliders del simulador
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
        el.addEventListener("input", () => {
          this.removeScenarioActiveStates();
          this.updateFinancialSimulation();
        });
      }
    });
  },

  /**
   * Botones de escenarios predefinidos (Conservador, Moderado, Óptimo)
   */
  bindScenarioButtons() {
    const scenarioBtns = document.querySelectorAll(".scenario-btn");
    scenarioBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const scenarioKey = btn.dataset.scenario;
        const scenarios = await ApiService.getFinancialScenarios();
        const sc = scenarios[scenarioKey];
        if (!sc) return;

        // Asignar valores a los sliders
        document.getElementById("simStudents").value = sc.totalStudents;
        document.getElementById("simDropoutRate").value = sc.baselineDropoutRate;
        document.getElementById("simTuition").value = sc.semesterTuitionCOP;
        document.getElementById("simRetentionRate").value = sc.interventionSuccessRate;
        document.getElementById("simPlatformCost").value = sc.annualPlatformCostCOP;

        // Actualizar clase activa
        scenarioBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        this.updateFinancialSimulation();
        SharedApp.showToast(`Escenario ${scenarioKey.toUpperCase()} aplicado con éxito`, "info");
      });
    });
  },

  removeScenarioActiveStates() {
    document.querySelectorAll(".scenario-btn").forEach((b) => b.classList.remove("active"));
  },

  /**
   * Ejecuta el motor matemático del simulador financiero (HU10)
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
    document.getElementById("resCostPerRetained").textContent = result.costPerRetainedStudent === null ? "N/D" : FinancialSimulator.formatCOP(result.costPerRetainedStudent);
  }
};

