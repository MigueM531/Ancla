/**
 * ANCLA - Controlador del Padrón Académico y Base de Datos (HU03)
 * Facultad de Ingenierías - Universidad de Medellín
 * 
 * Funcionalidades:
 * - Padrón consolidado de estudiantes en monitoreo
 * - Filtros por texto, programa académico y nivel de riesgo
 * - Inspección detallada de notas y asistencias por materia
 * - Sincronización masiva con el sistema institucional de la Universidad
 */


const AcademicoApp = {
  titleMap: {
    "view-academic": "Base de Datos y Monitoreo Académico Institucional"
  },
  currentStudents: [],

  async init() {
    this.bindSearchAndFilters();
    this.bindSyncButton();
    await this.loadAndRenderStudents();
  },

  /**
   * Vincula la barra de búsqueda y selectores de filtro
   */
  bindSearchAndFilters() {
    const searchInput = document.getElementById("searchStudentInput");
    const riskFilter = document.getElementById("filterRiskSelect");
    const programFilter = document.getElementById("filterProgramSelect");

    if (searchInput) {
      searchInput.addEventListener("input", () => this.filterStudents());
    }
    if (riskFilter) {
      riskFilter.addEventListener("change", () => this.filterStudents());
    }
    if (programFilter) {
      programFilter.addEventListener("change", () => this.filterStudents());
    }
  },

  /**
   * Botón de sincronización con el sistema institucional de notas (HU03)
   */
  bindSyncButton() {
    const btnSync = document.getElementById("btnSyncAcademicData");
    if (btnSync) {
      btnSync.addEventListener("click", async () => {
        btnSync.disabled = true;
        btnSync.innerHTML = "⏳ Sincronizando con UdeMedellín...";

        try {
          const res = await ApiService.syncAcademicData();
          SharedApp.showToast(`Sincronización simulada: ${res.studentsCount} registros reevaluados.`, "success");
          await this.loadAndRenderStudents();
          SharedApp.updatePendingAlertsBadge();
        } catch (err) {
          SharedApp.showToast(err.message === "PERMISSION_DENIED" ? "Tu rol no tiene permiso para sincronizar datos." : "Error en la sincronización institucional", "danger");
        } finally {
          btnSync.disabled = false;
          btnSync.innerHTML = "🔄 Sincronizar con Sistema Institucional";
        }
      });
    }
  },

  /**
   * Carga los estudiantes de la capa de datos
   */
  async loadAndRenderStudents() {
    try {
      this.currentStudents = await ApiService.getStudents();
      // El filtro de programas se construye con los programas reales del padrón
      const sel = document.getElementById("filterProgramSelect");
      if (sel) {
        const keep = sel.value;
        const programs = [...new Set(this.currentStudents.map((s) => s.program))].sort();
        sel.innerHTML = '<option value="all">Todos los Programas</option>' +
          programs.map((p) => `<option value="${SharedApp.escapeHtml(p)}">${SharedApp.escapeHtml(p)}</option>`).join("");
        if (programs.includes(keep)) sel.value = keep;
      }
      this.filterStudents();
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
      SharedApp.showToast("Error al cargar padrón de estudiantes", "danger");
    }
  },

  /**
   * Aplica los filtros combinados
   */
  filterStudents() {
    const searchQuery = (document.getElementById("searchStudentInput")?.value || "").toLowerCase().trim();
    const selectedRisk = document.getElementById("filterRiskSelect")?.value || "all";
    const selectedProgram = document.getElementById("filterProgramSelect")?.value || "all";

    let filtered = [...this.currentStudents];

    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery) ||
          s.id.toLowerCase().includes(searchQuery) ||
          s.program.toLowerCase().includes(searchQuery)
      );
    }

    if (selectedRisk !== "all") {
      filtered = filtered.filter((s) => s.riskLevel.toLowerCase() === selectedRisk.toLowerCase());
    }

    if (selectedProgram !== "all") {
      filtered = filtered.filter((s) => s.program.toLowerCase().includes(selectedProgram.toLowerCase()));
    }

    this.renderStudentsTable(filtered);
  },

  /**
   * Renderiza las filas de la tabla de estudiantes
   */
  renderStudentsTable(students) {
    const tbody = document.getElementById("studentsTableBody");
    const countBadge = document.getElementById("filteredCountBadge");

    if (countBadge) countBadge.textContent = `${students.length} estudiantes`;
    if (!tbody) return;

    if (students.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding:32px; color:var(--text-muted);">
            No se encontraron estudiantes con los criterios de búsqueda especificados.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = students
      .map((s) => {
        const riskClass = SharedApp.riskClass(s.riskLevel);
        const p = s.perceptions || {};
        const stressIcon = p.stressLevel >= 4 ? "🔴" : p.stressLevel === 3 ? "🟡" : "🟢";
        const wellbeingIcon = p.emotionalWellbeing <= 2 ? "🌧️" : p.emotionalWellbeing === 3 ? "🌤️" : "☀️";

        const coursesHtml = s.courses
          ? s.courses
              .map(
                (c) => `
                <div class="course-mini-card">
                  <div>
                    <span style="font-weight:600; color:var(--text-white);">${SharedApp.escapeHtml(c.name)}</span>
                    <div style="font-size:0.72rem; color:var(--text-muted);">Asist: ${c.attendance}%</div>
                  </div>
                  <span class="badge-risk ${c.grade >= 3.0 ? "bajo" : "critico"}">Nota: ${c.grade.toFixed(1)}</span>
                </div>
              `
              )
              .join("")
          : "Sin asignaturas";

        return `
          <tr>
            <td>
              <div style="font-weight: 700; color: var(--text-white);">${SharedApp.escapeHtml(s.name)}</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">${SharedApp.escapeHtml(s.id)} • ${SharedApp.escapeHtml(s.program)} (Sem. ${Number(s.semester)})</div>
            </td>
            <td>
              <span style="font-weight: 700; font-size: 0.95rem; color: ${s.averageGrade >= 3.0 ? "var(--text-white)" : "var(--red-hover)"};">
                ${s.averageGrade.toFixed(1)}
              </span>
              <div style="font-size: 0.72rem; color: var(--text-muted);">Escala 0.0 - 5.0</div>
            </td>
            <td>
              <span style="font-weight: 600; color: ${s.attendanceRate >= 80 ? "var(--status-low)" : "var(--red-hover)"};">
                ${s.attendanceRate}%
              </span>
              <div style="font-size: 0.72rem; color: var(--text-muted);">${s.attendanceRate >= 80 ? "Cumple mínimo" : "Bajo umbral (80%)"}</div>
            </td>
            <td>
              <div style="display:flex; align-items:center; gap:8px;">
                <span title="Estrés emocional: ${p.stressLevel || 'N/A'}/5">${stressIcon} Estrés ${p.stressLevel || '-'}/5</span>
                <span title="Bienestar emocional: ${p.emotionalWellbeing || 'N/A'}/5">${wellbeingIcon} Bienestar ${p.emotionalWellbeing || '-'}/5</span>
              </div>
            </td>
            <td>
              <span class="badge-risk ${riskClass}">
                ${SharedApp.escapeHtml(s.riskLevel)}
              </span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm" onclick="AcademicoApp.toggleCourseDetails('${SharedApp.escapeHtml(s.id)}')">
                🔍 Asignaturas
              </button>
            </td>
          </tr>
          <tr id="details-${SharedApp.escapeHtml(s.id)}" style="display: none; background: rgba(0,0,0,0.18);">
            <td colspan="6" style="padding: 16px 20px;">
              <div class="student-detail-box">
                <div style="font-size: 0.82rem; font-weight: 700; color: var(--text-white); margin-bottom: 8px;">
                  📚 Asignaturas Inscritas y Registro Académico Individual:
                </div>
                <div class="courses-mini-grid">
                  ${coursesHtml}
                </div>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  },

  /**
   * Alterna la visualización del desglose de asignaturas
   */
  toggleCourseDetails(studentId) {
    const row = document.getElementById(`details-${studentId}`);
    if (row) {
      row.style.display = row.style.display === "none" ? "table-row" : "none";
    }
  }
};

