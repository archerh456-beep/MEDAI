import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier) {
      return NextResponse.json({ error: 'يرجى إدخال البريد الإلكتروني أو الرقم الجامعي' }, { status: 400 });
    }

    const db = await getDb();
    const query = identifier.trim().toLowerCase();

    const user = db.users.find(
      (u) =>
        u.email.toLowerCase() === query ||
        (u.studentId && u.studentId.toLowerCase() === query)
    );

    if (!user) {
      return NextResponse.json({ error: 'لم يتم العثور على حساب بهذا البريد أو الرقم الجامعي' }, { status: 404 });
    }

    // Optional password verification
    if (password && user.password && user.password !== password) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      user,
      message: 'تم تسجيل الدخول بنجاح',
    });

    response.cookies.set('userId', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
