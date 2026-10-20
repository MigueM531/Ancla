-- ===================================================================
-- PROYECTO ANCLA - DATOS INICIALES (SEED DATA)
-- Facultad de Ingenierías - Universidad de Medellín
-- ===================================================================

-- 1. INSERTAR ROLES DEL SISTEMA
INSERT INTO roles (code, name, description)
VALUES 
  ('estudiante', 'Estudiante de Pregrado', 'Acceso al portal estudiantil, seguimiento personal de permanencia, consentimiento ético y encuesta de bienestar'),
  ('tutor', 'Tutor / Consejería de Bienestar', 'Gestión y supervisión humana obligatoria de la bandeja de pre-alertas tempranas'),
  ('directivo', 'Directivo / Coordinador Académico', 'Dashboard institucional de indicadores, padrón de retención y simulador financiero de retorno de inversión')
ON CONFLICT (code) DO NOTHING;

-- 2. INSERTAR USUARIOS PRINCIPALES (Contraseñas con Hashing Bcrypt de alta seguridad)
-- Credenciales Demo:
-- 1. Estudiante:  aescobar@udemellin.edu.co    / Estudiante2026*
-- 2. Tutor:       cvalderrama@udemellin.edu.co  / Tutor2026*
-- 3. Directivo:   rrestrepo@udemellin.edu.co    / Directivo2026*
-- 4. Soporte TI:  admin@udemellin.edu.co        / Admin2026*

INSERT INTO users (code, name, email, password_hash, role_code, role_label, department, program, semester, avatar, privacy_consent_accepted, consent_date)
VALUES 
  (
    'EST-2026-084',
    'Alejandra Escobar',
    'aescobar@udemellin.edu.co',
    '$2b$10$e.Eb6SK9JKMLr/KbqQUerush4zieSz5CBWL6DUAN4curYXUTdxa.2',
    'estudiante',
    'Estudiante',
    'Facultad de Ingenierías',
    'Ingeniería de Sistemas',
    2,
    'AE',
    TRUE,
    '2026-02-10 08:30:00+00'
  ),
  (
    'TUT-104',
    'Dr. Carlos Valderrama',
    'cvalderrama@udemellin.edu.co',
    '$2b$10$WlPxO/EYDxXsZIDurd9CYuf/3BwJ0mfjJ7i8QKBPQ5FZVyDeeRXUC',
    'tutor',
    'Tutor / Profesional de Bienestar',
    'Bienestar Universitario & Consejería',
    'Facultad de Ingenierías',
    NULL,
    'CV',
    TRUE,
    '2026-01-15 09:00:00+00'
  ),
  (
    'DIR-002',
    'Ing. Roberto Restrepo',
    'rrestrepo@udemellin.edu.co',
    '$2b$10$chWo/MIijbcncqjz6t8UQOm8HDRkWX8g5OlV89Cni3Yh4W/XgUIF.',
    'directivo',
    'Directivo / Coordinador Académico',
    'Decanatura de Ingenierías',
    'Facultad de Ingenierías',
    NULL,
    'RR',
    TRUE,
    '2026-01-10 07:30:00+00'
  )
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  role_code = EXCLUDED.role_code,
  role_label = EXCLUDED.role_label,
  updated_at = CURRENT_TIMESTAMP;

-- 3. INSERTAR PADRÓN DE ESTUDIANTES PARA MONITOREO
INSERT INTO students (id, name, email, program, semester, attendance_rate, risk_level, user_id)
VALUES
  ('EST-2026-084', 'Alejandra Escobar', 'aescobar@udemellin.edu.co', 'Ingeniería de Sistemas', 2, 91.00, 'Bajo', 1),
  ('EST-2026-102', 'Juan Pablo Montoya', 'jpmontoya@udemellin.edu.co', 'Ingeniería Industrial', 1, 74.00, 'Crítico', NULL),
  ('EST-2026-155', 'Camila Andrea Henao', 'cahenao@udemellin.edu.co', 'Ingeniería Ambiental', 2, 84.00, 'Alto', NULL),
  ('EST-2026-041', 'Sebastián Gómez Ríos', 'sgomez@udemellin.edu.co', 'Ingeniería Civil', 3, 78.00, 'Alto', NULL),
  ('EST-2026-099', 'Mariana Londoño Cruz', 'mlondono@udemellin.edu.co', 'Ingeniería de Sistemas', 1, 96.00, 'Bajo', NULL),
  ('EST-2026-210', 'David Felipe Ortiz', 'dfortiz@udemellin.edu.co', 'Ingeniería de Telecomunicaciones', 2, 72.00, 'Crítico', NULL)
ON CONFLICT (id) DO UPDATE SET
  attendance_rate = EXCLUDED.attendance_rate,
  risk_level = EXCLUDED.risk_level,
  updated_at = CURRENT_TIMESTAMP;

-- 4. INSERTAR HISTORIAL DE PERCEPCIONES DE BIENESTAR
INSERT INTO wellness_perceptions (student_id, emotional_wellbeing, stress_level, academic_load, adaptation_level)
VALUES
  ('EST-2026-084', 4, 2, 3, 4),
  ('EST-2026-102', 2, 5, 5, 2),
  ('EST-2026-155', 2, 4, 4, 3),
  ('EST-2026-041', 3, 4, 4, 3),
  ('EST-2026-099', 5, 2, 3, 5),
  ('EST-2026-210', 2, 4, 5, 2);

-- 5. INSERTAR PRE-ALERTAS TEMPRANAS
INSERT INTO pre_alerts (id, student_id, status, level, reason, tutor_notes, validated_by, validation_date)
VALUES
  ('PAL-001', 'EST-2026-102', 'Pendiente', 'Crítico', 'Asistencia < 80% + Carga percibida crítica (5/5)', '', NULL, NULL),
  ('PAL-002', 'EST-2026-155', 'Pendiente', 'Alto', 'Estrés emocional alto (4/5) + Carga percibida crítica (4/5)', '', NULL, NULL),
  ('PAL-003', 'EST-2026-041', 'Validada', 'Alto', 'Asistencia < 80% en materia clave (Estática)', 'Se convocó a sesión de tutoría con docente de Estática y consejero.', 'Dr. Carlos Valderrama', '2026-10-04 10:00:00+00'),
  ('PAL-004', 'EST-2026-210', 'Pendiente', 'Crítico', 'Asistencia < 80% + Desadaptación severa (2/5)', '', NULL, NULL)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  level = EXCLUDED.level,
  reason = EXCLUDED.reason,
  updated_at = CURRENT_TIMESTAMP;

-- 6. REGISTRO DE AUDITORÍA INICIAL
INSERT INTO audit_logs (actor_id, actor_name, role, action, details)
VALUES
  ('SYS-BOOT', 'Sistema ANCLA', 'Sistema', 'INICIALIZACIÓN_DB', 'Base de datos PostgreSQL en Neon aprovisionada correctamente para permanencia estudiantil 2026-2'),
  ('TUT-104', 'Dr. Carlos Valderrama', 'Tutor', 'VALIDACIÓN_PREALERTA', 'Validó la alerta PAL-003 para el estudiante Sebastián Gómez Ríos con citación presencial');
