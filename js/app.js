/**
 * ANCLA - Controlador Principal de la Aplicación Frontend
 * Universidad de Medellín - Facultad de Ingenierías
 * 
 * Orquesta la interfaz según los roles definidos:
 * - Estudiante (HU01, HU03, HU04)
 * - Tutor / Bienestar (HU05, HU06, HU08)
 * - Directivo / Coordinador (HU07, HU09, HU10)
 */

document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

const App = {
  currentRole: "directivo", // "directivo" | "tutor" | "estudiante"
  surveyStep: 0,
  surveyAnswers: {},
  selectedStudentForValidation: null,

  init() {
    this.bindEvents();
    this.applyRole(this.currentRole);
    this.initFinancialSimulator();
  },

  bindEvents() {
    // Selector de rol en sidebar
    const roleSelect = document.getElementById("roleSelect");
    if (roleSelect) {
      roleSelect.value = this.currentRole;
      roleSelect.addEventListener("change", (e) => {
        this.switchRole(e.target.value);
      });
    }

    // Links de navegación del sidebar
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = link.dataset.view;
        if (targetView) {
          this.navigateToView(targetView);
        }
      });
    });

    // Filtros de alertas en vista de Tutor
    const filterTabs = document.querySelectorAll(".alert-filter-btn");
    filterTabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterTabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderTutorAlerts(btn.dataset.filter);
      });
    });

    // Sliders del Simulador Financiero
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

    // Botones de cierre de modales
    document.querySelectorAll(".modal-close-trigger").forEach((btn) => {
      btn.addEventListener("click", () => this.closeAllModals());
    });

    // Cerrar modal al dar click en el backdrop
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.closeAllModals();
      });
    });

    // Botones de acción del Modal de Validación Humana
    const btnConfirmAlert = document.getElementById("btnConfirmAlert");
    const btnDismissAlert = document.getElementById("btnDismissAlert");
    if (btnConfirmAlert) {
      btnConfirmAlert.addEventListener("click", () => this.submitAlertValidation("Validada"));
    }
    if (btnDismissAlert) {
      btnDismissAlert.addEventListener("click", () => this.submitAlertValidation("Descartada"));
    }

    // Botón de consentimiento de privacidad
    const btnToggleConsent = document.getElementById("btnToggleConsent");
    if (btnToggleConsent) {
      btnToggleConsent.addEventListener("click", () => this.togglePrivacyConsent());
    }

    // Botón para abrir modal de términos de privacidad
    const btnOpenPrivacyModal = document.getElementById("btnOpenPrivacyModal");
    if (btnOpenPrivacyModal) {
      btnOpenPrivacyModal.addEventListener("click", () => this.openModal("modalPrivacy"));
    }
  },

  /**
   * Cambia de rol en la interfaz (HU02)
   */
  switchRole(newRole) {
    this.currentRole = newRole;
    this.applyRole(newRole);
    this.showToast(`Modo cambiado a: ${newRole.toUpperCase()}`, "info");
  },

  applyRole(role) {
    const data = getSavedData();
    // Mapa de rol (selector) → clave en data.users
    const roleKeyMap = {
      estudiante: "student",
      tutor: "tutor",
      directivo: "executive"
    };
    const userKey = roleKeyMap[role] || role;
    const user = data.users[userKey];

    // Actualizar datos del usuario en footer de sidebar
    document.getElementById("sidebarUserName").textContent = user.name;
    document.getElementById("sidebarUserRole").textContent = user.roleLabel;
    document.getElementById("sidebarUserAvatar").textContent = user.avatar;

    // Actualizar visibilidad de secciones de navegación según permisos de rol
    document.querySelectorAll(".nav-link").forEach((link) => {
      const allowedRoles = link.dataset.roles ? link.dataset.roles.split(",") : [];
      if (allowedRoles.includes(role)) {
        link.style.display = "flex";
      } else {
        link.style.display = "none";
      }
    });

    // Seleccionar vista por defecto según rol
    let defaultView = "view-executive";
    if (role === "tutor") defaultView = "view-tutor";
    if (role === "estudiante") defaultView = "view-student";

    this.navigateToView(defaultView);

    // Cargar contenidos específicos
    if (role === "estudiante") {
      this.renderStudentView();
    } else if (role === "tutor") {
      this.renderTutorView();
    } else if (role === "directivo") {
      this.renderExecutiveView();
    }
  },

  navigateToView(viewId) {
    // Actualizar navegación activa
    document.querySelectorAll(".nav-link").forEach((l) => {
      l.classList.toggle("active", l.dataset.view === viewId);
    });

    // Mostrar sección
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === viewId);
    });

    // Actualizar título de topbar
    const titleMap = {
      "view-executive": "Panel Directivo y Métricas de Permanencia",
      "view-financial": "Simulador de Impacto Económico y Retorno (ROI)",
      "view-tutor": "Bandeja de Supervisión y Validación de Pre-Alertas",
      "view-students-table": "Monitoreo Integral de Estudiantes",
      "view-student": "Portal del Estudiante: Bienestar y Progreso"
    };

    const pageTitleEl = document.getElementById("pageTitle");
    if (pageTitleEl && titleMap[viewId]) {
      pageTitleEl.textContent = titleMap[viewId];
    }
  },

  /* =================================================================
     VISTA 1: ESTUDIANTE (HU01, HU03, HU04)
     ================================================================= */
  renderStudentView() {
    const data = getSavedData();
    const studentUser = data.users.student;
    const studentData = data.students.find((s) => s.id === studentUser.id) || data.students[0];

    // HU01: Consentimiento
    const consentBanner = document.getElementById("studentConsentBanner");
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

    // HU03: Resumen Académico del Estudiante
    document.getElementById("studentAvgGrade").textContent = studentData.averageGrade.toFixed(1);
    document.getElementById("studentAttendance").textContent = `${studentData.attendanceRate}%`;
    document.getElementById("studentRiskBadge").textContent = `Riesgo: ${studentData.riskLevel}`;
    document.getElementById("studentRiskBadge").className = `badge-risk ${studentData.riskLevel.toLowerCase()}`;

    // Renderizar cursos inscritos
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

    // HU04: Iniciar Encuesta Typeform
    this.surveyStep = 0;
    this.surveyAnswers = { ...studentData.perceptions };
    this.renderSurveyStep();
  },

  renderSurveyStep() {
    const questions = ANCLA_DATA.surveyQuestions;
    const q = questions[this.surveyStep];
    const total = questions.length;

    // Actualizar barra de progreso e indicador
    const progressFill = document.getElementById("surveyProgressFill");
    const stepIndicator = document.getElementById("surveyStepIndicator");
    if (progressFill) progressFill.style.width = `${((this.surveyStep + 1) / total) * 100}%`;
    if (stepIndicator) stepIndicator.textContent = `Pregunta ${this.surveyStep + 1} de ${total}`;

    // Título y subtítulo
    document.getElementById("surveyQuestionNum").textContent = `Paso 0${this.surveyStep + 1}`;
    document.getElementById("surveyQuestionTitle").textContent = q.title;
    document.getElementById("surveyQuestionSub").textContent = q.subtitle;

    // Opciones interactivas
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

    // Eventos a las opciones
    optionsGrid.querySelectorAll(".survey-option-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        optionsGrid.querySelectorAll(".survey-option-btn").forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.surveyAnswers[q.id] = parseInt(btn.dataset.val, 10);

        // Auto avance sutil estilo Typeform
        setTimeout(() => {
          if (this.surveyStep < total - 1) {
            this.surveyStep++;
            this.renderSurveyStep();
          }
        }, 250);
      });
    });

    // Control de botones de navegación
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

  async submitStudentSurvey() {
    const data = getSavedData();
    const studentUser = data.users.student;

    if (!studentUser.privacyConsentAccepted) {
      this.showToast("Debes aceptar el consentimiento de privacidad primero.", "warning");
      return;
    }

    try {
      await ApiService.submitPerceptions(studentUser.id, this.surveyAnswers);
      this.showToast("¡Respuestas registradas! Tu bienestar es nuestra prioridad formativa.", "success");
      this.renderStudentView();
    } catch (err) {
      this.showToast("Error al guardar la encuesta", "danger");
    }
  },

  async togglePrivacyConsent() {
    const data = getSavedData();
    const current = data.users.student.privacyConsentAccepted;
    await ApiService.submitPrivacyConsent(data.users.student.id, !current);
    this.showToast(!current ? "Consentimiento otorgado exitosamente." : "Consentimiento revocado.", "info");
    this.renderStudentView();
  },

  /* =================================================================
     VISTA 2: TUTOR / BIENESTAR (HU05, HU06, HU08)
     ================================================================= */
  async renderTutorView() {
    this.renderTutorAlerts("all");
    this.renderAllStudentsTable();
  },

  async renderTutorAlerts(filter = "all") {
    const students = await ApiService.getStudents();
    const tbody = document.getElementById("tutorAlertsTableBody");
    const badgeCount = document.getElementById("pendingAlertsCountBadge");

    // Filtrar estudiantes con pre-alertas
    let filtered = students.filter((s) => s.preAlert !== null);

    if (filter === "pending") {
      filtered = filtered.filter((s) => s.preAlert.status === "Pendiente");
    } else if (filter === "validated") {
      filtered = filtered.filter((s) => s.preAlert.status === "Validada");
    } else if (filter === "dismissed") {
      filtered = filtered.filter((s) => s.preAlert.status === "Descartada");
    }

    const pendingCount = students.filter((s) => s.preAlert && s.preAlert.status === "Pendiente").length;
    if (badgeCount) badgeCount.textContent = pendingCount;

    if (!tbody) return;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">
            No hay alertas en esta categoría. Todas las condiciones están bajo control preventivo.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((s) => {
        const pa = s.preAlert;
        const statusBadgeClass =
          pa.status === "Pendiente"
            ? "badge-risk critico"
            : pa.status === "Validada"
            ? "badge-risk medio"
            : "badge-risk bajo";

        return `
        <tr>
          <td>
            <div class="student-col">
              <div class="user-avatar" style="width:34px; height:34px; font-size:0.75rem;">${s.name.slice(0, 2).toUpperCase()}</div>
              <div class="student-col-info">
                <h5>${s.name}</h5>
                <span>${s.program} • Sem ${s.semester}</span>
              </div>
            </div>
          </td>
          <td>
            <span class="badge-risk ${s.riskLevel.toLowerCase()}">${s.riskLevel}</span>
          </td>
          <td>
            <div style="font-size:0.8rem; color:var(--text-primary); max-width:240px; line-height:1.3;">
              ${pa.ruleTriggered}
            </div>
            <div style="font-size:0.7rem; color:var(--text-muted); margin-top:3px;">
              Generada: ${pa.date}
            </div>
          </td>
          <td>
            <span class="${statusBadgeClass}">${pa.status}</span>
          </td>
          <td>
            <div style="font-size:0.8rem; color:var(--text-secondary); max-width:180px;">
              ${pa.tutorNotes || "<em>Sin notas aún</em>"}
            </div>
          </td>
          <td style="text-align:right;">
            <button class="btn btn-sm ${pa.status === 'Pendiente' ? 'btn-primary' : 'btn-secondary'}" 
                    onclick="App.openValidationModal('${s.id}')">
              ${pa.status === "Pendiente" ? "Supervisar / Validar" : "Ver Registro"}
            </button>
          </td>
        </tr>
      `;
      })
      .join("");
  },

  async renderAllStudentsTable() {
    const students = await ApiService.getStudents();
    const tbody = document.getElementById("allStudentsTableBody");
    if (!tbody) return;

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
  },

  /**
   * HU06: Abre el modal de validación humana obligatoria
   */
  async openValidationModal(studentId) {
    const students = await ApiService.getStudents();
    const student = students.find((s) => s.id === studentId);
    if (!student || !student.preAlert) return;

    this.selectedStudentForValidation = student;

    // Poblar modal
    document.getElementById("modalStudentName").textContent = `${student.name} (${student.program})`;
    document.getElementById("modalRuleDetails").textContent = student.preAlert.ruleTriggered;
    document.getElementById("modalAcademicStats").innerHTML = `
      <strong>Promedio:</strong> ${student.averageGrade.toFixed(1)} | 
      <strong>Asistencia:</strong> ${student.attendanceRate}% | 
      <strong>Estrés reportado:</strong> ${student.perceptions.stressLevel}/5
    `;
    document.getElementById("tutorNotesInput").value = student.preAlert.tutorNotes || "";

    this.openModal("modalValidation");
  },

  async submitAlertValidation(decision) {
    if (!this.selectedStudentForValidation) return;

    const notesInput = document.getElementById("tutorNotesInput").value.trim();

    // "Validada" requiere nota obligatoria del tutor
    if (decision === "Validada" && !notesInput) {
      this.showToast("Por favor incluye una nota u observación pedagógica de acompañamiento.", "warning");
      return;
    }

    // "Descartada": se registra "Falso Positivo" como observación
    const finalNotes = decision === "Descartada" ? "Falso Positivo" : notesInput;

    const data = getSavedData();
    const tutorName = data.users.tutor.name;

    await ApiService.validatePreAlert(
      this.selectedStudentForValidation.id,
      this.selectedStudentForValidation.preAlert.id,
      decision,
      finalNotes,
      tutorName
    );

    this.closeAllModals();
    this.showToast(
      decision === "Validada"
        ? "Pre-alerta confirmada. Caso canalizado a Bienestar Estudiantil."
        : "Pre-alerta descartada como falso positivo. Indicador calibrado.",
      "success"
    );

    const activeFilterBtn = document.querySelector(".alert-filter-btn.active");
    const currentFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : "all";
    this.renderTutorAlerts(currentFilter);
    this.renderAllStudentsTable();
  },

  /* =================================================================
     VISTA 3: DIRECTIVO Y SIMULADOR FINANCIERO (HU07, HU09, HU10)
     ================================================================= */
  async renderExecutiveView() {
    const summary = await ApiService.getDashboardSummary();

    // Actualizar KPIs
    document.getElementById("kpiTotalMonitored").textContent = summary.totalMonitored;
    document.getElementById("kpiAtRisk").textContent = summary.studentsAtRisk;
    document.getElementById("kpiPendingAlerts").textContent = summary.pendingPreAlerts;
    document.getElementById("kpiAvgAttendance").textContent = `${summary.avgAttendance}%`;
    document.getElementById("kpiAvgGPA").textContent = summary.avgGPA;

    // Distribución por nivel de riesgo
    document.getElementById("distCritico").textContent = summary.riskDistribution.critico;
    document.getElementById("distAlto").textContent = summary.riskDistribution.alto;
    document.getElementById("distMedio").textContent = summary.riskDistribution.medio;
    document.getElementById("distBajo").textContent = summary.riskDistribution.bajo;
  },

  initFinancialSimulator() {
    this.updateFinancialSimulation();
  },

  updateFinancialSimulation() {
    const totalStudents = parseInt(document.getElementById("simStudents").value, 10);
    const baselineDropoutRate = parseFloat(document.getElementById("simDropoutRate").value);
    const semesterTuitionCOP = parseInt(document.getElementById("simTuition").value, 10);
    const interventionSuccessRate = parseInt(document.getElementById("simRetentionRate").value, 10);
    const annualPlatformCostCOP = parseInt(document.getElementById("simPlatformCost").value, 10);

    // Actualizar etiquetas de valores junto a sliders
    document.getElementById("valSimStudents").textContent = totalStudents.toLocaleString("es-CO");
    document.getElementById("valSimDropoutRate").textContent = `${baselineDropoutRate.toFixed(1)}%`;
    document.getElementById("valSimTuition").textContent = FinancialSimulator.formatCOP(semesterTuitionCOP);
    document.getElementById("valSimRetentionRate").textContent = `${interventionSuccessRate}%`;
    document.getElementById("valSimPlatformCost").textContent = FinancialSimulator.formatCOP(annualPlatformCostCOP);

    // Ejecutar cálculo del simulador (HU10)
    const result = FinancialSimulator.calculateImpact({
      totalStudents,
      baselineDropoutRate,
      semesterTuitionCOP,
      interventionSuccessRate,
      annualPlatformCostCOP
    });

    // Actualizar tarjetas de salida
    document.getElementById("resRoiPercentage").textContent = `${result.roiPercentage}%`;
    document.getElementById("resRetainedStudents").textContent = `${result.studentsRetained} estudiantes`;
    document.getElementById("resRevenuePreserved").textContent = FinancialSimulator.formatCOP(result.annualRevenuePreserved);
    document.getElementById("resNetBenefit").textContent = FinancialSimulator.formatCOP(result.netEconomicBenefit);
    document.getElementById("resAnnualLoss").textContent = FinancialSimulator.formatCOP(result.annualLossWithoutIntervention);
    document.getElementById("resCostPerRetained").textContent = FinancialSimulator.formatCOP(result.costPerRetainedStudent);
  },

  /* =================================================================
     HELPERS MODALES Y TOASTS
     ================================================================= */
  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add("show");
  },

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.remove("show"));
    this.selectedStudentForValidation = null;
  },

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    if (type === "warning") toast.style.borderLeftColor = "var(--status-medium)";
    if (type === "success") toast.style.borderLeftColor = "var(--status-low)";
    if (type === "danger") toast.style.borderLeftColor = "var(--red-primary)";

    toast.innerHTML = `
      <span>${type === 'success' ? '✓' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

