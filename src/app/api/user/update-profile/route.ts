import { NextRequest, NextResponse } from 'next/server';
import { updateUserProfile } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, name, academicYear } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مفقود' }, { status: 400 });
    }

    if (!name?.trim() || !academicYear?.trim()) {
      return NextResponse.json({ error: 'الاسم والسنة الدراسية مطلوبان' }, { status: 400 });
    }

    const result = await updateUserProfile(userId, { name, academicYear });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      user: result.user,
    });
  } catch (error: any) {
    console.error('Update profile API error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
