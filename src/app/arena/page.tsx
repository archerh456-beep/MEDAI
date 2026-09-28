import { getDb, getCurrentUser } from '@/lib/db';
import ArenaClient from './ArenaClient';

export default async function ArenaPage() {
  const db = await getDb();
  const currentUser = await getCurrentUser();
  const battle = db.arenaBattles[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <ArenaClient battle={battle} allUsers={db.users} currentUser={currentUser} />
    </div>
  );
}
