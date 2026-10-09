/**
 * ANCLA - Simulador de Impacto Económico y Retorno de Inversión (HU09, HU10)
 * Módulo de Gestión Financiera y Sostenibilidad
 * 
 * Permite a directivos simular escenarios de retención estudiantil,
 * calculando el valor preservado para la institución educativa frente al costo de la plataforma.
 */

const FinancialSimulator = {
  /**
   * Calcula el modelo financiero basado en parámetros de entrada
   */
  calculateImpact(params) {
    const {
      totalStudents = 1250,
      baselineDropoutRate = 16.5,
      semesterTuitionCOP = 6800000,
      interventionSuccessRate = 30,
      annualPlatformCostCOP = 42000000,
      semestersLostPerDropout = 2 // Supuesto documentado: semestres de matrícula perdidos por cada deserción
    } = params;

    // 1. Estudiantes proyectados en riesgo de abandono escolar
    const projectedDropoutStudents = Math.round(totalStudents * (baselineDropoutRate / 100));

    // 2. Pérdida institucional sin intervención preventiva (2 semestres/año)
    const annualLossWithoutIntervention = projectedDropoutStudents * (semesterTuitionCOP * semestersLostPerDropout);

    // 3. Estudiantes retenidos efectivamente gracias al acompañamiento temprano de ANCLA
    const studentsRetained = Math.round(projectedDropoutStudents * (interventionSuccessRate / 100));

    // 4. Ingresos por matrículas preservadas para la Universidad
    const annualRevenuePreserved = studentsRetained * (semesterTuitionCOP * semestersLostPerDropout);

    // 5. Beneficio Económico Neto tras deducir el costo del sistema SaaS
    const netEconomicBenefit = annualRevenuePreserved - annualPlatformCostCOP;

    // 6. Retorno sobre la Inversión (ROI %)
    const roiPercentage = annualPlatformCostCOP > 0 
      ? Math.round(((annualRevenuePreserved - annualPlatformCostCOP) / annualPlatformCostCOP) * 100)
      : 0;

    // 7. Costo institucional por estudiante rescatado/retenido
    const costPerRetainedStudent = studentsRetained > 0 
      ? Math.round(annualPlatformCostCOP / studentsRetained) 
      : null; // null = no calculable

    return {
      totalStudents,
      baselineDropoutRate,
      semesterTuitionCOP,
      interventionSuccessRate,
      annualPlatformCostCOP,
      projectedDropoutStudents,
      annualLossWithoutIntervention,
      studentsRetained,
      annualRevenuePreserved,
      netEconomicBenefit,
      roiPercentage,
      costPerRetainedStudent
    };
  },

  /**
   * Formateador de moneda colombiana (COP)
   */
  formatCOP(value) {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(value);
  }
};

