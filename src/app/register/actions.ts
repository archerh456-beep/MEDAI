'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { registerUser } from '@/lib/db';

export interface RegisterActionState {
  error?: string | null;
  success?: boolean;
}

/**
 * Server Action for student registration in MedAI Academy.
 * Sets the authentication cookie and redirects directly to /profile (or /developer).
 */
export async function registerAction(
  prevState: RegisterActionState | null,
  formData: FormData
): Promise<RegisterActionState> {
  const name = (formData.get('name') as string)?.trim();
  const studentId = (formData.get('studentId') as string)?.trim();
  const academicYear = (formData.get('academicYear') as string)?.trim() || 'السنة الأولى';
  const university = (formData.get('university') as string)?.trim() || 'كلية الطب';
  const email = (formData.get('email') as string)?.trim();
  const password = (formData.get('password') as string) || '';

  if (!name || !studentId || !email || !academicYear) {
    return { error: 'يرجى ملء جميع الحقول الإلزامية (الاسم، الرقم الجامعي، السنة الدراسية، البريد الإلكتروني)' };
  }

  let result;
  try {
    result = await registerUser({
      name,
      email,
      studentId,
      academicYear,
      university,
      password: password || '123456',
    });
  } catch (err: any) {
    return { error: err.message || 'حدث خطأ غير متوقع أثناء معالجة بيانات التسجيل' };
  }

  if (result.error || !result.user) {
    return { error: result.error || 'فشل إنشاء الحساب الأكاديمي' };
  }

  // Set persistent session cookie
  const cookieStore = await cookies();
  cookieStore.set('userId', result.user.id, {
    path: '/',
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  const targetPath = result.user.role === 'DEVELOPER' ? '/developer' : '/profile';

  // In Next.js Server Actions, redirect() throws a NEXT_REDIRECT signal.
  // It MUST be outside any try/catch block to avoid being intercepted as an error.
  redirect(targetPath);
}
