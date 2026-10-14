/**
 * PROYECTO ANCLA - FRONTEND FUNCIONAL
 * Sistema de Monitoreo Temprano, Análisis y Alerta de Retención Estudiantil
 * Facultad de Ingenierías - Universidad de Medellín
 * 
 * Arquitectura: Monolítica Modular de Tres Capas (Capa de Presentación)
 * Este archivo gestiona el estado, la interacción por roles y la simulación
 * de servicios de backend para la posterior integración con API REST.
 */

// ================= ESTADO CENTRALIZADO (MOCK STORE) =================
const AppState = {
  // Rol actual: 'student' | 'tutor' | 'director'
  currentRole: 'student',

  // Datos del estudiante en sesión
  studentData: {
    id: "UDEM-2024-8192",
    name: "Mateo Gómez Ríos",
    program: "Ingeniería de Sistemas",
    semester: 2,
    consentAccepted: true,
    consentDate: "2026-08-01",
    courses: [
      { code: "SIS-201", name: "Cálculo Diferencial", grade: 2.7, attendance: 78, credits: 4, status: "risk" },
      { code: "SIS-202", name: "Algoritmos y Estructuras I", grade: 3.8, attendance: 92, credits: 3, status: "good" },
      { code: "FIS-101", name: "Física Mecánica", grade: 3.1, attendance: 82, credits: 4, status: "warning" },
      { code: "HUM-105", name: "Competencias Comunicativas", grade: 4.4, attendance: 96, credits: 2, status: "good" },
      { code: "ING-110", name: "Introducción a la Ingeniería", grade: 4.0, attendance: 90, credits: 2, status: "good" }
    ],
    lastSurveyDate: "2026-09-28"
  },

  // Bandeja de Pre-Alertas para Tutores (HU05, HU06)
  preAlerts: [
    {
      id: "ALT-101",
      studentName: "Valentina Cardona Maya",
      program: "Ingeniería Civil",
      semester: 1,
      riskLevel: "critical", // 'critical' | 'moderate' | 'stable'
      triggers: [
        "Asistencia en Geometría Vectorial al 71% (< 80%)",
        "Calificación acumulada en 2.4 (< 3.0)",
        "Percepción emocional: Nivel de agobio 5/5"
      ],
      date: "Hace 2 horas",
      status: "pending", // 'pending' | 'validated' | 'discarded'
      tutorNotes: ""
    },
    {
      id: "ALT-102",
      studentName: "Santiago Restrepo Londoño",
      program: "Ingeniería de Sistemas",
      semester: 2,
      riskLevel: "critical",
      triggers: [
        "Inasistencia continua de 3 semanas en Álgebra Lineal",
        "Reporte voluntario: Solicitud de orientación vocacional"
      ],
      date: "Hace 5 horas",
      status: "pending",
      tutorNotes: ""
    },
    {
      id: "ALT-103",
      studentName: "Laura Marcela Osorio",
      program: "Ingeniería Industrial",
      semester: 3,
      riskLevel: "moderate",
      triggers: [
        "Baja en rendimiento de Termodinámica (2.8)",
        "Carga académica percibida: 'Muy pesada'"
      ],
      date: "Ayer",
      status: "pending",
      tutorNotes: ""
    },
    {
      id: "ALT-104",
      studentName: "Felipe Quintero Soto",
      program: "Ingeniería Ambiental",
      semester: 1,
      riskLevel: "moderate",
      triggers: [
        "Asistencia al 79% en Química General",
        "Nota parcial 2.9"
      ],
      date: "Hace 2 días",
      status: "validated",
      tutorNotes: "Caso validado. Se agendó tutoría personalizada con el monitor de cátedra el 10/10."
    },
    {
      id: "ALT-105",
      studentName: "Camila Andrea Vega",
      program: "Ingeniería Financiera",
      semester: 2,
      riskLevel: "moderate",
      triggers: [
        "Reportó estrés alto en encuesta",
        "Rendimiento académico actual estable (3.9)"
      ],
      date: "Hace 3 días",
      status: "discarded",
      tutorNotes: "Falso positivo académico. La estudiante tenía entrega de proyecto pero no presenta riesgo de deserción."
    }
  ],

  // Parámetros del Simulador Financiero (HU09, HU10)
  financialModel: {
    studentsRescued: 18,
    averageTuition: 4800000, // COP
    operationalCost: 15000000 // Costo semestral infraestructura y monitoreo
  },

  // Estado temporal de la encuesta activa
  surveyForm: {
    step: 1,
    emotionalRating: 3,
    workloadRating: 'manageable',
    needSupport: 'no'
  },

  // Modal activo
  activeModalAlertId: null
};

