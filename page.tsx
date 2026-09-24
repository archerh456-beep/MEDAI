import { notFound } from 'next/navigation';
import { getDb } from '@/lib/db';
import CourseViewerClient from './CourseViewerClient';

export default async function SingleCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await getDb();
  const course = db.courses.find((c) => c.id === id);

  if (!course) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CourseViewerClient course={course} />
    </div>
  );
}
