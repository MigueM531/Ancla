-- ===================================================================
-- PROYECTO ANCLA - ESQUEMA DE BASE DE DATOS POSTGRESQL (NEON)
-- Sistema de Monitoreo Temprano, Análisis y Alerta de Retención Estudiantil
-- Facultad de Ingenierías - Universidad de Medellín
-- ===================================================================

-- 1. TABLA DE ROLES INSTITUCIONALES
CREATE TABLE IF NOT EXISTS roles (
  code VARCHAR(30) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABLA DE USUARIOS DEL SISTEMA (Estudiante, Tutor, Directivo)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_code VARCHAR(30) NOT NULL REFERENCES roles(code) ON UPDATE CASCADE,
  role_label VARCHAR(100) NOT NULL,
  department VARCHAR(150),
  program VARCHAR(150),
  semester INT DEFAULT 1,
  avatar VARCHAR(10) DEFAULT 'US',
  privacy_consent_accepted BOOLEAN DEFAULT FALSE,
  consent_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABLA DE ESTUDIANTES PARA MONITOREO DE PERMANENCIA
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL,
  program VARCHAR(150) NOT NULL,
  semester INT NOT NULL DEFAULT 1,
  attendance_rate NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
  risk_level VARCHAR(30) NOT NULL DEFAULT 'Bajo',
  user_id INT REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABLA DE PERCEPCIONES DE BIENESTAR (Encuestas de Acompañamiento)
CREATE TABLE IF NOT EXISTS wellness_perceptions (
  id SERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  emotional_wellbeing INT CHECK (emotional_wellbeing BETWEEN 1 AND 5),
  stress_level INT CHECK (stress_level BETWEEN 1 AND 5),
  academic_load INT CHECK (academic_load BETWEEN 1 AND 5),
  adaptation_level INT CHECK (adaptation_level BETWEEN 1 AND 5),
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. TABLA DE PRE-ALERTAS TEMPRANAS
CREATE TABLE IF NOT EXISTS pre_alerts (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'Pendiente', -- 'Pendiente', 'Validada', 'Descartada'
  level VARCHAR(30) NOT NULL,                      -- 'Crítico', 'Alto', 'Medio', 'Bajo'
  reason TEXT,
  tutor_notes TEXT,
  validated_by VARCHAR(150),
  validation_date TIMESTAMP WITH TIME ZONE,
  dismissed_signature VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABLA DE AUDITORÍA Y TRAZABILIDAD ÉTICA
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_id VARCHAR(50) NOT NULL,
  actor_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ÍNDICES DE RENDIMIENTO Y CONSULTA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_code);
CREATE INDEX IF NOT EXISTS idx_students_risk ON students(risk_level);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON pre_alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_student ON pre_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_perceptions_student ON wellness_perceptions(student_id);
