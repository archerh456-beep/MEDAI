import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';

export default async function HomePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const db = await getDb();
  const currentUser = userId ? db.users.find((u) => u.id === userId) : null;

  const totalStudents = db.users.length;

  return (
    <div className="space-y-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800/80 bg-gradient-to-b from-[#0e1730] via-[#091024] to-[#080d1e]">
        {/* Glow ambient background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-10 right-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-lg shadow-cyan-950/40">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
            <span>المنظومة الأولى لتعليم الطب السريري التفاعلي بالذكاء الاصطناعي</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.25] text-white">
            طوّر كفاءتك الطبية السريرية
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
              بالمحاكاة والتقييم المعرفي الذكي
            </span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            منصة متكاملة صُممت لطلاب كليات الطب والأطباء المقيمين لربط العلوم الأساسية بالممارسة السريرية الواقعية،
            مع قياس راداري دقيق لقدرات التشخيص، الأمان الدوائي، وسرعة اتخاذ القرارات في الطوارئ.
          </p>

          {/* Primary Action Buttons (CTA) */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {currentUser ? (
              <Link
                href="/profile"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/25 transition transform hover:-translate-y-0.5 flex items-center gap-3"
              >
                <span>👨‍⚕️</span>
                <span>الدخول إلى لوحة تحكم الطالب ({currentUser.name.split(' ')[0]})</span>
                <span>←</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/25 transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>🎓</span>
                  <span>إنشاء حساب طالب جديد مجاناً</span>
                  <span>←</span>
                </Link>

                <Link
                  href="/login"
                  className="px-8 py-4 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 hover:border-slate-600 text-white font-bold text-base shadow-md transition transform hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>🔑</span>
                  <span>تسجيل الدخول</span>
                </Link>
              </>
            )}

            <Link
              href="/assessment"
              className="px-6 py-4 rounded-2xl bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 font-bold text-sm transition flex items-center gap-2"
            >
              <span>🕸️</span>
              <span>تجربة الرادار المعرفي السريري</span>
            </Link>
          </div>

          {/* Trust Telemetry Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-slate-800/80 max-w-4xl mx-auto">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
              <p className="text-3xl font-black text-cyan-400">{totalStudents}+</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">طالب وطبيب نشط</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
              <p className="text-3xl font-black text-teal-400">96.8%</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">دقة التشخيص المعرفي</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
              <p className="text-3xl font-black text-indigo-400">6 أبعاد</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">تقييم سريري شامل</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800/80">
              <p className="text-3xl font-black text-amber-400">100%</p>
              <p className="text-xs text-slate-400 mt-1 font-semibold">مطابقة للمناهج الطبية</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Pillars (المحاور الأساسية للمنصة) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40">
            أدوات الجيل الطبي القادم
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            لماذا يختار أطباء المستقبل منصة MedAI؟
          </h2>
          <p className="text-sm text-slate-400">
            أربع ركائز تقنية وطبية فريدة تم تصميمها لمساعدتك على التفوق في دراستك الجامعية وسنوات الامتياز والإقامة.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 hover:border-cyan-500/40 transition group shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition transform">
              🕸️
            </div>
            <h3 className="text-lg font-black text-white mb-2">مصفوفة الرادار المعرفي</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تقييم راداري سداسي الأبعاد يحدد بدقة نقاط قوتك وفجواتك المعرفية في التشخيص، الأمان الدوائي، والفيزيولوجيا المرضية مع وصفة تعلم مخصصة.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <Link href="/assessment" className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1">
                <span>استكشف الرادار المعرفي</span>
                <span>←</span>
              </Link>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 hover:border-teal-500/40 transition group shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition transform">
              🏥
            </div>
            <h3 className="text-lg font-black text-white mb-2">المحاكي السريري التفاعلي</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              محاكاة واقعية للمرضى مع علامات حيوية متغيرة، تخطيط قلب حقيقي (ECG)، نتائج مخبرية، وقرارات سريرية حاسمة تحاكي بيئة الطوارئ والمستشفى.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <Link href="/cases" className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1">
                <span>تصفح الحالات السريرية</span>
                <span>←</span>
              </Link>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 hover:border-amber-500/40 transition group shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-amber-950 border border-amber-500/30 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition transform">
              🏆
            </div>
            <h3 className="text-lg font-black text-white mb-2">حلبة المسابقات والمبارزات</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              تحديات تنافسية مباشرة وسريعة بين طلاب كليات الطب لتعزيز سرعة البديهة الطبية وتثبيت المعلومات الدوائية والتشخيصية الصعبة تحت ضغط الوقت.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <Link href="/arena" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <span>دخول حلبة التنافس</span>
                <span>←</span>
              </Link>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 hover:border-indigo-500/40 transition group shadow-lg">
            <div className="w-14 h-14 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-3xl mb-5 group-hover:scale-110 transition transform">
              🤖
            </div>
            <h3 className="text-lg font-black text-white mb-2">المساعد السريري الذكي</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              شريكك التعليمي السقراطي الذي لا يعطيك إجابات جاهزة، بل يوجه تفكيرك السريري خطوة بخطوة ويشرح لك الآليات العميقة وتداخلات الأدوية.
            </p>
            <div className="mt-4 pt-4 border-t border-slate-800/80">
              <Link href="/ai-tutor" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <span>تحدث مع المساعد الذكي</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The 6-Axis Cognitive Matrix Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl p-8 sm:p-12 bg-gradient-to-br from-[#0c142b] via-[#091024] to-[#070b1a] border border-slate-800 space-y-8">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              الأبعاد الستة للرادار المعرفي الطبي
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              معايير سريرية مستندة إلى أحدث متطلبات امتحانات البورد والتراخيص المهنية
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-2xl">🧠</span>
              <h4 className="text-sm font-black text-white">1. الاستدلال والتشخيص السريري</h4>
              <p className="text-xs text-slate-400">
                القدرة على تكوين تشخيص تفريقي (Differential Diagnosis) متزن وتفسير الأعراض المعقدة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-2xl">💊</span>
              <h4 className="text-sm font-black text-white">2. الأمان الدوائي وتداخلات العلاج</h4>
              <p className="text-xs text-slate-400">
                اختيار الجرعات السليمة وتجنب التفاعلات الدوائية القاتلة وموانع الاستعمال الدقيقة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-2xl">🔬</span>
              <h4 className="text-sm font-black text-white">3. الفيزيولوجيا المرضية العميقة</h4>
              <p className="text-xs text-slate-400">
                فهم الخلل الوظيفي الخلوي والعضوي المسبب للأعراض وليس مجرد حفظ المصطلحات.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-2xl">📊</span>
              <h4 className="text-sm font-black text-white">4. قراءة التحاليل ورسم القلب (ECG)</h4>
              <p className="text-xs text-slate-400">
                قراءة غازات الدم الشرياني (ABG)، علامات احتشاء القلب، وتفسير الفحوصات التصويرية.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-2xl">⚡</span>
              <h4 className="text-sm font-black text-white">5. طب الطوارئ والقرار الحرج</h4>
              <p className="text-xs text-slate-400">
                السرعة والدقة في تطبيق بروتوكولات الإنعاش الفوري وفرز الحالات المهددة للحياة.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="text-2xl">⚖️</span>
              <h4 className="text-sm font-black text-white">6. الطب المسند بالدليل والأخلاقيات</h4>
              <p className="text-xs text-slate-400">
                احترام استقلالية المريض، اتخاذ القرارات بناء على أحدث الأدلة والمبادئ التوجيهية.
              </p>
            </div>
          </div>
        </div>
      </section>
      {/* How to Get Started */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white">كيف تبدأ رحلتك في المنصة؟</h3>
          <p className="text-xs text-slate-400">ثلاث خطوات بسيطة لبدء التدريب السريري التفاعلي</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/30 flex items-center justify-center text-3xl mx-auto">1️⃣</div>
            <h4 className="text-base font-black text-white">أنشئ حسابك الطبي</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              سجّل حسابك مجاناً عبر Google أو بالبريد الإلكتروني، وحدد سنتك الدراسية وتخصصك الطبي.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-teal-950 border border-teal-500/30 flex items-center justify-center text-3xl mx-auto">2️⃣</div>
            <h4 className="text-base font-black text-white">اختبر مستواك بالرادار المعرفي</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              أجرِ التقييم الراداري السداسي لاكتشاف نقاط القوة والفجوات المعرفية في مهاراتك السريرية.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-3xl mx-auto">3️⃣</div>
            <h4 className="text-base font-black text-white">تدرّب وارتقِ بمستواك</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ادخل المحاكي السريري، حلّ الحالات الطبية، وشارك في حلبة المسابقات لتحسين درجاتك باستمرار.
            </p>
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border border-cyan-500/30 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <h3 className="text-2xl sm:text-3xl font-black text-white">
            ابدأ رحلتك نحو التميز السريري اليوم
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
            انضم إلى مجتمع أطباء المستقبل، اختبر قدراتك بالرادار المعرفي، وتابع تقدمك في كل سنة دراسية عبر لوحة تحكم مخصصة لك.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {currentUser ? (
              <Link
                href="/profile"
                className="px-8 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/30 transition transform hover:-translate-y-0.5"
              >
                انتقل إلى لوحة التحكم الخاصة بك ←
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/30 transition transform hover:-translate-y-0.5"
                >
                  إنشاء حساب جديد 🎓
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-700 transition"
                >
                  تسجيل الدخول
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
