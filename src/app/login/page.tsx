'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.user?.role === 'DEVELOPER') {
          router.push('/developer');
        } else {
          router.push('/profile');
        }
        router.refresh();
      } else {
        setErrorMsg(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-[#0c142b] p-8 rounded-3xl border border-indigo-500/30 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-2xl flex items-center justify-center mx-auto text-white">
            🩺
          </div>
          <h2 className="text-2xl font-black text-white">تسجيل الدخول للمنصة</h2>
          <p className="text-xs text-slate-400">
            أدخل بالرقم الجامعي أو البريد الإلكتروني أو بحساب Google المعتمد
          </p>
        </div>

        {/* Google Auth Button */}
        <div>
          <GoogleAuthButton label="الدخول السريع باستخدام Google" />
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-[#0c142b] px-3 text-[11px] text-slate-500 font-bold uppercase">
            أو عبر البريد / الرقم الجامعي
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">
              البريد الإلكتروني أو الرقم الجامعي
            </label>
            <input
              type="text"
              required
              placeholder="archerh456@gmail.com أو MED-2024-410"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">كلمة المرور</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:brightness-110 text-white font-black text-sm shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
          >
            {loading ? 'جارٍ التحقق...' : 'تسجيل الدخول 🚀'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400">
          ليس لديك حساب بعد؟{' '}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-bold">
            أنشئ حساباً طبياً جديداً (+100 نقطة)
          </Link>
        </p>
      </div>
    </div>
  );
}
