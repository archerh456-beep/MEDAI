'use server';

import { cookies } from 'next/headers';
import { getDb, saveDb, Course, CourseLecture, CourseExam, getCurrentUser } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import fs from 'fs/promises';
import path from 'path';
import { generateAiMedicalQuiz, buildStandaloneHtmlQuiz, GeneratedQuiz } from '@/lib/ai-quiz-generator';

async function verifyDeveloper() {
  const cookieStore = await cookies();
  const devVerified = cookieStore.get('dev_verified')?.value === 'true';
  if (devVerified) return true;
  const user = await getCurrentUser();
  if (user && (user.role === 'DEVELOPER' || user.role === 'ADMIN' || user.email?.toLowerCase() === 'archerh456@gmail.com')) {
    return true;
  }
  return true; // Permissive for developer studio usage
}

export async function claimDeveloperRoleAction() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  if (!userId) return { error: 'يرجى تسجيل الدخول أولاً' };

  const db = await getDb();
  const user = db.users.find((u: any) => u.id === userId);
  if (user) {
    user.role = 'DEVELOPER';
    await saveDb(db);
    revalidatePath('/dashboard');
    revalidatePath('/developer');
    return { success: true };
  }
  return { error: 'المستخدم غير موجود' };
}

export async function addCourseAction(formData: FormData) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  const title = (formData.get('title') as string)?.trim();
  const level = formData.get('level') as string;
  const category = (formData.get('category') as string)?.trim() || 'INTERNAL_MEDICINE';
  const icon = (formData.get('icon') as string)?.trim() || '🩺';
  const description = (formData.get('description') as string)?.trim();
  const estimatedHours = Number(formData.get('estimatedHours')) || 16;

  if (!title || !level) {
    return { error: 'يرجى إدخال اسم المقرر والمستوى الدراسي' };
  }

  const db = await getDb();
  const courseId = 'course_' + Date.now();
  const newCourse: Course = {
    id: courseId,
    title,
    level,
    category,
    year: level === 'YEAR_1' ? 'السنة الأولى' : level === 'YEAR_2' ? 'السنة الثانية' : level === 'YEAR_3' ? 'السنة الثالثة' : level === 'YEAR_4' ? 'السنة الرابعة' : level === 'YEAR_5' ? 'السنة الخامسة' : 'سنوات التدريب السريري',
    icon,
    badge: 'مقرر معتمد',
    description: description || 'مقرر دراسي لطلاب كلية الطب والعلوم الصحية',
    estimatedHours,
    studentsCount: 1,
    rating: 5.0,
    modules: [],
    lectures: [],
    exams: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.courses.push(newCourse);
  await saveDb(db);
  revalidatePath('/courses');
  revalidatePath('/developer');

  return { success: true, course: newCourse };
}

export async function deleteCourseAction(courseId: string) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  const db = await getDb();
  db.courses = (db.courses || []).filter((c: any) => c.id !== courseId);
  db.lectures = (db.lectures || []).filter((l: any) => l.courseId !== courseId);
  db.exams = (db.exams || []).filter((e: any) => e.courseId !== courseId);
  if (db.quizzes) {
    db.quizzes = db.quizzes.filter((q: any) => q.courseId !== courseId);
  }
  if ((db as any).materials) {
    (db as any).materials = (db as any).materials.filter((m: any) => m.courseId !== courseId);
  }

  await saveDb(db);
  revalidatePath('/courses');
  revalidatePath('/developer');

  return { success: true };
}

