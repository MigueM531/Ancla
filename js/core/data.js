/**
 * ANCLA - Data Store y Estado Simulado
 * Arquitectura Monolítica Modular de Tres Capas - Prototipo Frontend
 * Universidad de Medellín - Facultad de Ingenierías
 */

const ANCLA_DATA = {
  projectInfo: {
    name: "ANCLA",
    tagline: "Sistema de Monitoreo Temprano, Análisis y Alerta para la Permanencia Estudiantil",
    faculty: "Facultad de Ingenierías",
    university: "Universidad de Medellín",
    course: "Proyecto de Ingeniería I (2026-2)",
    authors: [
      "Alejandra Escobar Chavarriaga",
      "Miguel Ángel Martínez Tamayo",
      "Juan José Martínez Acosta",
      "Cristian David Toro Arboleda"
    ],
    supervisor: "Duby Sulay Castellano Cárdenas",
    version: "1.0.0-PROTOTIPO"
  },

  // Perfiles de usuario por rol (HU02)
  users: {
    student: {
      id: "EST-2026-084",
      name: "Alejandra Escobar",
      email: "aescobar@udemellin.edu.co",
      role: "estudiante",
      roleLabel: "Estudiante",
      program: "Ingeniería de Sistemas",
      semester: 2,
      avatar: "AE",
      privacyConsentAccepted: true, // HU01
      consentDate: "2026-02-10 08:30"
    },
    tutor: {
      id: "TUT-104",
      name: "Dr. Carlos Valderrama",
      email: "cvalderrama@udemellin.edu.co",
      role: "tutor",
      roleLabel: "Tutor / Profesional de Bienestar",
      department: "Bienestar Universitario & Consejería",
      assignedStudentsCount: 42,
      avatar: "CV"
    },
    executive: {
      id: "DIR-002",
      name: "Ing. Roberto Restrepo",
      email: "rrestrepo@udemellin.edu.co",
      role: "directivo",
      roleLabel: "Directivo / Coordinador Académico",
      department: "Decanatura de Ingenierías",
      avatar: "RR"
    }
  },

  // Base de datos de estudiantes en seguimiento (HU03, HU04, HU05, HU06)
  students: [
    {
      id: "EST-2026-084",
      name: "Alejandra Escobar",
      program: "Ingeniería de Sistemas",
      semester: 2,
      averageGrade: 3.8,
      attendanceRate: 91,
      // Variables perceptuales (HU04 - Encuesta Typeform)
      perceptions: {
        emotionalWellbeing: 4, // 1 a 5
        stressLevel: 2,        // 1 a 5
        academicLoad: 3,       // 1 a 5
        adaptationLevel: 4,    // 1 a 5
        lastSurveyDate: "2026-10-05"
      },
      courses: [
        { name: "Cálculo Integral", grade: 3.5, attendance: 90 },
        { name: "Programación II", grade: 4.2, attendance: 95 },
        { name: "Física Mecánica", grade: 3.6, attendance: 88 }
      ],
      riskLevel: "Bajo",
      preAlert: null
    },
    {
      id: "EST-2026-102",
      name: "Juan Pablo Montoya",
      program: "Ingeniería Industrial",
      semester: 1,
      averageGrade: 2.8,
      attendanceRate: 74,
      perceptions: {
        emotionalWellbeing: 2,
        stressLevel: 5,
        academicLoad: 5,
        adaptationLevel: 2,
        lastSurveyDate: "2026-10-04"
      },
      courses: [
        { name: "Cálculo Diferencial", grade: 2.6, attendance: 70 },
        { name: "Álgebra Lineal", grade: 2.9, attendance: 75 },
        { name: "Introducción a la Ingeniería", grade: 3.2, attendance: 78 }
      ],
      riskLevel: "Crítico",
      preAlert: {
        id: "PAL-001",
        date: "2026-10-04 14:20",
        ruleTriggered: "Asistencia < 80% + Carga percibida crítica (5/5)",
        status: "Pendiente", // "Pendiente" | "Validada" | "Descartada"
        tutorNotes: "",
        validatedBy: null,
        validationDate: null
      }
    },
    {
      id: "EST-2026-155",
      name: "Camila Andrea Henao",
      program: "Ingeniería Ambiental",
      semester: 2,
      averageGrade: 2.9,
      attendanceRate: 84,
      perceptions: {
        emotionalWellbeing: 2,
        stressLevel: 4,
        academicLoad: 4,
        adaptationLevel: 3,
        lastSurveyDate: "2026-10-06"
      },
      courses: [
        { name: "Química General", grade: 2.7, attendance: 82 },
        { name: "Cálculo Integral", grade: 3.0, attendance: 85 }
      ],
      riskLevel: "Alto",
      preAlert: {
        id: "PAL-002",
        date: "2026-10-06 09:15",
        ruleTriggered: "Promedio < 3.0 + Estrés emocional alto (4/5)",
        status: "Pendiente",
        tutorNotes: "",
        validatedBy: null,
        validationDate: null
      }
    },
    {
      id: "EST-2026-041",
      name: "Sebastián Gómez Ríos",
      program: "Ingeniería Civil",
      semester: 3,
      averageGrade: 3.2,
      attendanceRate: 78,
      perceptions: {
        emotionalWellbeing: 3,
        stressLevel: 4,
        academicLoad: 4,
        adaptationLevel: 3,
        lastSurveyDate: "2026-10-03"
      },
      courses: [
        { name: "Estática", grade: 2.9, attendance: 76 },
        { name: "Topografía", grade: 3.4, attendance: 80 }
      ],
      riskLevel: "Medio",
      preAlert: {
        id: "PAL-003",
        date: "2026-10-03 16:40",
        ruleTriggered: "Asistencia < 80% en materia clave (Estática)",
        status: "Validada",
        tutorNotes: "Se convocó a sesión de tutoría con docente de Estática y consejero.",
        validatedBy: "Dr. Carlos Valderrama",
        validationDate: "2026-10-04 10:00"
      }
    },
    {
      id: "EST-2026-099",
      name: "Mariana Londoño Cruz",
      program: "Ingeniería de Sistemas",
      semester: 1,
      averageGrade: 4.4,
      attendanceRate: 96,
      perceptions: {
        emotionalWellbeing: 5,
        stressLevel: 2,
        academicLoad: 3,
        adaptationLevel: 5,
        lastSurveyDate: "2026-10-07"
      },
      courses: [
        { name: "Algoritmos", grade: 4.6, attendance: 98 },
        { name: "Cálculo Diferencial", grade: 4.2, attendance: 95 }
      ],
      riskLevel: "Bajo",
      preAlert: null
    },
    {
      id: "EST-2026-210",
      name: "David Felipe Ortiz",
      program: "Ingeniería de Telecomunicaciones",
      semester: 2,
      averageGrade: 3.4,
      attendanceRate: 72,
      perceptions: {
        emotionalWellbeing: 2,
        stressLevel: 4,
        academicLoad: 5,
        adaptationLevel: 2,
        lastSurveyDate: "2026-10-02"
      },
      courses: [
        { name: "Circuitos I", grade: 3.1, attendance: 70 },
        { name: "Física de Campos", grade: 3.6, attendance: 74 }
      ],
      riskLevel: "Alto",
      preAlert: {
        id: "PAL-004",
        date: "2026-10-02 11:30",
        ruleTriggered: "Asistencia general < 75% + Carga percibida máxima",
        status: "Pendiente",
        tutorNotes: "",
        validatedBy: null,
        validationDate: null
      }
    }
  ],

  // Parámetros por defecto para simulación financiera (HU09, HU10)
  financialModel: {
    totalStudents: 1250,          // Estudiantes en primeros semestres
    baselineDropoutRate: 16.5,    // Tasa de deserción histórica (%)
    semesterTuitionCOP: 6800000,  // Matrícula promedio semestral en COP ($6.8M COP)
    interventionSuccessRate: 35,  // % de casos en riesgo rescatados gracias a Ancla
    annualPlatformCostCOP: 42000000 // Costo operativo anual SaaS/infraestructura en COP
  },

  // Preguntas de la encuesta Typeform de bienestar (HU04)
  surveyQuestions: [
    {
      id: "emotionalWellbeing",
      title: "¿Cómo describirías tu estado anímico general esta semana?",
      subtitle: "Tu respuesta es confidencial y formativa, nunca punitiva.",
      type: "rating",
      options: [
        { value: 1, label: "Muy agotado / desmotivado", icon: "😫" },
        { value: 2, label: "Con dificultades", icon: "😟" },
        { value: 3, label: "Regular / Estable", icon: "😐" },
        { value: 4, label: "Motivado y con energía", icon: "🙂" },
        { value: 5, label: "Excelente / Muy motivado", icon: "😄" }
      ]
    },
    {
      id: "academicLoad",
      title: "¿Cómo percibes el volumen y exigencia de tus asignaturas actuales?",
      subtitle: "Ayúdanos a entender el nivel de demanda de tus cursos.",
      type: "rating",
      options: [
        { value: 1, label: "Muy liviana", icon: "🟢" },
        { value: 2, label: "Manejable", icon: "🟡" },
        { value: 3, label: "Equilibrada", icon: "🟠" },
        { value: 4, label: "Alta / Difícil de compaginar", icon: "🔴" },
        { value: 5, label: "Desbordante / Al límite", icon: "🔥" }
      ]
    },
    {
      id: "stressLevel",
      title: "¿Qué nivel de estrés o ansiedad sientes frente a tus próximas entregas y parciales?",
      subtitle: "Queremos apoyarte antes de que afecte tu rendimiento.",
      type: "rating",
      options: [
        { value: 1, label: "Muy bajo / Tranquilo", icon: "🧘" },
        { value: 2, label: "Bajo", icon: "😌" },
        { value: 3, label: "Moderado", icon: "😐" },
        { value: 4, label: "Alto", icon: "😰" },
        { value: 5, label: "Muy crítico", icon: "🚨" }
      ]
    },
    {
      id: "adaptationLevel",
      title: "¿Sientes que cuentas con apoyo y adaptación suficiente a la vida universitaria?",
      subtitle: "Bienestar estudiantil está listo para acompañarte si lo requieres.",
      type: "rating",
      options: [
        { value: 1, label: "Totalmente aislado", icon: "🌧️" },
        { value: 2, label: "Poco apoyo", icon: "⛅" },
        { value: 3, label: "En proceso de adaptación", icon: "🌤️" },
        { value: 4, label: "Bien adaptado", icon: "☀️" },
        { value: 5, label: "Totalmente integrado", icon: "🌟" }
      ]
    }
  ]
};

// Funciones auxiliares para almacenamiento local (mock offline/local storage)
function getSavedData() {
  const local = localStorage.getItem("ancla_data_v1");
  if (local) {
    try {
      return JSON.parse(local);
    } catch (e) {
      console.warn("Error leyendo datos locales, usando semilla inicial.");
    }
  }
  return ANCLA_DATA;
}

function persistData(data) {
  localStorage.setItem("ancla_data_v1", JSON.stringify(data));
}

