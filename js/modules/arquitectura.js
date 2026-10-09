/**
 * ANCLA - Controlador de Arquitectura y Diagrama BPMN
 * Facultad de Ingenierías - Universidad de Medellín
 * 
 * Funcionalidades:
 * - Explicación interactiva del Modelo Monolítico Modular de Tres Capas
 * - Flujo del Diagrama BPMN: Detección Temprana y Gestión de Alertas
 * - Verificación de Criterios de Aceptación del Reto
 */


const ArquitecturaApp = {
  titleMap: {
    "view-architecture": "Modelo Arquitectónico Monolítico Modular y BPMN"
  },

  init() {
    this.bindInteractiveSimulation();
  },

  /**
   * Permite probar la trazabilidad del flujo BPMN con un caso práctico
   */
  bindInteractiveSimulation() {
    const btnSimulate = document.getElementById("btnTestBpmnFlow");
    if (btnSimulate) {
      btnSimulate.addEventListener("click", () => {
        const resultCard = document.getElementById("bpmnSimResult");
        if (!resultCard) return;

        // Estudiante de prueba con sobrecarga
        const testStudent = {
          name: "Estudiante Simulado",
          averageGrade: 2.8,
          attendanceRate: 74,
          perceptions: {
            stressLevel: 5,
            academicLoad: 5,
            emotionalWellbeing: 2,
            adaptationLevel: 2
          }
        };

        const evalResult = RulesEngine.evaluateStudent(testStudent);

        resultCard.style.display = "block";
        resultCard.innerHTML = `
          <div style="font-weight:700; color:var(--text-white); margin-bottom:8px;">
            🧪 Resultado de la Evaluación Determinista por Umbrales:
          </div>
          <div style="font-size:0.85rem; color:var(--text-primary); line-height:1.6;">
            <strong>Puntuación de Riesgo:</strong> ${evalResult.riskScore} / 100 <br>
            <strong>Clasificación:</strong> <span class="badge-risk ${SharedApp.riskClass(evalResult.riskLevel)}">${evalResult.riskLevel}</span> <br>
            <strong>Pre-Alerta Disparada:</strong> ${evalResult.triggerAlert ? "SÍ (Sujeta obligatoriamente a revisión de tutor)" : "NO"} <br>
            <strong>Trazabilidad de Reglas:</strong>
            <ul style="padding-left:18px; margin-top:6px; color:var(--red-hover);">
              ${evalResult.reason.split(" • ").map((r) => `<li>${SharedApp.escapeHtml(r)}</li>`).join("")}
            </ul>
          </div>
        `;

        SharedApp.showToast("Flujo BPMN evaluado: Pre-alerta generada con éxito", "info");
      });
    }
  }
};