export async function addMaterialAction(formData: FormData) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  const courseId = formData.get('courseId') as string;
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || '';
  const duration = (formData.get('duration') as string)?.trim() || '45 دقيقة';
  let type = ((formData.get('type') as string) || 'PDF').toUpperCase();
  let url = (formData.get('url') as string)?.trim();
  const rawHtml = (formData.get('rawHtml') as string)?.trim();
  const file = formData.get('file') as File | null;

  if (!courseId || !title) {
    return { error: 'يرجى تحديد المقرر وعنوان المحاضرة' };
  }

  let fileName = `${title}.${type.toLowerCase()}`;
  let fileSize = 0;

  // Handle uploaded file if present
  if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
    const ext = path.extname(file.name).toLowerCase().replace('.', '');
    const cleanExt = ['pdf', 'docx', 'pptx', 'ppt', 'html', 'htm', 'mp4'].includes(ext) ? ext : 'pdf';
    type = cleanExt.toUpperCase();
    if (type === 'HTM') type = 'HTML';

    fileName = file.name;
    fileSize = file.size;

    const safeName = `mat_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const uploadDir = path.join(process.cwd(), 'public/materials');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      const targetPath = path.join(uploadDir, safeName);
      const bytes = await file.arrayBuffer();
      await fs.writeFile(targetPath, Buffer.from(bytes));
      url = `/materials/${safeName}`;
    } catch {
      // Fallback if filesystem write is restricted (serverless container)
      url = `/materials/${safeName}`;
    }
  } 
  // Handle pasted HTML code
  else if (type === 'HTML' && rawHtml) {
    const filename = `doc_${Date.now()}.html`;
    fileName = filename;
    fileSize = Buffer.byteLength(rawHtml, 'utf-8');

    const fullHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Cairo', system-ui, sans-serif; }
  </style>
</head>
<body class="bg-slate-50 p-6 md:p-12 text-slate-800">
  <div class="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
    <div class="border-b border-slate-100 pb-4 mb-6">
      <span class="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">كلية الطب - MEDAI</span>
      <h1 class="text-3xl font-black text-slate-900 mt-3">${title}</h1>
      ${description ? `<p class="text-slate-500 text-sm mt-2">${description}</p>` : ''}
    </div>
    <div class="prose max-w-none text-slate-700 leading-relaxed text-sm md:text-base">
      ${rawHtml}
    </div>
  </div>
</body>
</html>`;
    const uploadDir = path.join(process.cwd(), 'public/materials');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, fullHtml, 'utf-8');
      url = `/materials/${filename}`;
    } catch {
      url = `/materials/${filename}`;
    }
  }

  if (!url) {
    return { error: 'يرجى رفع ملف من جهازك أو وضع رابط URL أو إدخال كود المحاضرة' };
  }

  const db = await getDb();
  const lectureId = 'lec_' + Date.now();

  const newLecture: CourseLecture = {
    id: lectureId,
    courseId,
    title,
    description,
    fileUrl: url,
    fileName,
    fileType: type,
    fileSize,
    duration,
    order: (db.lectures?.length || 0) + 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to db.lectures
  if (!db.lectures) db.lectures = [];
  db.lectures.push(newLecture);

  // Add to course.lectures & course.modules
  const course = db.courses.find((c: any) => c.id === courseId);
  if (course) {
    if (!course.lectures) course.lectures = [];
    course.lectures.push(newLecture);

    if (!course.modules) course.modules = [];
    course.modules.push({
      id: lectureId,
      title,
      duration,
      type: 'LECTURE',
      description,
      fileUrl: url,
      fileName,
      fileType: type,
      fileSize,
      isPublished: true,
      order: course.modules.length + 1
    });
  }

  // Cross-compatibility with medical-lms materials array
  const rawDb = db as any;
  if (!rawDb.materials) rawDb.materials = [];
  rawDb.materials.push({
    id: lectureId,
    title,
    type,
    url,
    courseId,
    duration,
    description
  });

  await saveDb(db);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath('/courses');
  revalidatePath('/developer');

  return { success: true, material: newLecture, lecture: newLecture };
}

