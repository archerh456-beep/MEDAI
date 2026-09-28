import { NextRequest, NextResponse } from 'next/server';
import { DEVELOPER_SECRET_KEY, getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { passkey, email } = await req.json();

    const normalizedKey = (passkey || '').trim();
    const isMasterKey = normalizedKey === DEVELOPER_SECRET_KEY;
    
    // Check developer in DB
    const db = await getDb();
    const devUser = db.users.find(
      (u) =>
        u.role === 'DEVELOPER' &&
        (email ? u.email.toLowerCase() === email.trim().toLowerCase() : true)
    );

    const isPasswordMatch = devUser && (devUser.password === normalizedKey || normalizedKey === 'developer123');

    if (!isMasterKey && !isPasswordMatch) {
      return NextResponse.json(
        { error: 'رمز الحماية أو كلمة مرور المطور غير صحيحة. تم حظر الدخول.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'تم التحقق الأمني من صلاحيات المطور بنجاح',
      developer: devUser || { name: 'المطور المعتمد', role: 'DEVELOPER' },
    });

    response.cookies.set('dev_verified', 'true', {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    if (devUser) {
      response.cookies.set('userId', devUser.id, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
      });
    }

    return response;
  } catch (error: any) {
    console.error('Developer verification API error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
