-- =================================================================
-- MedAI Academy - Neon PostgreSQL Database Schema
-- Run this script in your Neon Console (SQL Editor) to initialize all tables
-- =================================================================

-- 1. Users Table (تشمل الاسم، الرقم الجامعي، السنة الدراسية، والربط بـ Google)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  student_id VARCHAR(100) UNIQUE,
  academic_year VARCHAR(100) NOT NULL DEFAULT 'السنة الأولى',
  university VARCHAR(255) DEFAULT 'كلية الطب',
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255),
  role VARCHAR(50) NOT NULL DEFAULT 'STUDENT', -- 'DEVELOPER', 'ADMIN', 'STUDENT'
  level VARCHAR(50) DEFAULT 'STUDENT', -- 'STUDENT', 'INTERN', 'RESIDENT', 'CONSULTANT'
  points INTEGER DEFAULT 100,
  rank INTEGER DEFAULT 1,
  streak INTEGER DEFAULT 1,
  avatar TEXT,
  google_id VARCHAR(255),
  cognitive_scores JSONB DEFAULT '{"foundational": 75, "clinicalReasoning": 75, "pharmacology": 75, "emergencySpeed": 75, "evidenceBased": 75}',
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Courses Table (المقررات الطبية)
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  academic_year VARCHAR(100) NOT NULL,
  level VARCHAR(50) DEFAULT 'CORE',
  icon VARCHAR(50) DEFAULT '🩺',
  badge VARCHAR(100) DEFAULT 'مقرر معتمد',
  description TEXT,
  estimated_hours INTEGER DEFAULT 10,
  students_count INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 5.0,
  modules JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Clinical Cases Table (محاكي الحالات السريرية)
CREATE TABLE IF NOT EXISTS clinical_cases (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  specialty VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) DEFAULT 'متوسط',
  points_reward INTEGER DEFAULT 200,
  patient_profile JSONB NOT NULL,
  ecg_snippet TEXT,
  lab_results TEXT,
  steps JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Quizzes Table (بنك التقييم المعرفي)
CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  time_limit_minutes INTEGER DEFAULT 15,
  total_points INTEGER DEFAULT 100,
  cognitive_dimensions JSONB DEFAULT '["foundational", "clinicalReasoning", "pharmacology", "emergencySpeed", "evidenceBased"]',
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Arena Battles Table (حلبة التنافس والمسابقات)
CREATE TABLE IF NOT EXISTS arena_battles (
  id VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  total_questions INTEGER DEFAULT 5,
  time_per_question_sec INTEGER DEFAULT 20,
  status VARCHAR(50) DEFAULT 'ACTIVE',
  participants_count INTEGER DEFAULT 0,
  prize_points INTEGER DEFAULT 500,
  questions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Flashcards Table (بطاقات الاستذكار)
CREATE TABLE IF NOT EXISTS flashcards (
  id VARCHAR(100) PRIMARY KEY,
  deck VARCHAR(100) NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  high_yield BOOLEAN DEFAULT TRUE,
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Badges Table (الأوسمة والإنجازات)
CREATE TABLE IF NOT EXISTS badges (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  description TEXT NOT NULL
);

-- -----------------------------------------------------------------
-- Insert Master Developer Account (Archerhood)
-- -----------------------------------------------------------------
INSERT INTO users (
  id, name, student_id, academic_year, university, email, password, role, level, points, rank, streak, avatar, google_id, cognitive_scores, badges
) VALUES (
  'dev_archerh456',
  'Archerhood (المطور والمسؤول الأكاديمي العام)',
  'MED-DEV-01',
  'استشاري وأستاذ أكاديمي',
  'كلية الطب - المشرف الأكاديمي العام',
  'archerh456@gmail.com',
  'developer123',
  'DEVELOPER',
  'CONSULTANT',
  9500,
  1,
  28,
  'https://api.dicebear.com/7.x/bottts/svg?seed=archerh456@gmail.com',
  'g_archerh456',
  '{"foundational": 96, "clinicalReasoning": 94, "pharmacology": 92, "emergencySpeed": 98, "evidenceBased": 95}',
  '["master_diagnostician", "emergency_hero", "ecg_guru", "code_architect", "curriculum_lead"]'
) ON CONFLICT (id) DO NOTHING;
