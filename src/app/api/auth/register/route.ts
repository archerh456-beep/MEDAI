import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, studentId, academicYear, university, password } = await req.json();

    if (!name || !email || !studentId || !academicYear) {
      return NextResponse.json({ error: 'يرجى ملء جميع الحقول المطلوبة' }, { status: 400 });
    }

    const result = await registerUser({
      name,
      email,
      studentId,
      academicYear,
      university: university || 'كلية الطب',
      password: password || '123456',
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      message: 'تم تسجيل الحساب بنجاح (+100 نقطة ترحيبية)',
    });

    if (result.user) {
      response.cookies.set('userId', result.user.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
