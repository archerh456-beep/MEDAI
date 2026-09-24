import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import fallbackDataset from '@/data/db.json';

export interface CognitiveScores {
  foundational?: number;
  clinicalReasoning: number; // الاستدلال السريري والتشخيص التفريقي
  pharmacology: number;      // الأمان الدوائي وعلم الأدوية
  pathophysiology: number;   // الفيزيولوجيا المرضية وآليات المرض
  diagnosticsLab: number;    // تفسير الفحوصات والتحاليل والـ ECG
  emergencySpeed: number;    // طب الطوارئ والتدخل الحرج السريع
  evidenceEthics: number;    // الطب المسند بالدليل والأخلاقيات
}

export interface User {
  id: string;
  name: string;
  studentId: string;
  academicYear: string;
  university: string;
  email: string;
  password?: string;
  role: 'DEVELOPER' | 'ADMIN' | 'STUDENT';
  level: string;
  points: number;
  rank: number;
  streak: number;
  avatar: string;
  googleId?: string;
  cognitiveScores: CognitiveScores;
  badges: string[];
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  type: string;
}

export interface Course {
  id: string;
  title: string;
  category: string;
  year: string;
  level: string;
  icon: string;
  badge: string;
  description: string;
  estimatedHours: number;
  studentsCount: number;
  rating: number;
  modules: CourseModule[];
}

export interface ClinicalCaseOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface ClinicalCaseStep {
  stepIndex: number;
  prompt: string;
  options: ClinicalCaseOption[];
}

export interface ClinicalCase {
  id: string;
  title: string;
  specialty: string;
  difficulty: string;
  pointsReward: number;
  patientProfile: {
    name: string;
    age: number;
    gender: string;
    chiefComplaint: string;
    history: string;
    vitals: {
      bloodPressure: string;
      heartRate: string;
      respiratoryRate: string;
      oxygenSaturation: string;
      temperature: string;
    };
  };
  ecgSnippet?: string;
  labResults?: string;
  steps: ClinicalCaseStep[];
}

export interface QuizQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  domain: keyof CognitiveScores;
  domainName: string;
  question: string;
  options: QuizQuestionOption[];
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  timeLimitMinutes: number;
  totalPoints: number;
  cognitiveDimensions: string[];
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  deck: string;
  front: string;
  back: string;
  highYield: boolean;
  category: string;
}

export interface ArenaBattle {
  id: string;
  title: string;
  totalQuestions: number;
  timePerQuestionSec: number;
  status: string;
  participantsCount: number;
  prizePoints: number;
  questions: {
    q: string;
    options: string[];
    correctIndex: number;
  }[];
}

export interface Database {
  users: User[];
  courses: Course[];
  clinicalCases: ClinicalCase[];
  quizzes: Quiz[];
  arenaBattles: ArenaBattle[];
  flashcards: Flashcard[];
  badges: { id: string; name: string; icon: string; description: string }[];
}

// Check for Neon Database URL
const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Local fallback cache path
const LOCAL_STORE = path.join(process.cwd(), 'src', 'data', 'db.json');
let memoryDb: Database | null = null;

// Initialize Neon Client if URL is provided
export function getNeonClient() {
  if (DATABASE_URL) {
    return neon(DATABASE_URL);
  }
  return null;
}

export async function isNeonConnected(): Promise<boolean> {
  if (!DATABASE_URL) return false;
  try {
    const sql = neon(DATABASE_URL);
    await sql`SELECT 1 as connected`;
    return true;
  } catch (err) {
    console.error('Neon connection check failed:', err);
    return false;
  }
}

/**
 * Reads the entire database state either from Neon PostgreSQL or fallback store
 */
