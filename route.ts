import { NextRequest, NextResponse } from 'next/server';
import { authenticateWithGoogle } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, name, googleId, avatar, studentId, academicYear } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'البريد الإلكتروني مطلوب' }, { status: 400 });
    }

    const { user, isNewUser } = await authenticateWithGoogle({
      email,
      name: name || email.split('@')[0],
      googleId: googleId || `g_${Date.now()}`,
      avatar,
      studentId,
      academicYear,
    });

    const response = NextResponse.json({
      success: true,
      user,
      isNewUser,
      message: isNewUser
        ? 'تم إنشاء حسابك وربطه بـ Google بنجاح (+150 نقطة XP)'
        : 'تم تسجيل الدخول بحساب Google بنجاح',
    });

    // Set auth cookie
    response.cookies.set('userId', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return response;
  } catch (error: any) {
    console.error('Error in Google Auth API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
