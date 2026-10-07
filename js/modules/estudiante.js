/**
 * ANCLA - Controlador de Vista Estudiante
 * Universidad de Medellín - Facultad de Ingenierías
 * 
 * Funcionalidades:
 * - Indicadores personales de permanencia y rendimiento
 * - Gestión de consentimiento informado y ética de datos (HU01)
 * - Encuesta de bienestar y micro-pulsos estilo Typeform (HU04)
 * - Asignaturas matriculadas con notas y asistencias
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

  init() {
    SharedApp.init("estudiante");
    SharedApp.bindNavigationTabs(this.titleMap);
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

    if (studentUser.privacyConsentAccepted) {
      consentStatusText.innerHTML = `Consentimiento activo desde <strong>${studentUser.consentDate || "el inicio de semestre"}</strong>. Tus datos son confidenciales y no punitivos.`;
      btnConsent.textContent = "Revocar Consentimiento";
      btnConsent.classList.replace("btn-primary", "btn-secondary");
    } else {
      consentStatusText.innerHTML = `<span style="color:var(--red-hover)">Consentimiento pendiente o revocado.</span> No recopilaremos datos emocionales hasta tu autorización.`;
      btnConsent.textContent = "Autorizar Consentimiento";
      btnConsent.classList.replace("btn-secondary", "btn-primary");
    }

    // Indicadores académicos del estudiante
    document.getElementById("studentAvgGrade").textContent = studentData.averageGrade.toFixed(1);
    document.getElementById("studentAttendance").textContent = `${studentData.attendanceRate}%`;
    document.getElementById("studentRiskBadge").textContent = `Riesgo: ${studentData.riskLevel}`;
    document.getElementById("studentRiskBadge").className = `badge-risk ${studentData.riskLevel.toLowerCase()}`;

    // Cursos inscritos
    const coursesContainer = document.getElementById("studentCoursesList");
    if (coursesContainer) {
      coursesContainer.innerHTML = studentData.courses
        .map(
          (c) => `
        <div class="finance-item">
          <div>
            <span style="color:var(--text-white); font-weight:600;">${c.name}</span>
            <div style="font-size:0.75rem; color:var(--text-muted);">Asistencia: ${c.attendance}%</div>
          </div>
          <div>
            <span class="badge-risk ${c.grade >= 3.0 ? 'bajo' : 'critico'}">Nota: ${c.grade.toFixed(1)}</span>
          </div>
        </div>
      `
        )
        .join("");
    }

    // Iniciar encuesta de bienestar
    this.surveyStep = 0;
    this.surveyAnswers = { ...studentData.perceptions };
    this.renderSurveyStep();
  },

  /**
   * Renderiza el paso activo de la encuesta de bienestar estilo Typeform
   */
  renderSurveyStep() {
    const questions = ANCLA_DATA.surveyQuestions;
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

    if (this.surveyStep === total - 1) {
      btnNext.textContent = "Finalizar y Guardar";
      btnNext.className = "btn btn-primary";
      btnNext.onclick = () => this.submitStudentSurvey();
    } else {
      btnNext.textContent = "Siguiente →";
      btnNext.className = "btn btn-secondary";
      btnNext.onclick = () => {
        if (this.surveyStep < total - 1) {
          this.surveyStep++;
          this.renderSurveyStep();
        }
      };
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

    try {
      await ApiService.submitPerceptions(studentUser.id, this.surveyAnswers);
      SharedApp.showToast("¡Respuestas registradas! Tu bienestar es nuestra prioridad formativa.", "success");
      this.renderStudentView();
      SharedApp.updatePendingAlertsBadge();
    } catch (err) {
      SharedApp.showToast("Error al guardar la encuesta de bienestar", "danger");
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
