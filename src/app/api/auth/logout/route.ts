import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'تم تسجيل الخروج بنجاح' });
  
  response.cookies.set('userId', '', {
    path: '/',
    maxAge: 0,
  });
  
  response.cookies.set('dev_verified', '', {
    path: '/',
    maxAge: 0,
  });

  return response;
}
