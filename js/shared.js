/**
 * ANCLA - Módulo Compartido (SharedApp)
 * Universidad de Medellín - Facultad de Ingenierías
 * 
 * Gestiona utilidades globales compartidas por todas las vistas:
 * - Cambio y sincronización de roles (Directivo, Tutor, Estudiante)
 * - Pestañas de navegación interna
 * - Gestión de modales (Privacidad, Validación)
 * - Notificaciones flotantes (Toast)
 * - Contador dinámico de alertas pendientes
 */

const SharedApp = {
  currentRole: null,

  escapeHtml(v) {
    return String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  },

  // "Crítico" -> "critico" (las clases CSS no llevan tilde)
  riskClass(level) {
    return String(level || "bajo").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  },

  plural(n, singular, plural) {
    return `${n} ${n === 1 ? singular : plural}`;
  },

  bindGlobalEvents() {
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") this.closeAllModals(); });
    // Sincronización entre pestañas (el evento "storage" solo se dispara en las OTRAS pestañas)
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return;
      this.updatePendingAlertsBadge();
      document.dispatchEvent(new CustomEvent("ancla:data-changed"));
    });
  },

  /** Padrón de estudiantes (compartido por Directivo y Tutor) */
  async renderStudentsTable(tbodyId = "allStudentsTableBody") {
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return;
    const esc = (v) => this.escapeHtml(v);
    try {
      const students = await ApiService.getStudents();
      tbody.innerHTML = students.map((s) => {
        const p = s.perceptions;
        return `
          <tr>
            <td><div class="student-col">
              <div class="user-avatar" style="width:32px; height:32px; font-size:0.75rem;">${esc(s.name.slice(0, 2).toUpperCase())}</div>
              <div class="student-col-info"><h5>${esc(s.name)}</h5><span>${esc(s.id)} • ${esc(s.program)}</span></div>
            </div></td>
            <td><strong>${s.averageGrade.toFixed(1)}</strong> / 5.0</td>
            <td><div style="display:flex; align-items:center; gap:8px;">
              <span>${s.attendanceRate}%</span>
              <div style="width:50px; height:4px; background:var(--bg-badge-gray); border-radius:2px; overflow:hidden;">
                <div style="width:${s.attendanceRate}%; height:100%; background:${s.attendanceRate < 80 ? "var(--red-primary)" : "var(--status-low)"};"></div>
              </div></div></td>
            <td><div style="font-size:0.78rem; color:var(--text-secondary);">${p ? `Estrés: ${p.stressLevel} / 5 | Carga: ${p.academicLoad} / 5` : "Sin datos de bienestar"}</div></td>
            <td><span class="badge-risk ${this.riskClass(s.riskLevel)}">${esc(s.riskLevel)}</span></td>
          </tr>`;
      }).join("");
    } catch (err) {
      console.error("Error al cargar estudiantes:", err);
    }
  },

  init(role, titleMap = {}) {
    this.currentRole = role;
    this.syncCurrentRoleState();
    this.bindRoleSwitcher();
    this.bindNavigationTabs(titleMap);
    this.bindModalTriggers();
    this.bindMobileMenu();
    this.bindResetDemo();
    this.updatePendingAlertsBadge();
    this.renderUserInfo();
    this.bindGlobalEvents();
  },

  /**
   * Guarda el rol actual en almacenamiento local
   */
  syncCurrentRoleState() {
    if (this.currentRole) {
      localStorage.setItem("ancla_current_role", this.currentRole);
    }
  },

  /**
   * Obtiene la ruta relativa correcta al archivo de vista según la ubicación actual
   */
  resolveViewUrl(targetRole) {
    const isInsideViews = window.location.pathname.includes("/views/");
    const filename = `${targetRole}.html`;
    return isInsideViews ? filename : `views/${filename}`;
  },

  /**
   * Vincula el selector de rol del sidebar con redirección inmediata
   */
  bindRoleSwitcher() {
    const roleSelect = document.getElementById("roleSelect");
    if (!roleSelect) return;

    if (this.currentRole) {
      roleSelect.value = this.currentRole;
    }

    roleSelect.addEventListener("change", (e) => {
      const newRole = e.target.value;
      if (newRole === this.currentRole) return;

      localStorage.setItem("ancla_current_role", newRole);
      this.showToast(`Cambiando a vista de ${newRole.toUpperCase()}...`, "info");

      setTimeout(() => {
        window.location.href = this.resolveViewUrl(newRole);
      }, 150);
    });
  },

  /**
   * Actualiza la información del perfil del usuario en el sidebar
   */
  renderUserInfo() {
    if (!this.currentRole) return;
    const data = getSavedData();
    const roleKeyMap = {
      directivo: "executive",
      tutor: "tutor",
      estudiante: "student"
    };
    const userKey = roleKeyMap[this.currentRole] || this.currentRole;
    const user = data.users[userKey];
    if (!user) return;

    const nameEl = document.getElementById("sidebarUserName");
    const roleEl = document.getElementById("sidebarUserRole");
    const avatarEl = document.getElementById("sidebarUserAvatar");

    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.roleLabel;
    if (avatarEl) avatarEl.textContent = user.avatar;
  },

  /**
   * Manejo de pestañas internas dentro del dashboard activo
   */
  bindNavigationTabs(titleMap = {}) {
    const navLinks = document.querySelectorAll("[data-view]");
    navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = link.dataset.view;
        if (targetView) {
          this.navigateToView(targetView, titleMap);
        }
      });
    });
  },

  navigateToView(viewId, titleMap = {}) {
    // Actualizar enlace activo en sidebar
    document.querySelectorAll(".nav-link[data-view]").forEach((l) => {
      l.classList.toggle("active", l.dataset.view === viewId);
    });

    // Mostrar sección correspondiente
    document.querySelectorAll(".view-section").forEach((sec) => {
      sec.classList.toggle("active", sec.id === viewId);
    });

    // Actualizar título de la página
    const pageTitleEl = document.getElementById("pageTitle");
    if (pageTitleEl && titleMap[viewId]) {
      pageTitleEl.textContent = titleMap[viewId];
    }
  },

  /**
   * Control de apertura y cierre de modales
   */
  bindModalTriggers() {
    // Botón para abrir modal de términos de privacidad
    const btnPrivacy = document.getElementById("btnOpenPrivacyModal");
    if (btnPrivacy) {
      btnPrivacy.addEventListener("click", (e) => {
        e.preventDefault();
        this.openModal("modalPrivacy");
      });
    }

    // Botones con trigger de cierre
    document.querySelectorAll(".modal-close-trigger").forEach((btn) => {
      btn.addEventListener("click", () => this.closeAllModals());
    });

    // Cierre al pulsar el fondo oscuro
    document.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.closeAllModals();
      });
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("show");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
    }
  },

  closeAllModals() {
    document.querySelectorAll(".modal-backdrop").forEach((m) => m.classList.remove("show"));
  },

  /**
   * Notificaciones flotantes tipo Toast
   */
  showToast(message, type = "info") {
    let container = document.getElementById("toastContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    if (type === "warning") toast.style.borderLeftColor = "var(--status-medium)";
    if (type === "success") toast.style.borderLeftColor = "var(--status-low)";
    if (type === "danger") toast.style.borderLeftColor = "var(--red-primary)";

    const icon = document.createElement("span");
    icon.textContent = type === "success" ? "✓" : type === "warning" ? "⚠️" : type === "danger" ? "✕" : "ℹ️";
    const msg = document.createElement("span");
    msg.textContent = message; // textContent: evita inyección de HTML
    toast.append(icon, msg);

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(40px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  /**
   * Actualiza el badge de pre-alertas pendientes en el sidebar
   */
  async updatePendingAlertsBadge() {
    const badge = document.getElementById("pendingAlertsCountBadge");
    if (!badge) return;
    try {
      const students = await ApiService.getStudents();
      const pendingCount = students.filter((s) => s.preAlert && s.preAlert.status === "Pendiente").length;
      badge.textContent = pendingCount;
    } catch (err) {
      console.warn("No se pudo actualizar el badge de alertas:", err);
    }
  },

  /**
   * Vincula la apertura y cierre del menú lateral en dispositivos móviles
   */
  bindMobileMenu() {
    const btnToggle = document.getElementById("btnToggleMobileMenu");
    const sidebar = document.querySelector(".sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");

    if (btnToggle && sidebar) {
      btnToggle.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        if (backdrop) backdrop.classList.toggle("active");
      });
    }

    if (backdrop && sidebar) {
      backdrop.addEventListener("click", () => {
        sidebar.classList.remove("open");
        backdrop.classList.remove("active");
      });
    }

    // Cerrar sidebar al hacer clic en un enlace en móvil
    document.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.innerWidth <= 768 && sidebar) {
          sidebar.classList.remove("open");
          if (backdrop) backdrop.classList.remove("active");
        }
      });
    });
  },

  /**
   * Permite restablecer los datos locales de prueba al estado inicial
   */
  bindResetDemo() {
    const btnReset = document.getElementById("btnResetDemoData");
    if (btnReset) {
      btnReset.addEventListener("click", () => {
        const confirmReset = window.confirm("¿Deseas restablecer todos los datos del prototipo al estado inicial de demostración?");
        if (confirmReset) {
          localStorage.removeItem(STORAGE_KEY);
          this.showToast("Datos de demostración reiniciados. Recargando...", "info");
          setTimeout(() => {
            window.location.reload();
          }, 350);
        }
      });
    }
  }
};
