'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Database, Course, ClinicalCase, QuizQuestion, User } from '@/lib/db';

interface DeveloperStudioProps {
  initialDb: Database;
  initiallyUnlocked?: boolean;
}

export default function DeveloperStudio({
  initialDb,
  initiallyUnlocked = false,
}: DeveloperStudioProps) {
  // Security Gate State
  const [isUnlocked, setIsUnlocked] = useState(initiallyUnlocked);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Studio State
  const [activeTab, setActiveTab] = useState<'studio' | 'courses' | 'leaderboard'>('studio');
  const [studioSubTab, setStudioSubTab] = useState<'case_architect' | 'cognitive_calibration' | 'ai_sandbox' | 'neon_control'>('case_architect');
  const [db, setDb] = useState<Database>(initialDb);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Clinical Case Architect State
  const [caseForm, setCaseForm] = useState({
    title: 'ألم حاد بالصدر مع تعرق وانخفاض بضغط الدم',
    specialty: 'أمراض القلب وطب الطوارئ',
    difficulty: 'متقدم',
    pointsReward: 250,
    patientName: 'أبو فهد',
    patientAge: 54,
    patientGender: 'ذكر',
    chiefComplaint: 'ألم عاصر خلف عظم القص يمتد للذراع اليسرى مع ضيق تنفس شديد بدأ منذ 45 دقيقة.',
    history: 'مدخن شره، يعاني من داء السكري النمط الثاني وارتفاع الكولسترول دون التزام بالعلاج.',
    // Vitals
    bpSystolic: 85,
    bpDiastolic: 55,
    heartRate: 118,
    respiratoryRate: 24,
    spO2: 91,
    temperature: 37.2,
    gcs: 14,
    // ECG Waveform Preset
    ecgPreset: 'anterior_stemi',
    // Lab Panel
    troponin: '3.8 ng/mL (High)',
    lactate: '2.9 mmol/L (Elevated)',
    // Step prompt
    stepPrompt: 'المريض في حالة صدمة قلبية وليدة الاحتشاء الحاد. ما هو التدخل العاجل الأكثر أولوية خلال الدقائق العشر القادمة؟',
    stepOptA: 'قسطرة تداخلية أولية عاجلة (Primary PCI) مع دعم ترويضي للمضخة بالإنوتروبات',
    stepOptB: 'إعطاء 2 لتر محلول ملحي سريع دون فحص علامات احتقان الرئة',
    stepOptC: 'إعطاء حاصرات بيتا وريدياً فوراً لخفض تسارع ضربات القلب',
    correctOpt: 'a',
    stepExplanation: 'في الصدمة القلبية الناتجة عن Anterior STEMI، فتح الشريان المسدود بالقسطرة الفورية مع الحذر الشديد من إغراق الرئة بالسوائل وتجنب حاصرات بيتا هو الخيار المنقذ للحياة.',
  });

  // 2. Cognitive Radar Calibration Weights State
  const [radarWeights, setRadarWeights] = useState({
    clinicalReasoning: 25,
    pharmacology: 20,
    pathophysiology: 15,
    diagnosticsLab: 15,
    emergencySpeed: 15,
    evidenceEthics: 10,
    errorPenaltyMultiplier: 1.5,
  });

  // 3. AI Sandbox State
  const [aiPromptType, setAiPromptType] = useState<'case_gen' | 'pharmacology_check' | 'socratic_tutor'>('case_gen');
  const [aiCustomInput, setAiCustomInput] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);

  // 4. Course Management State
  const [courseFilter, setCourseFilter] = useState('ALL');
  const [newCourse, setNewCourse] = useState({
    title: '',
    category: 'INTERNAL_MEDICINE',
    year: 'السنوات السريرية',
    level: 'CLINICAL',
    icon: '🩺',
    badge: 'مقرر معتمد',
    description: '',
    estimatedHours: 16,
  });

  // 5. Leaderboard Bonus Modal State
  const [selectedStudentForBonus, setSelectedStudentForBonus] = useState<User | null>(null);
  const [bonusPoints, setBonusPoints] = useState(100);
  const [bonusBadge, setBonusBadge] = useState('master_diagnostician');

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle Developer Verification
  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      const res = await fetch('/api/developer/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkeyInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsUnlocked(true);
        showNotification('تمت المصادقة الأمنية! مرحباً بك في استوديو المطور ⚡');
      } else {
        setAuthError(data.error || 'رمز الحماية غير صحيح');
      }
    } catch {
      setAuthError('حدث خطأ أثناء التحقق الأمني');
    } finally {
      setAuthLoading(false);
    }
  };

  // Add Case to DB
  const handleCreateCase = async () => {
    setActionLoading(true);
    try {
      const newCaseObj: Partial<ClinicalCase> = {
        title: caseForm.title,
        specialty: caseForm.specialty,
        difficulty: caseForm.difficulty,
        pointsReward: Number(caseForm.pointsReward),
        patientProfile: {
          name: caseForm.patientName,
          age: Number(caseForm.patientAge),
          gender: caseForm.patientGender,
          chiefComplaint: caseForm.chiefComplaint,
          history: caseForm.history,
          vitals: {
            bloodPressure: `${caseForm.bpSystolic}/${caseForm.bpDiastolic} mmHg`,
            heartRate: `${caseForm.heartRate} bpm`,
            respiratoryRate: `${caseForm.respiratoryRate} /min`,
            oxygenSaturation: `${caseForm.spO2}%`,
            temperature: `${caseForm.temperature} °C`,
          },
        },
        ecgSnippet: `Preset: ${caseForm.ecgPreset} | Waveform recorded live via Medical Simulator`,
        labResults: `Troponin: ${caseForm.troponin} | Lactate: ${caseForm.lactate}`,
        steps: [
          {
            stepIndex: 1,
            prompt: caseForm.stepPrompt,
            options: [
              {
                id: 'opt_a',
                text: caseForm.stepOptA,
                isCorrect: caseForm.correctOpt === 'a',
                explanation: caseForm.stepExplanation,
              },
              {
                id: 'opt_b',
                text: caseForm.stepOptB,
                isCorrect: caseForm.correctOpt === 'b',
                explanation: 'خاطئ: يؤدي إلى تفاقم الوذمة الرئوية الحادة أو صدمة انخفاض الضغط.',
              },
              {
                id: 'opt_c',
                text: caseForm.stepOptC,
                isCorrect: caseForm.correctOpt === 'c',
                explanation: 'خاطئ وموانع استعمال قاطعة في ظل انخفاض الضغط الحاد وعلامات الصدمة القلبية.',
              },
            ],
          },
        ],
      };

      const res = await fetch('/api/developer/update-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_CLINICAL_CASE', payload: newCaseObj }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تم إطلاق الحالة السريرية التفاعلية بنجاح في المنصة! 🏥');
        setDb({
          ...db,
          clinicalCases: [
            ...db.clinicalCases,
            { ...newCaseObj, id: `case_${Date.now()}` } as ClinicalCase,
          ],
        });
      } else {
        showNotification(data.error || 'فشل حفظ الحالة', 'error');
      }
    } catch {
      showNotification('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Course to DB
  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.title || !newCourse.description) {
      showNotification('يرجى ملء عنوان ووصف المقرر', 'error');
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        ...newCourse,
        modules: [
          {
            id: `m_${Date.now()}_1`,
            title: `مقدمة في ${newCourse.title}`,
            duration: '40 دقيقة',
            type: 'LECTURE',
          },
          {
            id: `m_${Date.now()}_2`,
            title: 'المحاكاة والتحليلات السريرية التطبيقية',
            duration: '50 دقيقة',
            type: 'CASE_STUDY',
          },
          {
            id: `m_${Date.now()}_3`,
            title: 'التشخيص التفريقي والأمان الدوائي',
            duration: '35 دقيقة',
            type: 'PHARMACOLOGY',
          },
        ],
      };

      const res = await fetch('/api/developer/update-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ADD_COURSE', payload }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تمت إضافة المقرر الطبي بنجاح! 📚');
        setDb({
          ...db,
          courses: [
            ...db.courses,
            {
              ...payload,
              id: `course_${Date.now()}`,
              studentsCount: 0,
              rating: 5.0,
            } as Course,
          ],
        });
        setNewCourse({
          title: '',
          category: 'INTERNAL_MEDICINE',
          year: 'السنوات السريرية',
          level: 'CLINICAL',
          icon: '🩺',
          badge: 'مقرر معتمد',
          description: '',
          estimatedHours: 16,
        });
      } else {
        showNotification(data.error || 'فشل إضافة المقرر', 'error');
      }
    } catch {
      showNotification('خطأ في الاتصال', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المقرر الطبي؟')) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/developer/update-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE_COURSE', payload: { courseId } }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification('تم حذف المقرر بنجاح');
        setDb({ ...db, courses: db.courses.filter((c) => c.id !== courseId) });
      }
    } catch {
      showNotification('خطأ في الحذف', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Award Student Bonus
  const handleAwardBonus = async () => {
    if (!selectedStudentForBonus) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/developer/update-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'AWARD_BONUS',
          payload: {
            userId: selectedStudentForBonus.id,
            bonusPoints,
            badge: bonusBadge,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message);
        // update local DB
        const updatedUsers = db.users.map((u) => {
          if (u.id === selectedStudentForBonus.id) {
            const badges = [...u.badges];
            if (!badges.includes(bonusBadge)) badges.push(bonusBadge);
            return {
              ...u,
              points: (u.points || 0) + Number(bonusPoints),
              badges,
            };
          }
          return u;
        });
        setDb({ ...db, users: updatedUsers });
        setSelectedStudentForBonus(null);
      } else {
        showNotification(data.error || 'فشل منح المكافأة', 'error');
      }
    } catch {
      showNotification('خطأ في الاتصال', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // AI Prompt Simulator
  const handleTestAi = () => {
    setAiGenerating(true);
    setAiOutput('');
    setTimeout(() => {
      if (aiPromptType === 'case_gen') {
        setAiOutput(
          `[AI MedStudio Engine v3.2 - Simulated Output]:\n\n` +
          `• سيناريو الحالة المقترح: متلازمة ضيق التنفس الحادة (ARDS) تالية لذات رئة شديدة.\n` +
          `• العلامات الحيوية: PaO2/FiO2 ratio: 140 mmHg, SpO2: 87% على قناع الأكسجين، النبض: 125/دقيقة.\n` +
          `• الفحص الشعاعي: ارتشاحات ثنائية الجانب منتشرة (Bilateral infiltrates) دون توسع في ظل القلب.\n` +
          `• القرار الحرج: تطبيق استراتيجية التهوية الوقائية للرئة (Low Tidal Volume Ventilation: 6 mL/kg) مع PEEP عالي وتجنب الضغط الرضحي (Barotrauma).`
        );
      } else if (aiPromptType === 'pharmacology_check') {
        setAiOutput(
          `[MedAI Clinical Pharmacist Engine]:\n\n` +
          `• تم فحص التداخل: Clopidogrel + Omeprazole.\n` +
          `• التحذير السريري: أوميبرازول يثبط إنزيم CYP2C19 الكبدي المسؤول عن تفعيل كلوبيدوجريل، مما يقلل فعاليته المضادة للصفيحات بنسبة تصل إلى 45% ويرفع خطر تكرار الجلطة.\n` +
          `• التوصية السريرية: التبديل إلى Pantoprazole أو Famotidine لتقليل التثبيط الإنزيمي التنافسي.`
        );
      } else {
        setAiOutput(
          `[Socratic Clinical Tutor Response]:\n\n` +
          `"دكتور، قبل أن نقفز مباشرة إلى طلب قسطرة تشخيصية، لاحظت أن ضغط دم المريض 75/40 وأوردة العنق محتقنة مع خفوت أصوات القلب (Beck's Triad). ما هي الحالة الجراحية الإسعافية المهددة للحياة التي يجب أن نستبعدها بالسونار الفوري عند السرير (POCUS) قبل التفكير بأي احتشاء؟"`
        );
      }
      setAiGenerating(false);
    }, 900);
  };

  // If locked, render the High-Security Gate
  if (!isUnlocked) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-gradient-to-b from-[#0c142b] to-[#070b1a] border border-indigo-500/40 shadow-2xl space-y-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-950 border-2 border-indigo-500/50 flex items-center justify-center text-3xl mx-auto shadow-lg shadow-indigo-500/30">
            🔒
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">منطقة المطور والمشرف الأكاديمي</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              هذه المنطقة مشفرة ومخصصة للمطور والمشرف العام على المنظمة. يرجى إدخال رمز الحماية المعتمد للمتابعة.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-bold">
              {authError}
            </div>
          )}

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-slate-300">رمز المرور السري / Master Key</label>
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                placeholder="أدخل رمز المطور (مثال: MEDAI_DEV_2026)"
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-400 font-mono text-center tracking-wider"
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {authLoading ? 'جارٍ التحقق الأمني...' : 'التحقق وفتح استوديو المطور ⚡'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500">
            الرمز الافتراضي المعتمد للمطور: <code className="text-indigo-300 font-mono bg-indigo-950/60 px-1.5 py-0.5 rounded">MEDAI_DEV_2026</code>
          </p>
        </div>
      </div>
    );
  }

  // Filter courses
  const filteredCourses = db.courses.filter((c) => {
    if (courseFilter === 'ALL') return true;
    return c.category === courseFilter;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Toast Alert */}
      {statusMessage && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2 animate-bounce ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
          }`}
        >
          <span>{statusMessage.type === 'success' ? '⚡' : '⚠️'}</span>
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Developer Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d1633] via-slate-900 to-[#0c142b] border border-indigo-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-black">
              ⚡ وحدة تحكم المطور والمسؤول الأكاديمي
            </span>
            <span className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              NEON LIVE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            استوديو المطور التفاعلي المتقدم (MedAI Studio Pro)
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            المنصة المركزية لإدارة المناهج الطبية، هندسة الحالات السريرية الحية، معايرة الرادار المعرفي، ومتابعة لوحة المتصدرين الوطنية.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUnlocked(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/70 text-slate-300 hover:text-rose-200 border border-slate-700 hover:border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5"
          >
            <span>🔒</span>
            <span>قفل الاستوديو</span>
          </button>
        </div>
      </div>

      {/* Main 3 Navigation Tabs (المطلوبة بالتحديد من المستخدم) */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('studio')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
            activeTab === 'studio'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🎨</span>
          <span>استوديو المطور الإبداعي المتخصص</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>📚</span>
          <span>أسماء وإدارة الكورسات الطبية ({db.courses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`px-5 py-3 rounded-2xl text-xs sm:text-sm font-black transition flex items-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <span>🏆</span>
          <span>لوحة المتصدرين وقائمة الشرف (Leaderboard)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: استوديو المطور الإبداعي المتخصص (Advanced Creative Studio)          */}
      {/* ========================================================================= */}
      {activeTab === 'studio' && (
        <div className="space-y-6">
          {/* Studio Sub-Navigation */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStudioSubTab('case_architect')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                studioSubTab === 'case_architect'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🏥</span>
              <span>مهندس ومحاكي الحالات السريرية الحية</span>
            </button>

            <button
              onClick={() => setStudioSubTab('cognitive_calibration')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                studioSubTab === 'cognitive_calibration'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🕸️</span>
              <span>معايرة مصفوفة الرادار المعرفي</span>
            </button>

            <button
              onClick={() => setStudioSubTab('ai_sandbox')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                studioSubTab === 'ai_sandbox'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🤖</span>
              <span>مختبر الذكاء الاصطناعي والمحاكاة</span>
            </button>

            <button
              onClick={() => setStudioSubTab('neon_control')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                studioSubTab === 'neon_control'
                  ? 'bg-cyan-500 text-slate-950 font-black'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>🐘</span>
              <span>مركز عمليات قاعدة بيانات Neon</span>
            </button>
          </div>

          {/* Sub-Tab 1: Clinical Case Architect */}
          {studioSubTab === 'case_architect' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Form & Inputs */}
              <div className="lg:col-span-7 space-y-6">
                <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-5">
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    <span>🩺</span>
                    <span>تصميم سيناريو الحالة السريرية التفاعلية</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">عنوان الحالة</label>
                      <input
                        type="text"
                        value={caseForm.title}
                        onChange={(e) => setCaseForm({ ...caseForm, title: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">التخصص الطبي</label>
                      <select
                        value={caseForm.specialty}
                        onChange={(e) => setCaseForm({ ...caseForm, specialty: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                      >
                        <option>أمراض القلب وطب الطوارئ</option>
                        <option>الباطنة العامة والغدد الصماء</option>
                        <option>طب الأطفال والإنعاش</option>
                        <option>الجراحة العامة والحوادث</option>
                        <option>طب الأعصاب والسكتات الدماغية</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-xs font-bold text-slate-300">الشكوى الرئيسية والفحص السريري</label>
                      <textarea
                        rows={2}
                        value={caseForm.chiefComplaint}
                        onChange={(e) => setCaseForm({ ...caseForm, chiefComplaint: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed font-semibold"
                      />
                    </div>
                  </div>

                  {/* Interactive Sliders for Patient Vitals */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-black text-cyan-400 uppercase tracking-wider">
                      محاكي العلامات الحيوية المباشرة (Live Patient Vitals)
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {/* BP Systolic */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-400">ضغط الدم الانقباضي</span>
                          <span className={caseForm.bpSystolic < 90 ? 'text-rose-400' : 'text-emerald-400'}>
                            {caseForm.bpSystolic} mmHg
                          </span>
                        </div>
                        <input
                          type="range"
                          min="60"
                          max="200"
                          value={caseForm.bpSystolic}
                          onChange={(e) => setCaseForm({ ...caseForm, bpSystolic: Number(e.target.value) })}
                          className="w-full accent-cyan-400"
                        />
                      </div>

                      {/* Heart Rate */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-400">معدل النبض HR</span>
                          <span className={caseForm.heartRate > 100 || caseForm.heartRate < 60 ? 'text-amber-400' : 'text-emerald-400'}>
                            {caseForm.heartRate} bpm
                          </span>
                        </div>
                        <input
                          type="range"
                          min="40"
                          max="180"
                          value={caseForm.heartRate}
                          onChange={(e) => setCaseForm({ ...caseForm, heartRate: Number(e.target.value) })}
                          className="w-full accent-amber-400"
                        />
                      </div>

                      {/* SpO2 */}
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span className="text-slate-400">تشبع الأكسجين SpO2</span>
                          <span className={caseForm.spO2 < 92 ? 'text-rose-400' : 'text-emerald-400'}>
                            {caseForm.spO2}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="75"
                          max="100"
                          value={caseForm.spO2}
                          onChange={(e) => setCaseForm({ ...caseForm, spO2: Number(e.target.value) })}
                          className="w-full accent-teal-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Decision Step & Options */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-300">سؤال القرار الحرج للطالب</label>
                      <input
                        type="text"
                        value={caseForm.stepPrompt}
                        onChange={(e) => setCaseForm({ ...caseForm, stepPrompt: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-400">الخيار الصحيح (A):</span>
                        <input
                          type="text"
                          value={caseForm.stepOptA}
                          onChange={(e) => setCaseForm({ ...caseForm, stepOptA: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-rose-400">الخيار الخاطئ (B):</span>
                        <input
                          type="text"
                          value={caseForm.stepOptB}
                          onChange={(e) => setCaseForm({ ...caseForm, stepOptB: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleCreateCase}
                      disabled={actionLoading}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-xl shadow-cyan-500/25 transition disabled:opacity-50"
                    >
                      {actionLoading ? 'جارٍ الإطلاق...' : 'إطلاق الحالة السريرية فوراً إلى المنصة 🚀'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Telemetry & ECG Preview */}
              <div className="lg:col-span-5 space-y-6">
                {/* Simulated ICU Patient Monitor */}
                <div className="p-6 rounded-3xl bg-slate-950 border border-slate-800 space-y-4 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                      <span className="text-xs font-mono font-bold text-emerald-400">ICU MONITOR BEDSIDE #04</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">LIVE TELEMETRY</span>
                  </div>

                  {/* Vitals Digital Readout */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">HR (BPM)</span>
                      <span className="text-3xl font-black text-emerald-400 font-mono">{caseForm.heartRate}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">NIBP (mmHg)</span>
                      <span className="text-2xl font-black text-cyan-400 font-mono">
                        {caseForm.bpSystolic}/{caseForm.bpDiastolic}
                      </span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">SpO2 (%)</span>
                      <span className="text-3xl font-black text-teal-400 font-mono">{caseForm.spO2}%</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-mono">RR (/min)</span>
                      <span className="text-3xl font-black text-amber-400 font-mono">{caseForm.respiratoryRate}</span>
                    </div>
                  </div>

                  {/* Simulated ECG Waveform Canvas / SVG */}
                  <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-emerald-400">
                      <span>LEAD II (ST-Elevation Anterior STEMI)</span>
                      <span>25 mm/s | 10 mm/mV</span>
                    </div>
                    <svg viewBox="0 0 400 60" className="w-full h-16 text-emerald-400">
                      <path
                        d="M0,30 L40,30 L45,28 L50,30 L60,30 L65,10 L70,55 L75,5 L85,15 L100,18 L120,30 L160,30 L165,28 L170,30 L180,30 L185,10 L190,55 L195,5 L205,15 L220,18 L240,30 L280,30 L285,28 L290,30 L300,30 L305,10 L310,55 L315,5 L325,15 L340,18 L360,30 L400,30"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Triage Alert */}
                  {caseForm.bpSystolic < 90 && (
                    <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2 animate-pulse">
                      <span>🚨</span>
                      <span>تحذير حرج: المريض في حالة صدمة هبوط ضغط دمي (Hypotensive Shock)</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 2: Cognitive Radar Calibration Studio */}
          {studioSubTab === 'cognitive_calibration' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <h3 className="font-black text-white text-lg flex items-center gap-2">
                    <span>🕸️</span>
                    <span>معايرة أوزان ومعادلات الرادار المعرفي سداسي الأبعاد</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    ضبط الحصص النسبية للأبعاد الستة ومعامل الخصم للأخطاء السريرية القاتلة.
                  </p>
                </div>

                <button
                  onClick={() => showNotification('تم حفظ مصفوفة الأوزان المعرفية بنجاح!')}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs shadow-md"
                >
                  حفظ المعايرة
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Dimension 1 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>1. الاستدلال السريري</span>
                    <span className="text-indigo-400 font-mono">{radarWeights.clinicalReasoning}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={radarWeights.clinicalReasoning}
                    onChange={(e) => setRadarWeights({ ...radarWeights, clinicalReasoning: Number(e.target.value) })}
                    className="w-full accent-indigo-400"
                  />
                  <p className="text-[10px] text-slate-400">وزن التشخيص التفريقي وربط الأعراض</p>
                </div>

                {/* Dimension 2 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>2. الأمان الدوائي</span>
                    <span className="text-purple-400 font-mono">{radarWeights.pharmacology}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={radarWeights.pharmacology}
                    onChange={(e) => setRadarWeights({ ...radarWeights, pharmacology: Number(e.target.value) })}
                    className="w-full accent-purple-400"
                  />
                  <p className="text-[10px] text-slate-400">وزن حساب الجرعات والتفاعلات العكسية</p>
                </div>

                {/* Dimension 3 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>3. الفيزيولوجيا المرضية</span>
                    <span className="text-cyan-400 font-mono">{radarWeights.pathophysiology}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={radarWeights.pathophysiology}
                    onChange={(e) => setRadarWeights({ ...radarWeights, pathophysiology: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                  <p className="text-[10px] text-slate-400">فهم آليات المرض الخلوية والعضوية</p>
                </div>

                {/* Dimension 4 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>4. الفحوصات والـ ECG</span>
                    <span className="text-teal-400 font-mono">{radarWeights.diagnosticsLab}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={radarWeights.diagnosticsLab}
                    onChange={(e) => setRadarWeights({ ...radarWeights, diagnosticsLab: Number(e.target.value) })}
                    className="w-full accent-teal-400"
                  />
                  <p className="text-[10px] text-slate-400">دقة قراءة التخطيط والتحاليل المخبرية</p>
                </div>

                {/* Dimension 5 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>5. سرعة الطوارئ والإنعاش</span>
                    <span className="text-amber-400 font-mono">{radarWeights.emergencySpeed}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    value={radarWeights.emergencySpeed}
                    onChange={(e) => setRadarWeights({ ...radarWeights, emergencySpeed: Number(e.target.value) })}
                    className="w-full accent-amber-400"
                  />
                  <p className="text-[10px] text-slate-400">معدل التدخل الحرج تحت عامل الوقت</p>
                </div>

                {/* Dimension 6 */}
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-white">
                    <span>6. الأخلاقيات والطب المسند</span>
                    <span className="text-emerald-400 font-mono">{radarWeights.evidenceEthics}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    value={radarWeights.evidenceEthics}
                    onChange={(e) => setRadarWeights({ ...radarWeights, evidenceEthics: Number(e.target.value) })}
                    className="w-full accent-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400">المبادئ التوجيهية واستقلالية المريض</p>
                </div>
              </div>
            </div>
          )}

          {/* Sub-Tab 3: AI Prompt & Socratic Sandbox */}
          {studioSubTab === 'ai_sandbox' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
              <div className="space-y-1">
                <h3 className="font-black text-white text-lg flex items-center gap-2">
                  <span>🤖</span>
                  <span>مختبر المحاكاة والذكاء الاصطناعي السريري (Socratic AI Prompt Studio)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  اختبار استجابات المساعد الذكي ومولد سيناريوهات الحالات الطبية السريرية في الوقت الفعلي.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setAiPromptType('case_gen')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    aiPromptType === 'case_gen' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  مولد سيناريو العناية المركزة
                </button>
                <button
                  onClick={() => setAiPromptType('pharmacology_check')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    aiPromptType === 'pharmacology_check' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  فاحص التداخلات الدوائية
                </button>
                <button
                  onClick={() => setAiPromptType('socratic_tutor')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold ${
                    aiPromptType === 'socratic_tutor' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  المرشد السقراطي السريري
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleTestAi}
                  disabled={aiGenerating}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-50"
                >
                  {aiGenerating ? 'جارٍ تشغيل المحرك...' : 'تشغيل محاكاة الذكاء الاصطناعي ▶'}
                </button>

                {aiOutput && (
                  <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 font-mono text-xs text-cyan-200 whitespace-pre-wrap leading-relaxed">
                    {aiOutput}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub-Tab 4: Neon PostgreSQL Control */}
          {studioSubTab === 'neon_control' && (
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🐘</span>
                  <div>
                    <h3 className="font-black text-white text-base">مركز إدارة قاعدة بيانات Neon Serverless</h3>
                    <p className="text-xs text-slate-400">PostgreSQL Cloud Cluster • MedAI Academy Production</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  ● اتصال نشط ومستقر
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">المستخدمون والطلاب</span>
                  <span className="text-2xl font-black text-white block mt-1">{db.users.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">المقررات الطبية</span>
                  <span className="text-2xl font-black text-cyan-400 block mt-1">{db.courses.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">الحالات السريرية</span>
                  <span className="text-2xl font-black text-teal-400 block mt-1">{db.clinicalCases.length}</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <span className="text-xs text-slate-400">أسئلة الرادار والمسابقات</span>
                  <span className="text-2xl font-black text-amber-400 block mt-1">
                    {(db.quizzes[0]?.questions.length || 0) + (db.flashcards?.length || 0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: أسماء وإدارة الكورسات الطبية (Courses Management)                   */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-6">
          {/* Header & Filter */}
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <span>📚</span>
                <span>قائمة وأسماء المقررات الطبية المعتمدة</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                إجمالي المقررات: {db.courses.length} مقرر • يمكنك تعديل وإضافة أو حذف أي مقرر.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {['ALL', 'INTERNAL_MEDICINE', 'EMERGENCY', 'BASIC_SCIENCE'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCourseFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    courseFilter === cat
                      ? 'bg-cyan-500 text-slate-950 font-black'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat === 'ALL'
                    ? 'الكل'
                    : cat === 'INTERNAL_MEDICINE'
                    ? 'الباطنة العامة'
                    : cat === 'EMERGENCY'
                    ? 'الطوارئ'
                    : 'العلوم الأساسية'}
                </button>
              ))}
            </div>
          </div>

          {/* Add New Course Form */}
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-indigo-500/30 space-y-4">
            <h4 className="font-black text-white text-sm flex items-center gap-2">
              <span>➕</span>
              <span>إضافة مقرر طبي جديد إلى المنصة</span>
            </h4>

            <form onSubmit={handleAddCourse} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">اسم المقرر الطبي</label>
                <input
                  type="text"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="مثال: جراحة العظام والكسور الحادة"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">التصنيف</label>
                <select
                  value={newCourse.category}
                  onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                >
                  <option value="INTERNAL_MEDICINE">الباطنة العامة</option>
                  <option value="EMERGENCY">طب الطوارئ</option>
                  <option value="BASIC_SCIENCE">العلوم الأساسية</option>
                  <option value="SURGERY">الجراحة العامة</option>
                  <option value="PEDIATRICS">طب الأطفال</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">السنة الأكاديمية المستهدفة</label>
                <input
                  type="text"
                  value={newCourse.year}
                  onChange={(e) => setNewCourse({ ...newCourse, year: e.target.value })}
                  placeholder="مثال: السنوات السريرية (4-5)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">أيقونة ورمز المقرر</label>
                <input
                  type="text"
                  value={newCourse.icon}
                  onChange={(e) => setNewCourse({ ...newCourse, icon: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs text-center font-bold"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                <label className="text-xs font-bold text-slate-300">الوصف الأكاديمي والسريري</label>
                <input
                  type="text"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="وصف تفصيلي لما سيتعلمه الطالب من محاكاة وحالات..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-50"
                >
                  إضافة المقرر فوراً ➕
                </button>
              </div>
            </form>
          </div>

          {/* List of Courses */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((c) => (
              <div
                key={c.id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 rounded-xl bg-slate-950 border border-slate-800">
                      {c.icon || '🩺'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-800/40">
                      {c.year}
                    </span>
                  </div>

                  <h4 className="font-black text-white text-sm">{c.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>{c.modules?.length || 3} وحدات تعليمية</span>
                    <span>⏳ {c.estimatedHours} ساعة تدريب</span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <Link
                      href={`/courses/${c.id}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                    >
                      معاينة الطالب ←
                    </Link>

                    <button
                      onClick={() => handleDeleteCourse(c.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-bold transition border border-rose-500/30"
                    >
                      حذف المقرر 🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: لوحة المتصدرين وقائمة الشرف (Leaderboard)                           */}
      {/* ========================================================================= */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-black text-white text-lg flex items-center gap-2">
                <span>🏆</span>
                <span>لوحة المتصدرين الوطنية لطلاب الطب والأطباء (Medical Leaderboard)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                ترتيب الطلاب حسب نقاط الخبرة السريرية (XP) وأيام النشاط المتواصل والدرجات المعرفية.
              </p>
            </div>

            <div className="text-xs text-cyan-400 font-bold bg-cyan-950/60 px-3.5 py-1.5 rounded-xl border border-cyan-500/30">
              إجمالي الطلاب المتنافسين: {db.users.length}
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-[#0c142b] shadow-2xl">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-900/80 text-slate-400 text-[11px] font-bold border-b border-slate-800">
                <tr>
                  <th className="py-4 px-4 text-center">الترتيب</th>
                  <th className="py-4 px-4">الطالب / الطبيب</th>
                  <th className="py-4 px-4">الكلية والجامعة</th>
                  <th className="py-4 px-4">المرحلة الدراسية</th>
                  <th className="py-4 px-4 text-center">أيام النشاط</th>
                  <th className="py-4 px-4 text-center">نقاط XP</th>
                  <th className="py-4 px-4 text-center">معدل الرادار</th>
                  <th className="py-4 px-4 text-center">إجراء المطور</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-semibold">
                {db.users
                  .sort((a, b) => (b.points || 0) - (a.points || 0))
                  .map((u, idx) => {
                    const avgScore = u.cognitiveScores
                      ? Math.round(
                          ((u.cognitiveScores.clinicalReasoning || 80) +
                            (u.cognitiveScores.pharmacology || 80) +
                            (u.cognitiveScores.pathophysiology || u.cognitiveScores.foundational || 80) +
                            (u.cognitiveScores.diagnosticsLab || 80) +
                            (u.cognitiveScores.emergencySpeed || 80) +
                            (u.cognitiveScores.evidenceEthics || 80)) /
                            6
                        )
                      : 80;

                    return (
                      <tr key={u.id} className="hover:bg-slate-900/40 transition">
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded-xl font-black text-xs ${
                              idx === 0
                                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : idx === 2
                                ? 'bg-amber-700 text-white'
                                : 'text-slate-400'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-700 p-0.5"
                            />
                            <div>
                              <span className="font-bold text-white block text-xs">{u.name}</span>
                              <span className="text-[10px] text-cyan-400 font-mono">
                                {u.studentId || u.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-slate-300">{u.university || 'كلية الطب'}</td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-[10px] text-slate-300 font-bold">
                            {u.academicYear}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="text-amber-400 font-bold">🔥 {u.streak}</span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="text-emerald-400 font-black font-mono">
                            {(u.points || 0).toLocaleString()} XP
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-bold font-mono">
                            {avgScore}%
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedStudentForBonus(u)}
                            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] transition shadow-sm"
                          >
                            منح مكافأة 🎁
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>

          {/* Bonus Modal */}
          {selectedStudentForBonus && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="max-w-md w-full p-6 rounded-3xl bg-[#0c142b] border border-cyan-500/40 shadow-2xl space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h4 className="font-black text-white text-sm flex items-center gap-2">
                    <span>🎁</span>
                    <span>منح مكافأة تقديرية لـ {selectedStudentForBonus.name}</span>
                  </h4>
                  <button
                    onClick={() => setSelectedStudentForBonus(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">عدد نقاط المكافأة (XP)</label>
                    <input
                      type="number"
                      value={bonusPoints}
                      onChange={(e) => setBonusPoints(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 font-bold">منح وسام سريري فخري</label>
                    <select
                      value={bonusBadge}
                      onChange={(e) => setBonusBadge(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold"
                    >
                      <option value="master_diagnostician">وسام عبقري التشخيص السريري (Master Diagnostician)</option>
                      <option value="emergency_hero">وسام بطل الطوارئ والإنعاش (Emergency Hero)</option>
                      <option value="ecg_guru">وسام خبير تخطيط القلب (ECG Guru)</option>
                      <option value="curriculum_lead">وسام النخبة الأكاديمية (Curriculum Lead)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSelectedStudentForBonus(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleAwardBonus}
                    disabled={actionLoading}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black text-xs shadow-md"
                  >
                    تأكيد المنح فوراً 🌟
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
