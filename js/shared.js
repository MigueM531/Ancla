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
    const navLinks = document.querySelectorAll(".nav-link[data-view]");
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
    if (modal) modal.classList.add("show");
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

    toast.innerHTML = `
      <span>${type === "success" ? "✓" : type === "warning" ? "⚠️" : type === "danger" ? "✕" : "ℹ️"}</span>
      <span>${message}</span>
    `;

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
          localStorage.removeItem("ancla_data_v1");
          this.showToast("Datos de demostración reiniciados. Recargando...", "info");
          setTimeout(() => {
            window.location.reload();
          }, 350);
        }
      });
    }
  }
};
