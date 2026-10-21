/**
 * ANCLA - Controlador de Vista Estudiante
 * Universidad de Medellín - Facultad de Ingenierías
 * 
 * Funcionalidades:
 * - Indicadores personales de permanencia y rendimiento
 * - Gestión de consentimiento informado y ética de datos (HU01)
 * - Encuesta de bienestar y micro-pulsos estilo Typeform (HU04), con rotación de sectores
 * - Asignaturas matriculadas con asistencias
 */

document.addEventListener("DOMContentLoaded", () => {
  EstudianteApp.init();
});

const EstudianteApp = {
  titleMap: {
    "view-student": "Portal del Estudiante: Bienestar y Progreso"
  },
  surveyStep: 0,
  surveyAnswers: {},
  currentBattery: null,      // batería (sector) que corresponde responder ahora
  showSupportNotice: false,  // se activa si el ítem de cuidado marcó alerta en el último envío

  init() {
    SharedApp.init("estudiante", this.titleMap);
    this.bindConsentToggle();
    this.renderStudentView();
  },

  /**
   * Vincula el botón de autorización / revocación de consentimiento
   */
  bindConsentToggle() {
    const btnToggleConsent = document.getElementById("btnToggleConsent");
    if (btnToggleConsent) {
      btnToggleConsent.addEventListener("click", () => this.togglePrivacyConsent());
    }
  },

  /**
   * Carga y renderiza el resumen académico y estado del estudiante
   */
  renderStudentView() {
    const data = getSavedData();
    const studentUser = data.users.student;
    const studentData = data.students.find((s) => s.id === studentUser.id) || data.students[0];

    // Banner de consentimiento ético
    const consentStatusText = document.getElementById("consentStatusText");
    const btnConsent = document.getElementById("btnToggleConsent");
    const surveyCard = document.getElementById("studentSurveyCard");
    const disabledNotice = document.getElementById("surveyDisabledNotice");

    if (studentUser.privacyConsentAccepted) {
      consentStatusText.innerHTML = `Consentimiento activo desde <strong>${SharedApp.escapeHtml(studentUser.consentDate || "el inicio de semestre")}</strong>. Tus datos son confidenciales y no punitivos.`;
      btnConsent.textContent = "Revocar Consentimiento";
      btnConsent.classList.replace("btn-primary", "btn-secondary");
      if (surveyCard) surveyCard.classList.remove("disabled");
      if (disabledNotice) disabledNotice.classList.remove("active");
    } else {
      consentStatusText.innerHTML = `<span style="color:var(--red-hover)">Consentimiento pendiente o revocado.</span> No recopilaremos datos emocionales hasta tu autorización.`;
      btnConsent.textContent = "Autorizar Consentimiento";
      btnConsent.classList.replace("btn-secondary", "btn-primary");
      if (surveyCard) surveyCard.classList.add("disabled");
      if (disabledNotice) disabledNotice.classList.add("active");
    }

    // Indicadores académicos del estudiante
    document.getElementById("studentAttendance").textContent = `${studentData.attendanceRate}%`;
    const riskBadge = document.getElementById("studentRiskBadge");
    const riskDetail = document.getElementById("studentRiskDetail");
    const hasPending = studentData.preAlert && studentData.preAlert.status === "Pendiente";
    if (hasPending && studentData.preAlert.safety) {
      // Alerta de cuidado: nunca se muestra una etiqueta de riesgo al estudiante, sino acompañamiento
      riskBadge.textContent = "Acompañamiento de Bienestar";
      riskBadge.className = "badge-risk medio";
      if (riskDetail) riskDetail.textContent = "El equipo de Bienestar se pondrá en contacto contigo.";
    } else {
      riskBadge.textContent = `Riesgo: ${studentData.riskLevel}`;
      riskBadge.className = `badge-risk ${SharedApp.riskClass(studentData.riskLevel)}`;
      if (riskDetail) riskDetail.textContent = hasPending ? "Tu tutor revisará tu caso de forma formativa." : "Sin alertas preventivas activas";
    }

    // Cursos inscritos
    const coursesContainer = document.getElementById("studentCoursesList");
    if (coursesContainer) {
      coursesContainer.innerHTML = studentData.courses
        .map(
          (c) => `
        <div class="finance-item">
          <div>
            <span style="color:var(--text-white); font-weight:600;">${SharedApp.escapeHtml(c.name)}</span>
            <div style="font-size:0.75rem; color:var(--text-muted);">Asistencia: ${c.attendance}%</div>
          </div>
        </div>
      `
        )
        .join("");
    }

    // Iniciar encuesta de bienestar: el sector depende del último que el estudiante completó
    this.currentBattery = SurveyEngine.getNextBattery(studentData);
    this.surveyStep = 0;
    this.surveyAnswers = {}; // nunca se precargan respuestas antiguas: cada pulso es una respuesta nueva
    this.renderSurveyHeader(studentData);
    this.renderSupportNotice();
    this.renderSurveyStep();
  },

  /**
   * Muestra el sector activo y el avance del ciclo de rotación (5 sectores)
   */
  renderSurveyHeader(studentData) {
    const battery = this.currentBattery;
    const chip = document.getElementById("surveySectorChip");
    if (chip) {
      chip.innerHTML = `<span class="sector-icon">${battery.icon}</span><span>${SharedApp.escapeHtml(battery.shortTitle)}</span>`;
      chip.style.borderColor = battery.color;
      chip.style.color = battery.color;
      chip.title = battery.description;
    }
    const track = document.getElementById("surveyCycleTrack");
    if (track) {
      const { order, currentIndex, completedCycles } = SurveyEngine.getCycleProgress(studentData);
      track.innerHTML =
        order
          .map((b, i) => {
            const cls = i === currentIndex ? "current" : "";
            const style = i === currentIndex ? `style="border-color:${b.color}; background:${b.color}22;"` : "";
            return `<span class="cycle-dot ${cls}" ${style} title="${SharedApp.escapeHtml(b.shortTitle)}">${b.icon}</span>`;
          })
          .join("") +
        `<span class="cycle-caption">Sector ${currentIndex + 1} de ${order.length}${completedCycles ? ` · ciclo ${completedCycles + 1}` : ""}</span>`;
    }
  },

  /**
   * Mensaje de acompañamiento si el ítem de cuidado marcó alerta en el último envío
   */
  renderSupportNotice() {
    const box = document.getElementById("surveySupportNotice");
    if (!box) return;
    if (!this.showSupportNotice) {
      box.classList.remove("active");
      box.innerHTML = "";
      return;
    }
    const r = ANCLA_DATA.supportResources;
    box.innerHTML = `
      <strong>💙 Estamos contigo</strong>
      <p>${SharedApp.escapeHtml(r.message)}</p>
      <p style="margin-top:6px;">Emergencias: <strong>${SharedApp.escapeHtml(r.emergencyLine)}</strong> · ${SharedApp.escapeHtml(r.campusService)}</p>
      <button type="button" class="btn btn-secondary btn-sm" id="btnDismissSupport" style="margin-top:8px;">Entendido</button>`;
    box.classList.add("active");
    document.getElementById("btnDismissSupport").onclick = () => {
      this.showSupportNotice = false;
      this.renderSupportNotice();
    };
  },

  /**
   * Renderiza el paso activo de la encuesta de bienestar estilo Typeform
   */
  renderSurveyStep() {
    const questions = this.currentBattery.questions;
    const q = questions[this.surveyStep];
    const total = questions.length;

    // Barra de progreso y pasos
    const progressFill = document.getElementById("surveyProgressFill");
    const stepIndicator = document.getElementById("surveyStepIndicator");
    if (progressFill) progressFill.style.width = `${((this.surveyStep + 1) / total) * 100}%`;
    if (stepIndicator) stepIndicator.textContent = `Pregunta ${this.surveyStep + 1} de ${total}`;

    document.getElementById("surveyQuestionNum").textContent = `Paso 0${this.surveyStep + 1}`;
    document.getElementById("surveyQuestionTitle").textContent = q.title;
    document.getElementById("surveyQuestionSub").textContent = q.subtitle;

    // Cuadrícula de opciones
    const optionsGrid = document.getElementById("surveyOptionsGrid");
    const currentValue = this.surveyAnswers[q.id] || null;

    optionsGrid.innerHTML = q.options
      .map(
        (opt) => `
      <button type="button" class="survey-option-btn ${currentValue === opt.value ? 'selected' : ''}" data-val="${opt.value}">
        <span class="opt-icon">${opt.icon}</span>
        <span class="opt-label">${opt.label}</span>
      </button>
    `
      )
      .join("");

    // Eventos de selección con auto-avance sutil
    optionsGrid.querySelectorAll(".survey-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        optionsGrid.querySelectorAll(".survey-option-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.surveyAnswers[q.id] = parseInt(btn.dataset.val, 10);

        setTimeout(() => {
          if (this.surveyStep < total - 1) {
            this.surveyStep++;
            this.renderSurveyStep();
          } else {
            // Al seleccionar la última opción, finaliza automáticamente
            this.submitStudentSurvey();
          }
        }, 220);
      });
    });

    // Botones Anterior y Siguiente/Finalizar
    const btnPrev = document.getElementById("btnSurveyPrev");
    const btnNext = document.getElementById("btnSurveyNext");

    btnPrev.style.visibility = this.surveyStep > 0 ? "visible" : "hidden";
    btnPrev.onclick = () => {
      if (this.surveyStep > 0) {
        this.surveyStep--;
        this.renderSurveyStep();
      }
    };

    // El botón Siguiente se removió porque cada opción avanza automáticamente
    if (btnNext) {
      if (this.surveyStep === total - 1 && this.surveyAnswers[q.id]) {
        btnNext.style.display = "inline-flex";
        btnNext.textContent = "Finalizar y Guardar";
        btnNext.className = "btn btn-primary btn-sm";
        btnNext.onclick = () => this.submitStudentSurvey();
      } else {
        btnNext.style.display = "none";
      }
    }
  },

  /**
   * Guarda las respuestas de la encuesta y dispara re-evaluación del motor de reglas
   */
  async submitStudentSurvey() {
    const data = getSavedData();
    const studentUser = data.users.student;

    if (!studentUser.privacyConsentAccepted) {
      SharedApp.showToast("Debes aceptar el consentimiento de privacidad primero.", "warning");
      return;
    }

    const missing = this.currentBattery.questions.findIndex((q) => !this.surveyAnswers[q.id]);
    if (missing !== -1) {
      SharedApp.showToast("Responde todas las preguntas antes de guardar.", "warning");
      this.surveyStep = missing;
      this.renderSurveyStep();
      return;
    }

    try {
      const result = await ApiService.submitPerceptions(studentUser.id, this.surveyAnswers, this.currentBattery.id);
      this.showSupportNotice = result.safetyFlag;
      SharedApp.showToast(`¡Respuestas registradas! Próximo pulso: ${result.nextBattery.shortTitle}.`, "success");
      this.renderStudentView(); // carga de inmediato las preguntas del siguiente sector
      SharedApp.updatePendingAlertsBadge();
    } catch (err) {
      SharedApp.showToast(
        err.message === "CONSENT_REQUIRED" ? "Debes aceptar el consentimiento de privacidad primero." : "Error al guardar la encuesta de bienestar",
        err.message === "CONSENT_REQUIRED" ? "warning" : "danger"
      );
    }
  },

  /**
   * Alterna el estado del consentimiento de privacidad del estudiante
   */
  async togglePrivacyConsent() {
    const data = getSavedData();
    const current = data.users.student.privacyConsentAccepted;
    await ApiService.submitPrivacyConsent(data.users.student.id, !current);
    SharedApp.showToast(!current ? "Consentimiento otorgado exitosamente." : "Consentimiento revocado.", "info");
    this.renderStudentView();
  }
};
