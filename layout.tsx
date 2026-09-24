import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import MobileNav from '@/app/components/MobileNav';

export const metadata: Metadata = {
  title: 'MedAI Academy | أكاديمية الذكاء الاصطناعي والطب التفاعلية',
  description: 'المنصة الطبية التعليمية المتقدمة لطلاب كليات الطب: تقييم معرفي بالرادار، حلبة مسابقات وتنافس، محاكي حالات سريرية، واستوديو مطور متكامل.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  const db = await getDb();
  const currentUser = userId ? db.users.find((u) => u.id === userId) : null;

  return (
    <html lang="ar" dir="rtl" className="h-full bg-slate-900 text-slate-100">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              tailwind.config = {
                darkMode: 'class',
                theme: {
                  extend: {
                    fontFamily: {
                      sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
                    },
                    colors: {
                      med: {
                        50: '#f0fdfa',
                        100: '#ccfbf1',
                        500: '#14b8a6',
                        600: '#0d9488',
                        700: '#0f766e',
                        800: '#115e59',
                        900: '#134e4a',
                      },
                      clinical: {
                        dark: '#0b1329',
                        card: '#131e3a',
                        border: '#1e2d54',
                        accent: '#38bdf8',
                        pulse: '#10b981',
                      }
                    }
                  }
                }
              }
            `,
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              body {
                font-family: 'Cairo', 'Tajawal', sans-serif;
              }
              @keyframes pulseSlow {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.4; }
              }
              .animate-pulse-slow {
                animation: pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
              }
              ::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              ::-webkit-scrollbar-track {
                background: #0b1329;
              }
              ::-webkit-scrollbar-thumb {
                background: #1e2d54;
                border-radius: 4px;
              }
              ::-webkit-scrollbar-thumb:hover {
                background: #38bdf8;
              }
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#080d1e] text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
        {/* Top Notification Bar */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-xs px-4 py-2 border-b border-indigo-900/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block"></span>
              أكاديمية MedAI الطبية
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-300 text-[11px]">
              {currentUser ? (
                <>
                  طالب الطب المسجل: <strong className="text-white">{currentUser.name}</strong> ({currentUser.academicYear})
                </>
              ) : (
                'المنظومة الأولى لطلاب كليات الطب لربط المعرفة السريرية بالتقييم الراداري الذكي'
              )}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {currentUser ? (
              <>
                <div className="flex items-center gap-1 text-amber-300 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  <span>🔥</span>
                  <span>{currentUser.streak} أيام متواصلة</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                  <span>💎</span>
                  <span>{currentUser.points?.toLocaleString() || 0} XP</span>
                </div>
                <Link
                  href="/profile"
                  className="bg-cyan-900/80 hover:bg-cyan-800 text-cyan-200 font-bold px-2.5 py-0.5 rounded transition border border-cyan-500/30"
                >
                  لوحة التحكم
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-slate-300 hover:text-white transition font-medium"
                >
                  تسجيل الدخول
                </Link>
                <span className="text-slate-600">•</span>
                <Link
                  href="/register"
                  className="text-cyan-400 hover:text-cyan-300 font-bold transition"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation (Header Drawer & Bottom Nav) */}
        <MobileNav currentUser={currentUser} />

        {/* Desktop Main Navigation Bar */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0b1329]/95 border-b border-slate-800/80 hidden lg:block">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition transform">
                🩺
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-xl tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-400 bg-clip-text text-transparent">
                    MedAI Academy
                  </span>
                  <span className="text-[10px] bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold px-1.5 py-0.5 rounded-full">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">أكاديمية الطب والتقييم المعرفي الذكي</p>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 text-sm font-semibold">
              <Link
                href="/courses"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
              >
                <span>📚</span>
                <span>المقررات الطبية</span>
              </Link>
              <Link
                href="/cases"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
              >
                <span>🏥</span>
                <span>المحاكي السريري</span>
              </Link>
              <Link
                href="/assessment"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-cyan-300 hover:bg-slate-800/60 transition flex items-center gap-1.5"
              >
                <span>🕸️</span>
                <span>الرادار المعرفي</span>
              </Link>
              <Link
                href="/arena"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-amber-300 hover:bg-slate-800/60 transition flex items-center gap-1.5"
              >
                <span>🏆</span>
                <span>حلبة المسابقات</span>
              </Link>
              <Link
                href="/flashcards"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5"
              >
                <span>🎴</span>
                <span>البطاقات الذكية</span>
              </Link>
              <Link
                href="/ai-tutor"
                className="px-3 py-2 rounded-lg text-slate-300 hover:text-teal-300 hover:bg-slate-800/60 transition flex items-center gap-1.5"
              >
                <span>🤖</span>
                <span>المساعد الذكي</span>
              </Link>
              {currentUser?.role === 'DEVELOPER' && (
                <Link
                  href="/developer"
                  className="px-3 py-2 rounded-lg text-indigo-300 hover:text-indigo-200 hover:bg-indigo-900/40 transition flex items-center gap-1.5 border border-indigo-500/30"
                >
                  <span>⚡</span>
                  <span>استوديو المطور</span>
                </Link>
              )}
            </nav>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3">
              {currentUser ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-cyan-500/50 transition group"
                  >
                    <div className="text-right hidden sm:block leading-tight">
                      <span className="text-xs font-bold block text-white group-hover:text-cyan-300 transition">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-cyan-400 font-mono">
                        {currentUser.studentId || currentUser.academicYear}
                      </span>
                    </div>
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-8 h-8 rounded-lg bg-slate-900 border border-cyan-500/40 p-0.5"
                    />
                  </Link>

                  <form action="/api/auth/logout" method="POST">
                    <button
                      type="submit"
                      title="تسجيل الخروج"
                      className="p-2 rounded-xl bg-slate-800/60 hover:bg-red-950/60 text-slate-400 hover:text-red-300 border border-slate-700 hover:border-red-500/40 transition text-xs"
                    >
                      🚪
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition border border-slate-700"
                  >
                    تسجيل الدخول
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs transition shadow-md shadow-cyan-500/20"
                  >
                    إنشاء حساب جديد
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 pb-24 lg:pb-8">{children}</main>

        {/* Clean Professional Footer */}
        <footer className="bg-[#050814] border-t border-slate-800/80 text-slate-400 text-xs py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🩺</span>
                <div>
                  <p className="font-bold text-slate-100 text-sm">منصة MedAI Academy الأكاديمية الطبية</p>
                  <p className="text-[11px] text-slate-500">
                    البيئة التفاعلية المتطورة لربط العلوم الطبية الأساسية بالتشخيص السريري الواقعي
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-slate-400">
                <Link href="/courses" className="hover:text-cyan-400 transition">المقررات الطبية</Link>
                <Link href="/cases" className="hover:text-cyan-400 transition">المحاكي السريري</Link>
                <Link href="/assessment" className="hover:text-cyan-400 transition">الرادار المعرفي</Link>
                <Link href="/arena" className="hover:text-cyan-400 transition">حلبة المسابقات</Link>
                <Link href="/flashcards" className="hover:text-cyan-400 transition">البطاقات السريرية</Link>
                <Link href="/ai-tutor" className="hover:text-cyan-400 transition">المساعد الذكي</Link>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
              <p>جميع الحقوق محفوظة © 2026 MedAI Academy. صممت خصيصاً لدعم التعليم الطبي الجامعي.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
