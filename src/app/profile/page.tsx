import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb, getCurrentUser } from '@/lib/db';
import ProfileClient from './ProfileClient';

export default async function ProfilePage() {
  const db = await getDb();
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;

  // If user is not logged in, redirect them to login page
  if (!userId) {
    redirect('/login');
  }

  const currentUser = await getCurrentUser(userId);

  if (!currentUser) {
    redirect('/login');
  }

  return (
    <ProfileClient
      initialUser={currentUser}
      courses={db.courses}
      badges={db.badges}
    />
  );
}
