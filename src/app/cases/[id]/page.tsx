import { notFound } from 'next/navigation';
import { getDb, getCurrentUser } from '@/lib/db';
import CaseRunnerClient from './CaseRunnerClient';

export default async function SingleCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const currentUser = await getCurrentUser();

  const clinicalCase = db.clinicalCases.find((c) => c.id === id);

  if (!clinicalCase) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CaseRunnerClient clinicalCase={clinicalCase} currentUser={currentUser} />
    </div>
  );
}
