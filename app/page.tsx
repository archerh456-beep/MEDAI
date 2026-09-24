import DeveloperStudio from '@/DeveloperStudio';
import CourseViewerClient from '@/CourseViewerClient';
import { getDb } from '@/lib/db';

export default async function Home() {
  const db = await getDb();

  return (
    <main className="min-h-screen bg-[#050a1e]">
      {/* Hero Section */}
      <section className="relative p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🩺</span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  MedAI Academy
                </h1>
                <p className="text-sm text-slate-400">
                  أكاديمية الذكاء الاصطناعي الطبي
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-4">
              <a
                href="#courses"
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-bold transition border border-slate-700"
              >
                الكورسات
              </a>
              <a
                href="#features"
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-bold transition border border-slate-700"
              >
                الميزات
              </a>
              <a
                href="#about"
                className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-sm font-bold transition border border-slate-700"
              >
                عن المنصة
              </a>
            </nav>
          </header>

          {/* Hero Content */}
          <div className="text-center py-12 sm:py-20">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight">
              منصة تعليم طبية
              <span className="text-gradient bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                {' '}متقدمة{' '}
              </span>
              <br />
              <span className="text-gradient bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                مع الذكاء الاصطناعي
              </span>
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto">
              تعلم الطب بطريقة تفاعلية مع محاكيات واقعية، اختبارات ذكية،
              و نظام تقييم متقدم يعتمد على الذكاء الاصطناعي
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#get-started"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-400 hover:to-cyan-400 text-white font-black text-lg shadow-xl shadow-indigo-500/30 transition"
              >
                ابدأ التعلم الآن
              </a>
              <a
                href="#demo"
                className="px-8 py-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-white font-black text-lg border border-slate-700 transition"
              >
                جرب ديمو
              </a>
            </div>
          </div>

          {/* Features Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-indigo-900/60 flex items-center justify-center text-2xl mb-4">
                🧠
              </div>
              <h3 className="font-bold text-white text-lg mb-2">
                محاكيات ذكية
              </h3>
              <p className="text-slate-400 text-sm">
                محاكيات حالات سريرية واقعية مع تقييم فوري
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-cyan-900/60 flex items-center justify-center text-2xl mb-4">
                📊
              </div>
              <h3 className="font-bold text-white text-lg mb-2">
                نظام تقييم متقدم
              </h3>
              <p className="text-slate-400 text-sm">
                رادار مهارات مع 6 أبعاد تقييم مختلفة
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-emerald-900/60 flex items-center justify-center text-2xl mb-4">
                🎯
              </div>
              <h3 className="font-bold text-white text-lg mb-2">
                تعليم تفاعلي
              </h3>
              <p className="text-slate-400 text-sm">
                بطاقات استذكار، اختبارات، محاضرات
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Studio Section */}
      <section id="developer" className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800">
            <DeveloperStudio initialDb={db} initiallyUnlocked={false} />
          </div>
        </div>
      </section>

      {/* Course Viewer Section */}
      <section id="courses" className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-white mb-6 flex items-center gap-3">
            <span>📚</span>
            <span>الكورسات المتاحة</span>
          </h2>
          <CourseViewerClient courses={db.courses} />
        </div>
      </section>

      {/* Footer */}
      <footer className="p-6 sm:p-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-slate-400 text-sm">
            © 2026 MedAI Academy. جميع الحقوق محفوظة.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            مطور بواسطة Archerhood (archerh456@gmail.com)
          </p>
        </div>
      </footer>
    </main>
  );
}
