'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    google?: any;
    handleGoogleCredentialResponse?: (response: any) => void;
  }
}

export default function GoogleAuthButton({
  label = 'المتابعة باستخدام حساب Google',
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
  const [showFallback, setShowFallback] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clientId = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '') 
    : '';

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
        setGsiReady(true);
      }
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [clientId]);

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError(null);
    try {
      // Decode the JWT credential
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
      console.error('Google credential error:', err);
      setError('حدث خطأ أثناء معالجة بيانات حساب Google');
      setIsLoading(false);
    }
  };

  const submitToServer = async (payload: {
    email: string;
    name: string;
    googleId: string;
    avatar?: string;
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
          academicYear: defaultAcademicYear,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowFallback(false);
        router.push(data.user?.role === 'DEVELOPER' ? '/developer' : redirectTo);
        router.refresh();
      } else {
        setError(data.error || 'فشل تسجيل الدخول بحساب Google');
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالخادم');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleClick = () => {
    if (gsiReady && window.google?.accounts?.id) {
      // Use official Google Sign-In popup
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fallback if popup blocked or not available
          setShowFallback(true);
        }
      });
    } else {
      // No Google Client ID configured - show fallback
      setShowFallback(true);
    }
  };

  const handleFallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    submitToServer({
      email: email.trim(),
      name: name.trim() || email.split('@')[0],
      googleId: `g_${Date.now()}`,
    });
  };

  return (
    <>
      <button
        type="button"
        disabled={isLoading}
        onClick={handleGoogleClick}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
        </svg>
        <span>{isLoading ? 'جارٍ الاتصال...' : label}</span>
      </button>

      {/* Fallback Modal */}
      {showFallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0c142b] border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 className="text-sm font-black text-white">تسجيل الدخول بحساب Google</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowFallback(false); setError(null); }}
                className="text-slate-400 hover:text-white text-sm font-bold transition w-8 h-8 rounded-lg hover:bg-slate-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              أدخل بريدك الإلكتروني المرتبط بحساب Google للمتابعة. سيتم ربط حسابك تلقائياً.
            </p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-bold">
                {error}
              </div>
            )}

            <form onSubmit={handleFallbackSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-bold">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-bold">الاسم الكامل</label>
                <input
                  type="text"
                  placeholder="اسمك كما يظهر في حساب Google"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
              >
                {isLoading ? 'جارٍ المعالجة...' : 'متابعة تسجيل الدخول'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
