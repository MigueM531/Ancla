/**
 * ANCLA - Motor de Encuestas Rotativas (HU04)
 * Capa de Lógica / Rotación de baterías y puntuación por dimensión
 *
 * Responsabilidades:
 *  1. ROTAR: cada vez que un estudiante envía una batería de 5 preguntas, la siguiente
 *     encuesta pasa al sector siguiente del orden configurado (ANCLA_DATA.surveyRotation.order).
 *     Nunca se repite el mismo sector dos veces seguidas.
 *  2. PUNTUAR: convierte las respuestas en las 4 dimensiones que consume el RulesEngine
 *     (stressLevel, academicLoad, emotionalWellbeing, adaptationLevel), respetando la
 *     polaridad de cada pregunta ("favorable": 5 = mejor ; "adverse": 5 = peor).
 *  3. CUIDAR: detecta el ítem de seguridad (desesperanza / autolesión) para escalar a
 *     contacto humano prioritario.
 *
 * Principios: determinista, transparente y no punitivo. No se guardan las respuestas
 * individuales, solo los puntajes agregados por dimensión (minimización de datos, HU01).
 */

const SurveyEngine = {
  // En estas dimensiones un valor ALTO es desfavorable (presión). En las otras, un valor alto es favorable.
  HIGH_IS_BAD: {
    stressLevel: true,
    academicLoad: true,
    emotionalWellbeing: false,
    adaptationLevel: false
  },

  getBatteries() {
    return ANCLA_DATA.surveyBatteries;
  },

  getBatteryById(id) {
    return this.getBatteries().find((b) => b.id === id) || null;
  },

  /** Orden de rotación configurado, filtrando ids inexistentes; si no hay configuración, el orden natural. */
  getRotationOrder() {
    const cfg = ANCLA_DATA.surveyRotation && ANCLA_DATA.surveyRotation.order;
    const valid = (cfg || []).filter((id) => this.getBatteryById(id));
    return valid.length ? valid : this.getBatteries().map((b) => b.id);
  },

  /** Estado de rotación del estudiante (tolerante a estudiantes sin historial). */
  getRotationState(student) {
    const r = (student && student.surveyRotation) || {};
    return { lastBatteryId: r.lastBatteryId || null, history: Array.isArray(r.history) ? r.history : [] };
  },

  /** Batería que le corresponde responder ahora: la siguiente a la última completada. */
  getNextBattery(student) {
    const order = this.getRotationOrder();
    const { lastBatteryId } = this.getRotationState(student);
    const idx = order.indexOf(lastBatteryId); // -1 si nunca respondió o el sector ya no existe
    return this.getBatteryById(order[(idx + 1) % order.length]);
  },

  /** Posición dentro del ciclo actual, para mostrar el avance al estudiante. */
  getCycleProgress(student) {
    const order = this.getRotationOrder();
    const next = this.getNextBattery(student);
    const currentIndex = order.indexOf(next.id);
    return {
      order: order.map((id) => this.getBatteryById(id)),
      currentIndex,
      completedCycles: Math.floor(this.getRotationState(student).history.length / order.length)
    };
  },

  /** Desfavorabilidad de una respuesta en escala común 1 (mejor) - 5 (peor). */
  badness(question, value) {
    return question.polarity === "adverse" ? value : 6 - value;
  },

  /** Verifica que todas las preguntas de la batería tengan una respuesta válida (1-5 y existente en las opciones). */
  validateAnswers(battery, answers) {
    const missing = [];
    const invalid = [];
    for (const q of battery.questions) {
      const v = answers ? answers[q.id] : undefined;
      if (v === undefined || v === null) missing.push(q.id);
      else if (!q.options.some((o) => o.value === v)) invalid.push(q.id);
    }
    return { valid: !missing.length && !invalid.length, missing, invalid };
  },

  /**
   * Convierte las respuestas de una batería en puntajes por dimensión (enteros 1-5, compatibles con la BD).
   * Regla de no-dilución: si algún ítem de una dimensión está en su extremo más desfavorable,
   * la dimensión nunca queda por debajo del nivel de alerta (4 en escala de desfavorabilidad).
   */
  scoreBattery(battery, answers) {
    const byDim = {};
    let hasSafetyItem = false;
    let safetyFlag = false;

    for (const q of battery.questions) {
      const v = answers[q.id];
      (byDim[q.coreDimension] = byDim[q.coreDimension] || []).push(this.badness(q, v));
      if (q.safety) {
        hasSafetyItem = true;
        if (v <= (q.flagAtOrBelow || 2)) safetyFlag = true;
      }
    }

    const dimensions = {};
    for (const [dim, bads] of Object.entries(byDim)) {
      const mean = bads.reduce((a, b) => a + b, 0) / bads.length;
      let bad = Math.round(mean);
      if (bads.some((b) => b === 5)) bad = Math.max(bad, 4);
      dimensions[dim] = this.HIGH_IS_BAD[dim] ? bad : 6 - bad;
    }
    return { dimensions, hasSafetyItem, safetyFlag };
  },

  /** Registra la batería completada: avanza la rotación y guarda solo puntajes agregados. */
  recordCompletion(student, battery, scoring, isoDate) {
    const limit = (ANCLA_DATA.surveyRotation && ANCLA_DATA.surveyRotation.historyLimit) || 60;
    const prev = this.getRotationState(student);
    const history = prev.history.concat({
      batteryId: battery.id,
      date: isoDate || new Date().toISOString().split("T")[0],
      dimensions: scoring.dimensions
    });
    student.surveyRotation = { lastBatteryId: battery.id, history: history.slice(-limit) };
    return student.surveyRotation;
  }
};
