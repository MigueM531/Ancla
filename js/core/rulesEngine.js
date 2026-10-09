/**
 * ANCLA - Motor Lógico Determinista de Reglas por Umbrales (HU05)
 * Capa de Lógica / Motor Predictivo y Validación
 * 
 * Reglas transparentes no-punitivas basadas en umbrales cuantitativos y cualitativos.
 * Toda alerta nace como PRE-ALERTA sujeta a supervisión humana obligatoria (HU06).
 */

const RulesEngine = {
  // Umbrales deterministas configurables
  thresholds: {
    minAcceptableAttendance: 80,   // % asistencia mínima institucional
    criticalAttendance: 75,        // % asistencia de alto riesgo
    minPassingGrade: 3.0,          // Escala 0.0 - 5.0
    warningGrade: 3.3,
    criticalStressLevel: 4,        // Escala 1 - 5 (Typeform)
    criticalAcademicLoad: 4,       // Escala 1 - 5 (Typeform)
    criticalWellbeingLow: 2        // Escala 1 - 5
  },

  /**
   * Evalúa a un estudiante combinando variables cuantitativas y cualitativas.
   * Retorna { riskLevel, triggerAlert, reason, trace, score }
   */
  evaluateStudent(student) {
    const t = this.thresholds;
    const reasons = [];
    const trace = [];
    let riskScore = 0; // 0 a 100

    // 1. Evaluación Cuantitativa de Asistencia (HU03)
    if (student.attendanceRate < t.criticalAttendance) {
      riskScore += 35;
      reasons.push(`Inasistencia severa detectada (${student.attendanceRate}% < umbral crítico de ${t.criticalAttendance}%)`);
      trace.push({ type: "ACADEMIC_ATTENDANCE", severity: "HIGH", detail: "Asistencia por debajo del 75%" });
    } else if (student.attendanceRate < t.minAcceptableAttendance) {
      riskScore += 20;
      reasons.push(`Inasistencia preventiva (${student.attendanceRate}% < umbral ${t.minAcceptableAttendance}%)`);
      trace.push({ type: "ACADEMIC_ATTENDANCE", severity: "MEDIUM", detail: "Asistencia entre 75% y 80%" });
    }

    // 2. Evaluación Cuantitativa de Notas / Promedio (HU03)
    if (student.averageGrade < t.minPassingGrade) {
      riskScore += 35;
      reasons.push(`Promedio ponderado reprobatorio (${student.averageGrade} < 3.0)`);
      trace.push({ type: "ACADEMIC_GRADE", severity: "HIGH", detail: "Promedio acumulado menor a 3.0" });
    } else if (student.averageGrade < t.warningGrade) {
      riskScore += 15;
      reasons.push(`Promedio en margen de advertencia (${student.averageGrade})`);
      trace.push({ type: "ACADEMIC_GRADE", severity: "MEDIUM", detail: "Promedio entre 3.0 y 3.3" });
    }

    // 3. Evaluación Cualitativa / Perceptual (HU04 - Typeform)
    if (student.perceptions) {
      const { stressLevel, academicLoad, emotionalWellbeing, adaptationLevel } = student.perceptions;

      if (stressLevel >= t.criticalStressLevel && academicLoad >= t.criticalAcademicLoad) {
        riskScore += 25;
        reasons.push(`Sobrecarga cognitiva y estrés elevado autodeclarados (Estrés: ${stressLevel}/5, Carga: ${academicLoad}/5)`);
        trace.push({ type: "PERCEPTUAL_LOAD", severity: "HIGH", detail: "Estrés y carga en nivel 4 o superior" });
      } else if (stressLevel >= t.criticalStressLevel) {
        riskScore += 15;
        reasons.push(`Alerta de estrés emocional moderado/alto (${stressLevel}/5)`);
        trace.push({ type: "PERCEPTUAL_STRESS", severity: "MEDIUM", detail: "Estrés individual alto" });
      }

      if (emotionalWellbeing <= t.criticalWellbeingLow) {
        riskScore += 20;
        reasons.push(`Baja percepción de bienestar anímico (${emotionalWellbeing}/5)`);
        trace.push({ type: "PERCEPTUAL_WELLBEING", severity: "MEDIUM", detail: "Bienestar menor o igual a 2" });
      }

      if (adaptationLevel <= 2) {
        riskScore += 15;
        reasons.push(`Dificultades en integración universitaria (Adaptación: ${adaptationLevel}/5)`);
        trace.push({ type: "PERCEPTUAL_ADAPTATION", severity: "MEDIUM", detail: "Adaptación baja en primer año" });
      }
    }

    // 4. Determinación de Nivel de Riesgo Determinista
    let riskLevel = "Bajo";
    let triggerAlert = false;

    if (riskScore >= 65) {
      riskLevel = "Crítico";
      triggerAlert = true;
    } else if (riskScore >= 40) {
      riskLevel = "Alto";
      triggerAlert = true;
    } else if (riskScore >= 20) {
      riskLevel = "Medio";
      triggerAlert = false; // El riesgo medio genera observación, pero alerta formal solo ante superación
    } else {
      riskLevel = "Bajo";
      triggerAlert = false;
    }

    return {
      riskScore: Math.min(riskScore, 100),
      riskLevel,
      triggerAlert,
      reason: reasons.length ? reasons.join(" • ") : "Indicadores dentro de los rangos esperados",
      trace
    };
  },

  /**
   * Genera o actualiza una Pre-Alerta para el flujo de validación humana (HU06)
   */
  // Huella del estado evaluado: permite saber si los indicadores cambiaron desde un descarte
  signature(ev) {
    return `${ev.riskLevel}|${ev.reason}`;
  },

  processPreAlert(student) {
    const ev = this.evaluateStudent(student);
    const pa = student.preAlert;
    const sig = this.signature(ev);
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const createAlert = () => {
      student.preAlert = {
        id: `PAL-${Date.now().toString().slice(-6)}`,
        date: now,
        ruleTriggered: ev.reason,
        riskScore: ev.riskScore,
        status: "Pendiente", // HU06: requiere supervisión humana obligatoria
        tutorNotes: "",
        validatedBy: null,
        validationDate: null,
        history: pa && pa.history ? pa.history : []
      };
    };

    if (ev.triggerAlert) {
      if (!pa) createAlert();
      // Un descarte se respeta mientras los indicadores no cambien
      else if (pa.status === "Descartada" && pa.dismissedSignature !== sig) createAlert();
      else if (pa.status === "Pendiente") {
        pa.ruleTriggered = ev.reason;
        pa.riskScore = ev.riskScore;
      }
    } else if (pa && pa.status === "Pendiente") {
      // El estudiante se recuperó: se cierra la pre-alerta con trazabilidad
      pa.status = "Descartada";
      pa.tutorNotes = "Cerrada automáticamente: los indicadores volvieron a rangos esperados.";
      pa.validatedBy = "Sistema ANCLA";
      pa.validationDate = now;
      pa.dismissedSignature = sig;
      (pa.history = pa.history || []).push({ date: now, status: "Descartada", by: "Sistema ANCLA", notes: pa.tutorNotes });
    }
    student.riskLevel = ev.riskLevel; // el riesgo real nunca se oculta
    return ev;
  }
};