// ================= INICIALIZACIÓN =================
document.addEventListener('DOMContentLoaded', () => {
  initRoleNavigation();
  initStudentView();
  initTutorView();
  initDirectorView();
  initModals();
  updateUIForCurrentRole();
  renderStudentCourses();
  renderPreAlerts();
  updateFinancialSimulator();
});

// ================= NAVEGACIÓN Y CONTROL DE ROLES (HU02) =================
function initRoleNavigation() {
  const roleButtons = document.querySelectorAll('.role-pill');
  roleButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const selectedRole = btn.getAttribute('data-role');
      switchRole(selectedRole);
    });
  });

  // Navegación por menú lateral
  const navItems = document.querySelectorAll('.nav-item[data-target]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetRole = item.getAttribute('data-target');
      switchRole(targetRole);
    });
  });
}

function switchRole(role) {
  AppState.currentRole = role;

  // Actualizar botones de selector
  document.querySelectorAll('.role-pill').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-role') === role);
  });

  // Actualizar sidebar nav items
  document.querySelectorAll('.nav-item[data-target]').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-target') === role);
  });

  // Actualizar badge y texto de perfil en la cabecera
  const userRoleTag = document.getElementById('user-role-badge');
  const userNameElem = document.getElementById('user-display-name');
  const userAvatarElem = document.getElementById('user-avatar-initials');

  if (role === 'student') {
    userRoleTag.textContent = "Estudiante";
    userNameElem.textContent = "Mateo Gómez Ríos";
    userAvatarElem.textContent = "MG";
    document.getElementById('header-title').textContent = "Portal del Estudiante";
    document.getElementById('header-subtitle').textContent = "Facultad de Ingenierías | Monitoreo y Acompañamiento Preventivo";
  } else if (role === 'tutor') {
    userRoleTag.textContent = "Tutor / Bienestar";
    userNameElem.textContent = "Dra. Carolina Morales";
    userAvatarElem.textContent = "CM";
    document.getElementById('header-title').textContent = "Supervisión Humana y Pre-Alertas";
    document.getElementById('header-subtitle').textContent = "Motor Determinista de Umbrales y Validación Temprana";
  } else if (role === 'director') {
    userRoleTag.textContent = "Coordinador / Directivo";
    userNameElem.textContent = "Decanatura de Ingenierías";
    userAvatarElem.textContent = "DI";
    document.getElementById('header-title').textContent = "Dashboard Estratégico y Sostenibilidad";
    document.getElementById('header-subtitle').textContent = "Retención Estudiantil, Viabilidad Financiera y Retorno de Inversión";
  }

  updateUIForCurrentRole();
}

function updateUIForCurrentRole() {
  document.querySelectorAll('.view-section').forEach(view => {
    view.classList.remove('active');
  });

  const activeView = document.getElementById(`view-${AppState.currentRole}`);
  if (activeView) {
    activeView.classList.add('active');
  }

  // Notificación de cambio de contexto
  showToast(`Cambiado al perfil: ${AppState.currentRole.toUpperCase()}`);
}