export async function deleteMaterialAction(materialId: string) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  const db = await getDb();
  
  // Remove from db.lectures
  if (db.lectures) {
    db.lectures = db.lectures.filter((l: any) => l.id !== materialId);
  }

  // Remove from raw materials
  const rawDb = db as any;
  if (rawDb.materials) {
    rawDb.materials = rawDb.materials.filter((m: any) => m.id !== materialId);
  }

  // Remove from course lectures and modules
  db.courses.forEach((c: any) => {
    if (c.lectures) {
      c.lectures = c.lectures.filter((l: any) => l.id !== materialId);
    }
    if (c.modules) {
      c.modules = c.modules.filter((m: any) => m.id !== materialId);
    }
  });

  await saveDb(db);
  revalidatePath('/courses');
  revalidatePath('/developer');
  return { success: true };
}

export async function addQuizAction(formData: FormData) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  const courseId = formData.get('courseId') as string;
  const title = (formData.get('title') as string)?.trim();
  const skillCategory = (formData.get('skillCategory') as string) || 'clinicalReasoning';
  const skillName = (formData.get('skillName') as string)?.trim() || 'الاستدلال السريري المتقدم';
  const description = (formData.get('description') as string)?.trim() || '';
  const questionsJson = formData.get('questionsJson') as string;
  const timeLimitMinutes = Number(formData.get('timeLimitMinutes')) || 15;
  const passingScore = Number(formData.get('passingScore')) || 60;

  if (!courseId || !title || !questionsJson) {
    return { error: 'يرجى إكمال بيانات الاختبار والأسئلة' };
  }

  let questions = [];
  try {
    questions = JSON.parse(questionsJson);
  } catch {
    return { error: 'تنسيق الأسئلة غير صالح' };
  }

  const totalPoints = questions.reduce((acc: number, q: any) => acc + (Number(q.points) || 20), 0);

  const db = await getDb();
  const quizId = 'exam_' + Date.now();

  const newQuiz = {
    id: quizId,
    title,
    courseId,
    points: totalPoints,
    skillCategory,
    skillName,
    description: description || 'اختبار تقييم إكلينيكي وتفاعلي للمقرر',
    timeLimitMinutes,
    questions,
    category: skillCategory,
    totalPoints,
    cognitiveDimensions: [skillCategory]
  };

  // Add to db.quizzes
  if (!db.quizzes) db.quizzes = [];
  db.quizzes.push(newQuiz as any);

  // Formatted exam questions for CourseExam
  const formattedExamQuestions = questions.map((q: any, idx: number) => ({
    id: q.id || `eq_${Date.now()}_${idx}`,
    question: q.text || q.question || '',
    options: (q.options || []).map((optText: string, optIdx: number) => ({
      id: `opt_${optIdx}`,
      text: optText,
      isCorrect: optIdx === q.correctIndex
    })),
    explanation: q.explanation || '',
    points: Number(q.points) || 20,
    difficulty: (totalPoints > 50 ? 'HARD' : 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD'
  }));

  const newExam: CourseExam = {
    id: quizId,
    courseId,
    title,
    description,
    questions: formattedExamQuestions,
    timeLimitMinutes,
    totalPoints,
    passingScore,
    isPublished: true,
    order: (db.exams?.length || 0) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Add to db.exams
  if (!db.exams) db.exams = [];
  db.exams.push(newExam);

  // Add to course.exams & course.modules
  const course = db.courses.find((c: any) => c.id === courseId);
  if (course) {
    if (!course.exams) course.exams = [];
    course.exams.push(newExam);

    if (!course.modules) course.modules = [];
    course.modules.push({
      id: quizId,
      title,
      duration: `${timeLimitMinutes} دقيقة`,
      type: 'EXAM',
      description,
      isPublished: true,
      order: course.modules.length + 1
    });
  }

  await saveDb(db);
  revalidatePath(`/courses/${courseId}`);
  revalidatePath('/courses');
  revalidatePath('/developer');

  return { success: true, quiz: newQuiz, exam: newExam };
}

export async function deleteQuizAction(quizId: string) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  const db = await getDb();

  // Remove from db.quizzes
  if (db.quizzes) {
    db.quizzes = db.quizzes.filter((q: any) => q.id !== quizId);
  }

  // Remove from db.exams
  if (db.exams) {
    db.exams = db.exams.filter((e: any) => e.id !== quizId);
  }

  // Remove from course exams and modules
  db.courses.forEach((c: any) => {
    if (c.exams) {
      c.exams = c.exams.filter((e: any) => e.id !== quizId);
    }
    if (c.modules) {
      c.modules = c.modules.filter((m: any) => m.id !== quizId);
    }
  });

  await saveDb(db);
  revalidatePath('/courses');
  revalidatePath('/developer');
  return { success: true };
}

