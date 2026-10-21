/**
 * ANCLA - Data Store y Estado Simulado
 * Arquitectura Monolítica Modular de Tres Capas - Prototipo Frontend
 * Universidad de Medellín - Facultad de Ingenierías
 */

const STORAGE_KEY = "ancla_data_v4"; // v4: sin promedio/notas en el modelo

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
      assignedStudentsCount: 6,
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
    },
    // Rol de soporte: figura en la matriz de permisos; el prototipo no incluye una vista para él
    admin: {
      id: "ADM-001",
      name: "Ing. Miguel Martínez",
      email: "admin@udemellin.edu.co",
      role: "admin",
      roleLabel: "Administrador de Sistemas",
      department: "TI & Arquitectura de Software",
      avatar: "MM"
    }
  },

  // Base de datos de estudiantes en seguimiento (HU03, HU04, HU05, HU06)
  students: [
    {
      id: "EST-2026-084",
      name: "Alejandra Escobar",
      program: "Ingeniería de Sistemas",
      semester: 2,
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
        { name: "Cálculo Integral", attendance: 90 },
        { name: "Programación II", attendance: 95 },
        { name: "Física Mecánica", attendance: 88 }
      ],
      riskLevel: "Bajo",
      preAlert: null
    },
    {
      id: "EST-2026-102",
      name: "Juan Pablo Montoya",
      program: "Ingeniería Industrial",
      semester: 1,
      attendanceRate: 74,
      perceptions: {
        emotionalWellbeing: 2,
        stressLevel: 5,
        academicLoad: 5,
        adaptationLevel: 2,
        lastSurveyDate: "2026-10-04"
      },
      courses: [
        { name: "Cálculo Diferencial", attendance: 70 },
        { name: "Álgebra Lineal", attendance: 75 },
        { name: "Introducción a la Ingeniería", attendance: 78 }
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
      attendanceRate: 84,
      perceptions: {
        emotionalWellbeing: 2,
        stressLevel: 4,
        academicLoad: 4,
        adaptationLevel: 3,
        lastSurveyDate: "2026-10-06"
      },
      courses: [
        { name: "Química General", attendance: 82 },
        { name: "Cálculo Integral", attendance: 85 }
      ],
      riskLevel: "Alto",
      preAlert: {
        id: "PAL-002",
        date: "2026-10-06 09:15",
        ruleTriggered: "Estrés emocional alto (4/5) + Carga percibida crítica (4/5)",
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
      attendanceRate: 78,
      perceptions: {
        emotionalWellbeing: 3,
        stressLevel: 4,
        academicLoad: 4,
        adaptationLevel: 3,
        lastSurveyDate: "2026-10-03"
      },
      courses: [
        { name: "Estática", attendance: 76 },
        { name: "Topografía", attendance: 80 }
      ],
      riskLevel: "Alto",
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
      attendanceRate: 96,
      perceptions: {
        emotionalWellbeing: 5,
        stressLevel: 2,
        academicLoad: 3,
        adaptationLevel: 5,
        lastSurveyDate: "2026-10-07"
      },
      courses: [
        { name: "Algoritmos", attendance: 98 },
        { name: "Cálculo Diferencial", attendance: 95 }
      ],
      riskLevel: "Bajo",
      preAlert: null
    },
    {
      id: "EST-2026-210",
      name: "David Felipe Ortiz",
      program: "Ingeniería de Telecomunicaciones",
      semester: 2,
      attendanceRate: 72,
      perceptions: {
        emotionalWellbeing: 2,
        stressLevel: 4,
        academicLoad: 5,
        adaptationLevel: 2,
        lastSurveyDate: "2026-10-02"
      },
      courses: [
        { name: "Circuitos I", attendance: 70 },
        { name: "Física de Campos", attendance: 74 }
      ],
      riskLevel: "Crítico",
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

  // Matriz de Control de Acceso por Roles y Privilegios (HU02)
  roleMatrix: [
    {
      key: "own_consent",
      permission: "Consultar y aceptar consentimiento informado propio",
      estudiante: true,
      tutor: false,
      directivo: false,
      admin: true
    },
    {
      key: "survey",
      permission: "Completar micro-encuestas de bienestar tipo Typeform",
      estudiante: true,
      tutor: false,
      directivo: false,
      admin: false
    },
    {
      key: "view_academic",
      permission: "Visualizar asistencias y asignaturas personales",
      estudiante: true,
      tutor: true,
      directivo: true,
      admin: true
    },
    {
      key: "validate_alerts",
      permission: "Recibir y validar pre-alertas de deserción (Supervisión Humana)",
      estudiante: false,
      tutor: true,
      directivo: false,
      admin: false
    },
    {
      key: "view_dashboard",
      permission: "Acceder al Dashboard macro de permanencia y KPIs",
      estudiante: false,
      tutor: true,
      directivo: true,
      admin: true
    },
    {
      key: "view_financial",
      permission: "Ejecutar Simulador Financiero de Retorno (ROI) y Costos",
      estudiante: false,
      tutor: false,
      directivo: true,
      admin: true
    },
    {
      key: "sync_db",
      permission: "Sincronizar datos académicos institucionales (HU03)",
      estudiante: false,
      tutor: false,
      directivo: true,
      admin: true
    },
    {
      key: "config_rules",
      permission: "Configurar umbrales deterministas del motor de reglas",
      estudiante: false,
      tutor: false,
      directivo: false,
      admin: true
    }
  ],

  // Registros de auditoría de consentimiento y accesos (HU01, HU02)
  auditLogs: [
    { date: "2026-10-08 08:30", user: "Alejandra Escobar", action: "Consentimiento informado aceptado (HU01)", ip: "172.16.24.12" },
    { date: "2026-10-08 09:15", user: "Dr. Carlos Valderrama", action: "Validación de pre-alerta PAL-003 completada (HU06)", ip: "172.16.10.05" },
    { date: "2026-10-08 10:45", user: "Ing. Roberto Restrepo", action: "Consulta del Dashboard Ejecutivo y ROI (HU07)", ip: "172.16.02.18" },
    { date: "2026-10-08 11:20", user: "Alejandra Escobar", action: "Ingesta de micro-encuesta semanal de bienestar (HU04)", ip: "172.16.24.12" }
  ],

  // Análisis de Costos y Viabilidad Financiera (HU09)
  costBreakdown: {
    initialInvestmentCOP: 35000000, // Costo de diseño y desarrollo inicial
    annualOperationalTotalCOP: 42000000,
    items: [
      {
        category: "Infraestructura Cloud SaaS",
        name: "Servidores, Base de Datos Relacional y Cifrado",
        annualCOP: 14000000,
        description: "Alojamiento en nube de alta disponibilidad, backups automáticos y cumplimiento de Ley 1581 (Habeas Data)."
      },
      {
        category: "Mantenimiento & Soporte",
        name: "Soporte Técnico Continuo y Actualización de Reglas",
        annualCOP: 12000000,
        description: "Monitoreo del motor de umbrales deterministas, ajustes de seguridad e integraciones semestrales."
      },
      {
        category: "Acompañamiento Humano",
        name: "Plataforma de Consejería y Bienestar Universitario",
        annualCOP: 16000000,
        description: "Horas dedicadas de tutores para supervisión obligatoria de pre-alertas e intervención preventiva temprana."
      }
    ]
  },

  // Escenarios predefinidos para la Simulación Financiera (HU10)
  financialScenarios: {
    conservador: {
      totalStudents: 1250,
      baselineDropoutRate: 14.0,
      semesterTuitionCOP: 6800000,
      interventionSuccessRate: 20,
      annualPlatformCostCOP: 42000000
    },
    moderado: {
      totalStudents: 1250,
      baselineDropoutRate: 16.5,
      semesterTuitionCOP: 6800000,
      interventionSuccessRate: 35,
      annualPlatformCostCOP: 42000000
    },
    optimo: {
      totalStudents: 1500,
      baselineDropoutRate: 18.0,
      semesterTuitionCOP: 7200000,
      interventionSuccessRate: 50,
      annualPlatformCostCOP: 45000000
    }
  },

  // Parámetros por defecto para simulación financiera (HU09, HU10)
  financialModel: {
    totalStudents: 1250,          // Estudiantes en primeros semestres
    baselineDropoutRate: 16.5,    // Tasa de deserción histórica (%)
    semesterTuitionCOP: 6800000,  // Matrícula promedio semestral en COP ($6.8M COP)
    interventionSuccessRate: 30,  // % de casos en riesgo rescatados gracias a Ancla
    annualPlatformCostCOP: 42000000 // Costo operativo anual SaaS/infraestructura en COP
  },

  // Banco rotativo de baterías de evaluación de bienestar y permanencia universitaria
  // Formulado bajo criterios psicopedagógicos y de salud mental para ingeniería (25 preguntas, 5 sectores de 5 preguntas)
  surveyBatteries: [
    {
      id: "sector_academic",
      name: "Carga Cognitiva y Rendimiento Académico",
      shortTitle: "Rendimiento y Carga Académica",
      icon: "📚",
      color: "#0984e3",
      description: "Explora la comprensión conceptual, hábitos de estudio, procrastinación y preparación ante evaluaciones complejas.",
      questions: [
        {
          id: "acad_comprehension",
          coreDimension: "academicLoad",
          polarity: "favorable",
          title: "¿Con qué facilidad logras comprender y seguir el ritmo en tus asignaturas más complejas?",
          subtitle: "Tu percepción nos ayuda a identificar si requieres monitorías académicas tempranas.",
          type: "rating",
          options: [
            { value: 1, label: "Muy perdido / Desconectado del contenido", icon: "😫" },
            { value: 2, label: "Con bastante dificultad y retraso", icon: "😟" },
            { value: 3, label: "Regular / Entiendo pero me cuesta ponerme al día", icon: "😐" },
            { value: 4, label: "Bien / Sigo el ritmo con dedicación constante", icon: "🙂" },
            { value: 5, label: "Excelente / Comprendo con total claridad y fluidez", icon: "😄" }
          ]
        },
        {
          id: "acad_workload",
          coreDimension: "academicLoad",
          polarity: "adverse",
          title: "¿Cómo percibes el volumen total de tareas, proyectos y talleres de esta semana?",
          subtitle: "Evaluamos el balance entre la exigencia académica y tu tiempo disponible.",
          type: "rating",
          options: [
            { value: 1, label: "Muy liviana / Casi sin exigencia", icon: "🟢" },
            { value: 2, label: "Manejable y equilibrada", icon: "🟡" },
            { value: 3, label: "Ajustada pero cumplible", icon: "🟠" },
            { value: 4, label: "Alta / Difícil de compaginar con mi vida", icon: "🔴" },
            { value: 5, label: "Desbordante / Al límite del agotamiento", icon: "🔥" }
          ]
        },
        {
          id: "acad_procrastination",
          coreDimension: "stressLevel",
          polarity: "adverse",
          title: "¿Con qué frecuencia postergas el inicio de tus estudios por sensación de bloqueo o agobio?",
          subtitle: "La procrastinación en ingeniería suele ser un indicador temprano de sobrecarga cognitiva.",
          type: "rating",
          options: [
            { value: 1, label: "Casi nunca / Inicio mis tareas con puntualidad", icon: "⏱️" },
            { value: 2, label: "Rara vez / Me enfoco con facilidad", icon: "😌" },
            { value: 3, label: "A veces / Cuando los temas son muy densos", icon: "😐" },
            { value: 4, label: "Frecuentemente / Me cuesta mucho arrancar", icon: "😰" },
            { value: 5, label: "Constantemente / El bloqueo me paraliza", icon: "🚨" }
          ]
        },
        {
          id: "acad_exam_preparedness",
          coreDimension: "stressLevel",
          polarity: "favorable",
          title: "¿Qué tan preparado y confiado te sientes para tus próximas evaluaciones y quices?",
          subtitle: "Nos permite anticipar momentos de máxima tensión evaluativa.",
          type: "rating",
          options: [
            { value: 1, label: "Totalmente desprevenido / Alto riesgo", icon: "🚨" },
            { value: 2, label: "Con vacíos importantes / Bastante inseguro", icon: "😟" },
            { value: 3, label: "Con preparación intermedia / Dudas normales", icon: "😐" },
            { value: 4, label: "Bien preparado / Confiado en mis repasos", icon: "🙂" },
            { value: 5, label: "Completamente seguro y al día", icon: "🌟" }
          ]
        },
        {
          id: "acad_concentration",
          coreDimension: "academicLoad",
          polarity: "favorable",
          title: "¿Cómo ha sido tu capacidad de concentración y enfoque mental durante las jornadas de estudio?",
          subtitle: "La fatiga mental acumulada disminuye la retención en materias lógicas y matemáticas.",
          type: "rating",
          options: [
            { value: 1, label: "Disperso al extremo / Me distraigo al instante", icon: "🌪️" },
            { value: 2, label: "Baja / Me fatigo en menos de 15 minutos", icon: "🔋" },
            { value: 3, label: "Moderada / Con altibajos habituales", icon: "⏳" },
            { value: 4, label: "Buena / Mantengo bloques de estudio productivos", icon: "🎯" },
            { value: 5, label: "Óptima / Alto estado de concentración y fluidez", icon: "⚡" }
          ]
        }
      ]
    },
    {
      id: "sector_emotional",
      name: "Salud Emocional y Regulación del Estrés",
      shortTitle: "Salud Emocional y Estrés",
      icon: "🧠",
      color: "#e63946",
      description: "Monitorea sintomatología ansiosa, energía vital, calidad del sueño y capacidad de desconexión.",
      questions: [
        {
          id: "emot_mood",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          title: "¿Cómo describirías tu estado anímico y nivel de energía vital predominante esta semana?",
          subtitle: "Tu salud mental es la base fundamental de tu permanencia y aprendizaje.",
          type: "rating",
          options: [
            { value: 1, label: "Profundamente desanimado / Vacío de energía", icon: "😫" },
            { value: 2, label: "Decaído y con desgano persistente", icon: "😟" },
            { value: 3, label: "Neutro / Estable sin mayores altibajos", icon: "😐" },
            { value: 4, label: "Positivo y con buen ánimo", icon: "🙂" },
            { value: 5, label: "Lleno de entusiasmo y vitalidad", icon: "😄" }
          ]
        },
        {
          id: "emot_anxiety",
          coreDimension: "stressLevel",
          polarity: "adverse",
          title: "En las últimas dos semanas, ¿con qué frecuencia has sentido nerviosismo o tensión difíciles de controlar por tus estudios?",
          subtitle: "Indicador de reactividad ansiosa frente a la exigencia académica.",
          type: "rating",
          options: [
            { value: 1, label: "Nunca / Me he sentido en calma", icon: "🧘" },
            { value: 2, label: "Rara vez / Tensión breve y pasajera", icon: "😌" },
            { value: 3, label: "A veces / Sobre todo en semanas de entregas", icon: "😐" },
            { value: 4, label: "Con frecuencia / Me cuesta relajarme", icon: "😰" },
            { value: 5, label: "Casi todos los días / Me resulta abrumador", icon: "🚨" }
          ]
        },
        {
          id: "emot_sleep_quality",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          title: "¿Cómo calificarías la calidad reparadora de tu sueño y tu descanso nocturno?",
          subtitle: "El sueño no reparador multiplica por tres la vulnerabilidad académica.",
          type: "rating",
          options: [
            { value: 1, label: "Insomnio severo / Me despierto totalmente agotado", icon: "🌑" },
            { value: 2, label: "Sueño interrumpido y poco reparador", icon: "🌘" },
            { value: 3, label: "Regular / Duermo pero sigo con cansancio", icon: "🌗" },
            { value: 4, label: "Bueno / Descanso entre 6 y 8 horas continuas", icon: "🌖" },
            { value: 5, label: "Excelente y profundamente reparador", icon: "🌕" }
          ]
        },
        {
          id: "emot_emotional_coping",
          coreDimension: "stressLevel",
          polarity: "favorable",
          title: "Cuando una calificación o entrega no sale bien, ¿cómo suele ser tu reacción emocional?",
          subtitle: "Evalúa la tolerancia a la frustración y la resiliencia formativa.",
          type: "rating",
          options: [
            { value: 1, label: "Culpa extrema o desesperanza inmediata", icon: "🌧️" },
            { value: 2, label: "Frustración prolongada que me bloquea por días", icon: "⛈️" },
            { value: 3, label: "Me afecta pero busco continuar", icon: "⛅" },
            { value: 4, label: "Lo asumo con madurez y busco alternativas", icon: "🌤️" },
            { value: 5, label: "Lo tomo como retroalimentación constructiva", icon: "☀️" }
          ]
        },
        {
          id: "emot_hopelessness",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          safety: true,
          flagAtOrBelow: 2,
          title: "En las últimas dos semanas, ¿has sentido que no vale la pena seguir adelante o has pensado en hacerte daño?",
          subtitle: "Pregunta de cuidado: si algo de esto te resuena, queremos acompañarte. Es confidencial y nunca punitiva.",
          type: "rating",
          options: [
            { value: 1, label: "Sí, con frecuencia / Me preocupa mi seguridad", icon: "🌑" },
            { value: 2, label: "Sí, en algunos momentos", icon: "🌘" },
            { value: 3, label: "Un pensamiento aislado y pasajero", icon: "🌗" },
            { value: 4, label: "No, aunque me he sentido muy desanimado", icon: "🌖" },
            { value: 5, label: "No, en absoluto", icon: "🌕" }
          ]
        }
      ]
    },
    {
      id: "sector_social",
      name: "Integración Social y Red de Apoyo en el Campus",
      shortTitle: "Integración Social y Redes",
      icon: "🤝",
      color: "#00b894",
      description: "Evalúa el sentido de pertenencia a la facultad, redes de estudio entre pares y apoyo institucional.",
      questions: [
        {
          id: "soc_belonging",
          coreDimension: "adaptationLevel",
          polarity: "favorable",
          title: "¿Sientes que encajas y perteneces a la comunidad de la Facultad de Ingenierías de la UdeM?",
          subtitle: "El sentido de arraigo e identidad universitaria es el mayor predictor de retención.",
          type: "rating",
          options: [
            { value: 1, label: "Me siento ajeno / Cero sentido de pertenencia", icon: "❄️" },
            { value: 2, label: "Poco conectado con la vida universitaria", icon: "🌧️" },
            { value: 3, label: "En proceso de encontrar mi lugar", icon: "⛅" },
            { value: 4, label: "Cómodo e integrado en la facultad", icon: "☀️" },
            { value: 5, label: "Totalmente identificado y orgulloso en la UdeM", icon: "🌟" }
          ]
        },
        {
          id: "soc_study_networks",
          coreDimension: "adaptationLevel",
          polarity: "favorable",
          title: "¿Cuentas con compañeros o grupos de estudio con quienes apoyarte para resolver dudas?",
          subtitle: "El aprendizaje colaborativo mitiga el aislamiento en materias de cálculo y programación.",
          type: "rating",
          options: [
            { value: 1, label: "Ninguno / Estudio y trabajo completamente solo", icon: "👤" },
            { value: 2, label: "Muy pocos y con contacto muy esporádico", icon: "👥" },
            { value: 3, label: "Compañeros para entregas pero sin vínculo cercano", icon: "🤝" },
            { value: 4, label: "Cuento con un buen equipo de estudio constante", icon: "🧑‍🤝‍🧑" },
            { value: 5, label: "Cuento con una red sólida, confiable y solidaria", icon: "🛡️" }
          ]
        },
        {
          id: "soc_emotional_support",
          coreDimension: "adaptationLevel",
          polarity: "favorable",
          title: "Si tuvieras un momento personal o académico difícil, ¿tienes con quién desahogarte?",
          subtitle: "La red de contención afectiva amortigua el estrés evaluativo.",
          type: "rating",
          options: [
            { value: 1, label: "Nadie / No tengo a quién recurrir", icon: "🤐" },
            { value: 2, label: "Dudo que alguien entienda mi situación", icon: "🥀" },
            { value: 3, label: "Quizá alguien fuera de la universidad", icon: "🏠" },
            { value: 4, label: "Sí, amigos o familiares que me escuchan", icon: "💬" },
            { value: 5, label: "Red de apoyo inmediata, comprensiva y cercana", icon: "🫂" }
          ]
        },
        {
          id: "soc_isolation_feeling",
          coreDimension: "adaptationLevel",
          polarity: "favorable",
          title: "Durante tus horas en el campus, ¿con qué frecuencia experimentas sensación de soledad?",
          subtitle: "Identifica desconexión cotidiana en espacios comunes y cafeterías.",
          type: "rating",
          options: [
            { value: 1, label: "Casi todo el tiempo / Me siento invisible", icon: "🌫️" },
            { value: 2, label: "Frecuentemente en pasillos o descansos", icon: "🍂" },
            { value: 3, label: "Solo en momentos de estudio individual", icon: "📖" },
            { value: 4, label: "Rara vez / Suelo compartir con compañeros", icon: "☕" },
            { value: 5, label: "Nunca / Me siento acompañado y bienvenido", icon: "✨" }
          ]
        },
        {
          id: "soc_help_seeking",
          coreDimension: "adaptationLevel",
          polarity: "favorable",
          title: "¿Qué tan accesible y cómodo te resulta acudir a Bienestar Universitario o consejería?",
          subtitle: "Garantizamos un espacio confidencial, formativo y sin estigmas.",
          type: "rating",
          options: [
            { value: 1, label: "Me da vergüenza o temo ser juzgado", icon: "🙈" },
            { value: 2, label: "Me cuesta pedir ayuda aunque la necesite", icon: "🚧" },
            { value: 3, label: "Lo consideraría si mi situación se agrava", icon: "⚖️" },
            { value: 4, label: "Acudiría con tranquilidad si lo requiero", icon: "🚪" },
            { value: 5, label: "Muy cómodo / Valoro el apoyo profesional", icon: "💚" }
          ]
        }
      ]
    },
    {
      id: "sector_vocational",
      name: "Motivación, Vocación y Autoeficacia",
      shortTitle: "Motivación y Vocación",
      icon: "🎯",
      color: "#ff9f43",
      description: "Explora la convicción vocacional, autoeficacia académica, presiones del entorno y meta de graduación.",
      questions: [
        {
          id: "mot_vocational_clarity",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          title: "¿Qué tan seguro y motivado te sientes con la carrera de ingeniería que estás cursando?",
          subtitle: "La duda vocacional temprana es una de las principales causas silenciosas de abandono.",
          type: "rating",
          options: [
            { value: 1, label: "En crisis vocacional profunda / Pensando en retirarme", icon: "🛑" },
            { value: 2, label: "Con serias dudas sobre mi futuro profesional", icon: "❓" },
            { value: 3, label: "Con dudas normales, sigo explorando el área", icon: "🧭" },
            { value: 4, label: "Bastante seguro y motivado por mi carrera", icon: "📐" },
            { value: 5, label: "Totalmente apasionado y convencido de mi vocación", icon: "🚀" }
          ]
        },
        {
          id: "mot_self_efficacy",
          coreDimension: "academicLoad",
          polarity: "favorable",
          title: "¿Confías en tus capacidades intelectuales para superar con éxito las materias del pensum?",
          subtitle: "Aborda el síndrome del impostor frecuente en primeros semestres.",
          type: "rating",
          options: [
            { value: 1, label: "Siento que no doy la talla para esta carrera", icon: "📉" },
            { value: 2, label: "Muy inseguro de mis habilidades analíticas", icon: "🌧️" },
            { value: 3, label: "Con esfuerzo y disciplina creo que lo logro", icon: "💪" },
            { value: 4, label: "Confiado en mis destrezas y perseverancia", icon: "💡" },
            { value: 5, label: "Plenamente seguro de mi potencial como ingeniero", icon: "🏆" }
          ]
        },
        {
          id: "mot_daily_drive",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          title: "¿Con qué nivel de motivación y propósito asistes a tus jornadas universitarias?",
          subtitle: "La motivación intrínseca sostiene el esfuerzo en semanas de alta exigencia.",
          type: "rating",
          options: [
            { value: 1, label: "Con profunda pesadez y resistencia interna", icon: "⛓️" },
            { value: 2, label: "Por pura inercia y obligación externa", icon: "🚶" },
            { value: 3, label: "Con disposición moderada pero cumplidora", icon: "🎒" },
            { value: 4, label: "Con buena energía y ganas de aprender", icon: "☀️" },
            { value: 5, label: "Entusiasmado por cada clase y reto del día", icon: "🔥" }
          ]
        },
        {
          id: "mot_external_pressures",
          coreDimension: "stressLevel",
          polarity: "favorable",
          title: "¿Factores externos (económicos, familiares o laborales) interfieren con tu dedicación?",
          subtitle: "Nos permite orientarte hacia apoyos de sostenimiento o becas institucionales.",
          type: "rating",
          options: [
            { value: 1, label: "Interferencia crítica / Pone en riesgo mi permanencia", icon: "🚨" },
            { value: 2, label: "Presión económica o familiar considerable", icon: "💸" },
            { value: 3, label: "Ciertas presiones que intento equilibrar", icon: "⚖️" },
            { value: 4, label: "Poca interferencia / Entorno relativamente estable", icon: "🏡" },
            { value: 5, label: "Entorno favorable, tranquilo y con pleno respaldo", icon: "🌿" }
          ]
        },
        {
          id: "mot_graduation_purpose",
          coreDimension: "adaptationLevel",
          polarity: "favorable",
          title: "¿Qué tan claro, viable y significativo visualizas tu objetivo de graduarte en la UdeM?",
          subtitle: "La visualización de la meta consolida la resiliencia a largo plazo.",
          type: "rating",
          options: [
            { value: 1, label: "Muy lejano e inalcanzable en este momento", icon: "🌫️" },
            { value: 2, label: "Nublado por las dificultades del semestre", icon: "⛅" },
            { value: 3, label: "Posible con tropiezos en el camino", icon: "🧗" },
            { value: 4, label: "Una meta clara por la cual vale la pena luchar", icon: "🎓" },
            { value: 5, label: "Un objetivo firme, realista y con propósito de vida", icon: "⭐" }
          ]
        }
      ]
    },
    {
      id: "sector_lifestyle",
      name: "Hábitos de Vida, Salud y Recursos Básicos",
      shortTitle: "Hábitos y Salud",
      icon: "🌱",
      color: "#a29bfe",
      description: "Revisa alimentación, actividad física, desconexión, estrategias para sobrellevar la presión y acceso a recursos básicos.",
      questions: [
        {
          id: "life_nutrition",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          title: "¿Con qué regularidad logras alimentarte bien (comidas completas y a tus horas) durante tus jornadas?",
          subtitle: "La alimentación irregular afecta la energía, el ánimo y la concentración.",
          type: "rating",
          options: [
            { value: 1, label: "Casi nunca / Me salto comidas casi a diario", icon: "🥀" },
            { value: 2, label: "Con frecuencia como a destiempo o muy poco", icon: "🕐" },
            { value: 3, label: "A veces, según la carga del día", icon: "🥪" },
            { value: 4, label: "Casi siempre como a mis horas", icon: "🍲" },
            { value: 5, label: "Siempre como completo y con calma", icon: "🥗" }
          ]
        },
        {
          id: "life_physical_activity",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          title: "¿Con qué frecuencia te mueves o haces actividad física, deporte o caminatas?",
          subtitle: "El movimiento regular protege el estado de ánimo y reduce el estrés acumulado.",
          type: "rating",
          options: [
            { value: 1, label: "Nada / Paso casi todo el día sentado", icon: "🪑" },
            { value: 2, label: "Muy rara vez", icon: "🐢" },
            { value: 3, label: "Una o dos veces por semana", icon: "🚶" },
            { value: 4, label: "Varias veces por semana", icon: "🏃" },
            { value: 5, label: "Casi a diario / Es parte de mi rutina", icon: "🏅" }
          ]
        },
        {
          id: "life_coping_substances",
          coreDimension: "stressLevel",
          polarity: "adverse",
          title: "Cuando te sientes presionado, ¿con qué frecuencia recurres a alcohol, cigarrillo u otras sustancias para sobrellevarlo?",
          subtitle: "Sin juicios: queremos conocer qué estrategias estás usando para sostener la presión.",
          type: "rating",
          options: [
            { value: 1, label: "Nunca / Uso otras formas de manejarlo", icon: "🌿" },
            { value: 2, label: "Rara vez", icon: "🍃" },
            { value: 3, label: "A veces", icon: "⚖️" },
            { value: 4, label: "Con frecuencia", icon: "⚠️" },
            { value: 5, label: "Casi siempre / Siento que lo necesito", icon: "🚨" }
          ]
        },
        {
          id: "life_basic_resources",
          coreDimension: "stressLevel",
          polarity: "favorable",
          title: "¿Cuentas con lo básico para estudiar con tranquilidad (alimentación, transporte, internet y materiales)?",
          subtitle: "Nos permite orientarte hacia apoyos de sostenimiento y bienestar institucional.",
          type: "rating",
          options: [
            { value: 1, label: "No / Me falta casi todo lo básico", icon: "🚫" },
            { value: 2, label: "Me faltan varias cosas con frecuencia", icon: "📉" },
            { value: 3, label: "Lo justo, con algunos apuros", icon: "⚖️" },
            { value: 4, label: "Casi siempre cuento con ello", icon: "👍" },
            { value: 5, label: "Sí, lo tengo todo cubierto", icon: "✅" }
          ]
        },
        {
          id: "life_disconnection",
          coreDimension: "emotionalWellbeing",
          polarity: "favorable",
          title: "¿Logras desconectarte de las obligaciones universitarias para descansar o hacer lo que te gusta?",
          subtitle: "La capacidad de pausa protege contra el agotamiento crónico.",
          type: "rating",
          options: [
            { value: 1, label: "Imposible / Culpa constante incluso descansando", icon: "🔒" },
            { value: 2, label: "Muy poco / Mi mente sigue atada al estudio", icon: "⏳" },
            { value: 3, label: "A veces / Depende de las semanas del semestre", icon: "⚖️" },
            { value: 4, label: "Frecuentemente / Respeto mis espacios libres", icon: "🌿" },
            { value: 5, label: "Totalmente / Mantengo un equilibrio saludable", icon: "🌈" }
          ]
        }
      ]
    }
  ],

  // Rotación: cada vez que el estudiante envía una encuesta, la siguiente ataca el sector siguiente de este orden.
  surveyRotation: {
    order: ["sector_academic", "sector_emotional", "sector_social", "sector_vocational", "sector_lifestyle"],
    historyLimit: 60
  },

  // Recursos mostrados al estudiante cuando el ítem de cuidado marca alerta (ajustar con las líneas oficiales de la institución)
  supportResources: {
    emergencyLine: "123",
    campusService: "Bienestar Universitario de la Universidad de Medellín",
    message: "Gracias por ser sincero/a. Lo que sientes importa y no tienes que afrontarlo solo/a. El equipo de Bienestar se pondrá en contacto contigo de forma cuidadosa y confidencial. Si sientes que estás en peligro inmediato, llama a la línea de emergencias 123 o acude a la persona de confianza más cercana."
  },

  // Preguntas activas por defecto (retrocompatibilidad)
  get surveyQuestions() {
    return this.surveyBatteries[0].questions;
  }
};

// Almacenamiento local (mock). Siempre devuelve una copia: la semilla nunca se muta.
try { localStorage.removeItem("ancla_data_v1"); localStorage.removeItem("ancla_data_v2"); localStorage.removeItem("ancla_data_v3"); } catch (e) { /* ignorar */ }

function getSavedData() {
  try {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) return JSON.parse(local);
  } catch (e) {
    console.warn("Error leyendo datos locales, usando semilla inicial.");
  }
  return JSON.parse(JSON.stringify(ANCLA_DATA));
}

function persistData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
