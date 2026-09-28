import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, scores } = await req.json();
    const db = await getDb();

    const user = db.users.find((u) => u.id === userId) || db.users[0];
    if (user) {
      user.cognitiveScores = {
        ...user.cognitiveScores,
        ...scores,
      };
      // Award XP for completing diagnostic assessment
      user.points += 150;
      await saveDb(db);
      return NextResponse.json({ success: true, user });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error submitting assessment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
