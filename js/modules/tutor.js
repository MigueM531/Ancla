/**
 * ANCLA - Controlador de Vista Tutor / Bienestar Universitario
 * Universidad de Medellín - Facultad de Ingenierías
 * 
 * Funcionalidades:
 * - Bandeja de pre-alertas tempranas con filtros por estado
 * - Flujo de supervisión humana obligatoria (Validar / Descartar)
 * - Padrón de monitoreo integral de estudiantes
 */

document.addEventListener("DOMContentLoaded", () => {
  TutorApp.init();
});

const TutorApp = {
  titleMap: {
    "view-tutor": "Bandeja de Supervisión y Validación de Pre-Alertas",
    "view-students-table": "Monitoreo Integral de Estudiantes"
  },
  selectedStudentForValidation: null,

  init() {
    SharedApp.init("tutor");
    SharedApp.bindNavigationTabs(this.titleMap);
    this.bindFilterTabs();
    this.bindValidationActions();
    this.renderTutorAlerts("all");
    this.renderAllStudentsTable();
  },

  /**
   * Vincula las pestañas de filtro de alertas
   */
  bindFilterTabs() {
    const filterTabs = document.querySelectorAll(".alert-filter-btn");
    filterTabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        filterTabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.renderTutorAlerts(btn.dataset.filter);
      });
    });
  },

  /**
   * Vincula las acciones del modal de supervisión humana
   */
  bindValidationActions() {
    const btnConfirmAlert = document.getElementById("btnConfirmAlert");
    const btnDismissAlert = document.getElementById("btnDismissAlert");

    if (btnConfirmAlert) {
      btnConfirmAlert.addEventListener("click", () => this.submitAlertValidation("Validada"));
    }
    if (btnDismissAlert) {
      btnDismissAlert.addEventListener("click", () => this.submitAlertValidation("Descartada"));
    }
  },

  /**
   * Carga y renderiza la tabla de pre-alertas con filtros
   */
  async renderTutorAlerts(filter = "all") {
    try {
      const students = await ApiService.getStudents();
      const tbody = document.getElementById("tutorAlertsTableBody");
      const badgeCount = document.getElementById("pendingAlertsCountBadge");

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
            <td colspan="6" style="text-align:center; padding:36px; color:var(--text-muted);">
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
                      onclick="TutorApp.openValidationModal('${s.id}')">
                ${pa.status === "Pendiente" ? "Supervisar / Validar" : "Ver Registro"}
              </button>
            </td>
          </tr>
        `;
        })
        .join("");
    } catch (err) {
      console.error("Error al renderizar alertas de tutor:", err);
    }
  },

  /**
   * Renderiza el padrón de todos los estudiantes
   */
  async renderAllStudentsTable() {
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
      console.error("Error al cargar padrón de estudiantes:", err);
    }
  },

  /**
   * Abre el modal de validación humana obligatoria
   */
  async openValidationModal(studentId) {
    try {
      const students = await ApiService.getStudents();
      const student = students.find((s) => s.id === studentId);
      if (!student || !student.preAlert) return;

      this.selectedStudentForValidation = student;

      // Poblar campos del modal
      document.getElementById("modalStudentName").textContent = `${student.name} (${student.program})`;
      document.getElementById("modalRuleDetails").textContent = student.preAlert.ruleTriggered;
      document.getElementById("modalAcademicStats").innerHTML = `
        <strong>Promedio:</strong> ${student.averageGrade.toFixed(1)} | 
        <strong>Asistencia:</strong> ${student.attendanceRate}% | 
        <strong>Estrés reportado:</strong> ${student.perceptions.stressLevel}/5
      `;
      document.getElementById("tutorNotesInput").value = student.preAlert.tutorNotes || "";

      SharedApp.openModal("modalValidation");
    } catch (err) {
      console.error("Error al abrir modal de validación:", err);
    }
  },

  /**
   * Procesa la decisión del tutor: Validar u Oficializar vs Descartar como Falso Positivo
   */
  async submitAlertValidation(decision) {
    if (!this.selectedStudentForValidation) return;

    const notesInput = document.getElementById("tutorNotesInput").value.trim();

    // La validación exige nota pedagógica
    if (decision === "Validada" && !notesInput) {
      SharedApp.showToast("Por favor incluye una nota u observación pedagógica de acompañamiento.", "warning");
      return;
    }

    // Descarte por falso positivo asigna automáticamente la nota
    const finalNotes = decision === "Descartada" ? "Falso Positivo" : notesInput;

    const data = getSavedData();
    const tutorName = data.users.tutor.name;

    try {
      await ApiService.validatePreAlert(
        this.selectedStudentForValidation.id,
        this.selectedStudentForValidation.preAlert.id,
        decision,
        finalNotes,
        tutorName
      );

      SharedApp.closeAllModals();
      SharedApp.showToast(
        decision === "Validada"
          ? "Pre-alerta confirmada. Caso canalizado a Bienestar Estudiantil."
          : "Pre-alerta descartada como falso positivo. Indicador calibrado.",
        "success"
      );

      const activeFilterBtn = document.querySelector(".alert-filter-btn.active");
      const currentFilter = activeFilterBtn ? activeFilterBtn.dataset.filter : "all";
      this.renderTutorAlerts(currentFilter);
      this.renderAllStudentsTable();
      SharedApp.updatePendingAlertsBadge();
    } catch (err) {
      console.error("Error al registrar decisión:", err);
      SharedApp.showToast("Error al guardar la validación de la pre-alerta", "danger");
    }
  }
};
