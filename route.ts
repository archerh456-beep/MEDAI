import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { userId, pointsEarned } = await req.json();
    const db = await getDb();

    const user = db.users.find((u) => u.id === userId) || db.users[0];
    if (user) {
      user.points += Number(pointsEarned) || 0;
      user.streak = (user.streak || 0) + 1;

      // Re-sort leaderboard ranks based on points
      db.users.sort((a, b) => b.points - a.points);
      db.users.forEach((u, idx) => {
        u.rank = idx + 1;
      });

      await saveDb(db);
      return NextResponse.json({ success: true, newPoints: user.points, newRank: user.rank });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Error recording arena score:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