export async function getDb(): Promise<Database> {
  const sql = getNeonClient();

  if (sql) {
    try {
      // Query Neon PostgreSQL tables
      const usersRows = await sql`SELECT * FROM users ORDER BY points DESC`;
      const coursesRows = await sql`SELECT * FROM courses ORDER BY created_at ASC`;
      const casesRows = await sql`SELECT * FROM clinical_cases ORDER BY created_at ASC`;
      const quizzesRows = await sql`SELECT * FROM quizzes ORDER BY created_at ASC`;
      const arenaRows = await sql`SELECT * FROM arena_battles ORDER BY created_at ASC`;
      const flashcardsRows = await sql`SELECT * FROM flashcards ORDER BY created_at ASC`;
      const badgesRows = await sql`SELECT * FROM badges`;

      return {
        users: usersRows.map((r: any) => ({
          id: r.id,
          name: r.name,
          studentId: r.student_id,
          academicYear: r.academic_year,
          university: r.university,
          email: r.email,
          password: r.password,
          role: r.role,
          level: r.level,
          points: Number(r.points) || 0,
          rank: Number(r.rank) || 1,
          streak: Number(r.streak) || 1,
          avatar: r.avatar,
          googleId: r.google_id,
          cognitiveScores: typeof r.cognitive_scores === 'string' ? JSON.parse(r.cognitive_scores) : r.cognitive_scores,
          badges: typeof r.badges === 'string' ? JSON.parse(r.badges) : r.badges,
        })),
        courses: coursesRows.map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          year: r.academic_year,
          level: r.level,
          icon: r.icon,
          badge: r.badge,
          description: r.description,
          estimatedHours: Number(r.estimated_hours),
          studentsCount: Number(r.students_count),
          rating: Number(r.rating),
          modules: typeof r.modules === 'string' ? JSON.parse(r.modules) : r.modules,
        })),
        clinicalCases: casesRows.map((r: any) => ({
          id: r.id,
          title: r.title,
          specialty: r.specialty,
          difficulty: r.difficulty,
          pointsReward: Number(r.points_reward),
          patientProfile: typeof r.patient_profile === 'string' ? JSON.parse(r.patient_profile) : r.patient_profile,
          ecgSnippet: r.ecg_snippet,
          labResults: r.lab_results,
          steps: typeof r.steps === 'string' ? JSON.parse(r.steps) : r.steps,
        })),
        quizzes: quizzesRows.map((r: any) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          timeLimitMinutes: Number(r.time_limit_minutes),
          totalPoints: Number(r.total_points),
          cognitiveDimensions: typeof r.cognitive_dimensions === 'string' ? JSON.parse(r.cognitive_dimensions) : r.cognitive_dimensions,
          questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : r.questions,
        })),
        arenaBattles: arenaRows.map((r: any) => ({
          id: r.id,
          title: r.title,
          totalQuestions: Number(r.total_questions),
          timePerQuestionSec: Number(r.time_per_question_sec),
          status: r.status,
          participantsCount: Number(r.participants_count),
          prizePoints: Number(r.prize_points),
          questions: typeof r.questions === 'string' ? JSON.parse(r.questions) : r.questions,
        })),
        flashcards: flashcardsRows.map((r: any) => ({
          id: r.id,
          deck: r.deck,
          front: r.front,
          back: r.back,
          highYield: Boolean(r.high_yield),
          category: r.category,
        })),
        badges: badgesRows.map((r: any) => ({
          id: r.id,
          name: r.name,
          icon: r.icon,
          description: r.description,
        })),
      };
    } catch (neonErr) {
      console.warn('Neon query error, falling back to local dataset:', neonErr);
    }
  }

  // Return in-memory database if already loaded
  if (memoryDb) {
    return memoryDb;
  }

  // Fallback to local store or /tmp store on Vercel
  const tmpStore = '/tmp/medai_db.json';
  try {
    if (fs.existsSync(tmpStore)) {
      const raw = fs.readFileSync(tmpStore, 'utf-8');
      memoryDb = JSON.parse(raw);
      return memoryDb!;
    }
    if (fs.existsSync(LOCAL_STORE)) {
      const raw = fs.readFileSync(LOCAL_STORE, 'utf-8');
      memoryDb = JSON.parse(raw);
      return memoryDb!;
    }
  } catch (err) {
    console.warn('Error reading local fallback store:', err);
  }

  // Guaranteed fallback to bundled dataset
  memoryDb = JSON.parse(JSON.stringify(fallbackDataset));
  return memoryDb!;
}

