import Link from 'next/link';
import { getDb } from '@/lib/db';

export default async function CoursesPage() {
  const db = await getDb();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black border border-indigo-500/30 mb-2">
            <span>📚</span>
            <span>المناهج والمقررات الطبية التفاعلية (Curricula & Modules)</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            المقررات والمحاضرات الطبية التفاعلية
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            محتوى أكاديمي وسريري معتمد مقسم حسب السنوات الدراسية والتخصصات، معزز بنماذج تشريحية تفاعلية، مخططات بيوكيميائية، وربط مباشر بالحالات الواقعية.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 text-center min-w-[170px]">
          <span className="text-xs text-slate-400 font-bold block">إجمالي المقررات</span>
          <span className="text-3xl font-black text-indigo-400">{db.courses.length} مناهج</span>
          <span className="text-[11px] block text-cyan-400 font-bold mt-0.5">شاملة ومحدثة لعام 2026</span>
        </div>
      </div>

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {db.courses.map((course) => (
          <div
            key={course.id}
            className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 hover:border-indigo-500/50 transition group flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-800">
                  {course.icon}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                  {course.year}
                </span>
              </div>

              <h2 className="text-lg font-black text-white group-hover:text-cyan-300 transition">
                {course.title}
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                {course.description}
              </p>

              {/* Modules count & rating */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span>⏱️ {course.estimatedHours} ساعة تدريبية</span>
                <span className="text-amber-400 font-bold">★ {course.rating}</span>
                <span>👥 {course.studentsCount} طالب</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-cyan-400 font-semibold">
                {course.modules.length} وحدات تعليمية
              </span>
              <Link
                href={`/courses/${course.id}`}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
              >
                <span>دخول المحاضرة</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
