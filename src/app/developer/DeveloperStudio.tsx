'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  addCourseAction, 
  deleteCourseAction,
  addMaterialAction, 
  deleteMaterialAction, 
  addQuizAction, 
  deleteQuizAction,
  exportQuizAsStandaloneHtml,
  generateAiQuizAction,
  saveAiQuizToLmsAction
} from './actions';
import SummaryClient from './SummaryClient';

interface DeveloperStudioProps {
  initialDb: any;
  initiallyUnlocked?: boolean;
}

export default function DeveloperStudio({ initialDb }: DeveloperStudioProps) {
  const [activeTab, setActiveTab] = useState<'materials' | 'quizzes' | 'ai-generator' | 'courses' | 'database' | 'summaries'>('materials');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [db, setDb] = useState(initialDb);

  // Selected course filter for lectures & exams views
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('ALL');

  // AI Quiz Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCourseId, setAiCourseId] = useState(initialDb.courses?.[0]?.id || 'cardio_101');
  const [aiNotes, setAiNotes] = useState('');
  const [aiCount, setAiCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState<'basic' | 'clinical' | 'advanced'>('clinical');
  const [aiGeneratedQuiz, setAiGeneratedQuiz] = useState<any | null>(null);
  const [aiHtmlContent, setAiHtmlContent] = useState<string | null>(null);
  const [aiFilename, setAiFilename] = useState<string | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSavingAi, setIsSavingAi] = useState(false);

  // Material / Lecture Form state
  const [materialCourseId, setMaterialCourseId] = useState(initialDb.courses?.[0]?.id || '');
  const [materialType, setMaterialType] = useState<'PDF' | 'DOCX' | 'PPTX' | 'PPT' | 'HTML'>('PDF');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url' | 'code'>('file');

  // Quiz / Exam Builder state
  const [examCourseId, setExamCourseId] = useState(initialDb.courses?.[0]?.id || '');
  const [quizQuestions, setQuizQuestions] = useState([
    {
      id: 'q_init_1',
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      points: 20,
      explanation: ''
    }
  ]);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMessage({ type, text });
    setTimeout(() => {
      setStatusMessage(null);
    }, 6000);
  };

  const handleAddQuestion = () => {
    setQuizQuestions((prev) => [
      ...prev,
      {
        id: 'q_' + Date.now() + '_' + prev.length,
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        points: 20,
        explanation: ''
      }
    ]);
  };

  const handleRemoveQuestion = (qIndex: number) => {
    if (quizQuestions.length <= 1) return;
    setQuizQuestions((prev) => prev.filter((_, idx) => idx !== qIndex));
  };

  const handleUpdateQuestion = (qIndex: number, field: string, value: any) => {
    setQuizQuestions((prev) => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], [field]: value };
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuizQuestions((prev) => {
      const copy = [...prev];
      const opts = [...copy[qIndex].options];
      opts[optIndex] = value;
      copy[qIndex].options = opts;
      return copy;
    });
  };

  // Submit Material / Lecture
  const handleMaterialSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setStatusMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set('type', materialType);
    
    const res = await addMaterialAction(formData);
    setIsPending(false);

    if (res.error) {
      showNotification(res.error, 'error');
    } else {
      showNotification('تم رفع ونشر المحاضرة بنجاح وإضافتها للمقرر الدراسي! 🚀', 'success');
      
      const newMat = res.material || res.lecture;
      setDb((prev: any) => {
        const updatedMaterials = [...(prev.materials || []), newMat];
        const updatedLectures = [...(prev.lectures || []), newMat];
        const updatedCourses = prev.courses.map((c: any) => {
          if (c.id === newMat.courseId) {
            return {
              ...c,
              lectures: [...(c.lectures || []), newMat]
            };
          }
          return c;
        });
        return {
          ...prev,
          materials: updatedMaterials,
          lectures: updatedLectures,
          courses: updatedCourses
        };
      });

      (e.target as HTMLFormElement).reset();
    }
  };

  // Delete Material / Lecture
  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذه المحاضرة / المادة؟')) return;
    setIsPending(true);
    const res = await deleteMaterialAction(id);
    setIsPending(false);

    if (res.success) {
      setDb((prev: any) => {
        const filteredMaterials = (prev.materials || []).filter((m: any) => m.id !== id);
        const filteredLectures = (prev.lectures || []).filter((l: any) => l.id !== id);
        const updatedCourses = prev.courses.map((c: any) => ({
          ...c,
          lectures: (c.lectures || []).filter((l: any) => l.id !== id),
          modules: (c.modules || []).filter((m: any) => m.id !== id)
        }));
        return {
          ...prev,
          materials: filteredMaterials,
          lectures: filteredLectures,
          courses: updatedCourses
        };
      });
      showNotification('تم حذف المحاضرة بنجاح من المقرر.', 'success');
    }
  };

  // Submit Quiz / Exam
  const handleQuizSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setStatusMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set('questionsJson', JSON.stringify(quizQuestions));

    const res = await addQuizAction(formData);
    setIsPending(false);

    if (res.error) {
      showNotification(res.error, 'error');
    } else {
      showNotification('تم إنشاء ونشر الاختبار والامتحان السريري للمقرر بنجاح! ⭐', 'success');
      const newQ = res.quiz;
      const newEx = res.exam;

      setDb((prev: any) => {
        const updatedQuizzes = [...(prev.quizzes || []), newQ];
        const updatedExams = [...(prev.exams || []), newEx];
        const updatedCourses = prev.courses.map((c: any) => {
          if (c.id === (newEx?.courseId || newQ?.courseId)) {
            return {
              ...c,
              exams: [...(c.exams || []), newEx]
            };
          }
          return c;
        });
        return {
          ...prev,
          quizzes: updatedQuizzes,
          exams: updatedExams,
          courses: updatedCourses
        };
      });

      // Reset questions
      setQuizQuestions([
        {
          id: 'q_' + Date.now(),
          text: '',
          options: ['', '', '', ''],
          correctIndex: 0,
          points: 20,
          explanation: ''
        }
      ]);
      (e.target as HTMLFormElement).reset();
    }
  };

  // Delete Quiz / Exam
  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا الامتحان / الاختبار؟')) return;
    setIsPending(true);
    const res = await deleteQuizAction(id);
    setIsPending(false);

    if (res.success) {
      setDb((prev: any) => {
        const filteredQuizzes = (prev.quizzes || []).filter((q: any) => q.id !== id);
        const filteredExams = (prev.exams || []).filter((e: any) => e.id !== id);
        const updatedCourses = prev.courses.map((c: any) => ({
          ...c,
          exams: (c.exams || []).filter((e: any) => e.id !== id),
          modules: (c.modules || []).filter((m: any) => m.id !== id)
        }));
        return {
          ...prev,
          quizzes: filteredQuizzes,
          exams: filteredExams,
          courses: updatedCourses
        };
      });
      showNotification('تم حذف الاختبار بنجاح.', 'success');
    }
  };

  // Export Quiz HTML
  const handleDownloadQuizHtml = async (quizId: string) => {
    setIsPending(true);
    const res = await exportQuizAsStandaloneHtml(quizId);
    setIsPending(false);

    if (res.success && res.htmlContent) {
      const blob = new Blob([res.htmlContent], { type: 'text/html;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = res.filename || 'quiz.html';
      link.click();
      showNotification('تم تحميل الاختبار التفاعلي كملف HTML مستقل يعمل بدون إنترنت! 📥', 'success');
    } else {
      showNotification(res.error || 'فشل تحميل ملف الاختبار', 'error');
    }
  };

  // AI Quiz Generation Handlers
  const handleGenerateAiQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) {
      showNotification('يرجى كتابة عنوان الموضوع الطبي أو اسم المحاضرة', 'error');
      return;
    }

    setIsGeneratingAi(true);
    setStatusMessage(null);

    const res = await generateAiQuizAction({
      topic: aiTopic,
      courseId: aiCourseId,
      questionCount: aiCount,
      difficulty: aiDifficulty,
      customNotes: aiNotes
    });

    setIsGeneratingAi(false);

    if (res.error) {
      showNotification(res.error, 'error');
    } else if (res.quiz && res.htmlContent) {
      setAiGeneratedQuiz(res.quiz);
      setAiHtmlContent(res.htmlContent);
      setAiFilename(res.filename || 'quiz.html');
      showNotification('تم توليد الحالات والأسئلة السريرية بواسطة الذكاء الاصطناعي بنجاح! 🤖⚡', 'success');
    }
  };

  const handleDownloadAiHtml = () => {
    if (!aiHtmlContent) return;
    const blob = new Blob([aiHtmlContent], { type: 'text/html;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = aiFilename || 'ai_medical_quiz.html';
    link.click();
    showNotification('تم تنزيل ملف اختبار HTML التفاعلي المستقل بنجاح! 📥', 'success');
  };

  const handleSaveAiQuizToDb = async () => {
    if (!aiGeneratedQuiz) return;
    setIsSavingAi(true);
    setStatusMessage(null);

    const res = await saveAiQuizToLmsAction(aiGeneratedQuiz);
    setIsSavingAi(false);

    if (res.error) {
      showNotification(res.error, 'error');
    } else if (res.quiz) {
      showNotification('تم حفظ ونشر الاختبار بنجاح في المنصة وإتاحته لجميع الطلاب! 🎉', 'success');
      const newQ = res.quiz;
      const newEx = res.exam;
      setDb((prev: any) => {
        const updatedQuizzes = [...(prev.quizzes || []), newQ];
        const updatedExams = [...(prev.exams || []), newEx];
        const updatedCourses = prev.courses.map((c: any) => {
          if (c.id === (newEx?.courseId || newQ?.courseId)) {
            return {
              ...c,
              exams: [...(c.exams || []), newEx]
            };
          }
          return c;
        });
        return {
          ...prev,
          quizzes: updatedQuizzes,
          exams: updatedExams,
          courses: updatedCourses
        };
      });
    }
  };

  // Submit Course
  const handleCourseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setStatusMessage(null);
    const formData = new FormData(e.currentTarget);
    const res = await addCourseAction(formData);
    setIsPending(false);

    if (res.error) {
      showNotification(res.error, 'error');
    } else {
      showNotification('تم إنشاء المقرر الدراسي الجديد بنجاح! 📚', 'success');
      setDb((prev: any) => ({
        ...prev,
        courses: [...(prev.courses || []), res.course]
      }));
      (e.target as HTMLFormElement).reset();
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('تحذير: هل أنت متأكد من حذف هذا المقرر وكافة المحاضرات والاختبارات التابعة له؟')) return;
    setIsPending(true);
    const res = await deleteCourseAction(courseId);
    setIsPending(false);

    if (res.success) {
      setDb((prev: any) => ({
        ...prev,
        courses: (prev.courses || []).filter((c: any) => c.id !== courseId),
        materials: (prev.materials || []).filter((m: any) => m.courseId !== courseId),
        lectures: (prev.lectures || []).filter((l: any) => l.courseId !== courseId),
        quizzes: (prev.quizzes || []).filter((q: any) => q.courseId !== courseId),
        exams: (prev.exams || []).filter((e: any) => e.courseId !== courseId),
      }));
      showNotification('تم حذف المقرر بنجاح.', 'success');
    }
  };

  // All lectures list (combining db.lectures, db.materials, and course.lectures without duplicates)
  const allLectures = (() => {
    const map = new Map<string, any>();
    (db.lectures || []).forEach((l: any) => map.set(l.id, l));
    (db.materials || []).forEach((m: any) => {
      if (!map.has(m.id)) {
        map.set(m.id, {
          id: m.id,
          courseId: m.courseId,
          title: m.title,
          description: m.description || '',
          fileUrl: m.url,
          fileName: m.title,
          fileType: m.type,
          duration: m.duration || '45 دقيقة',
        });
      }
    });
    db.courses.forEach((c: any) => {
      (c.lectures || []).forEach((l: any) => map.set(l.id, l));
    });
    return Array.from(map.values());
  })();

  // Filtered lectures
  const filteredLectures = selectedCourseFilter === 'ALL'
    ? allLectures
    : allLectures.filter((l) => l.courseId === selectedCourseFilter);

  // All quizzes & exams
  const allExams = (() => {
    const map = new Map<string, any>();
    (db.quizzes || []).forEach((q: any) => map.set(q.id, q));
    (db.exams || []).forEach((e: any) => {
      if (!map.has(e.id)) {
        map.set(e.id, {
          id: e.id,
          courseId: e.courseId,
          title: e.title,
          description: e.description || '',
          points: e.totalPoints || 100,
          skillName: 'اختبار المقرر السريري',
          questions: e.questions || []
        });
      }
    });
    db.courses.forEach((c: any) => {
      (c.exams || []).forEach((e: any) => {
        if (!map.has(e.id)) {
          map.set(e.id, {
            id: e.id,
            courseId: e.courseId || c.id,
            title: e.title,
            description: e.description || '',
            points: e.totalPoints || 100,
            skillName: 'اختبار المقرر السريري',
            questions: e.questions || []
          });
        }
      });
    });
    return Array.from(map.values());
  })();

  // Filtered exams
  const filteredExams = selectedCourseFilter === 'ALL'
    ? allExams
    : allExams.filter((e) => e.courseId === selectedCourseFilter);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-8 mb-8 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider">
                DEVELOPER STUDIO ⚡
              </span>
              <span className="bg-white/10 text-white/80 text-xs px-3 py-1 rounded-full">
                صلاحيات كاملة للمطور
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30">
                {db.courses?.length || 0} مقررات • {allLectures.length} محاضرات • {allExams.length} اختبارات
              </span>
            </div>
            <h1 className="text-3xl font-black mt-3">استوديو المطور والمسؤول الأكاديمي</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              إضافة المحاضرات والامتحانات للمقررات بكافة الصيغ (PDF, DOCX, PPTX, PPT, HTML)، تصدير الاختبارات كملفات HTML مستقلة تعمل دون إنترنت، توليد الحالات بالذكاء الاصطناعي، وإدارة المقررات الدراسية وقاعدة البيانات.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/courses"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-md flex items-center gap-1.5"
            >
              <span>📚</span>
              <span>تصفح المقررات</span>
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/20 flex items-center gap-1.5"
            >
              <span>👨‍⚕️</span>
              <span>الرئيسية العامة</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Status Notification Toast */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl mb-6 text-sm font-bold text-center border shadow-sm transition-all duration-300 ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
            : 'bg-rose-50 text-rose-800 border-rose-300'
        }`}>
          {statusMessage.text}
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📁</span> رفع وإضافة المحاضرات للمقررات ({allLectures.length})
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'quizzes'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>⚡</span> الامتحانات والاختبارات وتصدير HTML ({allExams.length})
        </button>

        <button
          onClick={() => setActiveTab('ai-generator')}
          className={`flex-1 min-w-[170px] py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'ai-generator'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🤖</span> توليد اختبار سريري بالذكاء الاصطناعي
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'courses'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📚</span> إدارة المقررات ({db.courses?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'database'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>🔍</span> فحص قاعدة البيانات (JSON)
        </button>

        <button
          onClick={() => setActiveTab('summaries')}
          className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 ${
            activeTab === 'summaries'
              ? 'bg-indigo-700 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>📋</span> الملخصات والإحصائيات
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: UPLOAD & MANAGE LECTURES */}
      {/* ========================================================================= */}
      {activeTab === 'materials' && (
        <div className="space-y-8">
          {/* Lecture Upload Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>📁</span>
                <span>إضافة ورفع محاضرة أو ملف تعليمي إلى المقرر</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                يمكنك رفع ملفات من جهازك بصيغ <strong>PDF, DOCX, PPTX, PPT, HTML</strong>، أو لصق كود HTML تفاعلي، أو إدخال رابط خارجي وتعيينها للمقرر المطلوب.
              </p>
            </div>

            <form onSubmit={handleMaterialSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">المقرر الدراسي المستهدف</label>
                  <select
                    name="courseId"
                    value={materialCourseId}
                    onChange={(e) => setMaterialCourseId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {db.courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.level || c.year || 'عام'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">صيغة ونوع المحتوى</label>
                  <div className="flex flex-wrap gap-2">
                    {(['PDF', 'DOCX', 'PPTX', 'PPT', 'HTML'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMaterialType(t)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                          materialType === t
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {t === 'PDF' && '📄 PDF'}
                        {t === 'DOCX' && '📝 Word (DOCX)'}
                        {t === 'PPTX' && '📊 PowerPoint (PPTX)'}
                        {t === 'PPT' && '📊 PPT'}
                        {t === 'HTML' && '🌐 HTML تفاعلي'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان المحاضرة</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="مثال: تشريح الجهاز الدوري والقلب - المحاضرة 4"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">مدة المحاضرة المقدرة</label>
                  <input
                    type="text"
                    name="duration"
                    defaultValue="45 دقيقة"
                    placeholder="مثال: 45 دقيقة"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف ومحاور المحاضرة (اختياري)</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="نبذة عن الأهداف التعليمية والمفاهيم السريرية المغطاة في هذه المحاضرة..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
                />
              </div>

              {/* Upload method selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">طريقة إضافة الملف</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMethod"
                      checked={uploadMethod === 'file'}
                      onChange={() => setUploadMethod('file')}
                    />
                    <span>رفع ملف من جهازي 📤</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="uploadMethod"
                      checked={uploadMethod === 'url'}
                      onChange={() => setUploadMethod('url')}
                    />
                    <span>رابط خارجي (URL) 🔗</span>
                  </label>
                  {materialType === 'HTML' && (
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="uploadMethod"
                        checked={uploadMethod === 'code'}
                        onChange={() => setUploadMethod('code')}
                      />
                      <span>كتابة كود HTML تفاعلي 💻</span>
                    </label>
                  )}
                </div>

                {uploadMethod === 'file' && (
                  <div className="p-6 border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 text-center">
                    <input
                      type="file"
                      name="file"
                      accept=".pdf,.docx,.pptx,.ppt,.html,.htm"
                      className="text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    <span className="block text-[11px] text-slate-400 mt-2">
                      يدعم ملفات: PDF, DOCX, PPTX, PPT, HTML
                    </span>
                  </div>
                )}

                {uploadMethod === 'url' && (
                  <input
                    type="text"
                    name="url"
                    placeholder="https://example.com/lecture.pdf"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir="ltr"
                  />
                )}

                {uploadMethod === 'code' && (
                  <textarea
                    name="rawHtml"
                    rows={6}
                    placeholder="<div class='p-6 bg-blue-50'><h2>دراسة تشريح القلب...</h2></div>"
                    className="w-full px-4 py-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800"
                    dir="ltr"
                  />
                )}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? 'جاري الرفع والحفظ...' : 'حفظ ونشر المحاضرة في المقرر 🚀'}
              </button>
            </form>
          </div>

          {/* Uploaded Materials & Lectures List */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  المحاضرات والملفات المرفوعة ({filteredLectures.length})
                </h3>
                <p className="text-xs text-slate-400">يمكنك تحميل أي ملف مباشرة أو حذفه أو توليد اختبار سريري منه</p>
              </div>

              {/* Course Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 shrink-0">تصفية حسب المقرر:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">جميع المقررات ({allLectures.length})</option>
                  {db.courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredLectures.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs font-bold">
                  لا توجد محاضرات مرفوعة لهذا المقرر بعد. استخدم النموذج أعلاه لرفع المحاضرة الأولى!
                </div>
              ) : (
                filteredLectures.map((m: any) => {
                  const course = db.courses.find((c: any) => c.id === m.courseId);
                  return (
                    <div key={m.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 text-xs font-black rounded-lg bg-indigo-100 text-indigo-800 border border-indigo-200">
                          {m.fileType || m.type || 'PDF'}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm">{m.title}</h4>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                            <span className="text-blue-600 font-semibold">{course ? course.title : 'مقرر عام'}</span>
                            {m.duration && <span>⏱️ {m.duration}</span>}
                          </div>
                          {m.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{m.description}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                        {/* AI Quiz Generator Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setAiTopic(m.title);
                            setAiCourseId(m.courseId || db.courses[0]?.id);
                            setActiveTab('ai-generator');
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-gradient-to-r from-teal-50 to-emerald-50 hover:from-teal-100 hover:to-emerald-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-xl transition flex items-center gap-1 shadow-sm"
                          title="توليد اختبار HTML تفاعلي بالذكاء الاصطناعي من محتوى هذه المحاضرة"
                        >
                          <span>🤖</span>
                          <span>توليد اختبار ذكي</span>
                        </button>

                        {/* Direct Download Button */}
                        <a
                          href={m.fileUrl || m.url || '#'}
                          download={m.fileName || m.title}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-xl transition flex items-center gap-1"
                        >
                          <span>📥</span>
                          <span>تحميل الملف</span>
                        </a>

                        {/* Preview Button */}
                        <a
                          href={m.fileUrl || m.url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                        >
                          معاينة ↗
                        </a>

                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteMaterial(m.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition"
                        >
                          حذف 🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXAMS, QUIZZES & EXPORT STANDALONE HTML */}
      {/* ========================================================================= */}
      {activeTab === 'quizzes' && (
        <div className="space-y-8">
          {/* Export Existing Quizzes as Standalone HTML */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>⚡</span>
                  <span>الامتحانات والاختبارات وتصدير HTML تفاعلي ({filteredExams.length})</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  حمّل أي اختبار كملف HTML مستقل كامل يعمل على أي هاتف أو جهاز كمبيوتر حتى <strong>بدون إنترنت (100% Offline)</strong>
                </p>
              </div>

              {/* Course Filter Dropdown */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-500 shrink-0">تصفية حسب المقرر:</span>
                <select
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                >
                  <option value="ALL">جميع المقررات ({allExams.length})</option>
                  {db.courses.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredExams.length === 0 ? (
                <div className="col-span-2 py-8 text-center text-slate-400 text-xs font-bold">
                  لا توجد اختبارات مسجلة لهذا المقرر حالياً.
                </div>
              ) : (
                filteredExams.map((q: any) => {
                  const course = db.courses.find((c: any) => c.id === q.courseId);
                  return (
                    <div key={q.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                            {q.skillName || 'تقييم سريري'}
                          </span>
                          <span className="text-xs font-black text-emerald-600">+{q.points || q.totalPoints || 50} نقطة</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-base mb-1">{q.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                          <span className="text-indigo-600 font-semibold">{course ? course.title : 'مقرر عام'}</span>
                          {q.timeLimitMinutes && <span>⏱️ {q.timeLimitMinutes} دقيقة</span>}
                        </div>
                        <p className="text-xs text-slate-500">{q.questions?.length || 0} أسئلة مع تصحيح سريري فوري</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDownloadQuizHtml(q.id)}
                          className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2"
                        >
                          <span>📥</span>
                          <span>تحميل كـ HTML مستقل (Offline)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuiz(q.id)}
                          className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition"
                          title="حذف الاختبار"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Create New Quiz / Exam Form */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>📝</span>
                <span>إنشاء وتعيين امتحان واختبار سريري جديد للمقرر</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">أضف امتحاناً للمقرر مع تحديد الإجابات الصحيحة والتفسير السريري ودرجة النجاح</p>
            </div>

            <form onSubmit={handleQuizSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">المقرر الدراسي المستهدف</label>
                  <select
                    name="courseId"
                    value={examCourseId}
                    onChange={(e) => setExamCourseId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {db.courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">المجال المعرفي الطبي</label>
                  <select
                    name="skillCategory"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="clinicalReasoning">🧠 التفكير والتشخيص السريري التفريقي</option>
                    <option value="pharmacology">💊 الأمان الدوائي وعلم الأدوية السريري</option>
                    <option value="pathophysiology">🫀 التحليل الفسيولوجي والمرضي</option>
                    <option value="diagnosticsLab">🔬 تفسير التحاليل والفحوصات وتخطيط القلب</option>
                    <option value="emergencySpeed">⚡ طب الطوارئ والتدخل الحرج السريع</option>
                    <option value="foundationalKnowledge">🦴 المعرفة التأسيسية والاسترجاع الدقيق</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">اسم المهارة المعروض</label>
                  <input
                    type="text"
                    name="skillName"
                    defaultValue="الاستدلال السريري المتقدم"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الاختبار / الامتحان</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="مثال: الحالات السريرية الطارئة لكسور الحوض والفقرات"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">الزمن (دقائق)</label>
                    <input
                      type="number"
                      name="timeLimitMinutes"
                      defaultValue={15}
                      min={1}
                      max={180}
                      required
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-center font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">نسبة النجاح %</label>
                    <input
                      type="number"
                      name="passingScore"
                      defaultValue={60}
                      min={10}
                      max={100}
                      required
                      className="w-full px-3 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-center font-bold"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف الامتحان والتعليمات للطلاب</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="تعليمات الاختبار، نظام النقاط، والنقاط الإكلينيكية التي يجب مراعاتها..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs leading-relaxed"
                />
              </div>

              {/* Questions Section */}
              <div className="space-y-6 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-black text-slate-800">
                    الأسئلة والسيناريوهات الإكلينيكية ({quizQuestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition flex items-center gap-1 border border-indigo-200"
                  >
                    <span>+</span>
                    <span>إضافة سؤال جديد</span>
                  </button>
                </div>

                {quizQuestions.map((q, qIdx) => (
                  <div key={q.id} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-black text-blue-700 bg-blue-100 px-3 py-1 rounded-full">
                        السؤال {qIdx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500 font-bold">النقاط:</span>
                          <input
                            type="number"
                            value={q.points}
                            onChange={(e) => handleUpdateQuestion(qIdx, 'points', Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs text-center font-bold"
                          />
                        </div>
                        {quizQuestions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1 rounded-lg hover:bg-rose-50"
                          >
                            حذف السؤال ✕
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نص السؤال أو السيناريو السريري</label>
                      <input
                        type="text"
                        value={q.text}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'text', e.target.value)}
                        placeholder="مثال: مريض يبلغ من العمر 45 عاماً يعاني من ألم صدري..."
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm"
                      />
                    </div>

                    {/* Choices */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-700">
                        خيارات الإجابة (حدد الدائرة أمام الإجابة الصحيحة)
                      </label>
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3">
                          <input
                            type="radio"
                            name={`correct_${q.id}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => handleUpdateQuestion(qIdx, 'correctIndex', optIdx)}
                            className="w-4 h-4 text-blue-600 cursor-pointer"
                            title="اختر كإجابة صحيحة"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`الخيار ${optIdx + 1}`}
                            required
                            className={`flex-1 px-3 py-2 rounded-xl text-xs border ${
                              q.correctIndex === optIdx 
                                ? 'border-emerald-500 bg-emerald-50 font-bold text-emerald-950' 
                                : 'border-slate-300 bg-white'
                            }`}
                          />
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">التفسير الطبي والسريري (المنطق السريري)</label>
                      <input
                        type="text"
                        value={q.explanation}
                        onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                        placeholder="وضح لماذا هذا الخيار صحيح وما هو المبدأ السريري المعتمد..."
                        required
                        className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? 'جاري النشر...' : 'نشر الامتحان كاملاً وإتاحته للطلاب ⭐'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AI MEDICAL QUIZ & HTML GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === 'ai-generator' && (
        <div className="space-y-8">
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                  <span>🤖</span>
                  <span>الذكاء الاصطناعي السريري (Clinical AI Engine)</span>
                </span>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full border border-blue-100">
                  توليد وتصدير HTML تفاعلي مستقل
                </span>
              </div>
              <h2 className="text-2xl font-black text-slate-900">مُولّد الاختبارات والحالات السريرية بالذكاء الاصطناعي</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                يقوم الذكاء الاصطناعي بتحليل الموضوع الطبي أو محتوى المحاضرة وصياغة سيناريوهات مرضية واقعية (Patient Vignettes) مطابقة لمعايير USMLE والامتحانات الطبية المعتمدة، مع توليد فوري لملف HTML مستقل يعمل بدون إنترنت أو حفظه مباشرة في المقرر.
              </p>
            </div>

            {/* Quick Topic Presets */}
            <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <label className="block text-xs font-bold text-slate-600 mb-2.5">
                ⚡ مواضيع سريرية سريعة وشائعة (انقر للتعبئة الفورية):
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'احتشاء عضلة القلب الحاد (STEMI)', cat: 'cardio' },
                  { name: 'قصور القلب الاحتقاني الحاد والوذمة الرئوية', cat: 'cardio' },
                  { name: 'الصمة الرئوية الحادة (Pulmonary Embolism)', cat: 'pulm' },
                  { name: 'نوبة الربو الحادة والصدر الصامت (Silent Chest)', cat: 'pulm' },
                  { name: 'السكتة الدماغية ومذيبات الخثرات (Ischemic Stroke)', cat: 'neuro' },
                  { name: 'شلل العصب الوجهي المحيطي (Bell\'s Palsy)', cat: 'neuro' },
                  { name: 'التهاب البنكرياس الحاد والإنعاش بالسوائل', cat: 'gi' },
                  { name: 'الحماض الكيتوني السكري (DKA)', cat: 'endo' },
                  { name: 'علم الأدوية وحماية الكلى (ACEi vs ARBs)', cat: 'pharm' },
                  { name: 'الإنعاش القلبي الرئوي وطب الطوارئ (ACLS Protocol)', cat: 'emergency' }
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAiTopic(preset.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                      aiTopic === preset.name
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleGenerateAiQuiz} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المقرر الدراسي المرتبط</label>
                  <select
                    value={aiCourseId}
                    onChange={(e) => setAiCourseId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    {db.courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عنوان الموضوع الطبي أو المحاضرة</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    required
                    placeholder="مثال: التدبير الإسعافي لمتلازمة الشريان التاجي الحادة..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ملخص المحاضرة أو ملاحظات سريرية خاصة (اختياري)
                </label>
                <textarea
                  value={aiNotes}
                  onChange={(e) => setAiNotes(e.target.value)}
                  rows={3}
                  placeholder="يمكنك لصق نقاط المحاضرة، الأهداف التعليمية، أو ملخص الحالة التي ترغب بالتركيز عليها..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">عدد الأسئلة المراد توليدها</label>
                  <select
                    value={aiCount}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value={2}>سؤالان سريريان (2 Questions)</option>
                    <option value={3}>3 أسئلة سريرية (3 Questions - قياسي)</option>
                    <option value={4}>4 أسئلة سريرية (4 Questions)</option>
                    <option value={5}>5 أسئلة سريرية (5 Questions)</option>
                    <option value={6}>6 أسئلة سريرية متقدمة (6 Questions)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">مستوى العمق السريري</label>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
                  >
                    <option value="basic">تأسيسي (استرجاع معلومات وفسيولوجيا مرضية - 15 نقطة)</option>
                    <option value="clinical">سريري قياسي (تقييم وتشخيص فارقي - 20 نقطة)</option>
                    <option value="advanced">متقدم (اتخاذ قرارات علاجية وطوارئ حرجة - 25 نقطة)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button
                  type="submit"
                  disabled={isGeneratingAi}
                  className="px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl transition text-sm shadow-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isGeneratingAi ? (
                    <>
                      <span className="animate-spin text-lg">⏳</span>
                      <span>جاري توليد الأسئلة والحالات بالذكاء الاصطناعي...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>توليد الاختبار الطبي بالذكاء الاصطناعي</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Quiz Live Preview */}
          {aiGeneratedQuiz && (
            <div className="bg-white rounded-3xl p-8 border-2 border-emerald-300 shadow-lg space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-100">
                <div>
                  <span className="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1 rounded-full">
                    تم التوليد بنجاح ✓
                  </span>
                  <h3 className="text-2xl font-black text-slate-900 mt-2">{aiGeneratedQuiz.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{aiGeneratedQuiz.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-600 font-bold">
                    <span>📚 المهارة: {aiGeneratedQuiz.skillName}</span>
                    <span>⏱️ الوقت: {aiGeneratedQuiz.timeLimitMinutes} دقائق</span>
                    <span>📝 عدد الأسئلة: {aiGeneratedQuiz.questions.length}</span>
                  </div>
                </div>

                {/* Instant Actions */}
                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  {/* Download HTML Button */}
                  <button
                    type="button"
                    onClick={handleDownloadAiHtml}
                    className="flex-1 md:flex-none px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span>📥</span>
                    <span>تنزيل الاختبار كـ HTML مستقل (Offline)</span>
                  </button>

                  {/* Save to LMS Button */}
                  <button
                    type="button"
                    onClick={handleSaveAiQuizToDb}
                    disabled={isSavingAi}
                    className="flex-1 md:flex-none px-5 py-3 bg-slate-900 hover:bg-black text-white font-black rounded-xl text-xs transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>💾</span>
                    <span>{isSavingAi ? 'جاري الحفظ...' : 'حفظ ونشر في المنصة للطلاب'}</span>
                  </button>
                </div>
              </div>

              {/* Questions Preview */}
              <div className="space-y-4">
                <h4 className="text-base font-black text-slate-800">
                  معاينة الحالات والأسئلة المولدة ({aiGeneratedQuiz.questions.length}):
                </h4>

                {aiGeneratedQuiz.questions.map((q: any, idx: number) => (
                  <div key={q.id || idx} className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
                        حالة سريرية {idx + 1}
                      </span>
                      <span className="text-slate-500 font-mono">{q.points || 20} نقطة</span>
                    </div>

                    <p className="font-bold text-slate-900 text-sm leading-relaxed">{q.text}</p>

                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isCorrect = optIdx === q.correctIndex;
                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl text-xs flex items-center justify-between border ${
                              isCorrect
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {optIdx + 1}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isCorrect && (
                              <span className="text-emerald-700 font-bold text-[11px]">الإجابة الصحيحة ✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      <strong className="text-slate-900 block mb-0.5">💡 التفسير والمنطق السريري:</strong>
                      {q.explanation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: COURSES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'courses' && (
        <div className="space-y-8">
          {/* Add Course Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>📚</span>
                <span>إضافة مقرر دراسي جديد لكلية الطب</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">حدد اسم المقرر والمستوى الأكاديمي والتخصص السريري</p>
            </div>

            <form onSubmit={handleCourseSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم المقرر</label>
                  <input
                    type="text"
                    name="title"
                    required
                    placeholder="مثال: علم الأدوية السريري (Clinical Pharmacology)"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">المستوى الدراسي</label>
                  <select
                    name="level"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="YEAR_1">السنة الأولى (Year 1)</option>
                    <option value="YEAR_2">السنة الثانية (Year 2)</option>
                    <option value="YEAR_3">السنة الثالثة (Year 3)</option>
                    <option value="YEAR_4">السنة الرابعة - سريري (Year 4)</option>
                    <option value="YEAR_5">السنة الخامسة - سريري (Year 5)</option>
                    <option value="INTERNSHIP">سنة الامتياز (Internship)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">التصنيف الطبي</label>
                  <select
                    name="category"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="INTERNAL_MEDICINE">الباطنة العامة (Internal Medicine)</option>
                    <option value="SURGERY">الجراحة العامة (General Surgery)</option>
                    <option value="PEDIATRICS">طب الأطفال (Pediatrics)</option>
                    <option value="OBGYN">النساء والتوليد (Obstetrics & Gynecology)</option>
                    <option value="EMERGENCY">طب الطوارئ والعناية الحرجة (Emergency)</option>
                    <option value="BASIC_SCIENCES">العلوم الطبية الأساسية (Basic Sciences)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">أيقونة المقرر (Emoji)</label>
                  <input
                    type="text"
                    name="icon"
                    defaultValue="🩺"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-center font-bold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">الساعات المعتمدة المقدرة</label>
                  <input
                    type="number"
                    name="estimatedHours"
                    defaultValue={18}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">وصف المقرر ومحاوره</label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="نبذة عن المقرر والمفاهيم الطبية والسريرية الرئيسية..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm shadow-md disabled:opacity-50 flex items-center gap-2"
              >
                {isPending ? 'جاري الإضافة...' : 'إضافة المقرر الدراسي 📚'}
              </button>
            </form>
          </div>

          {/* Courses Directory with Lecture & Exam management shortcuts */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6">
              دليل المقررات الدراسية الحالية ({db.courses.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {db.courses.map((c: any) => {
                const courseLectures = allLectures.filter((l) => l.courseId === c.id);
                const courseExams = allExams.filter((e) => e.courseId === c.id);

                return (
                  <div key={c.id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-2xl">{c.icon || '🩺'}</span>
                        <span className="text-xs font-bold bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                          {c.level || c.year || 'عام'}
                        </span>
                      </div>
                      <h4 className="font-black text-slate-900 text-base mb-1">{c.title}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{c.description}</p>
                      
                      <div className="flex items-center gap-3 mt-4 text-xs font-bold text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200">
                        <span>📑 {courseLectures.length} محاضرات</span>
                        <span>•</span>
                        <span>📝 {courseExams.length} امتحانات</span>
                        <span>•</span>
                        <span>⭐ {c.rating || 5.0}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2 justify-between">
                      <div className="flex items-center gap-2">
                        {/* Add Lecture Shortcut */}
                        <button
                          type="button"
                          onClick={() => {
                            setMaterialCourseId(c.id);
                            setActiveTab('materials');
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition border border-blue-200"
                        >
                          + محاضرة
                        </button>

                        {/* Add Exam Shortcut */}
                        <button
                          type="button"
                          onClick={() => {
                            setExamCourseId(c.id);
                            setActiveTab('quizzes');
                            window.scrollTo({ top: 300, behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition border border-amber-200"
                        >
                          + امتحان
                        </button>

                        {/* View Course */}
                        <Link
                          href={`/courses/${c.id}`}
                          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
                        >
                          عرض المقرر ↗
                        </Link>
                      </div>

                      {/* Delete Course */}
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c.id)}
                        className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition"
                        title="حذف المقرر"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: DATABASE & LIVE JSON INSPECTOR */}
      {/* ========================================================================= */}
      {activeTab === 'database' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>🔍</span>
                <span>قاعدة البيانات الحية (Live JSON Inspector)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">يمكنك فحص البيانات الحية وتصديرها ونسخها بالكامل</p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(JSON.stringify(db, null, 2));
                showNotification('تم نسخ قاعدة البيانات بالكامل إلى الحافظة! 📋', 'success');
              }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>نسخ قاعدة البيانات</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="block text-2xl font-black text-blue-600">{db.courses?.length || 0}</span>
              <span className="text-xs text-slate-500 font-bold">المقررات</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="block text-2xl font-black text-indigo-600">{allLectures.length}</span>
              <span className="text-xs text-slate-500 font-bold">المحاضرات</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="block text-2xl font-black text-emerald-600">{allExams.length}</span>
              <span className="text-xs text-slate-500 font-bold">الامتحانات</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <span className="block text-2xl font-black text-amber-600">{db.users?.length || 0}</span>
              <span className="text-xs text-slate-500 font-bold">المستخدمين</span>
            </div>
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto max-h-[500px]" dir="ltr">
            <pre>{JSON.stringify(db, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: SUMMARIES & CLINICAL REPORTS (ENHANCEMENT) */}
      {/* ========================================================================= */}
      {activeTab === 'summaries' && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="mb-6 pb-4 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>📋</span>
                <span>مركز التقارير والملخصات الطبية السريرية</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                متابعة التحليلات الشاملة لجميع المقررات والامتحانات وحالات التدريب السريري
              </p>
            </div>
          </div>

          <SummaryClient db={db} currentUser={db.users?.[0]} />
        </div>
      )}
    </div>
  );
}
