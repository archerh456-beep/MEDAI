'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Course } from '@/lib/db';

interface ProfileClientProps {
  initialUser: User;
  courses: Course[];
  badges: { id: string; name: string; icon: string; description: string }[];
}

const ACADEMIC_YEARS = [
  'السنة الأولى (العلوم الأساسية)',
  'السنة الثانية (العلوم الطبية التأسيسية)',
  'السنة الثالثة (مقدمة العلوم السريرية)',
  'السنة الرابعة (السريرية: الباطنة والجراحة)',
  'السنة الخامسة (السريرية: الأطفال والنساء والولادة)',
  'السنة السادسة (السريرية المتقدمة والتطبيقية)',
  'طبيب امتياز (Intern Doctor)',
  'طبيب مقيم (Resident Doctor)',
  'أستاذ / مشرف أكاديمي',
];

export default function ProfileClient({
  initialUser,
  courses,
  badges,
}: ProfileClientProps) {
  const [user, setUser] = useState<User>(initialUser);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(initialUser.name);
  const [editYear, setEditYear] = useState(initialUser.academicYear);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      showToast('يرجى إدخال اسم صحيح', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          name: editName,
          academicYear: editYear,
        }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setIsEditing(false);
        showToast('تم حفظ وتحديث بياناتك الأكاديمية بنجاح! 🩺');
      } else {
        showToast(data.error || 'فشل تحديث البيانات', 'error');
      }
    } catch {
      showToast('خطأ في الاتصال بالخادم', 'error');
    } finally {
      setSaving(false);
    }
  };

  const userBadges = badges.filter((b) => user.badges?.includes(b.id));

  const cognitive = {
    clinicalReasoning: user.cognitiveScores?.clinicalReasoning ?? 80,
    pharmacology: user.cognitiveScores?.pharmacology ?? 80,
    pathophysiology: user.cognitiveScores?.pathophysiology ?? user.cognitiveScores?.foundational ?? 80,
    diagnosticsLab: user.cognitiveScores?.diagnosticsLab ?? 80,
    emergencySpeed: user.cognitiveScores?.emergencySpeed ?? 75,
    evidenceEthics: user.cognitiveScores?.evidenceEthics ?? 85,
  };

  const overallAvg = Math.round(
    (cognitive.clinicalReasoning +
      cognitive.pharmacology +
      cognitive.pathophysiology +
      cognitive.diagnosticsLab +
      cognitive.emergencySpeed +
      cognitive.evidenceEthics) /
      6
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-2xl border text-sm font-bold flex items-center gap-2 animate-bounce ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
          }`}
        >
          <span>{toast.type === 'success' ? '✅' : '⚠️'}</span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d1633] via-slate-900 to-[#0a1024] border border-cyan-500/30 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Avatar */}
        <div className="relative">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-indigo-950 border-2 border-cyan-400/60 p-1.5 shadow-xl shadow-cyan-500/20"
          />
          <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-cyan-900 text-cyan-300 border border-cyan-400 text-[10px] font-black">
            {user.level === 'RESIDENT' ? 'طبيب مقيم' : user.level === 'INTERN' ? 'طبيب امتياز' : 'طالب طب'}
          </span>
        </div>

        {/* User Details */}
        <div className="space-y-2 text-center md:text-right flex-1">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-white">{user.name}</h1>
            <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-black">
              {user.studentId || 'MED-STUDENT'}
            </span>
          </div>

          <p className="text-xs text-cyan-400 font-mono font-semibold">{user.email}</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs text-slate-300">
            <span className="font-bold text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              🎓 {user.academicYear}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300">{user.university || 'كلية الطب'}</span>
          </div>

          {/* Gamification Pills */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2.5 pt-3 text-xs font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 flex items-center gap-1.5">
              <span>🔥</span>
              <span>{user.streak} أيام نشاط متواصل</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 flex items-center gap-1.5">
              <span>💎</span>
              <span>{(user.points || 0).toLocaleString()} نقطة XP</span>
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 flex items-center gap-1.5">
              <span>👑</span>
              <span>الترتيب الوطني: #{user.rank || 1}</span>
            </span>
          </div>
        </div>

        {/* Edit Profile Action Button */}
        <div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5 flex items-center gap-2"
          >
            <span>✏️</span>
            <span>تعديل بيانات الحساب</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Panel (Modal/Accordion) */}
      {isEditing && (
        <div className="p-6 rounded-3xl bg-[#0c142b] border border-cyan-500/40 shadow-2xl animate-in fade-in space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <span>📝</span>
              <span>تعديل الاسم والسنة الدراسية</span>
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕ إغلاق
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">الاسم الكامل للطالب / الطبيب</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-semibold"
                placeholder="مثال: د. أحمد خالد"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">المرحلة / السنة الدراسية</label>
              <select
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-cyan-400 font-semibold"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-50"
              >
                {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات الأكاديمية'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Cognitive Radar Matrix Breakdown */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <span>🕸️</span>
              <span>مصفوفة الكفاءة السريرية والمعرفية (6D Cognitive Matrix)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              المعدل السريري العام للطالب: <strong className="text-cyan-400 font-black text-sm">{overallAvg}%</strong>
            </p>
          </div>

          <Link
            href="/assessment"
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 self-start sm:self-auto"
          >
            <span>⚡</span>
            <span>بدء فحص الرادار الكامل وتحديث الدرجات</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Axis 1 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>🧠</span>
                <span>الاستدلال السريري</span>
              </span>
              <span className="font-mono font-black text-indigo-400">{cognitive.clinicalReasoning}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                style={{ width: `${cognitive.clinicalReasoning}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">التشخيص التفريقي وربط الأعراض</span>
          </div>

          {/* Axis 2 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>💊</span>
                <span>الأمان الدوائي</span>
              </span>
              <span className="font-mono font-black text-purple-400">{cognitive.pharmacology}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all duration-1000"
                style={{ width: `${cognitive.pharmacology}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">تجنب التفاعلات الخطرة وموانع الاستعمال</span>
          </div>

          {/* Axis 3 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>🔬</span>
                <span>الفيزيولوجيا المرضية</span>
              </span>
              <span className="font-mono font-black text-cyan-400">{cognitive.pathophysiology}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-1000"
                style={{ width: `${cognitive.pathophysiology}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">فهم آليات المرض العضوية العميقة</span>
          </div>

          {/* Axis 4 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>📊</span>
                <span>تفسير التحاليل والـ ECG</span>
              </span>
              <span className="font-mono font-black text-teal-400">{cognitive.diagnosticsLab}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-teal-500 rounded-full transition-all duration-1000"
                style={{ width: `${cognitive.diagnosticsLab}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">تخطيط القلب وغازات الدم الشرياني</span>
          </div>

          {/* Axis 5 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>⚡</span>
                <span>سرعة الطوارئ والإنعاش</span>
              </span>
              <span className="font-mono font-black text-amber-400">{cognitive.emergencySpeed}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                style={{ width: `${cognitive.emergencySpeed}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">التدخل الفوري لإنقاذ الحياة تحت الضغط</span>
          </div>

          {/* Axis 6 */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-bold flex items-center gap-1.5">
                <span>⚖️</span>
                <span>الأخلاقيات والطب المسند</span>
              </span>
              <span className="font-mono font-black text-emerald-400">{cognitive.evidenceEthics}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                style={{ width: `${cognitive.evidenceEthics}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 block">المبادئ التوجيهية واستقلالية المريض</span>
          </div>
        </div>
      </div>

      {/* My Medical Courses & Learning Path */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <span>📚</span>
              <span>المقررات والكورسات الطبية المسجل بها ({courses.length})</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              مناهج معتمدة مبنية بنظام المحاكاة السريرية والتدريب التفاعلي
            </p>
          </div>

          <Link
            href="/courses"
            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            تصفح دليل الكورسات كاملاً ←
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courses.map((course, idx) => {
            // Simulated progress per course based on index
            const progress = 0;
            return (
              <div
                key={course.id}
                className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 rounded-2xl bg-slate-950 border border-slate-800">
                      {course.icon || '🩺'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                      {course.year}
                    </span>
                  </div>

                  <h4 className="font-black text-white text-sm">{course.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                      <span>{progress > 0 ? `نسبة الإنجاز: ${progress}%` : 'لم تبدأ بعد'}</span>
                      <span>{course.modules?.length || 3} وحدات تعليمية</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-bold">
                      ⏳ {course.estimatedHours} ساعة تدريب
                    </span>
                    <Link
                      href={`/courses/${course.id}`}
                      className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 text-xs font-bold transition flex items-center gap-1"
                    >
                      <span>{progress > 0 ? 'متابعة الدراسة' : 'بدء الدراسة'}</span>
                      <span>←</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="font-black text-white text-lg flex items-center gap-2">
            <span>🎖️</span>
            <span>الأوسمة والإنجازات السريرية المعتمدة ({userBadges.length})</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            مستواك الحالي: {user.points >= 5000 ? '🥇 استشاري متقدم' : '🥈 ممارس سريري'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {userBadges.length > 0 ? (
            userBadges.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5"
              >
                <span className="text-3xl p-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner">
                  {b.icon}
                </span>
                <div>
                  <h4 className="font-bold text-white text-xs">{b.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{b.description}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="sm:col-span-3 text-center py-6 text-slate-500 text-xs">
              أكمل الحالات السريرية وتحديات الرادار المعرفي لحصد أوسمتك الطبية الأولى! 🎖️
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