export async function saveDb(data: Database): Promise<boolean> {
  memoryDb = data;
  const sql = getNeonClient();

  // If Neon is connected, sync user changes and course records
  if (sql) {
    try {
      // Upsert users
      for (const u of data.users) {
        await sql`
          INSERT INTO users (id, name, student_id, academic_year, university, email, role, level, points, rank, streak, avatar, google_id, cognitive_scores, badges)
          VALUES (${u.id}, ${u.name}, ${u.studentId}, ${u.academicYear}, ${u.university}, ${u.email}, ${u.role}, ${u.level}, ${u.points}, ${u.rank}, ${u.streak}, ${u.avatar}, ${u.googleId || null}, ${JSON.stringify(u.cognitiveScores)}, ${JSON.stringify(u.badges)})
          ON CONFLICT (id) DO UPDATE SET
            points = EXCLUDED.points,
            rank = EXCLUDED.rank,
            streak = EXCLUDED.streak,
            cognitive_scores = EXCLUDED.cognitive_scores,
            badges = EXCLUDED.badges;
        `;
      }
    } catch (neonErr) {
      console.warn('Neon save error, updating local fallback:', neonErr);
    }
  }

  // Try writing to /tmp for serverless container persistence
  try {
    fs.writeFileSync('/tmp/medai_db.json', JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // ignore
  }

  // Try saving to LOCAL_STORE if in writable local environment
  try {
    const dir = path.dirname(LOCAL_STORE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(LOCAL_STORE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // Read-only filesystem on Vercel is expected and safely ignored
  }

  return true;
}

export const DEVELOPER_SECRET_KEY = process.env.DEVELOPER_SECRET_KEY || 'MEDAI_DEV_2026';

export async function getCurrentUser(userId?: string): Promise<User | null> {
  const db = await getDb();
  if (userId) {
    const found = db.users.find((u) => u.id === userId);
    if (found) return found;
  }
  // Try checking cookies if available in server context
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const cookieUserId = cookieStore.get('userId')?.value;
    if (cookieUserId) {
      const found = db.users.find((u) => u.id === cookieUserId);
      if (found) return found;
    }
  } catch {
    // Outside request context
  }

  return null;
}

/**
 * Update student profile (Name and Academic Year)
 */
export async function updateUserProfile(
  userId: string,
  updates: { name?: string; academicYear?: string }
): Promise<{ user?: User; error?: string }> {
  const db = await getDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) {
    return { error: 'المستخدم غير موجود' };
  }

  if (updates.name && updates.name.trim()) {
    user.name = updates.name.trim();
  }
  if (updates.academicYear && updates.academicYear.trim()) {
    user.academicYear = updates.academicYear.trim();
  }

  const sql = getNeonClient();
  if (sql) {
    try {
      await sql`
        UPDATE users
        SET name = ${user.name}, academic_year = ${user.academicYear}
        WHERE id = ${user.id}
      `;
    } catch (err) {
      console.warn('Neon profile update warning:', err);
    }
  }

  await saveDb(db);
  return { user };
}

/**
 * Update cognitive assessment radar scores
 */
export async function updateUserCognitiveScores(
  userId: string,
  scores: Partial<CognitiveScores>
): Promise<boolean> {
  const db = await getDb();
  const user = db.users.find((u) => u.id === userId);
  if (!user) return false;

  user.cognitiveScores = {
    ...user.cognitiveScores,
    ...scores,
  };

  // Add 150 XP for completing assessment
  user.points = (user.points || 0) + 150;

  const sql = getNeonClient();
  if (sql) {
    try {
      await sql`
        UPDATE users
        SET cognitive_scores = ${JSON.stringify(user.cognitiveScores)},
            points = ${user.points}
        WHERE id = ${user.id}
      `;
    } catch (err) {
      console.warn('Neon scores update warning:', err);
    }
  }

  await saveDb(db);
  return true;
}

/**
 * Register a new user with academic information
 */
export async function registerUser({
  name,
  email,
  studentId,
  academicYear,
  university = 'كلية الطب',
  password,
  googleId,
  avatar,
}: {
  name: string;
  email: string;
  studentId: string;
  academicYear: string;
  university?: string;
  password?: string;
  googleId?: string;
  avatar?: string;
}): Promise<{ user?: User; error?: string }> {
  const db = await getDb();

  // Check if email already registered
  const existingEmail = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return { error: 'البريد الإلكتروني مسجل مسبقاً في النظام' };
  }

  // Check if studentId already exists
  const existingId = db.users.find((u) => u.studentId?.toLowerCase() === studentId.toLowerCase());
  if (existingId) {
    return { error: 'الرقم الجامعي مسجل مسبقاً لطالب آخر' };
  }

  const isDevAccount = email.toLowerCase() === 'archerh456@gmail.com';

  const newUser: User = {
    id: isDevAccount ? 'dev_archerh456' : `user_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    studentId,
    academicYear,
    university,
    password: password || '123456',
    role: isDevAccount ? 'DEVELOPER' : 'STUDENT',
    level: isDevAccount ? 'CONSULTANT' : academicYear.includes('امتياز') ? 'INTERN' : 'STUDENT',
    points: 0, // Welcome bonus
    rank: db.users.length + 1,
    streak: 1,
    avatar:
      avatar ||
      `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email.toLowerCase())}`,
    googleId,
    cognitiveScores: {
      foundational: 0,
      clinicalReasoning: 0,
      pharmacology: 0,
      pathophysiology: 0,
      diagnosticsLab: 0,
      emergencySpeed: 0,
      evidenceEthics: 0,
    },
    badges: [],
  };

  const sql = getNeonClient();
  if (sql) {
    try {
      await sql`
        INSERT INTO users (id, name, student_id, academic_year, university, email, password, role, level, points, rank, streak, avatar, google_id, cognitive_scores, badges)
        VALUES (${newUser.id}, ${newUser.name}, ${newUser.studentId}, ${newUser.academicYear}, ${newUser.university}, ${newUser.email}, ${newUser.password}, ${newUser.role}, ${newUser.level}, ${newUser.points}, ${newUser.rank}, ${newUser.streak}, ${newUser.avatar}, ${newUser.googleId || null}, ${JSON.stringify(newUser.cognitiveScores)}, ${JSON.stringify(newUser.badges)})
      `;
    } catch (err) {
      console.warn('Neon insert error:', err);
    }
  }

  db.users.push(newUser);
  await saveDb(db);
  return { user: newUser };
}

/**
 * Handle Google Login / Linking
 */
export async function authenticateWithGoogle({
  email,
  name,
  googleId,
  avatar,
  studentId,
  academicYear,
}: {
  email: string;
  name: string;
  googleId: string;
  avatar?: string;
  studentId?: string;
  academicYear?: string;
}): Promise<{ user: User; isNewUser: boolean }> {
  const db = await getDb();
  const existingUser = db.users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() || (u.googleId && u.googleId === googleId)
  );

  if (existingUser) {
    // Update googleId and avatar if not present
    existingUser.googleId = googleId;
    if (avatar) existingUser.avatar = avatar;
    if (studentId && !existingUser.studentId) existingUser.studentId = studentId;
    if (academicYear) existingUser.academicYear = academicYear;
    await saveDb(db);
    return { user: existingUser, isNewUser: false };
  }

  // Create new user linked with Google
  const isDev = email.toLowerCase() === 'archerh456@gmail.com';
  const newUser: User = {
    id: isDev ? 'dev_archerh456' : `user_g_${Date.now()}`,
    name,
    email: email.toLowerCase(),
    studentId: studentId || `MED-${Math.floor(1000 + Math.random() * 9000)}`,
    academicYear: academicYear || 'السنة الأولى',
    university: 'كلية الطب',
    role: isDev ? 'DEVELOPER' : 'STUDENT',
    level: isDev ? 'CONSULTANT' : 'STUDENT',
    points: 0, // Welcome + Google link bonus
    rank: db.users.length + 1,
    streak: 1,
    avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${email.toLowerCase()}`,
    googleId,
    cognitiveScores: {
      foundational: 0,
      clinicalReasoning: 0,
      pharmacology: 0,
      pathophysiology: 0,
      diagnosticsLab: 0,
      emergencySpeed: 0,
      evidenceEthics: 0,
    },
    badges: [],
  };

  db.users.push(newUser);
  await saveDb(db);
  return { user: newUser, isNewUser: true };
}
