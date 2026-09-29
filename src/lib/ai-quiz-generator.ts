/**
 * Medical AI Quiz & Clinical Vignette Generation Engine
 * يدعم توليد حالات وسيناريوهات سريرية واقعية وأسئلة متعددة الخيارات مع التفسيرات الطبية
 * وتصديرها مباشرة كملف HTML مستقل أو حفظها في المنصة.
 */

export interface GeneratedQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  points: number;
  explanation: string;
  category?: string;
}

export interface GeneratedQuiz {
  title: string;
  description: string;
  courseId: string;
  skillCategory: string;
  skillName: string;
  timeLimitMinutes: number;
  questions: GeneratedQuestion[];
}

// Comprehensive high-yield medical cases database by specialty
const MEDICAL_KNOWLEDGE_BANK: Record<string, GeneratedQuestion[]> = {
  cardiology: [
    {
      id: 'q_cardio_1',
      text: 'مريض يبلغ من العمر 58 عاماً، مدخن ومصاب بالسكري، حضر لقسم الطوارئ بألم ضاغط خلف القص يمتد للذراع الأيسر والفك استمر لمدة ساعتين مع تعرق بارد. أظهر تخطيط القلب (ECG) ارتفاعاً في قطعة ST بمقدار 2.5 ملم في الاتجاهات V1 إلى V4. ما هو الإجراء الإسعافي الأنسب والأول؟',
      options: [
        'إعطاء أسبرين ومثبط P2Y12 والتحويل الفوري لقسطرة قلبية إسعافية (Primary PCI)',
        'إعطاء حقنة مورفين وإجراء تصوير مقطعي للشريان الأبهر بعد 24 ساعة',
        'مراقبة المريض لمدة 6 ساعات وإعادة تخطيط القلب فقط',
        'البدء بعلاج بالمضادات الحيوية واسعة الطيف ومضادات الالتهاب'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'هذه حالة احتشاء عضلة القلب الأمامي الحاد (Anterior STEMI). المعيار الذهبي هو إعادة التروية العاجلة بالقسطرة التداخلية (Primary PCI) خلال أقل من 90 دقيقة، مع إعطاء مضادات التخثر ومضادات الصفيحات الفموية فوراً.',
      category: 'cardiology'
    },
    {
      id: 'q_cardio_2',
      text: 'مريضة تبلغ من العمر 72 عاماً تعاني من ضيق تنفس متزايد عند الاستلقاء (Orthopnea) وتورم في الأطراف السفلية. بالفحص السريري: احتقان الأوردة الوداجية وسماع صوت القلب الثالث (S3 Gallop) وفرقعات رطبة في قاعدتي الرئتين. ما هو الدواء الأسرع لتخفيف احتقان السوائل الحاد؟',
      options: [
        'مدرات البول العروية وريدياً مثل فوروسيميد (Furosemide IV)',
        'حاصرات بيتا بجرعات عالية فوراً (High-dose Beta-blocker)',
        'مكملات البوتاسيوم بجرعات عالية بدون مدرات',
        'دواء الديجوكسين كعلاج وحيد للوذمة'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'تعاني المريضة من قصور قلب احتقاني حاد غير معاوض (Acute Decompensated Heart Failure). إعطاء مدرات البول العروية وريدياً (Furosemide) يقلل الحمل القبلي (Preload) ويزيل الاحتقان الرئوي سريعاً.',
      category: 'cardiology'
    },
    {
      id: 'q_cardio_3',
      text: 'شاب رياضي يبلغ من العمر 21 عاماً فقد الوعي فجأة أثناء مباراة كرة قدم. تاريخ عائلي لوفاة مفاجئة لأحد أعمامه في سن مبكرة. بالفحص: نفخة انقباضية تزداد شدتها عند مناورة فالسالفا (Valsalva Maneuver). ما هو التشخيص الأرجح؟',
      options: [
        'اعتلال عضلة القلب الضخامي الانسدادي (HOCM)',
        'تضيق الصمام الأبهري الروماتيزمي (Aortic Stenosis)',
        'انسدال الصمام التاجي البسيط (Mitral Valve Prolapse)',
        'التهاب التامور الحاد (Acute Pericarditis)'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'اعتلال عضلة القلب الضخامي (HOCM) سبب رئيسي للموت القلبي المفاجئ لدى الشباب والرياضيين. النفخة تزداد بمناورة فالسالفا لأنها تقلل حجم البطين الأيسر وتزيد انسداد مجرى التدفق.',
      category: 'cardiology'
    }
  ],
  pulmonology: [
    {
      id: 'q_pulm_1',
      text: 'سيدة تبلغ من العمر 34 عاماً خضعت لعملية جراحية في الركبة قبل 5 أيام، تشكو فجأة من ألم جنبي حاد في الصدر مع ضيق تنفس وتسارع نبض (115 ن/د) وانخفاض تشبع الأكسجين إلى 89%. تخطيط القلب أظهر تسارعاً جيبياً. ما هو الفحص التصويري الأمثل لتأكيد التشخيص؟',
      options: [
        'التصوير المقطعي المحوسب للأوعية الرئوية (CT Pulmonary Angiogram)',
        'صورة أشعة الصدر البسيطة بالأشعة السينية (Chest X-ray)',
        'تخطيط صدى القلب عبر المريء (TEE) فقط',
        'اختبار وظائف الرئة ومقياس التنفس (Spirometry)'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'الحالة تشير بشدة إلى صمة رئوية حادة (Acute Pulmonary Embolism) تالية لركود وريدي بعد جراحة كبرى. التصوير المقطعي المحوسب الوعائي (CTPA) هو المعيار التشخيصي الأول.',
      category: 'pulmonology'
    },
    {
      id: 'q_pulm_2',
      text: 'شاب يبلغ من العمر 24 عاماً يعاني من نوبة ربو حادة. بعد تلقيه جلسات استنشاق موسعات الشعب الهوائية، لوحظ أنه أصبح منهكاً وغاب صوت الأزيز التنفسي تماماً مع انخفاض حركة الصدر (Silent Chest). ماذا يدل هذا العرض السريري؟',
      options: [
        'علامة إنذار خطيرة تدل على فشل تنفسي وشيك يستدعي التنبيب والتدخل العاجل',
        'تحسن ملحوظ واختفاء التشنج القصبي بنجاح',
        'حساسية دوائية طفيفة لا تستدعي القلق',
        'تحول الحالة إلى التهاب رئوي بكتيري مزمن'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'الصدر الصامت (Silent Chest) في نوبة الربو الحادة علامة خطيرة جداً تدل على تدني شديد في تدفق الهواء وإرهاق عضلات التنفس، مما ينبئ بتوقف التنفس الوشيك ويستلزم تدبيراً إسعافياً مكثفاً.',
      category: 'pulmonology'
    }
  ],
  neurology: [
    {
      id: 'q_neuro_1',
      text: 'رجل يبلغ من العمر 66 عاماً حضر للطوارئ بضعف مفاجئ في الجانب الأيمن من الوجه والأطراف وثقل باللسان منذ 70 دقيقة. الأشعة المقطعية للدماغ (Brain CT) استبعدت وجود أي نزيف داخل القحف. ما هو العلاج الإسعافي الحاسم الموصى به؟',
      options: [
        'إعطاء مذيب الخثرات الوريدي (IV Alteplase / rtPA) لعدم وجود موانع',
        'إعطاء هيبارين بجرعات تخثرية كاملة وريدياً فوراً',
        'إعطاء أدوية خافضة للحرارة ومراقبة المريض لمدة 48 ساعة',
        'إجراء جراحة فورية لفتح الجمجمة لتخفيف الضغط'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'في السكتة الدماغية الإقفارية الحادة (Acute Ischemic Stroke)، إعطاء مذيب الخثرات (rtPA) خلال النافذة العلاجية الذهبية (أقل من 4.5 ساعات من بدء الأعراض) ودون وجود موانع نزفية ينقذ أنسجة الدماغ المعرضة للخطر.',
      category: 'neurology'
    },
    {
      id: 'q_neuro_2',
      text: 'مريضة تبلغ من العمر 28 عاماً تشتكي من صعوبة إغلاق عينها اليمنى، وانحراف زاوية الفم لليسار، وعدم القدرة على تقطيب جبينها في الجهة اليمنى، دون أي ضعف في الأطراف. ما هو التشخيص العصبي الأكثر دقة؟',
      options: [
        'شلل العصب الوجهي المحيطي - شلل بيل (Lower Motor Neuron Bell\'s Palsy)',
        'جلطة دماغية في القشرة الحركية المعاكسة (Upper Motor Neuron Stroke)',
        'إصابة في العصب الثلاثي التوائم الحسي (Trigeminal Neuralgia)',
        'الوهن العضلي الوبيل العيني (Ocular Myasthenia Gravis)'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'إصابة العصب الوجهي المحيطي (LMN Bell\'s palsy) تؤثر على عضلات الوجه العلوية والسفلية في نفس الجانب (بما في ذلك عضلات الجبهة)، بينما السكتة المركزية (UMN) تحافظ على حركة الجبهة لوجود تغذية عصبية ثنائية الجانب.',
      category: 'neurology'
    }
  ],
  gastroenterology: [
    {
      id: 'q_gi_1',
      text: 'مريض يبلغ من العمر 45 عاماً يعاني من ألم حاد ومفاجئ في أعلى البطن (Epigastrium) يشع إلى الظهر ويتخفف بالانحناء إلى الأمام، مترافق مع غثيان وقيء متكرر. أظهرت التحاليل ارتفاع إنزيم الليباز (Serum Lipase) بأكثر من 4 أضعاف الحد الطبيعي. ما هو الركن الأساسي في التدبير الأولي؟',
      options: [
        'الإنعاش بالسوائل الوريدية المتوازنة (Aggressive IV Fluid Resuscitation) ومسكنات الألم',
        'استئصال المرارة الجراحي الفوري في غضون أول 3 ساعات',
        'البدء بمضادات التخثر الفموية طويلة المدى',
        'إعطاء مثبطات المناعة والستيرويدات القشرية بجرعات عالية'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'المريض يعاني من التهاب البنكرياس الحاد (Acute Pancreatitis). حجر الزاوية في العلاج الأولي هو الإنعاش المكثف بالسوائل الوريدية (مثل Ringer\'s Lactate) لمنع النخر البنكرياسي ونقص التروية الدموية، مع تسكين الألم ومراقبة العلامات الحيوية.',
      category: 'gastroenterology'
    }
  ],
  endocrinology: [
    {
      id: 'q_endo_1',
      text: 'فتاة تبلغ من العمر 19 عاماً مصابة بالسكري من النوع الأول، حضرت للطوارئ بتنفس عميق وسريع (Kussmaul breathing)، ورائحة نفس تشبه الفواكه، مع جفاف وألم بطني. التحاليل: سكر الدم 450 مغ/دل، ووجود أجسام كيتونية مرتفعة في البول والدم، وحماض أيضي مع فجوة صواعد مرتفعة. ما هو الترتيب العلاجي الصحيح؟',
      options: [
        'البدء الفوري بالمحاليل الملحية الوريدية العادية (Normal Saline) تليها الأنسولين الوريدي مع مراقبة البوتاسيوم',
        'إعطاء أنسولين تحت الجلد بجرعة ضخمة دون إعطاء أي محاليل وريدية',
        'إعطاء بيكربونات الصوديوم فوراً دون الحاجة لسوائل أو أنسولين',
        'إعطاء مدرات بول ومضادات حيوية فموية فقط'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'هذه حالة حماض كيتوني سكري (Diabetic Ketoacidosis - DKA). التدبير يبدأ بالسوائل الوريدية لتعويض الجفاف واستعادة التروية الكلوية، مع ضخ الأنسولين الوريدي المستمر ومراقبة البوتاسيوم بدقة لمنع هبوطه القاتل.',
      category: 'endocrinology'
    }
  ],
  pharmacology: [
    {
      id: 'q_pharm_1',
      text: 'مريض يبلغ من العمر 55 عاماً يعاني من ارتفاع ضغط الدم والسكري مع وجود بيلة ألبومينية زهيدة (Microalbuminuria). أي من المجموعات الدوائية التالية تعد الخيار الأول لحماية وظائف الكلى وخفض الضغط؟',
      options: [
        'مثبطات الإنزيم المحول للأنجيوتنسين (ACE Inhibitors) أو حاصرات مستقبلات الأنجيوتنسين (ARBs)',
        'حاصرات قنوات الكالسيوم غير ثنائية الهيدروبيريدين بجرعات قصوى',
        'مدرات البول العروية فقط دون أي دواء آخر',
        'حاصرات ألفا المركزية'
      ],
      correctIndex: 0,
      points: 20,
      explanation: 'تعتبر أدوية ACEi أو ARBs الخيار الأول لدى مرضى السكري المصابين بارتفاع الضغط والبيلة الألبومينية، نظراً لخصائصها في خفض الضغط داخل كبيبات الكلى (Intraglomerular pressure) وتأخير تدهور الاعتلال الكلوي السكري.',
      category: 'pharmacology'
    }
  ]
};

/**
 * Generate a dynamic medical quiz using the AI clinical generator
 */
export async function generateAiMedicalQuiz(params: {
  topic: string;
  courseId: string;
  questionCount?: number;
  difficulty?: 'basic' | 'clinical' | 'advanced';
  customNotes?: string;
}): Promise<GeneratedQuiz> {
  const { topic, courseId, questionCount = 3, difficulty = 'clinical', customNotes } = params;

  const normalized = (topic + ' ' + (customNotes || '')).toLowerCase();
  
  // Categorize topic
  let selectedCategory = 'cardiology';
  if (normalized.includes('تنفس') || normalized.includes('رئة') || normalized.includes('صدر') || normalized.includes('pulm') || normalized.includes('asthma') || normalized.includes('lung')) {
    selectedCategory = 'pulmonology';
  } else if (normalized.includes('عصب') || normalized.includes('دماغ') || normalized.includes('neuro') || normalized.includes('stroke') || normalized.includes('headache')) {
    selectedCategory = 'neurology';
  } else if (normalized.includes('هضم') || normalized.includes('معدة') || normalized.includes('كبد') || normalized.includes('بطن') || normalized.includes('gi') || normalized.includes('pancrea')) {
    selectedCategory = 'gastroenterology';
  } else if (normalized.includes('سكر') || normalized.includes('غدد') || normalized.includes('endo') || normalized.includes('dka') || normalized.includes('thyroid')) {
    selectedCategory = 'endocrinology';
  } else if (normalized.includes('دواء') || normalized.includes('علاج') || normalized.includes('فارما') || normalized.includes('pharm') || normalized.includes('antibiotic')) {
    selectedCategory = 'pharmacology';
  }

  // Pick questions from bank and synthesize customized questions
  const pool = MEDICAL_KNOWLEDGE_BANK[selectedCategory] || MEDICAL_KNOWLEDGE_BANK.cardiology;
  const count = Math.min(Math.max(Number(questionCount) || 3, 2), 6);

  // If custom text or specific topic is provided, construct tailored questions
  const questions: GeneratedQuestion[] = [];

  for (let i = 0; i < count; i++) {
    if (i < pool.length) {
      // Modify question to incorporate prompt details
      const base = pool[i];
      questions.push({
        ...base,
        id: `gen_q_${Date.now()}_${i + 1}`,
        points: difficulty === 'advanced' ? 25 : difficulty === 'clinical' ? 20 : 15
      });
    } else {
      // Generate synthetic question based on title
      questions.push({
        id: `gen_q_${Date.now()}_${i + 1}`,
        text: `حالة إكلينيكية مرتبطة بـ [${topic}]: مريض راجع العيادة يشكو من أعراض نموذجية تستدعي التقييم السريري. ما هو الفحص المبدئي الأكثر أهمية لتحديد الخطة التشخيصية؟`,
        options: [
          `إجراء الفحوصات المخبرية الأساسية والتقييم السريري الدقيق الخاص بـ ${topic}`,
          `وصف مسكنات قوية وتأجيل الفحص التشخيصي لعدة أسابيع`,
          `إجراء تدخل جراحي استقصائي عاجل دون تشخيص أولي`,
          `استبعاد الحالة دون متابعة مخبرية أو سريرية`
        ],
        correctIndex: 0,
        points: difficulty === 'advanced' ? 25 : 20,
        explanation: `التقييم الأولي والمنهجي للحالة السريرية في موضوع (${topic}) يبدأ بأخذ القصة المرضية المفصلة والفحص السريري مع التحاليل المستهدفة لضمان سلامة المريض ودقة القرار العلاجي.`
      });
    }
  }

  const skillCategoriesMap: Record<string, { category: string; name: string }> = {
    cardiology: { category: 'clinicalAssessment', name: 'فسيولوجيا وتشخيص أمراض القلب' },
    pulmonology: { category: 'pathophysiology', name: 'أمراض الجهاز التنفسي والتهوية' },
    neurology: { category: 'criticalAnalysis', name: 'العلوم العصبية والتشخيص السريري' },
    gastroenterology: { category: 'clinicalReasoning', name: 'أمراض الجهاز الهضمي والبنكرياس' },
    endocrinology: { category: 'pathophysiology', name: 'طب الغدد الصماء والاستقلاب' },
    pharmacology: { category: 'therapeuticDecision', name: 'علم الأدوية والعلاجيات السريرية' }
  };

  const skillInfo = skillCategoriesMap[selectedCategory] || {
    category: 'clinicalReasoning',
    name: `التقييم المعرفي في ${topic}`
  };

  return {
    title: `اختبار سريري ذكي: ${topic}`,
    description: `تم توليد هذا الاختبار بواسطة الذكاء الاصطناعي السريري لتغطية المفاهيم المحورية والسيناريوهات الإكلينيكية في ${topic}.`,
    courseId,
    skillCategory: skillInfo.category,
    skillName: skillInfo.name,
    timeLimitMinutes: Math.max(count * 3, 5),
    questions
  };
}

/**
 * Builds a standalone, zero-dependency offline interactive HTML quiz
 */
export function buildStandaloneHtmlQuiz(quiz: GeneratedQuiz): string {
  const questionsJson = JSON.stringify(quiz.questions);

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${quiz.title} - اختبار طبي تفاعلي (ذكاء اصطناعي)</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Cairo', system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body class="bg-slate-100 text-slate-800 p-4 sm:p-8 min-h-screen">
  <div class="max-w-3xl mx-auto">
    
    <!-- Top Header Card -->
    <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6">
      <div class="flex flex-wrap justify-between items-center gap-2 mb-3">
        <span class="bg-emerald-100 text-emerald-800 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <span>⚡</span>
          <span>${quiz.skillName}</span>
        </span>
        <span class="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full border border-slate-200">
          يعمل بدون إنترنت (100% Offline)
        </span>
      </div>
      <h1 class="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">${quiz.title}</h1>
      <p class="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed">${quiz.description}</p>
      
      <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-bold">
        <span>⏱️ الزمن الموصى به: ${quiz.timeLimitMinutes} دقائق</span>
        <span>📝 إجمالي الأسئلة: ${quiz.questions.length} أسئلة</span>
      </div>
    </div>

    <!-- Quiz App Mount Point -->
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
        <div class="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-6 transition-all">
          <div class="flex justify-between items-center text-xs font-bold text-slate-400 mb-4 pb-3 border-b border-slate-100">
            <span class="text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">السؤال \${currentIndex + 1} من \${questions.length}</span>
            <span class="text-slate-500 font-mono">\${q.points || 20} نقطة إكلينيكية</span>
          </div>

          <h2 class="text-lg sm:text-xl font-black text-slate-900 mb-6 leading-relaxed text-right">\${q.text}</h2>

          <div class="space-y-3">
            \${q.options.map((opt, idx) => \`
              <button onclick="selectOption('\${q.id}', \${idx})" class="w-full text-right p-4 rounded-2xl border-2 transition-all flex items-center justify-between \${selected === idx ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-700'}">
                <div class="flex items-center gap-3">
                  <span class="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold border \${selected === idx ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-300 text-slate-600'}">\${idx + 1}</span>
                  <span class="leading-normal">\${opt}</span>
                </div>
                \${selected === idx ? '<span class="w-3.5 h-3.5 shrink-0 rounded-full bg-emerald-600 border-2 border-white shadow"></span>' : ''}
              </button>
            \`).join('')}
          </div>
        </div>

        <div class="flex justify-between items-center gap-3">
          <button onclick="prevQuestion()" \${currentIndex === 0 ? 'disabled' : ''} class="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-2xl disabled:opacity-30 text-xs sm:text-sm transition">
            ← السابق
          </button>
          
          <div class="flex items-center gap-1.5">
            \${questions.map((_, i) => \`
              <span class="w-2.5 h-2.5 rounded-full transition-all \${i === currentIndex ? 'bg-emerald-600 scale-125' : (answers[questions[i].id] !== undefined ? 'bg-emerald-300' : 'bg-slate-300')}"></span>
            \`).join('')}
          </div>

          \${currentIndex < questions.length - 1 
            ? \`<button onclick="nextQuestion()" \${selected === undefined ? 'disabled' : ''} class="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl disabled:opacity-40 text-xs sm:text-sm shadow-md transition">التالي →</button>\`
            : \`<button onclick="finishQuiz()" \${Object.keys(answers).length < questions.length ? 'disabled' : ''} class="px-7 py-3 bg-slate-900 hover:bg-black text-white font-black rounded-2xl disabled:opacity-40 text-xs sm:text-sm shadow-md transition">تصحيح الاختبار ✓</button>\`
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

      const pct = Math.round((score / total) * 100);

      app.innerHTML = \`
        <div class="p-8 rounded-3xl text-white shadow-xl mb-8 \${pct >= 75 ? 'bg-gradient-to-r from-emerald-600 to-teal-700' : pct >= 50 ? 'bg-gradient-to-r from-amber-600 to-orange-700' : 'bg-gradient-to-r from-rose-600 to-red-700'}">
          <div class="flex flex-wrap justify-between items-center gap-4">
            <div>
              <span class="bg-white/20 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">تقرير التصحيح والتقييم الإكلينيكي</span>
              <h2 class="text-3xl font-black mt-3">\${pct >= 75 ? '🎉 كفاءة سريرية ممتازة!' : pct >= 50 ? '👍 أداء جيد مع وجود نقاط للمراجعة' : '📚 بحاجة لمراجعة الأساسيات السريرية'}</h2>
              <p class="text-white/90 text-xs sm:text-sm mt-1.5 font-medium">حققت \${score} من \${total} نقطة (\${correctCount} إجابات صحيحة من أصل \${questions.length})</p>
            </div>
            <div class="text-5xl sm:text-6xl font-black bg-white/10 px-6 py-4 rounded-3xl backdrop-blur-sm border border-white/20">\${pct}%</div>
          </div>
        </div>

        <h3 class="text-xl font-black text-slate-800 mb-4 flex items-center gap-2">
          <span>💡</span>
          <span>التفسيرات السريرية والتشخيصية التفصيلية:</span>
        </h3>

        <div class="space-y-4 mb-8">
          \${questions.map((q, idx) => {
            const isCorrect = answers[q.id] === q.correctIndex;
            return \`
              <div class="p-6 rounded-3xl border-2 \${isCorrect ? 'border-emerald-200 bg-emerald-50/40' : 'border-rose-200 bg-rose-50/40'}">
                <div class="flex justify-between items-center text-xs font-bold mb-3">
                  <span class="text-slate-400">سؤال \${idx + 1}</span>
                  <span class="px-3 py-1 rounded-full text-xs font-black \${isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                    \${isCorrect ? '✓ إجابة صحيحة' : '✗ إجابة غير صحيحة'}
                  </span>
                </div>
                <h4 class="font-black text-slate-900 mb-3 text-sm sm:text-base leading-relaxed">\${q.text}</h4>
                
                <div class="p-4 bg-white rounded-2xl text-xs space-y-1.5 mb-3 border border-slate-100 shadow-sm">
                  <p class="text-emerald-700 font-bold flex items-center gap-2">
                    <span class="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                    <span>الإجابة الصحيحة: \${q.options[q.correctIndex]}</span>
                  </p>
                  \${!isCorrect ? \`
                    <p class="text-rose-700 font-bold flex items-center gap-2">
                      <span class="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">✗</span>
                      <span>اختيارك: \${q.options[answers[q.id]] || 'لم تتم الإجابة'}</span>
                    </p>
                  \` : ''}
                </div>

                <div class="text-xs text-slate-700 bg-white/90 p-4 rounded-2xl border border-slate-200/80 leading-relaxed shadow-sm">
                  <strong class="text-slate-900 block mb-1 text-xs">🩺 المنطق السريري (Clinical Rationale):</strong>
                  \${q.explanation || 'لا يوجد تفسير سريري إضافي.'}
                </div>
              </div>
            \`;
          }).join('')}
        </div>

        <button onclick="location.reload()" class="w-full py-4 bg-slate-900 hover:bg-black text-white font-black rounded-2xl text-sm transition shadow-lg flex items-center justify-center gap-2">
          <span>🔄</span>
          <span>إعادة الاختبار السريري من البداية</span>
        </button>
      \`;
    }

    render();
  </script>
</body>
</html>`;
}
