/**
 * ANCLA - Privacidad, Consentimiento y Roles (HU01, HU02)
 * Pestaña del panel Directivo: estado del consentimiento (solo lectura), matriz de permisos
 * aplicada por ApiService y registro de auditoría.
 */
const PrivacidadApp = {
  async init() {
    await Promise.all([this.renderConsentStatus(), this.renderRoleMatrix(), this.renderAuditLogs()]);
  },

  // El consentimiento solo lo cambia la persona titular desde su portal (permiso own_consent)
  renderConsentStatus() {
    const student = getSavedData().users.student;
    const badge = document.getElementById("consentStateBadge");
    const text = document.getElementById("consentDateText");
    if (badge) {
      badge.textContent = student.privacyConsentAccepted ? "Estado: Autorizado" : "Estado: Revocado / Pendiente";
      badge.className = `badge-risk ${student.privacyConsentAccepted ? "bajo" : "critico"}`;
    }
    if (text) {
      text.textContent = student.privacyConsentAccepted
        ? `Última aceptación registrada: ${student.consentDate || "N/D"}`
        : "No hay consentimiento activo: los datos de bienestar no se conservan ni se comparten.";
    }
  },

  async renderRoleMatrix() {
    const tbody = document.getElementById("roleMatrixTableBody");
    if (!tbody) return;
    const cell = (ok) => (ok ? '<span class="role-perm-check">✓ Permitido</span>' : '<span class="role-perm-cross">✕ No</span>');
    try {
      const matrix = await ApiService.getRoleMatrix();
      tbody.innerHTML = matrix.map((r) => `
        <tr>
          <td style="font-weight:600; color:var(--text-white);">${SharedApp.escapeHtml(r.permission)}</td>
          ${["estudiante", "tutor", "directivo", "admin"].map((k) => `<td style="text-align:center;">${cell(r[k])}</td>`).join("")}
        </tr>`).join("");
    } catch (err) {
      console.error("Error al cargar matriz de roles:", err);
    }
  },

  async renderAuditLogs() {
    const box = document.getElementById("auditLogsContainer");
    if (!box) return;
    try {
      const logs = [...(await ApiService.getAuditLogs())].sort((a, b) => b.date.localeCompare(a.date));
      box.innerHTML = logs.map((l) => `
        <div class="audit-item">
          <div>
            <span style="font-weight:600; color:var(--text-white);">${SharedApp.escapeHtml(l.action)}</span>
            <div style="font-size:0.74rem; color:var(--text-muted);">Usuario: ${SharedApp.escapeHtml(l.user)} • IP: ${SharedApp.escapeHtml(l.ip)}</div>
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); text-align:right;">${SharedApp.escapeHtml(l.date)}</div>
        </div>`).join("");
    } catch (err) {
      console.error("Error al cargar auditoría:", err);
    }
  }
};