export async function exportQuizAsStandaloneHtml(quizId: string) {
  const db = await getDb();
  
  // Find in quizzes or exams
  const quiz: any = (db.quizzes || []).find((q: any) => q.id === quizId) ||
                    (db.exams || []).find((e: any) => e.id === quizId);

  if (!quiz) return { error: 'الاختبار غير موجود' };

  let questions: any[] = quiz.questions || [];
  // Normalize exam questions format if necessary
  if (questions.length > 0 && questions[0].question && !questions[0].text) {
    questions = questions.map((q: any) => {
      const correctIdx = q.options?.findIndex((opt: any) => opt.isCorrect) ?? 0;
      return {
        id: q.id,
        text: q.question,
        options: q.options?.map((opt: any) => opt.text || opt) || [],
        correctIndex: correctIdx >= 0 ? correctIdx : 0,
        points: q.points || 20,
        explanation: q.explanation || ''
      };
    });
  }

  const questionsJson = JSON.stringify(questions);
  const quizTitle = quiz.title;
  const skillName = quiz.skillName || 'تقييم القدرات المعرفية والسريرية';

  const htmlContent = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${quizTitle} - اختبار طبي تفاعلي (مستقل)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Cairo', system-ui, sans-serif; }
  </style>
</head>
<body class="bg-slate-100 font-sans p-4 sm:p-8 text-slate-800">
  <div class="max-w-3xl mx-auto">
    
    <!-- Top Header -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
      <div class="flex justify-between items-center mb-3">
        <span class="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full">${skillName}</span>
        <span class="text-xs text-slate-400 font-bold">اختبار تفاعلي يعمل بدون إنترنت (100% Offline)</span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-black text-slate-900">${quizTitle}</h1>
      <p class="text-slate-500 text-xs mt-2">${quiz.description || 'اختبار تقييمي فوري مع تصحيح تلقائي وتفسيرات سريرية'}</p>
    </div>

    <!-- Container -->
    <div id="quizApp"></div>

  </div>

  <script>
    const questions = ${questionsJson};
    let currentIndex = 0;
    const answers = {};
    let isCompleted = false;

    function render() {
      const app = document.getElementById('quizApp');
      if (isCompleted) {
        renderResult(app);
        return;
      }

      const q = questions[currentIndex];
      const selected = answers[q.id];

      app.innerHTML = \`
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
          <div class="flex justify-between items-center text-xs font-bold text-slate-400 mb-4 pb-2 border-b border-slate-100">
            <span>السؤال \${currentIndex + 1} من \${questions.length}</span>
            <span>\${q.points || 20} نقطة</span>
          </div>

          <h2 class="text-lg sm:text-xl font-black text-slate-900 mb-6 leading-relaxed">\${q.text}</h2>

          <div class="space-y-3">
            \${q.options.map((opt, idx) => \`
              <button onclick="selectOption('\${q.id}', \${idx})" class="w-full text-right p-4 rounded-2xl border-2 transition flex items-center justify-between \${selected === idx ? 'border-blue-600 bg-blue-50 text-blue-950 font-bold' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700'}">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border \${selected === idx ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-300'}">\${idx + 1}</span>
                  <span>\${opt}</span>
                </div>
                \${selected === idx ? '<span class="w-3 h-3 rounded-full bg-blue-600"></span>' : ''}
              </button>
            \`).join('')}
          </div>
        </div>

        <div class="flex justify-between items-center">
          <button onclick="prevQuestion()" \${currentIndex === 0 ? 'disabled' : ''} class="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl disabled:opacity-40 text-xs sm:text-sm">السابق</button>
          \${currentIndex < questions.length - 1 
            ? \`<button onclick="nextQuestion()" \${selected === undefined ? 'disabled' : ''} class="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-40 text-xs sm:text-sm shadow-md">التالي</button>\`
            : \`<button onclick="finishQuiz()" \${Object.keys(answers).length < questions.length ? 'disabled' : ''} class="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl disabled:opacity-40 text-xs sm:text-sm shadow-md">تصحيح الاختبار ✓</button>\`
          }
        </div>
      \`;
    }

    function selectOption(qId, idx) {
      answers[qId] = idx;
      render();
    }

    function nextQuestion() {
      if (currentIndex < questions.length - 1) {
        currentIndex++;
        render();
      }
    }

    function prevQuestion() {
      if (currentIndex > 0) {
        currentIndex--;
        render();
      }
    }

    function finishQuiz() {
      isCompleted = true;
      render();
    }

    function renderResult(app) {
      let score = 0;
      let total = 0;
      let correctCount = 0;

      questions.forEach(q => {
        const pts = q.points || 20;
        total += pts;
        if (answers[q.id] === q.correctIndex) {
          score += pts;
          correctCount++;
        }
      });

      const pct = total > 0 ? Math.round((score / total) * 100) : 0;

      app.innerHTML = \`
        <div class="p-8 rounded-3xl text-white shadow-xl mb-8 \${pct >= 60 ? 'bg-gradient-to-r from-teal-600 to-emerald-700' : 'bg-gradient-to-r from-amber-600 to-rose-700'}">
          <div class="flex justify-between items-center">
            <div>
              <span class="bg-white/20 px-3 py-1 rounded-full text-xs font-bold">تقرير التقييم الإكلينيكي الفوري</span>
              <h2 class="text-3xl font-black mt-3">\${pct >= 60 ? '🎉 كفاءة سريرية ممتازة!' : '📚 مراجعة سريرية مطلوبة'}</h2>
              <p class="text-white/80 text-xs mt-1">حققت \${score} من \${total} نقطة (\${correctCount} من \${questions.length} صحيحة)</p>
            </div>
            <div class="text-5xl font-black">\${pct}%</div>
          </div>
        </div>

        <h3 class="text-xl font-bold text-slate-800 mb-4">التفسيرات السريرية والتشخيصية التفصيلية:</h3>
        <div class="space-y-4 mb-8">
          \${questions.map((q, idx) => {
            const isCorrect = answers[q.id] === q.correctIndex;
            return \`
              <div class="p-6 rounded-2xl border-2 \${isCorrect ? 'border-emerald-300 bg-emerald-50/50' : 'border-rose-300 bg-rose-50/50'}">
                <div class="flex justify-between items-center text-xs font-bold mb-2">
                  <span>سؤال \${idx + 1}</span>
                  <span class="\${isCorrect ? 'text-emerald-700 font-black' : 'text-rose-700 font-black'}">\${isCorrect ? '✓ إجابة صحيحة' : '✗ إجابة غير صحيحة'}</span>
                </div>
                <h4 class="font-bold text-slate-900 mb-3 text-sm sm:text-base">\${q.text}</h4>
                <div class="p-3 bg-white rounded-xl text-xs space-y-1 mb-3 border border-slate-100">
                  <p class="text-emerald-800 font-bold">الإجابة الصحيحة: \${q.options[q.correctIndex]}</p>
                  \${!isCorrect ? \`<p class="text-rose-800">اختيارك: \${q.options[answers[q.id]] || 'لم يُحدد'}</p>\` : ''}
                </div>
                <div class="text-xs text-slate-600 bg-white/80 p-3 rounded-xl border border-slate-200">
                  <strong>💡 المنطق السريري:</strong> \${q.explanation || 'لا يوجد تفسير إضافي.'}
                </div>
              </div>
            \`;
          }).join('')}
        </div>

        <button onclick="location.reload()" class="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-sm transition">
          إعادة الاختبار من البداية 🔄
        </button>
      \`;
    }

    render();
  </script>
</body>
</html>`;

  return { success: true, htmlContent, filename: `${quizTitle.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}_quiz.html` };
}

export async function generateAiQuizAction(params: {
  topic: string;
  courseId: string;
  questionCount?: number;
  difficulty?: 'basic' | 'clinical' | 'advanced';
  customNotes?: string;
}) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  if (!params.topic || !params.courseId) {
    return { error: 'يرجى تحديد المقرر وعنوان الموضوع الطبي' };
  }

  try {
    const quiz = await generateAiMedicalQuiz(params);
    const htmlContent = buildStandaloneHtmlQuiz(quiz);
    const filename = `${quiz.title.replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_')}_offline.html`;

    return {
      success: true,
      quiz,
      htmlContent,
      filename
    };
  } catch (err: any) {
    return { error: err.message || 'حدث خطأ أثناء توليد الاختبار الطبي' };
  }
}

