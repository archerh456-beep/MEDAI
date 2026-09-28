import { getDb, getCurrentUser } from '@/lib/db';
import FlashcardClient from './FlashcardClient';

export default async function FlashcardsPage() {
  const db = await getDb();
  const currentUser = await getCurrentUser();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <FlashcardClient flashcards={db.flashcards} currentUser={currentUser} />
    </div>
  );
}
