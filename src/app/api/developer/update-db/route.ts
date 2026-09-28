import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    const db = await getDb();

    switch (action) {
      case 'UPDATE_FULL_DB': {
        await saveDb(payload);
        return NextResponse.json({ success: true, message: 'تم تحديث قاعدة البيانات بالكامل بنجاح' });
      }

      case 'ADD_COURSE': {
        db.courses.push({
          ...payload,
          id: `course_${Date.now()}`,
          studentsCount: 0,
          rating: 5.0,
          modules: payload.modules || []
        });
        await saveDb(db);
        return NextResponse.json({ success: true, message: 'تمت إضافة المقرر الجديد بنجاح' });
      }

      case 'DELETE_COURSE': {
        db.courses = db.courses.filter(c => c.id !== payload.courseId);
        await saveDb(db);
        return NextResponse.json({ success: true, message: 'تم حذف المقرر بنجاح' });
      }

      case 'ADD_CLINICAL_CASE': {
        db.clinicalCases.push({
          ...payload,
          id: `case_${Date.now()}`
        });
        await saveDb(db);
        return NextResponse.json({ success: true, message: 'تمت إضافة الحالة السريرية بنجاح' });
      }

      case 'DELETE_CLINICAL_CASE': {
        db.clinicalCases = db.clinicalCases.filter(c => c.id !== payload.caseId);
        await saveDb(db);
        return NextResponse.json({ success: true, message: 'تم حذف الحالة السريرية بنجاح' });
      }

      case 'ADD_QUIZ_QUESTION': {
        const quiz = db.quizzes.find(q => q.id === payload.quizId) || db.quizzes[0];
        if (quiz) {
          quiz.questions.push({
            id: `cog_q_${Date.now()}`,
            domain: payload.domain,
            domainName: payload.domainName,
            question: payload.question,
            options: payload.options,
            explanation: payload.explanation
          });
          await saveDb(db);
          return NextResponse.json({ success: true, message: 'تمت إضافة السؤال للتقييم المعرفي بنجاح' });
        }
        return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
      }

      case 'ADD_ARENA_BATTLE': {
        db.arenaBattles.push({
          ...payload,
          id: `battle_${Date.now()}`,
          status: 'ACTIVE',
          participantsCount: 0
        });
        await saveDb(db);
        return NextResponse.json({ success: true, message: 'تم إطلاق مسابقة الحلبة الجديدة بنجاح' });
      }

      case 'UPDATE_COURSE': {
        const idx = db.courses.findIndex(c => c.id === payload.id);
        if (idx !== -1) {
          db.courses[idx] = { ...db.courses[idx], ...payload };
          await saveDb(db);
          return NextResponse.json({ success: true, message: 'تم تحديث بيانات المقرر بنجاح' });
        }
        return NextResponse.json({ error: 'المقرر غير موجود' }, { status: 404 });
      }

      case 'AWARD_BONUS': {
        const student = db.users.find(u => u.id === payload.userId);
        if (student) {
          student.points = (student.points || 0) + (Number(payload.bonusPoints) || 100);
          if (payload.badge && !student.badges.includes(payload.badge)) {
            student.badges.push(payload.badge);
          }
          await saveDb(db);
          return NextResponse.json({ success: true, message: `تم منح ${student.name} مكافأة ${payload.bonusPoints} نقطة XP` });
        }
        return NextResponse.json({ error: 'الطالب غير موجود' }, { status: 404 });
      }

      case 'RESET_DB': {
        return NextResponse.json({ success: true, message: 'تمت استعادة الإعدادات الافتراضية' });
      }

      default:
        return NextResponse.json({ error: 'Action not recognized' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Error in developer API:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
