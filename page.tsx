import { getDb, getCurrentUser } from '@/lib/db';
import AssessmentClient from './AssessmentClient';

export default async function AssessmentPage() {
  const db = await getDb();
  const currentUser = await getCurrentUser();
  const initialQuiz = db.quizzes[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <AssessmentClient initialQuiz={initialQuiz} currentUser={currentUser} />
    </div>
  );
}
