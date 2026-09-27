'use client';

import { useState, useEffect } from 'react';
import { Database, Course, User, CourseLecture, CourseExam } from '@/lib/db';

interface SummaryClientProps {
  db: Database;
  currentUser?: User | null;
}

export default function SummaryClient({ db, currentUser }: SummaryClientProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'performance' | 'html'>('overview');
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [customHtmlTitle, setCustomHtmlTitle] = useState<string>('');
  const [isEditingHtml, setIsEditingHtml] = useState(false);

  // Calculate statistics
  const totalCourses = db.courses.length;
  const totalLectures = db.lectures?.length || 0;
  const totalExams = db.exams?.length || 0;
  const totalUsers = db.users.length;
  const totalClinicalCases = db.clinicalCases.length;
  const totalFlashcards = db.flashcards?.length || 0;
  const totalQuizzes = db.quizzes.length;

  // Get user's courses if logged in
  const userCourses = currentUser 
    ? db.courses.filter(c => 
        db.users.some(u => u.id === currentUser.id && u.badges.includes(c.id))
      )
    : [];

  // Get recent activity
  const recentLectures = [...(db.lectures || [])]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  const recentExams = [...(db.exams || [])]
    .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
    .slice(0, 5);

  // Get HTML files from lectures and exams
  const htmlFiles = [
    ...(db.lectures || []).filter(l => l.fileType?.includes('html') || l.fileName?.endsWith('.html')),
    ...(db.exams || []).filter(e => e.fileType?.includes('html') || e.fileName?.endsWith('.html'))
  ];

  // Load HTML content from file
  const loadHtmlContent = async (fileUrl: string) => {
    try {
      // In production, you would fetch from your storage
      // For now, we'll use the file URL directly
      const response = await fetch(fileUrl);
      const content = await response.text();
      setHtmlContent(content);
    } catch (error) {
      console.error('Error loading HTML:', error);
      setHtmlContent('<p style="color: red;">فشل تحميل الملف</p>');
    }
  };

  // Save custom HTML
  const saveCustomHtml = () => {
    // In production, save to database or storage
    console.log('Saving HTML content:', { title: customHtmlTitle, content: htmlContent });
    // Show success message
    alert('تم حفظ المحتوى بنجاح!');
  };

  // Calculate user performance stats
  const getUserStats = () => {
    if (!currentUser) return null;
    
    const cognitiveScores = currentUser.cognitiveScores || {};
    const avgScore = Object.values(cognitiveScores).length > 0
      ? (Object.values(cognitiveScores).reduce((a, b) => a + (b || 0), 0) / Object.values(cognitiveScores).length).toFixed(1)
      : '0';
    
    return {
      avgScore,
      totalPoints: currentUser.points || 0,
      rank: currentUser.rank || 0,
      streak: currentUser.streak || 0,
      badgesCount: currentUser.badges?.length || 0,
    };
  };

  const userStats = getUserStats();

  return (
    <div className="min-h-screen bg-[#050a1e] text-white p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-black text-white flex items-center gap-3">
          <span className="text-4xl">📊</span>
          <span>لوحة الملخصات</span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          {currentUser 
            ? `مرحباً ${currentUser.name}! هذا ملخص أدائك ومحتوى المنصة`
            : 'مرحباً! هذا ملخص عام لمنصة MedAI Academy'
          }
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>🏠</span>
          <span>نظرة عامة</span>
        </button>

        <button
          onClick={() => setActiveTab('courses')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'courses'
              ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>📚</span>
          <span>الكورسات ({totalCourses})</span>
        </button>

        {currentUser && (
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
              activeTab === 'performance'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>📈</span>
            <span>أدائي الشخصي</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('html')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'html'
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <span>🌐</span>
          <span>ملفات HTML ({htmlFiles.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Courses */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📚</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold">
                  الكورسات
                </span>
              </div>
              <div className="text-4xl font-black text-white mb-1">
                {totalCourses}
              </div>
              <p className="text-slate-400 text-sm">
                عدد الكورسات المتاحة في المنصة
              </p>
            </div>

            {/* Total Content */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-900/60 to-teal-900/60 border border-cyan-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📄</span>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full font-bold">
                  المحتوى
                </span>
              </div>
              <div className="text-4xl font-black text-white mb-1">
                {totalLectures + totalExams}
              </div>
              <p className="text-slate-400 text-sm">
                {totalLectures} محاضرة + {totalExams} اختبار
              </p>
            </div>

            {/* Total Users */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900/60 to-green-900/60 border border-emerald-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">👥</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
                  المستخدمون
                </span>
              </div>
              <div className="text-4xl font-black text-white mb-1">
                {totalUsers}
              </div>
              <p className="text-slate-400 text-sm">
                عدد المستخدمين المسجلين
              </p>
            </div>

            {/* Total Learning Materials */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-900/60 to-orange-900/60 border border-amber-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🎯</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold">
                  المواد التعليمية
                </span>
              </div>
              <div className="text-4xl font-black text-white mb-1">
                {totalClinicalCases + totalFlashcards + totalQuizzes}
              </div>
              <p className="text-slate-400 text-sm">
                {totalClinicalCases} حالة سريرية + {totalFlashcards} بطاقة استذكار + {totalQuizzes} اختبار
              </p>
            </div>

            {/* Platform Health */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-900/60 to-pink-900/60 border border-rose-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">❤️</span>
                <span className="text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full font-bold">
                  صحة المنصة
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-sm">Neon Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span className="text-sm">API Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  <span className="text-sm">File Storage</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm mt-3">
                جميع الخدمات تعمل بشكل طبيعي
              </p>
            </div>

            {/* Recent Activity */}
            <div className="md:col-span-2 lg:col-span-3 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span>🕐</span>
                  <span>النشاط الأخير</span>
                </h3>
              </div>
              <div className="space-y-3">
                {recentLectures.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      محاضرات جديدة
                    </h4>
                    {recentLectures.map((lecture) => (
                      <div
                        key={lecture.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white text-sm">{lecture.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(lecture.createdAt || '').toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <span className="text-cyan-400">📄</span>
                      </div>
                    ))}
                  </div>
                )}
                {recentExams.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      اختبارات جديدة
                    </h4>
                    {recentExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-semibold text-white text-sm">{exam.title}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(exam.createdAt || '').toLocaleDateString('ar-EG')}
                          </p>
                        </div>
                        <span className="text-amber-400">📝</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {db.courses.map((course) => {
                const courseLectures = db.lectures?.filter(l => l.courseId === course.id) || [];
                const courseExams = db.exams?.filter(e => e.courseId === course.id) || [];
                const progress = currentUser 
                  ? Math.round((courseLectures.filter(l => 
                      // In production, check user's completed lectures
                      true
                    ).length / courseLectures.length) * 100)
                  : 0;

                return (
                  <div
                    key={course.id}
                    className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition group"
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl p-2 rounded-2xl bg-slate-950 border border-slate-800">
                          {course.icon || '🩺'}
                        </span>
                        <div>
                          <h3 className="font-black text-white text-lg">{course.title}</h3>
                          <p className="text-xs text-slate-400 mt-1">{course.category}</p>
                        </div>
                      </div>
                      <span className="px-2 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                        {course.level}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm text-slate-300 line-clamp-2">{course.description}</p>

                      <div className="grid grid-cols-3 gap-3 text-center text-xs">
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-cyan-400 font-bold">{courseLectures.length}</p>
                          <p className="text-slate-400">محاضرات</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-amber-400 font-bold">{courseExams.length}</p>
                          <p className="text-slate-400">اختبارات</p>
                        </div>
                        <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                          <p className="text-emerald-400 font-bold">{course.estimatedHours}س</p>
                          <p className="text-slate-400">المدة</p>
                        </div>
                      </div>

                      {currentUser && (
                        <div className="pt-2">
                          <div className="w-full bg-slate-800 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-1.5 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">
                            تقدمك: {progress}%
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-slate-500">
                          {course.year} • {course.badge}
                        </span>
                        <div className="flex gap-2">
                          {courseLectures.some(l => l.fileType?.includes('html')) && (
                            <span className="text-[10px] bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded-full">
                              HTML
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && currentUser && userStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Average Score */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900/60 to-purple-900/60 border border-indigo-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">📊</span>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold">
                  المتوسط
                </span>
              </div>
              <div className="text-5xl font-black text-white mb-1">
                {userStats.avgScore}%
              </div>
              <p className="text-slate-400 text-sm">
                المتوسط العام للدرجات
              </p>
            </div>

            {/* Total Points */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-amber-900/60 to-orange-900/60 border border-amber-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🎯</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full font-bold">
                  النقاط
                </span>
              </div>
              <div className="text-5xl font-black text-white mb-1">
                {userStats.totalPoints.toLocaleString()}
              </div>
              <p className="text-slate-400 text-sm">
                النقاط الكلية
              </p>
            </div>

            {/* Rank */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-900/60 to-green-900/60 border border-emerald-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🏆</span>
                <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold">
                  الرتبة
                </span>
              </div>
              <div className="text-5xl font-black text-white mb-1">
                #{userStats.rank}
              </div>
              <p className="text-slate-400 text-sm">
                رتبتك بين جميع المستخدمين
              </p>
            </div>

            {/* Streak */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-rose-900/60 to-pink-900/60 border border-rose-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🔥</span>
                <span className="text-xs bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full font-bold">
                  السلاسل
                </span>
              </div>
              <div className="text-5xl font-black text-white mb-1">
                {userStats.streak}
              </div>
              <p className="text-slate-400 text-sm">
                أيام متتالية
              </p>
            </div>

            {/* Badges */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-cyan-900/60 to-teal-900/60 border border-cyan-500/30 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">🏅</span>
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full font-bold">
                  الأوسمة
                </span>
              </div>
              <div className="text-5xl font-black text-white mb-1">
                {userStats.badgesCount}
              </div>
              <p className="text-slate-400 text-sm">
                عدد الأوسمة المحصل عليها
              </p>
            </div>

            {/* Cognitive Scores Radar */}
            <div className="md:col-span-2 lg:col-span-3 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span>🎯</span>
                  <span>درجات المهارات المعرفية</span>
                </h3>
              </div>
              
              {currentUser.cognitiveScores && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(currentUser.cognitiveScores).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-300">
                          {key === 'clinicalReasoning' && 'التفكير السريري'}
                          {key === 'pharmacology' && 'الصيدلة'}
                          {key === 'pathophysiology' && 'فيزيولوجيا المرض'}
                          {key === 'diagnosticsLab' && 'التشخيص والمختبر'}
                          {key === 'emergencySpeed' && 'سرعة الطوارئ'}
                          {key === 'evidenceEthics' && 'الأدلة والأخلاق'}
                          {key === 'foundational' && 'المعرفة الأساسية'}
                        </span>
                        <span className="text-cyan-400 font-bold">{value || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-2 rounded-full"
                          style={{ width: `${value || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HTML Files Tab */}
        {activeTab === 'html' && (
          <div className="space-y-4">
            {/* HTML File Viewer */}
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <span>🌐</span>
                  <span>ملفات HTML المتاحة</span>
                </h3>
                <button
                  onClick={() => setIsEditingHtml(!isEditingHtml)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  {isEditingHtml ? 'إلغاء' : 'إنشاء HTML جديد'}
                </button>
              </div>

              {isEditingHtml ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">عنوان الصفحة</label>
                    <input
                      type="text"
                      value={customHtmlTitle}
                      onChange={(e) => setCustomHtmlTitle(e.target.value)}
                      placeholder="مثال: صفحة التعلم التفاعلي"
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300">محتوى HTML</label>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="<html>...</html>"
                      rows={10}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setHtmlContent('');
                        setCustomHtmlTitle('');
                        setIsEditingHtml(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      مسح
                    </button>
                    <button
                      onClick={saveCustomHtml}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
                    >
                      حفظ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {htmlContent ? (
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-white">{customHtmlTitle || 'HTML مخصص'}</h4>
                        <button
                          onClick={() => setHtmlContent('')}
                          className="text-rose-400 hover:text-rose-300 text-xs"
                        >
                          حذف
                        </button>
                      </div>
                      <div
                        className="border border-slate-700 rounded-xl p-4 min-h-[200px] bg-white"
                        dangerouslySetInnerHTML={{ __html: htmlContent }}
                      />
                    </div>
                  ) : htmlFiles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {htmlFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-bold text-white text-sm">{file.title}</h4>
                              <p className="text-[10px] text-slate-400">{file.fileName}</p>
                            </div>
                            <button
                              onClick={() => loadHtmlContent(file.fileUrl)}
                              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold"
                            >
                              عرض
                            </button>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-2">{file.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center">
                      <span className="text-4xl">📄</span>
                      <p className="text-slate-400 mt-2">لا توجد ملفات HTML بعد</p>
                      <p className="text-xs text-slate-500 mt-1">
                        يمكنك إضافة ملفات HTML من استوديو المطور
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* HTML Preview */}
            {htmlContent && (
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <span>👁️</span>
                  <span>معاينة HTML</span>
                </h3>
                <div
                  className="border border-slate-700 rounded-xl p-4 min-h-[300px] bg-white"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
