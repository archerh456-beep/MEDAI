'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/lib/db';

export default function MobileNav({ currentUser }: { currentUser: User | null }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'الرئيسية', icon: '🏠' },
    { href: '/courses', label: 'المقررات', icon: '📚' },
    { href: '/cases', label: 'المحاكي', icon: '🏥' },
    { href: '/assessment', label: 'الرادار', icon: '🕸️' },
    { href: '/arena', label: 'الحلبة', icon: '🏆' },
    { href: currentUser ? '/profile' : '/login', label: currentUser ? 'حسابي' : 'دخول', icon: '👤' },
  ];

  const secondaryItems = [
    { href: '/flashcards', label: 'البطاقات السريرية (Flashcards)', icon: '🎴' },
    { href: '/ai-tutor', label: 'المساعد السقراطي الذكي', icon: '🤖' },
    { href: '/developer', label: 'استوديو المطور والتحكم', icon: '⚡' },
  ];

  return (
    <>
      {/* Mobile Top Header Bar with Drawer Toggle Button */}
      <div className="lg:hidden sticky top-0 z-40 backdrop-blur-xl bg-[#0b1329]/95 border-b border-slate-800/80 px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-white text-base shadow-md">
            🩺
          </span>
          <span className="font-black text-base tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-300 bg-clip-text text-transparent">
            MedAI Academy
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {currentUser ? (
            <Link
              href="/profile"
              className="text-xs bg-slate-800 border border-slate-700 text-cyan-300 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1"
            >
              <span>{currentUser.name.split(' ')[0]}</span>
              <span className="text-[10px] text-amber-400 font-mono">⚡{currentUser.points || 0}</span>
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-xs bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-bold px-2.5 py-1 rounded-lg"
            >
              دخول
            </Link>
          )}

          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="القائمة الجانبية"
            aria-expanded={drawerOpen}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 text-slate-200 border border-slate-700 active:scale-95 transition"
          >
            <span className="text-lg">{drawerOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Slide-over Drawer for Mobile */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-[#0b1329] border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto z-10 shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">🩺</span>
                  <div>
                    <h3 className="font-black text-sm text-white">MedAI Academy</h3>
                    <p className="text-[10px] text-slate-400">القائمة السريرية المتقدمة</p>
                  </div>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {/* Status info */}
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
                {currentUser ? (
                  <div className="space-y-1.5">
                    <p className="text-slate-400 font-medium">مرحباً بك دكتور:</p>
                    <p className="font-bold text-white text-sm">{currentUser.name}</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-cyan-400">{currentUser.academicYear}</span>
                      <span className="text-amber-400 font-mono font-bold">💎 {currentUser.points} XP</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-slate-300 font-medium">أنت تتصفح المنصة كزائر</p>
                    <div className="flex gap-2">
                      <Link
                        href="/login"
                        onClick={() => setDrawerOpen(false)}
                        className="flex-1 py-1.5 text-center rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                      >
                        دخول
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setDrawerOpen(false)}
                        className="flex-1 py-1.5 text-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs"
                      >
                        تسجيل
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-500 block px-2 mb-1">الأقسام الأساسية</span>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              {/* Secondary Tools */}
              <div className="space-y-1 pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-500 block px-2 mb-1">الأدوات الذكية والتحكم</span>
                {secondaryItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                        isActive
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Logout button if logged in */}
            {currentUser && (
              <form action="/api/auth/logout" method="POST" className="pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-rose-950/40 text-rose-300 border border-rose-500/30 font-bold text-xs hover:bg-rose-900/40 transition flex items-center justify-center gap-2"
                >
                  <span>🚪</span>
                  <span>تسجيل الخروج من الحساب</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile (< lg) */}
      <nav
        aria-label="شريط التنقل السفلي للهاتف"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#080d1e]/95 border-t border-slate-800/90 shadow-2xl px-2 py-1.5 flex items-center justify-around"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center min-w-[52px] min-h-[44px] py-1 px-1.5 rounded-xl transition ${
                isActive
                  ? 'text-cyan-400 font-black'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <span className={`text-lg transition transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-0.5 shadow-sm shadow-cyan-400 animate-pulse" />
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
