import { cookies } from 'next/headers';
import { getDb } from '@/lib/db';
import DeveloperStudio from './DeveloperStudio';

export default async function DeveloperPage() {
  const db = await getDb();
  const cookieStore = await cookies();
  const isDevVerified = cookieStore.get('dev_verified')?.value === 'true';
  const userId = cookieStore.get('userId')?.value;
  const user = userId ? db.users.find((u) => u.id === userId) : null;
  const isDevAccount = user?.role === 'DEVELOPER' || user?.email?.toLowerCase() === 'archerh456@gmail.com';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <DeveloperStudio
        initialDb={db}
        initiallyUnlocked={isDevVerified || isDevAccount}
      />
    </div>
  );
}
