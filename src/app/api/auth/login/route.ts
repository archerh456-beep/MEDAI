import { NextRequest, NextResponse } from 'next/server';
import { getNeonClient, getLocalUsers, mapUserRow, User } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawIdentifier = body.identifier ?? body.email ?? body.student_id ?? body.studentId;
    const password = body.password;

    if (!rawIdentifier || typeof rawIdentifier !== 'string' || !rawIdentifier.trim()) {
      return NextResponse.json(
        { error: 'يرجى إدخال البريد الإلكتروني أو الرقم الجامعي' },
        { status: 400 }
      );
    }

    const passwordVal = typeof password === 'string' ? password : (password !== undefined && password !== null ? String(password) : '');
    if (!passwordVal || !passwordVal.trim()) {
      return NextResponse.json(
        { error: 'يرجى إدخال كلمة المرور' },
        { status: 400 }
      );
    }

    const query = rawIdentifier.trim().toLowerCase();
    const sql = getNeonClient();
    let user: User | null = null;
    let neonFailed = false;

    // When DATABASE_URL/Neon is available, query the users table directly
    if (sql) {
      try {
        const rows = await sql`
          SELECT * FROM users
          WHERE LOWER(email) = ${query} OR LOWER(student_id) = ${query}
          LIMIT 1
        `;
        if (rows && rows.length > 0) {
          user = mapUserRow(rows[0]);
        }
      } catch (neonErr) {
        console.warn('Neon query error for user, Neon unavailable:', neonErr);
        neonFailed = true;
      }
    }

    // Keep the local db.json fallback only when Neon is unavailable
    if (!sql || neonFailed) {
      const localUsers = getLocalUsers();
      user =
        localUsers.find(
          (u) =>
            (u.email && u.email.toLowerCase() === query) ||
            (u.studentId && u.studentId.toLowerCase() === query) ||
            ((u as any).student_id && (u as any).student_id.toLowerCase() === query)
        ) || null;
    }

    if (!user) {
      return NextResponse.json(
        { error: 'لم يتم العثور على حساب بهذا البريد أو الرقم الجامعي' },
        { status: 404 }
      );
    }

    // Verify non-empty password against users.password
    if (!user.password || user.password !== passwordVal) {
      return NextResponse.json(
        { error: 'كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Return sanitized user without the password
    const { password: _pwd, ...sanitizedUser } = user;

    const response = NextResponse.json({
      success: true,
      user: sanitizedUser,
      message: 'تم تسجيل الدخول بنجاح',
    });

    // Set the userId cookie
    response.cookies.set('userId', user.id, {
      path: '/',
      httpOnly: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: any) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

