'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleAuthButton from '../components/GoogleAuthButton';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    studentId: '',
    academicYear: 'السنة الأولى',
    university: 'كلية الطب',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success && data.user) {
        // Guarantee immediate cookie availability on the client for smooth navigation
        if (typeof window !== 'undefined' && data.user.id) {
          document.cookie = `userId=${encodeURIComponent(data.user.id)}; path=/; max-age=2592000; SameSite=Lax`;
          localStorage.setItem('medai_user_id', data.user.id);
          localStorage.setItem('medai_user', JSON.stringify(data.user));
        }
        const target = data.user.role === 'DEVELOPER' ? '/developer' : '/profile';
        router.push(target);
        router.refresh();
      } else {
        setErrorMsg(data.error || 'حدث خطأ في التسجيل');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-[#0c142b] p-8 rounded-3xl border border-cyan-500/30 shadow-2xl">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-2xl flex items-center justify-center mx-auto text-white">
            🎓
          </div>
          <h2 className="text-2xl font-black text-white">إنشاء حساب طبي جديد</h2>
          <p className="text-xs text-slate-400">
            انضم لأكاديمية MedAI الطبية وشارك في التقييمات المعرفية وحلبة التنافس
          </p>
        </div>

        {/* Google Auth Button Top */}
        <div>
          <GoogleAuthButton
            label="التسجيل المباشر السريع بحساب Google"
            defaultStudentId={formData.studentId}
            defaultAcademicYear={formData.academicYear}
          />
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-800 w-full"></div>
          <span className="bg-[#0c142b] px-3 text-[11px] text-slate-500 font-bold uppercase">
            أو التسجيل بالبيانات الأكاديمية
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 text-xs font-bold text-center">
            {errorMsg}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">الاسم الكامل (د. الاسم)</label>
            <input
              type="text"
              required
              placeholder="د. أحمد السعيد"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">الرقم الجامعي</label>
              <input
                type="text"
                required
                placeholder="مثال: MED-2024-410"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">السنة الدراسية</label>
              <select
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="السنة الأولى">السنة الأولى</option>
                <option value="السنة الثانية">السنة الثانية</option>
                <option value="السنة الثالثة">السنة الثالثة</option>
                <option value="السنة الرابعة">السنة الرابعة</option>
                <option value="السنة الخامسة">السنة الخامسة</option>
                <option value="سنة الامتياز">سنة الامتياز (Intern)</option>
                <option value="طبيب مقيم">طبيب مقيم (Resident)</option>
                <option value="أستاذ واستشاري">أستاذ واستشاري (Consultant)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">الجامعة أو الكلية الطبية</label>
            <input
              type="text"
              placeholder="مثال: جامعة الملك سعود / جامعة القاهرة"
              value={formData.university}
              onChange={(e) => setFormData({ ...formData, university: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              required
              placeholder="doctor@medical.edu"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">كلمة المرور</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50"
          >
            {loading ? 'جارٍ إنشاء الحساب الأكاديمي...' : 'تأكيد التسجيل وبدء التدريب السريري 🚀'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="text-center text-xs text-slate-400">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold">
            تسجيل الدخول من هنا
          </Link>
        </p>
      </div>
    </div>
  );
}