// ================= MÓDULO ESTUDIANTE (HU01, HU03, HU04) =================
function initStudentView() {
  // Botones de la micro-encuesta (Typeform)
  setupTypeformSurvey();

  // Botón de consentimiento de privacidad
  const btnManageConsent = document.getElementById('btn-open-consent-modal');
  if (btnManageConsent) {
    btnManageConsent.addEventListener('click', () => {
      openModal('modal-privacy-consent');
    });
  }

  const btnAcceptConsent = document.getElementById('btn-confirm-consent');
  if (btnAcceptConsent) {
    btnAcceptConsent.addEventListener('click', () => {
      AppState.studentData.consentAccepted = true;
      document.getElementById('consent-status-badge').innerHTML = '✅ Consentimiento Activo (Protección de datos garantizada)';
      document.getElementById('consent-status-badge').className = 'badge badge-risk-stable';
      closeModal('modal-privacy-consent');
      showToast("Tus preferencias de privacidad y consentimiento han sido actualizadas.");
    });
  }
}

function renderStudentCourses() {
  const tableBody = document.getElementById('student-courses-tbody');
  if (!tableBody) return;

  tableBody.innerHTML = '';
  AppState.studentData.courses.forEach(course => {
    const tr = document.createElement('tr');
    
    // Semaforización de notas y asistencia según umbrales de HU05
    const isGradeRisk = course.grade < 3.0;
    const isAttendanceRisk = course.attendance < 80;

    let gradeBadge = isGradeRisk 
      ? `<span class="badge badge-risk-critical">${course.grade.toFixed(1)} (Bajo)</span>` 
      : `<span class="badge badge-risk-stable">${course.grade.toFixed(1)}</span>`;

    let attendanceBadge = isAttendanceRisk
      ? `<span class="badge badge-risk-critical">${course.attendance}% (Alerta)</span>`
      : `<span class="badge badge-risk-stable">${course.attendance}%</span>`;

    tr.innerHTML = `
      <td><strong>${course.code}</strong> - ${course.name}</td>
      <td>${course.credits}</td>
      <td>${gradeBadge}</td>
      <td>${attendanceBadge}</td>
      <td>
        ${isGradeRisk || isAttendanceRisk 
          ? '<span style="color: var(--red-light); font-weight:600; font-size:0.8rem;">⚠️ Acompañamiento sugerido</span>' 
          : '<span style="color: var(--success-green); font-size:0.8rem;">En orden</span>'}
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

function setupTypeformSurvey() {
  // Manejo de opciones del Paso 1: Estado de ánimo
  document.querySelectorAll('.tf-mood-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-mood-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      AppState.surveyForm.emotionalRating = parseInt(btn.getAttribute('data-value'));
    });
  });

  // Manejo de opciones del Paso 2: Carga de trabajo
  document.querySelectorAll('.tf-load-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-load-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      AppState.surveyForm.workloadRating = btn.getAttribute('data-value');
    });
  });

  // Manejo de opciones del Paso 3: Apoyo
  document.querySelectorAll('.tf-support-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tf-support-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      AppState.surveyForm.needSupport = btn.getAttribute('data-value');
    });
  });

  // Navegación siguiente/anterior de la micro-encuesta
  const btnNext = document.getElementById('tf-btn-next');
  const btnPrev = document.getElementById('tf-btn-prev');

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      if (AppState.surveyForm.step < 3) {
        goToSurveyStep(AppState.surveyForm.step + 1);
      } else {
        submitSurvey();
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener('click', () => {
      if (AppState.surveyForm.step > 1) {
        goToSurveyStep(AppState.surveyForm.step - 1);
      }
    });
  }
}

function goToSurveyStep(stepNumber) {
  AppState.surveyForm.step = stepNumber;

  document.querySelectorAll('.tf-step-slide').forEach(slide => slide.classList.remove('active'));
  const currentSlide = document.getElementById(`tf-step-${stepNumber}`);
  if (currentSlide) currentSlide.classList.add('active');

  // Actualizar barra de progreso y botones
  const fill = document.getElementById('tf-progress-fill');
  const stepBadge = document.getElementById('tf-current-step-badge');
  const btnNext = document.getElementById('tf-btn-next');
  const btnPrev = document.getElementById('tf-btn-prev');

  const percentage = (stepNumber / 3) * 100;
  fill.style.width = `${percentage}%`;
  stepBadge.textContent = `Pregunta ${stepNumber} de 3`;

  btnPrev.style.display = stepNumber === 1 ? 'none' : 'inline-block';
  btnNext.textContent = stepNumber === 3 ? 'Finalizar y Enviar' : 'Continuar →';
}

function submitSurvey() {
  // Simulación de envío a endpoint de backend: POST /api/v1/perceptual-data (HU04)
  const isHighStress = AppState.surveyForm.emotionalRating >= 4 || AppState.surveyForm.workloadRating === 'critical';

  // Si el estudiante reporta sobrecarga crítica, se dispara la regla del motor (HU05)
  if (isHighStress) {
    const newAlert = {
      id: `ALT-${Date.now().toString().slice(-3)}`,
      studentName: AppState.studentData.name,
      program: AppState.studentData.program,
      semester: AppState.studentData.semester,
      riskLevel: "critical",
      triggers: [
        `Percepción Emocional: Sobrecarga crítica registrada (${AppState.surveyForm.workloadRating})`,
        "Cálculo Diferencial con nota parcial de 2.7 y asistencia 78%"
      ],
      date: "Recién reportado",
      status: "pending",
      tutorNotes: ""
    };
    AppState.preAlerts.unshift(newAlert);
    renderPreAlerts();
  }

  // Animación / feedback en la tarjeta de encuesta
  const container = document.getElementById('typeform-survey-card');
  container.innerHTML = `
    <div style="text-align: center; padding: 2.5rem 1rem;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">✨</div>
      <h3 style="color: var(--text-white); font-size: 1.3rem; margin-bottom: 0.5rem;">¡Gracias por compartir cómo te sientes!</h3>
      <p style="color: var(--text-secondary); max-width: 480px; margin: 0 auto 1.5rem; font-size: 0.9rem;">
        Esta información nos permite activar redes de apoyo académico y emocional a tiempo, protegiendo tu permanencia en la UdeM.
      </p>
      <div class="badge badge-risk-stable" style="font-size: 0.85rem; padding: 6px 14px;">
        Registro confidencial procesado exitosamente
      </div>
    </div>
  `;

  showToast("Encuesta registrada en el sistema. Los datos fueron sincronizados.");
}

// ================= MÓDULO TUTOR / BIENESTAR (HU05, HU06, HU08) =================
function initTutorView() {
  // Filtro de riesgo
  const filterSelect = document.getElementById('filter-risk-select');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      renderPreAlerts(filterSelect.value);
    });
  }

  // Búsqueda rápida
  const searchInput = document.getElementById('search-alert-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase();
      renderPreAlerts(filterSelect.value, term);
    });
  }

  // Manejo de botones de validación de supervisión humana (HU06)
  const btnConfirmValidation = document.getElementById('btn-confirm-validation');
  if (btnConfirmValidation) {
    btnConfirmValidation.addEventListener('click', () => {
      confirmHumanValidation('validated');
    });
  }

  const btnConfirmDiscard = document.getElementById('btn-confirm-discard');
  if (btnConfirmDiscard) {
    btnConfirmDiscard.addEventListener('click', () => {
      confirmHumanValidation('discarded');
    });
  }
}

function renderPreAlerts(filterLevel = 'all', searchTerm = '') {
  const container = document.getElementById('pre-alerts-tbody');
  if (!container) return;

  container.innerHTML = '';

  let filtered = AppState.preAlerts.filter(a => {
    const matchesRisk = filterLevel === 'all' || a.riskLevel === filterLevel;
    const matchesSearch = a.studentName.toLowerCase().includes(searchTerm) || 
                          a.program.toLowerCase().includes(searchTerm);
    return matchesRisk && matchesSearch;
  });

  // Actualizar métricas del resumen del tutor
  const pendingCount = AppState.preAlerts.filter(a => a.status === 'pending').length;
  const validatedCount = AppState.preAlerts.filter(a => a.status === 'validated').length;
  const discardedCount = AppState.preAlerts.filter(a => a.status === 'discarded').length;

  const countPendingElem = document.getElementById('tutor-count-pending');
  const countValidatedElem = document.getElementById('tutor-count-validated');
  const countDiscardedElem = document.getElementById('tutor-count-discarded');

  if (countPendingElem) countPendingElem.textContent = pendingCount;
  if (countValidatedElem) countValidatedElem.textContent = validatedCount;
  if (countDiscardedElem) countDiscardedElem.textContent = discardedCount;

  // Actualizar contador en la campana de notificaciones de la barra superior
  const bellBadge = document.getElementById('header-bell-badge');
  if (bellBadge) {
    bellBadge.textContent = pendingCount;
    bellBadge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No se encontraron pre-alertas con los filtros especificados.
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(alert => {
    const tr = document.createElement('tr');

    let badgeRisk = '';
    if (alert.riskLevel === 'critical') {
      badgeRisk = `<span class="badge badge-risk-critical">🔴 Crítico</span>`;
    } else if (alert.riskLevel === 'moderate') {
      badgeRisk = `<span class="badge badge-risk-moderate">🟠 Moderado</span>`;
    } else {
      badgeRisk = `<span class="badge badge-risk-stable">🟢 Estable</span>`;
    }

    let statusTag = '';
    if (alert.status === 'pending') {
      statusTag = `<span class="badge-status badge-status-pending">⏳ Por Revisar</span>`;
    } else if (alert.status === 'validated') {
      statusTag = `<span class="badge-status badge-status-validated">✅ Validada</span>`;
    } else {
      statusTag = `<span class="badge-status badge-status-discarded">⚪ Descartada</span>`;
    }

    const triggersList = alert.triggers.map(t => `<li style="margin-bottom: 2px;">${t}</li>`).join('');

    tr.innerHTML = `
      <td>
        <div style="font-weight: 700; color: var(--text-white);">${alert.studentName}</div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">${alert.program} (Sem. ${alert.semester})</div>
        <div style="font-size: 0.72rem; color: var(--red-light); margin-top: 2px;">${alert.date}</div>
      </td>
      <td>${badgeRisk}</td>
      <td style="max-width: 320px;">
        <ul style="padding-left: 1rem; font-size: 0.8rem; color: var(--text-secondary); margin: 0;">
          ${triggersList}
        </ul>
        ${alert.tutorNotes ? `<div style="margin-top: 6px; font-size: 0.76rem; background: var(--bg-elevated); padding: 5px 8px; border-radius: 4px; border-left: 2px solid var(--border-medium);"><em>Nota: ${alert.tutorNotes}</em></div>` : ''}
      </td>
      <td>${statusTag}</td>
      <td>
        ${alert.status === 'pending' ? `
          <button class="btn-primary" style="padding: 0.4rem 0.75rem; font-size: 0.76rem;" onclick="openValidationModal('${alert.id}')">
            Supervisar Caso
          </button>
        ` : `
          <button class="btn-secondary" style="padding: 0.4rem 0.75rem; font-size: 0.76rem;" onclick="openValidationModal('${alert.id}')">
            Ver Detalle
          </button>
        `}
      </td>
    `;

    container.appendChild(tr);
  });
}

window.openValidationModal = function(alertId) {
  const alert = AppState.preAlerts.find(a => a.id === alertId);
  if (!alert) return;

  AppState.activeModalAlertId = alertId;

  document.getElementById('modal-student-name').textContent = alert.studentName;
  document.getElementById('modal-student-info').textContent = `${alert.program} | Semestre ${alert.semester}`;
  
  const triggersContainer = document.getElementById('modal-triggers-list');
  triggersContainer.innerHTML = alert.triggers.map(t => `<li style="margin-bottom: 4px;">${t}</li>`).join('');

  const notesField = document.getElementById('modal-tutor-notes');
  notesField.value = alert.tutorNotes || '';

  openModal('modal-validation-action');
};

function confirmHumanValidation(action) {
  const alertId = AppState.activeModalAlertId;
  const alert = AppState.preAlerts.find(a => a.id === alertId);
  if (!alert) return;

  const notes = document.getElementById('modal-tutor-notes').value.trim();

  alert.status = action;
  alert.tutorNotes = notes || (action === 'validated' ? 'Caso confirmado por tutor para citación a acompañamiento.' : 'Descartado como falso positivo.');

  closeModal('modal-validation-action');
  renderPreAlerts();
  updateFinancialSimulator();

  if (action === 'validated') {
    showToast(`Alerta validada oficialmente. Se envió citación preventiva a ${alert.studentName}.`);
  } else {
    showToast(`Pre-alerta descartada para ${alert.studentName}. Registrado como falso positivo.`);
  }
}

// ================= MÓDULO DIRECTIVO & SIMULADOR FINANCIERO (HU07, HU09, HU10) =================
function initDirectorView() {
  const rangeStudents = document.getElementById('range-rescued-students');
  const rangeTuition = document.getElementById('range-tuition-value');

  if (rangeStudents) {
    rangeStudents.addEventListener('input', (e) => {
      AppState.financialModel.studentsRescued = parseInt(e.target.value);
      document.getElementById('badge-rescued-students').textContent = `${AppState.financialModel.studentsRescued} Estudiantes`;
      updateFinancialSimulator();
    });
  }

  if (rangeTuition) {
    rangeTuition.addEventListener('input', (e) => {
      AppState.financialModel.averageTuition = parseInt(e.target.value);
      const formatted = formatCOP(AppState.financialModel.averageTuition);
      document.getElementById('badge-tuition-value').textContent = formatted;
      updateFinancialSimulator();
    });
  }
}

function updateFinancialSimulator() {
  const students = AppState.financialModel.studentsRescued;
  const tuition = AppState.financialModel.averageTuition;
  const operationalCost = AppState.financialModel.operationalCost;

  // Cálculo: Matrícula semestral por 2 semestres (proyección anual de retención)
  const grossSaved = students * tuition * 2;
  const netBenefit = grossSaved - (operationalCost * 2);
  const roi = Math.round((netBenefit / (operationalCost * 2)) * 100);

  // Actualizar elementos en pantalla
  const elemGross = document.getElementById('sim-gross-saved');
  const elemNet = document.getElementById('sim-net-benefit');
  const elemRoi = document.getElementById('sim-roi-percentage');

  if (elemGross) elemGross.textContent = formatCOP(grossSaved);
  if (elemNet) elemNet.textContent = formatCOP(netBenefit);
  if (elemRoi) elemRoi.textContent = `+${roi}%`;

  // Actualizar KPIs de la cabecera del directivo
  const totalMonitoredElem = document.getElementById('dir-total-monitored');
  const activeAlertsElem = document.getElementById('dir-active-alerts');
  const retentionRateElem = document.getElementById('dir-retention-rate');

  if (totalMonitoredElem) totalMonitoredElem.textContent = "1,420";
  if (activeAlertsElem) {
    const criticals = AppState.preAlerts.filter(a => a.riskLevel === 'critical').length;
    activeAlertsElem.textContent = criticals;
  }
  if (retentionRateElem) {
    retentionRateElem.textContent = "86.4%";
  }
}

function formatCOP(amount) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(amount);
}

// ================= MODALES GENÉRICOS =================
function initModals() {
  document.querySelectorAll('.modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal-overlay');
      if (modal) modal.classList.remove('active');
    });
  });

  // Cerrar haciendo clic en el fondo oscuro
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });
}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

// ================= SISTEMA DE TOASTS =================
function showToast(message) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <span style="color: var(--red-light); font-size: 1.1rem;">⚓</span>
    <span style="font-size: 0.85rem;">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