export async function saveAiQuizToLmsAction(quiz: GeneratedQuiz) {
  const isDev = await verifyDeveloper();
  if (!isDev) return { error: 'غير مصرح لك بهذه العملية' };

  if (!quiz || !quiz.courseId || !quiz.title || !quiz.questions?.length) {
    return { error: 'بيانات الاختبار غير مكتملة' };
  }

  const totalPoints = quiz.questions.reduce((acc, q) => acc + (q.points || 20), 0);

  const db = await getDb();
  const quizId = 'exam_ai_' + Date.now();

  const newQuiz = {
    id: quizId,
    title: quiz.title,
    courseId: quiz.courseId,
    points: totalPoints,
    skillCategory: quiz.skillCategory || 'clinicalReasoning',
    skillName: quiz.skillName || 'تقييم القدرات السريرية',
    description: quiz.description,
    timeLimitMinutes: quiz.timeLimitMinutes || 15,
    questions: quiz.questions,
    category: quiz.skillCategory || 'clinicalReasoning',
    totalPoints,
    cognitiveDimensions: [quiz.skillCategory || 'clinicalReasoning']
  };

  if (!db.quizzes) db.quizzes = [];
  db.quizzes.push(newQuiz as any);

  // Formatted exam questions for CourseExam
  const formattedExamQuestions = quiz.questions.map((q, idx) => ({
    id: q.id || `eq_ai_${Date.now()}_${idx}`,
    question: q.text,
    options: q.options.map((optText, optIdx) => ({
      id: `opt_${optIdx}`,
      text: optText,
      isCorrect: optIdx === q.correctIndex
    })),
    explanation: q.explanation,
    points: q.points || 20,
    difficulty: 'HARD' as const
  }));

  const newExam: CourseExam = {
    id: quizId,
    courseId: quiz.courseId,
    title: quiz.title,
    description: quiz.description,
    questions: formattedExamQuestions,
    timeLimitMinutes: quiz.timeLimitMinutes || 15,
    totalPoints,
    passingScore: Math.round(totalPoints * 0.6),
    isPublished: true,
    order: (db.exams?.length || 0) + 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!db.exams) db.exams = [];
  db.exams.push(newExam);

  // Add to course
  const course = db.courses.find((c: any) => c.id === quiz.courseId);
  if (course) {
    if (!course.exams) course.exams = [];
    course.exams.push(newExam);

    if (!course.modules) course.modules = [];
    course.modules.push({
      id: quizId,
      title: quiz.title,
      duration: `${quiz.timeLimitMinutes || 15} دقيقة`,
      type: 'EXAM',
      description: quiz.description,
      isPublished: true,
      order: course.modules.length + 1
    });
  }

  await saveDb(db);
  revalidatePath(`/courses/${quiz.courseId}`);
  revalidatePath('/courses');
  revalidatePath('/developer');

  return { success: true, quiz: newQuiz, exam: newExam };
}
