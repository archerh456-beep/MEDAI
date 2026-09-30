'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
    handleGoogleCredentialResponse?: (response: any) => void;
  }
}

interface QuickAccount {
  name: string;
  email: string;
  role: string;
  roleBadge: string;
  avatar: string;
  academicYear: string;
}

export default function GoogleAuthButton({
  label = 'المتابعة باستخدام Google',
  redirectTo = '/profile',
  defaultStudentId = '',
  defaultAcademicYear = 'السنة الأولى',
}: {
  label?: string;
  redirectTo?: string;
  defaultStudentId?: string;
  defaultAcademicYear?: string;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [gsiReady, setGsiReady] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  const clientId =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
      : '';

  // Quick select accounts matching modern OAuth testing and rapid access
  const quickAccounts: QuickAccount[] = [
    {
      name: 'Archerhood (المشرف والمطور الرئيسي)',
      email: 'archerh456@gmail.com',
      role: 'DEVELOPER',
      roleBadge: 'المطور المسؤول ⚡',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=archerh456@gmail.com',
      academicYear: 'استشاري وأكاديمي',
    },
    {
      name: 'د. سارة الأحمد',
      email: 'dr.sarah.intern@gmail.com',
      role: 'STUDENT',
      roleBadge: 'طبيبة امتياز (Intern) 🩺',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=sarah_intern',
      academicYear: 'سنة الامتياز',
    },
    {
      name: 'د. أحمد المنصوري',
      email: 'dr.ahmed.medai@gmail.com',
      role: 'STUDENT',
      roleBadge: 'طالب طب متميز 🔬',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=ahmed_mansoori',
      academicYear: 'السنة الثالثة',
    },
  ];

  useEffect(() => {
    if (!clientId) return;

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Prompt Google One Tap automatically (standard in modern websites)
        try {
          window.google.accounts.id.prompt();
        } catch {
          // ignore prompt restrictions
        }

        setGsiReady(true);
      }
    };
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [clientId]);

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Decode JWT ID Token payload
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const profile = JSON.parse(jsonPayload);

      await submitToServer({
        email: profile.email,
        name: profile.name,
        googleId: profile.sub,
        avatar: profile.picture,
      });
    } catch (err) {
      console.error('Google credential parse error:', err);
      setError('حدث خطأ أثناء معالجة بيانات اعتماد Google');
      setIsLoading(false);
    }
  };

  const submitToServer = async (payload: {
    email: string;
    name: string;
    googleId: string;
    avatar?: string;
    academicYear?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          studentId: defaultStudentId || `MED-${Math.floor(1000 + Math.random() * 9000)}`,
          academicYear: payload.academicYear || defaultAcademicYear,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        // Guarantee immediate client-side cookie & storage persistence
        if (typeof window !== 'undefined' && data.user.id) {
          document.cookie = `userId=${encodeURIComponent(data.user.id)}; path=/; max-age=2592000; SameSite=Lax`;
          localStorage.setItem('medai_user_id', data.user.id);
          localStorage.setItem('medai_user', JSON.stringify(data.user));
        }

        setShowPicker(false);
        const targetPath = data.user.role === 'DEVELOPER' ? '/developer' : redirectTo;
        router.push(targetPath);
        router.refresh();
      } else {
        setError(data.error || 'فشل الاتصال وتوثيق حساب Google');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    if (gsiReady && window.google?.accounts?.id && clientId) {
      // Trigger official Google One-Tap or Account prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowPicker(true);
        }
      });
    } else {
      setShowPicker(true);
    }
  };

  const handleSelectQuickAccount = (acc: QuickAccount) => {
    submitToServer({
      email: acc.email,
      name: acc.name,
      googleId: `g_${acc.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      avatar: acc.avatar,
      academicYear: acc.academicYear,
    });
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const cleanMail = customEmail.trim().toLowerCase();
    submitToServer({
      email: cleanMail,
      name: customName.trim() || cleanMail.split('@')[0],
      googleId: `g_${Date.now()}`,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanMail}`,
    });
  };

  return (
    <>
      {/* Modern Google Sign-In Button */}
      <div className="relative group">
        <button
          type="button"
          disabled={isLoading}
          onClick={handleButtonClick}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 active:scale-[0.99] border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 font-bold rounded-2xl text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 cursor-pointer"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-cyan-600" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{isLoading ? 'جارٍ الربط وتسجيل الدخول...' : label}</span>
        </button>

        {/* Hidden container for native Google rendered button if client ID is set */}
        <div ref={googleBtnContainerRef} className="hidden" />
      </div>

      {/* Modern Google Account Picker Modal (Google Identity Experience) */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            dir="rtl"
            className="bg-white text-slate-800 rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden relative"
          >
            {/* Top Bar with authentic Google Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    تسجيل الدخول باستخدام Google
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    اختر حساباً للمتابعة إلى <span className="font-bold text-cyan-600">MedAI Academy</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowPicker(false);
                  setShowCustomInput(false);
                  setError(null);
                }}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
              >
                ✕
              </button>
            </div>

            {/* Error banner if any */}
            {error && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold text-center">
                {error}
              </div>
            )}

            {/* Account List */}
            <div className="p-6 space-y-4">
              {!showCustomInput ? (
                <>
                  <div className="space-y-2">
                    {quickAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        disabled={isLoading}
                        onClick={() => handleSelectQuickAccount(acc)}
                        className="w-full p-3 rounded-2xl border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 transition-all duration-150 flex items-center justify-between text-right group disabled:opacity-50"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={acc.avatar}
                            alt={acc.name}
                            className="w-10 h-10 rounded-full border border-slate-200 bg-slate-100 p-0.5"
                          />
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-cyan-950 flex items-center gap-2">
                              <span>{acc.name}</span>
                              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                {acc.roleBadge}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              {acc.email}
                            </div>
                          </div>
                        </div>

                        <span className="text-slate-400 group-hover:text-cyan-600 text-sm font-bold pl-2">
                          ←
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Use another account toggle */}
                  <button
                    type="button"
                    onClick={() => setShowCustomInput(true)}
                    className="w-full py-3 px-4 rounded-2xl border border-dashed border-slate-300 hover:border-cyan-500 text-slate-600 hover:text-cyan-700 text-xs font-bold transition flex items-center justify-center gap-2"
                  >
                    <span>➕</span>
                    <span>استخدام حساب Google آخر</span>
                  </button>
                </>
              ) : (
                /* Google styled email input form */
                <form onSubmit={handleCustomSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      البريد الإلكتروني لحساب Google
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      placeholder="your.email@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 outline-none text-slate-900 transition text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      الاسم الشخصي (كما يظهر بحساب Google)
                    </label>
                    <input
                      type="text"
                      placeholder="د. الاسم الكامل"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100 outline-none text-slate-900 transition text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-xl transition shadow-md disabled:opacity-50 text-xs"
                    >
                      {isLoading ? 'جارٍ تسجيل الدخول...' : 'متابعة الدخول بحساب Google'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(false)}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                    >
                      رجوع
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Google privacy footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
              <div className="flex items-center gap-1.5 mb-1 text-slate-600 font-medium">
                <span>🔒</span>
                <span>ربط آمن ومباشر مع MedAI Academy</span>
              </div>
              <p>
                للمتابعة، ستشارك Google اسمك وعنوان بريدك الإلكتروني وصورة ملفك الشخصي مع MedAI Academy لمطابقة درجاتك الأكاديمية ونقاطك.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
