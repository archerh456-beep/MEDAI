'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Course } from '@/lib/db';

export default function CourseViewerClient({ course }: { course: Course }) {
  const [selectedModuleIdx, setSelectedModuleIdx] = useState(0);

  // Specialized course interactive state
  const isCardio = course.id.includes('cardio');
  const isEmergency = course.id.includes('emergency');
  const isNeuro = course.id.includes('neuro');
  const isBiochem = course.id.includes('biochem');
  const isPharma = course.id.includes('pharma');

  // Cardiology state
  const [selectedHeartPart, setSelectedHeartPart] = useState<'lv' | 'la' | 'rv' | 'ra' | 'aorta' | 'lad'>('lv');

  // Emergency state
  const [activeAbcde, setActiveAbcde] = useState<'A' | 'B' | 'C' | 'D' | 'E'>('A');
  const [selectedShockType, setSelectedShockType] = useState<'hypovolemic' | 'cardiogenic' | 'septic' | 'obstructive'>('hypovolemic');

  // Neurology state
  const [selectedCn, setSelectedCn] = useState<number>(3);
  const [gcsEye, setGcsEye] = useState<number>(4);
  const [gcsVerbal, setGcsVerbal] = useState<number>(5);
  const [gcsMotor, setGcsMotor] = useState<number>(6);

  // Biochemistry state
  const [serumNa, setSerumNa] = useState<number>(140);
  const [serumCl, setSerumCl] = useState<number>(102);
  const [serumHco3, setSerumHco3] = useState<number>(24);

  // Pharmacology state
  const [selectedToxin, setSelectedToxin] = useState<'opioids' | 'benzos' | 'paracetamol' | 'beta_blockers' | 'digoxin' | 'warfarin' | 'heparin'>('opioids');

  // Quick module knowledge check state
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  const currentModule = course.modules[selectedModuleIdx] || course.modules[0];

  // 1. Cardiology Explorer Data
  const heartPartsInfo: Record<
    string,
    { name: string; en: string; pressure: string; o2: string; clinicalPearls: string }
  > = {
    lv: {
      name: 'البطين الأيسر (Left Ventricle)',
      en: 'Thick muscular chamber pumping oxygenated blood into the systemic arterial tree.',
      pressure: '120 / 10 mmHg',
      o2: '98% - 100% (دم مؤكسج)',
      clinicalPearls: 'الجدار الأكثر سماكة (10-12 mm). انسداد LAD يسبب احتشاء الجدار الأمامي للبطين الأيسر وفشل ضخ حاد.',
    },
    la: {
      name: 'الأذين الأيسر (Left Atrium)',
      en: 'Receives oxygen-rich blood from 4 pulmonary veins.',
      pressure: '8 - 10 mmHg',
      o2: '98% - 100% (دم مؤكسج)',
      clinicalPearls: 'تضخم الأذين الأيسر في تضيق الصمام الميترالي هو السبب الأول لتطور الرجفان الأذيني (AFib) وتشكل الخثرات الدماغية.',
    },
    rv: {
      name: 'البطين الأيمن (Right Ventricle)',
      en: 'Pumps venous blood through pulmonary trunk to the lungs for gas exchange.',
      pressure: '25 / 4 mmHg',
      o2: '70% - 75% (دم وريدي)',
      clinicalPearls: 'حساس جداً للتجلط الرئوي الحاد (Massive PE) مسبباً فشل البطين الأيمن الحاد وعلامة McConnell بالتخطيط الصدوي.',
    },
    ra: {
      name: 'الأذين الأيمن (Right Atrium)',
      en: 'Receives deoxygenated venous return from Superior and Inferior Vena Cava.',
      pressure: '2 - 6 mmHg (CVP)',
      o2: '70% - 75% (دم وريدي)',
      clinicalPearls: 'يحتوي على العقدة الجيبية الأذينية (SA Node). ضغط الأذين الأيمن ينعكس مباشرة في ضغط الوريد الوداجي (JVP).',
    },
    aorta: {
      name: 'الشريان الأبهر وصمامه (Aorta & Aortic Valve)',
      en: 'Main systemic arterial trunk and tri-leaflet semilunar valve.',
      pressure: '120 / 80 mmHg',
      o2: '100% (دم شرياني نقي)',
      clinicalPearls: 'تضيق الصمام الأبهري (Aortic Stenosis) يسبب ثالوث الأعراض الكلاسيكي: ذبحة صدرية، إغماء بالجهد، وضيق تنفس (SAD Triad).',
    },
    lad: {
      name: 'الشريان التاجي الأمامي النازل (LAD - Widow Maker)',
      en: 'Left Anterior Descending branch of Left Coronary Artery.',
      pressure: 'Coronary Perfusion',
      o2: 'High demand',
      clinicalPearls: 'يغذي الحاجز بين البطينين والجدار الأمامي. انسداده يظهر كـ ST Elevation في المساري V1-V4.',
    },
  };

  // 2. Emergency ABCDE Data
  const abcdeData = {
    A: {
      title: 'A - Airway & C-Spine (مجرى الهواء واستقرار الفقرات العنقية)',
      assess: 'هل مجرى الهواء سالك ومفتوح؟ هل يستطيع المريض التحدث دون صرير (Stridor) أو غرغرة؟',
      intervene: 'مناورة دفع الفك (Jaw Thrust)، شفط الإفرازات، وضع الأنبوب البلعومي (OPA/NPA)، أو التنبيب الرغامي السريع (RSI) إذا كان GCS ≤ 8.',
      pearl: 'احمِ دائماً العمود الفقري العنقي عند مصابي الحوادث وتجنب إمالة الرأس (Head Tilt).',
    },
    B: {
      title: 'B - Breathing & Ventilation (التنفس والتهوية والأكسجة)',
      assess: 'معدل التنفس، حركة القفص الصدري، أصوات التنفس بالسماعة، ونسبة الأكسجين SpO2.',
      intervene: 'أكسجين عالي التدفق بقناع ذي خزان (Non-rebreather 15 L/min). إذا كان هناك استرواح صدري موتر (Tension Pneumothorax): بزل إبري فوري بالضلع الثاني.',
      pearl: 'عدم تناظر حركة الصدر مع غياب أصوات التنفس وهبوط الضغط = استرواح موتر يتطلب إبرة فورية دون انتظار صورة الأشعة!',
    },
    C: {
      title: 'C - Circulation & Bleeding (الدورة الدموية والنزف)',
      assess: 'النبض المركزي والمحيطي، زمن عودة امتلاء الشعيرات (CRT < 2s)، ضغط الدم، ولون وبرودة الأطراف.',
      intervene: 'تركيب قسطرتين وريديتين عريضتين (16G أو 14G)، إيقاف النزف الضاغط، وبدء محاليل بلورية دافئة أو بروتوكول نقل الدم المتوازن (1:1:1).',
      pearl: 'في النزف الحاد، لا تعتمد على الهيموغلوبين الأولي لأنه قد يبدو طبيعياً قبل التعويض بالسوائل (Hemodilution).',
    },
    D: {
      title: 'D - Disability & Neurological (التقييم العصبي وسكر الدم)',
      assess: 'مستوى الوعي بمقياس GCS، استجابة الحدقات للضوء وحجمها، وفحص سكر الدم السريع (Bedside Glucose).',
      intervene: 'إعطاء الجلوكوز الوريدي (Dextrose 50%) فوراً عند هبوط السكر، وإعطاء النالوكسون (Naloxone) عند الشك في جرعة زائدة من الأفيونات.',
      pearl: 'كل مريض فاقد للوعي في الطوارئ يجب قياس سكر دمه فوراً؛ نقص السكر هو المحاكي الأخطر للسكتة الدماغية (Stroke Mimic).',
    },
    E: {
      title: 'E - Exposure & Environment (التعرية وضبط الحرارة)',
      assess: 'فحص كامل الجسم لكشف الكدمات، الطفح، الجروح الخفية، وقياس حرارة الجسم المركزية.',
      intervene: 'تغطية المريض وتدفئته بأغطية حرارية دافئة لمنع هبوط الحرارة (Hypothermia) الذي يعطل تخثر الدم (Triad of Death).',
      pearl: 'المثلث المميت في الصدمة الرضية: هبوط الحرارة (Hypothermia) + حماض الدم (Acidosis) + اعتلال التخثر (Coagulopathy).',
    },
  };

  // Shock profiling
  const shockData = {
    hypovolemic: {
      name: 'صدمة نقص الحجم (Hypovolemic Shock)',
      cause: 'نزف حاد، جفاف شديد، أو حروق واسعة.',
      cvp: 'منخفض جداً ↓↓',
      co: 'منخفض ↓',
      svr: 'مرتفع تعويضياً ↑↑ (أطراف باردة)',
      treatment: 'سوائل وريدية سريعة (Bolus Crystalloids) أو دم كامل (PRBCs) وفق بروتوكول النقل الكتلي.',
    },
    cardiogenic: {
      name: 'الصدمة القلبية (Cardiogenic Shock)',
      cause: 'احتشاء عضلة القلب الحاد (STEMI)، تمزق الصمام، أو فشل البطين.',
      cvp: 'مرتفع جداً ↑↑ (JVP عالي واحتقان رئوي)',
      co: 'منخفض جداً ↓↓',
      svr: 'مرتفع ↑ (تضيق وعائي تعويضي)',
      treatment: 'دعم المضخة (Dobutamine / Milrinone)، قسطرة عاجلة، وتجنب إعطاء السوائل المفرطة التي تغرق الرئة.',
    },
    septic: {
      name: 'صدمة إنتانية / توزيعية (Septic / Distributive Shock)',
      cause: 'تجرثم الدم، إفراز السيتوكينات، وتوسع وعائي هائل وتسريب شعيري.',
      cvp: 'منخفض إلى طبيعي ↓/↔',
      co: 'مرتفع في المرحلة المبكرة ↑ (Warm Shock)',
      svr: 'منخفض جداً ↓↓ (أطراف دافئة وتوسع وعائي محيطي)',
      treatment: 'سوائل 30 ml/kg كريستالويد + رافع الضغط النورإبينفرين (Norepinephrine) + مضادات حيوية واسعة الطيف خلال ساعة.',
    },
    obstructive: {
      name: 'صدمة انسدادية (Obstructive Shock)',
      cause: 'اندحاس قلبي (Cardiac Tamponade)، استرواح موتر، أو صمة رئوية ضخمة.',
      cvp: 'مرتفع جداً ↑↑',
      co: 'منخفض ↓↓',
      svr: 'مرتفع ↑',
      treatment: 'إزالة العائق فوراً: بزل التأمور (Pericardiocentesis)، بزل الصدر، أو مذيبات الخثرة (tPA) للصمة.',
    },
  };

  // 3. Cranial Nerves Data
  const cranialNerves = [
    { num: 1, name: 'العصب الشمي (CN I: Olfactory)', type: 'حسي', test: 'فحص تمييز الروائح غير المهيجة مثل البن أو الفانيليا.', pearl: 'فقد الشم المبكر قد ينجم عن كسور الصفيحة المصفوية (Cribriform plate).' },
    { num: 2, name: 'العصب البصري (CN II: Optic)', type: 'حسي', test: 'حدة البصر (Snellen)، مجالات الرؤية، وفحص قعر العين.', pearl: 'عكس الضوء الحدقي المباشر والتوافقي يعتمد على العصب الثاني في المسار الوارد (Afferent).' },
    { num: 3, name: 'العصب محرك العين (CN III: Oculomotor)', type: 'حركي ومظلي', test: 'حركات العين للأعلى والداخل والأسفل + تضيق الحدقة.', pearl: 'الحدقة المتسعة غير المتفاعلة مع تدلي الجفن (Blown pupil) علامة انضغاط بانفتاق الفص الصدغي (Uncal herniation).' },
    { num: 4, name: 'العصب البكري (CN IV: Trochlear)', type: 'حركي', test: 'حركة العين للأسفل والداخل (العضلة المائلة العلوية SO4).', pearl: 'المريض يشكو من رؤية مزدوجة عند نزول الدرج أو القراءة ويميل برأسه للجهة المقابلة تعويضياً.' },
    { num: 5, name: 'العصب ثلاثي التوائم (CN V: Trigeminal)', type: 'مختلط', test: 'حس الوجه في الفروع الثلاثة (V1, V2, V3) + عضلات المضغ ومناع القرنية.', pearl: 'ألم العصب الخامس (Trigeminal Neuralgia) ألم كهربائي حاد يثار بلمس الوجه أو غسل الأسنان.' },
    { num: 6, name: 'العصب المبعد (CN VI: Abducens)', type: 'حركي', test: 'تبعيد العين للخارج (العضلة المستقيمة الوحشية LR6).', pearl: 'أطول مسار داخل الجمجمة؛ إصابته أول مؤشر غير موضعي لارتفاع الضغط داخل الجمجمة (Raised ICP).' },
    { num: 7, name: 'العصب الوجهي (CN VII: Facial)', type: 'مختلط', test: 'تعبيرات الوجه (رفع الحواجب، إغلاق العين، الابتسام) + تذوق ثلثي اللسان الأماميين.', pearl: 'شلل بيل (Bell\'s Palsy) يصيب كامل نصف الوجه بما فيه الجبهة (LMNL)، بينما السكتة تحافظ على حركة الجبهة (UMNL).' },
    { num: 8, name: 'العصب الدهليزي القوقعي (CN VIII: Vestibulocochlear)', type: 'حسي', test: 'فحص السمع (Weber & Rinne) والتوازن واختبار Dix-Hallpike.', pearl: 'ورم العصب السمعي (Vestibular Schwannoma) يسبب طنيناً وفقد سمع حسي عصبي وتوسع بزاوية المخيخ الجسرية.' },
    { num: 9, name: 'العصب البلعومي اللساني (CN IX: Glossopharyngeal)', type: 'مختلط', test: 'منعكس التهوّع (Gag reflex الوارد) وتذوق الثلث الخلفي لللسان.', pearl: 'يشارك مع العصب العاشر في رفع الحنك الرخو وضبط مستقبلات الضغط في الجيب السباتي (Carotid sinus).' },
    { num: 10, name: 'العصب المبهم (CN X: Vagus)', type: 'مختلط ومظلي', test: 'حركة الحنك واللهاة (تنحرف اللهاة للجهة السليمة) والصوت.', pearl: 'العصب الحنجري الراجع (Recurrent Laryngeal) فرع منه؛ تضرره بجراحة الغدة الدرقية يسبب بحة الصوت.' },
    { num: 11, name: 'العصب الإضافي (CN XI: Accessory)', type: 'حركي', test: 'رفع الكتفين (Trapezius) وإدارة الرأس ضد مقاومة (SCM).', pearl: 'شلل العضلة شبه المنحرفة يسبب تدلي الكتف وصعوبة رفع الذراع فوق المستوى الأفقي.' },
    { num: 12, name: 'العصب تحت اللسان (CN XII: Hypoglossal)', type: 'حركي', test: 'مد اللسان وفحصه (ينحرف اللسان نحو جهة الإصابة LMNL).', pearl: 'ضعف اللسان يسبب عسرة بلع وعسرة نطق حركية؛ ينحرف للجهة المصابة بضمور وتحزمات ليفية.' },
  ];

  // 4. Toxicology & Antidotes Data
  const antidotesData = {
    opioids: {
      toxin: 'الأفيونات (Opioids: Morphine, Heroin, Fentanyl)',
      manifestation: 'ثالوث التسمم: حدقات دبوسية (Miosis) + تثبيط تنفسي حاد + غيبوبة وانخفاض حرارة.',
      antidote: 'النالوكسون (Naloxone IV/IM/IN)',
      mechanism: 'مناهض تنافسي نقي على مستقبلات مو (μ-opioid receptors). يُكرر كل دقيقتين حتى عودة التنفس.',
    },
    benzos: {
      toxin: 'البنزوديازيبينات (Benzodiazepines: Diazepam, Alprazolam)',
      manifestation: 'نعاس شديد، رتة كلامية، ترنح، مع بقاء العلامات الحيوية مستقرة نسبياً مقارنة بالأفيونات.',
      antidote: 'الفلومازينيل (Flumazenil IV)',
      mechanism: 'مناهض لمستقبلات GABA-A. تحذير: قد يثير نوبات صرع مستعصية عند معتادي التعاطي المزمن.',
    },
    paracetamol: {
      toxin: 'الباراسيتامول / الأسيتامينوفين (Acetaminophen Toxicity)',
      manifestation: 'أول 24 ساعة لا أعراض واضحة، يليها نخر كبدي حاد يهدد الحياة (ارتفاع ALT/AST والـ INR).',
      antidote: 'ن-أسيتيل سيستئين (N-Acetylcysteine - NAC)',
      mechanism: 'يعيد بناء مخزون الجلوتاثيون (Glutathione) لمعادلة المستقلب السام الكبدي NAPQI.',
    },
    beta_blockers: {
      toxin: 'حاصرات بيتا (Beta-Blocker Toxicity)',
      manifestation: 'بطء قلب شديد (Bradycardia)، هبوط ضغط، صدمة قلبية، وهبوط سكر الدم.',
      antidote: 'الجلوكاجون (Glucagon IV) + الإنسولين بجرعة عالية (HDIE)',
      mechanism: 'ينشط الأدينيلات سايكلاز عبر مسار مستقل عن مستقبلات بيتا لزيادة cAMP وانقباض القلب.',
    },
    digoxin: {
      toxin: 'الديجوكسين (Digoxin / Digitalis Toxicity)',
      manifestation: 'غثيان، رؤية مشوشة بلون أصفر/أخضر (Xanthopsia)، عدم انتظام ضربات القلب، وارتفاع البوتاسيوم.',
      antidote: 'الأجسام المضادة النوعية للديجوكسين (Digoxin-Specific Fab Fragments - Digibind)',
      mechanism: 'ترتبط بالديجوكسين الحر في البلازما وتفرغه عبر الكلى وتمنع ارتباطه بمضخة Na+/K+ ATPase.',
    },
    warfarin: {
      toxin: 'الوارفارين ومضادات التخثر (Warfarin Over-anticoagulation)',
      manifestation: 'نزف تلقائي، ارتفاع حاد في الـ INR > 5.0، وكدمات دموية واسعة.',
      antidote: 'فيتامين K1 (Phytomenadione) + معقد البروثرومبين المركز (4-Factor PCC)',
      mechanism: 'PCC يوفر عوامل التخثر (II, VII, IX, X) فوراً لإيقاف النزف، وفيتامين K1 يحفز تصنيعها الكبدي.',
    },
    heparin: {
      toxin: 'الهيبارين غير المجزأ (Unfractionated Heparin Overdose)',
      manifestation: 'نزف غير متوقع مع ارتفاع حاد في زمن الترومبوبلاستين الجزئي المفعل (aPTT).',
      antidote: 'كبريتات البروتامين (Protamine Sulfate IV)',
      mechanism: 'بروتين قاعدي يرتبط بالهيبارين الحمضي ليشكل معقداً ثابتاً غير فعال ومعدوم الخصائص المضادة للتخثر.',
    },
  };

  // 5. Module Knowledge Check questions per module
  const moduleKnowledgeChecks: Record<
    string,
    { q: string; options: string[]; correctIdx: number; rationale: string }
  > = {
    m1: {
      q: 'في تخطيط القلب الطبيعي، ما الذي تمثله موجة P وما هو المعيار الزمني الأقصى لفاصل PR؟',
      options: [
        'نزع استقطاب الأذينين، وفاصل PR الطبيعي 0.12 - 0.20 ثانية (3-5 مربعات صغيرة).',
        'نزع استقطاب البطينين، وفاصل PR الطبيعي 0.08 - 0.12 ثانية.',
        'إعادة استقطاب البطينين، وفاصل PR الطبيعي أكثر من 0.22 ثانية.',
        'انقباض الصمام الأبهري، وفاصل PR يتراوح بين 0.25 - 0.35 ثانية.',
      ],
      correctIdx: 0,
      rationale: 'موجة P تعبر عن انتشار موجة نزع الاستقطاب عبر الأذينين، وفاصل PR الطبيعي هو 120-200 مللي ثانية (0.12 - 0.20 ثانية). تجاوزه يعني حصاراً أذينياً بطينياً من الدرجة الأولى (First-Degree AV Block).',
    },
    m2: {
      q: 'مريض يعاني من احتشاء الجدار السفلي لعضلة القلب (Inferior STEMI). ما هي المساري التي ستظهر ارتفاع ST، وما هو الشريان المسبب غالباً؟',
      options: [
        'المساري V1-V4، والشريان التاجي الأيسر النازل (LAD).',
        'المساري II, III, aVF، والشريان التاجي الأيمن (RCA).',
        'المساري I, aVL، والشريان المنعطف الأيسر (LCx).',
        'المساري V5-V6، والشريان السباتي الباطن.',
      ],
      correctIdx: 1,
      rationale: 'المساري السفلية II, III, aVF تنظر للجدار السفلي المتروي بالشريان التاجي الأيمن RCA في 85-90% من البشر. يجب الحذر من احتشاء البطين الأيمن المرافق وتجنب النترات الوريدية!',
    },
    em1: {
      q: 'أثناء إنعاش مريض متوقف القلب بنظم رجفان بطيني (VF)، ما هو التسلسل الإجرائي الصحيح بعد إعطاء الصدمة الأولى؟',
      options: [
        'إيقاف الإنعاش فوراً والتأكد من النبض السباتي لمدة 30 ثانية.',
        'استئناف التدليك القلبي CPR فوراً لمدة دقيقتين دون توقف لفحص النبض.',
        'إعطاء 300 ملغ أميودارون فوراً قبل التدليك.',
        'فصل جهاز الصدمات وتهوية المريض بالأكسجين فقط.',
      ],
      correctIdx: 1,
      rationale: 'وفق إرشادات ACLS الحديثة: بعد إعطاء الصدمة الكهربائية، يُستأنف الـ CPR عالي الجودة فوراً لمدة دقيقتين كاملتين ولا يتم التوقف لفحص النبض إلا بعد انتهاء الدورتين لتجنب تراجع ضغط التروية التاجي.',
    },
    an1: {
      q: 'انسداد الشريان المخي الأوسط (MCA) يسبب عادة عجزاً حركياً وحسياً يتركز بشكل أكبر في أي منطقة؟',
      options: [
        'الطرف السفلي والقدم بشكل أشد من الوجه واليد.',
        'الوجه والطرف العلوي (اليد) بشكل أشد بكثير من الطرف السفلي.',
        'كلا الساقين فقط مع فقد التحكم في البول.',
        'فقد التوازن والرأرأة فقط دون أي خزل حركي.',
      ],
      correctIdx: 1,
      rationale: 'شريان MCA يغذي الوجه المحدب الوحشي للقشرة المخية وحزام الموتور الحسي للوجه واليد، بينما الشريان المخي الأمامي (ACA) يغذي الوجه الأنسي الممثل للطرف السفلي.',
    },
    bc1: {
      q: 'ما هو الإنزيم المنظم ومحدد السرعة الرئيسي لمسار تحلل السكر (Glycolysis) في الخلايا؟',
      options: [
        'الفوسفوفركتوكاينيز-1 (Phosphofructokinase-1 - PFK-1)',
        'الجلوكوكيناز (Glucokinase)',
        'البيروفات كاينيز (Pyruvate Kinase)',
        'اللاكتات ديهيدروجيناز (LDH)',
      ],
      correctIdx: 0,
      rationale: 'إنزيم PFK-1 هو صمام الأمان الأساسي ونقطة الالتزام التي لا رجعة فيها في مسار Glycolysis، وينشطه مركب Fructose-2,6-bisphosphate ويثبطه الـ ATP والسيترات.',
    },
  };

  // Current module quiz or fallback
  const activeQuiz =
    moduleKnowledgeChecks[currentModule?.id] || {
      q: `سؤال تثبيت الفهم للوحدة: ${currentModule?.title}. ما هي القاعدة السريرية الذهبية المرتبطة بهذا المفهوم؟`,
      options: [
        'الربط الدائم بين الفيزيولوجيا المرضية والأعراض السريرية والتدخل الدوائي الآمن.',
        'الاعتماد الحصري على التخمين دون مراجعة التحاليل أو الفحوصات.',
        'إهمال العلامات الحيوية للمريض عند الشروع بالخطة العلاجية.',
        'تجاهل التاريخ المرضي السابق للمريض.',
      ],
      correctIdx: 0,
      rationale: 'الطب السريري الحديث يبنى على الفهم العميق للخلل الوظيفي والفيزيولوجيا المرضية لتطبيق التدخل القائم على الدليل الطبي بأقصى درجات الأمان للمريض.',
    };

  // Calculate Anion Gap
  const anionGap = serumNa - (serumCl + serumHco3);
  const isHighGap = anionGap > 12;

  // Calculate GCS total
  const gcsTotal = gcsEye + gcsVerbal + gcsMotor;
  const gcsSeverity =
    gcsTotal <= 8 ? 'إصابة دماغية شديدة / غيبوبة (Severe TBI)' : gcsTotal <= 12 ? 'إصابة متوسطة (Moderate)' : 'إصابة خفيفة ومستقرة (Mild)';

  return (
    <div className="space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <Link
          href="/courses"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <span>←</span>
          <span>العودة لجميع المقررات الطبية</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-xs font-bold">
            {course.year}
          </span>
          <span className="px-3 py-1 rounded-xl bg-cyan-950 text-cyan-300 border border-cyan-500/30 text-xs font-bold">
            {course.category}
          </span>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Course Modules Navigator */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                {course.icon}
              </span>
              <div>
                <h2 className="font-black text-white text-sm">{course.title}</h2>
                <p className="text-[11px] text-slate-400">
                  {course.estimatedHours} ساعة تدريبية • تقييم ★ {course.rating}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-bold block mb-1">
                الوحدات والدروس السريرية ({course.modules.length}):
              </span>
              {course.modules.map((m, idx) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModuleIdx(idx);
                    setQuizAnswer(null);
                    setQuizSubmitted(false);
                  }}
                  className={`w-full text-right p-3 rounded-2xl border transition text-xs font-bold flex items-center justify-between ${
                    selectedModuleIdx === idx
                      ? 'bg-gradient-to-r from-indigo-950 to-cyan-950 border-cyan-500 text-white shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        selectedModuleIdx === idx ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="truncate">{m.title}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono shrink-0 mr-2">{m.duration}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Quiz Card CTA */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-cyan-950/60 border border-indigo-500/30 text-center space-y-3">
            <span className="text-3xl">🕸️</span>
            <h3 className="font-bold text-white text-xs">هل ترغب بقياس رادارك المعرفي؟</h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              خض اختبار التقييم الشامل خماسي الأبعاد لقياس دقة استدلالك السريري وسرعتك الطارئة.
            </p>
            <Link
              href="/assessment"
              className="inline-block w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-md transition"
            >
              دخول الرادار المعرفي ←
            </Link>
          </div>
        </div>

        {/* Right Column: Dynamic Course Specialized Interactive Tools & Lecture Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lecture View Header */}
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-cyan-400 flex items-center gap-2">
                <span>📖</span>
                <span>
                  الوحدة {selectedModuleIdx + 1}: {currentModule?.title}
                </span>
              </span>
              <span className="text-[11px] bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400 font-mono">
                {currentModule?.type || 'محاضرة سريرية'}
              </span>
            </div>

            {/* DYNAMIC SPECIALIZED INTERACTIVE TOOL ACCORDING TO COURSE */}
            {isCardio && (
              /* CARDIOLOGY INTERACTIVE EXPLORER */
              <div className="p-5 rounded-2xl bg-black/60 border border-cyan-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <span>❤️</span>
                    <span>المستكشف التشريحي والهيموديناميكي للقلب (Cardiac Anatomy & Pressures)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">انقر لاستكشاف الضغوط والتروية</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-bold">
                  {[
                    { id: 'lv', label: 'البطين الأيسر (LV)' },
                    { id: 'la', label: 'الأذين الأيسر (LA)' },
                    { id: 'aorta', label: 'الأبهر (Aorta)' },
                    { id: 'rv', label: 'البطين الأيمن (RV)' },
                    { id: 'ra', label: 'الأذين الأيمن (RA)' },
                    { id: 'lad', label: 'شريان LAD' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedHeartPart(item.id as any)}
                      className={`py-2 px-1 rounded-xl border transition text-center ${
                        selectedHeartPart === item.id
                          ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400 shadow-md shadow-cyan-500/20'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                    <h3 className="font-black text-white text-sm text-cyan-400">
                      {heartPartsInfo[selectedHeartPart]?.name}
                    </h3>
                    <div className="flex gap-3 text-[11px] font-mono">
                      <span className="text-rose-400 font-bold">
                        Pressure: {heartPartsInfo[selectedHeartPart]?.pressure}
                      </span>
                      <span className="text-emerald-400 font-bold">
                        O2: {heartPartsInfo[selectedHeartPart]?.o2}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {heartPartsInfo[selectedHeartPart]?.en}
                  </p>
                  <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 space-y-1">
                    <span className="font-bold text-cyan-300 block text-[11px]">
                      💎 لؤلؤة سريرية (High-Yield Clinical Pearl):
                    </span>
                    <p className="text-slate-200 text-xs leading-relaxed">
                      {heartPartsInfo[selectedHeartPart]?.clinicalPearls}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isEmergency && (
              /* EMERGENCY ABCDE & SHOCK EXPLORER */
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-black/60 border border-rose-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <span>⚡</span>
                      <span>خوارزمية الإنعاش والفرز السريري الأولي (ABCDE Resuscitation Protocol)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">اختر الخطوة لعرض بروتوكول الطوارئ</span>
                  </div>

                  <div className="grid grid-cols-5 gap-2 text-xs font-bold">
                    {(['A', 'B', 'C', 'D', 'E'] as const).map((step) => (
                      <button
                        key={step}
                        onClick={() => setActiveAbcde(step)}
                        className={`py-2.5 rounded-xl border transition text-center ${
                          activeAbcde === step
                            ? 'bg-rose-500 text-slate-950 font-black border-rose-400 shadow-md shadow-rose-500/20'
                            : 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {step}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                    <h3 className="font-black text-rose-300 text-sm">{abcdeData[activeAbcde].title}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300">
                      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="font-bold text-slate-400 block text-[11px]">🔍 ما يجب تقييمه:</span>
                        <p>{abcdeData[activeAbcde].assess}</p>
                      </div>
                      <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1">
                        <span className="font-bold text-rose-400 block text-[11px]">🚨 التدخل الفوري المنقذ:</span>
                        <p>{abcdeData[activeAbcde].intervene}</p>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30">
                      <span className="font-bold text-rose-300 text-[11px] block">💎 قاعدة سريرية حرجة:</span>
                      <p className="text-slate-200 mt-0.5">{abcdeData[activeAbcde].pearl}</p>
                    </div>
                  </div>
                </div>

                {/* Shock Matrix */}
                <div className="p-5 rounded-2xl bg-black/60 border border-amber-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <span>🩺</span>
                      <span>مصفوفة التمييز الديناميكي لأنواع الصدمة (Shock Hemodynamics)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">انقر لعرض المؤشرات الحيوية</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                    {(
                      [
                        { id: 'hypovolemic', label: 'نقص الحجم' },
                        { id: 'cardiogenic', label: 'صدمة قلبية' },
                        { id: 'septic', label: 'صدمة إنتانية' },
                        { id: 'obstructive', label: 'صدمة انسدادية' },
                      ] as const
                    ).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedShockType(item.id)}
                        className={`py-2 px-1 rounded-xl border transition text-center ${
                          selectedShockType === item.id
                            ? 'bg-amber-500 text-slate-950 font-black border-amber-400'
                            : 'bg-slate-900/80 text-slate-300 border-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                    <h3 className="font-black text-amber-400 text-sm">
                      {shockData[selectedShockType].name}
                    </h3>
                    <p className="text-slate-300">{shockData[selectedShockType].cause}</p>

                    <div className="grid grid-cols-3 gap-2 text-center font-mono">
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">CVP (الضغط الوريدي)</span>
                        <span className="font-bold text-white text-xs">{shockData[selectedShockType].cvp}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">CO (نتاج القلب)</span>
                        <span className="font-bold text-cyan-400 text-xs">{shockData[selectedShockType].co}</span>
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">SVR (المقاومة الوعائية)</span>
                        <span className="font-bold text-rose-400 text-xs">{shockData[selectedShockType].svr}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/30 text-slate-200">
                      <span className="font-bold text-amber-300 block text-[11px]">💉 خطة العلاج الأولية:</span>
                      <p className="mt-0.5">{shockData[selectedShockType].treatment}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isNeuro && (
              /* NEUROLOGY CRANIAL NERVES & GCS CALCULATOR */
              <div className="space-y-4">
                {/* Cranial Nerves Explorer */}
                <div className="p-5 rounded-2xl bg-black/60 border border-indigo-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <span>🧠</span>
                      <span>أطلس الأعصاب القحفية التفاعلي (Cranial Nerves I - XII)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">اختر العصب لعرض طريقة الفحص</span>
                  </div>

                  <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-xs font-bold">
                    {cranialNerves.map((cn) => (
                      <button
                        key={cn.num}
                        onClick={() => setSelectedCn(cn.num)}
                        className={`py-2 rounded-lg border transition text-center ${
                          selectedCn === cn.num
                            ? 'bg-indigo-500 text-slate-950 font-black border-indigo-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {cn.num}
                      </button>
                    ))}
                  </div>

                  {(() => {
                    const currentCn = cranialNerves.find((c) => c.num === selectedCn) || cranialNerves[2];
                    return (
                      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <h3 className="font-black text-indigo-300 text-sm">{currentCn.name}</h3>
                          <span className="px-2 py-0.5 bg-indigo-950 text-indigo-300 rounded text-[11px] font-bold border border-indigo-500/30">
                            النوع: {currentCn.type}
                          </span>
                        </div>
                        <p className="text-slate-300">
                          <strong className="text-slate-400">طريقة الفحص السريري:</strong> {currentCn.test}
                        </p>
                        <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                          <strong>💎 الدلالة السريرية:</strong> {currentCn.pearl}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* GCS Calculator */}
                <div className="p-5 rounded-2xl bg-black/60 border border-cyan-900/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <span>📊</span>
                      <span>حاسبة مقياس غلاسكو للغيبوبة التفاعلية (Glasgow Coma Scale - GCS)</span>
                    </span>
                    <span className="font-mono text-sm font-black text-amber-400 bg-amber-950/60 px-2.5 py-0.5 rounded border border-amber-500/40">
                      GCS: {gcsTotal}/15
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {/* Eye Opening */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <label className="font-bold text-cyan-400 block">فتح العينين (Eye - 4):</label>
                      <select
                        value={gcsEye}
                        onChange={(e) => setGcsEye(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value={4}>4 - تلقائي (Spontaneous)</option>
                        <option value={3}>3 - استجابة للصوت (To sound)</option>
                        <option value={2}>2 - استجابة للألم (To pressure)</option>
                        <option value={1}>1 - لا استجابة (None)</option>
                      </select>
                    </div>

                    {/* Verbal Response */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <label className="font-bold text-emerald-400 block">الاستجابة اللفظية (Verbal - 5):</label>
                      <select
                        value={gcsVerbal}
                        onChange={(e) => setGcsVerbal(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value={5}>5 - واعٍ ومتجه (Oriented)</option>
                        <option value={4}>4 - مشوش (Confused)</option>
                        <option value={3}>3 - كلمات غير ملائمة (Words)</option>
                        <option value={2}>2 - أصوات غير مفهومة (Sounds)</option>
                        <option value={1}>1 - لا استجابة (None)</option>
                      </select>
                    </div>

                    {/* Motor Response */}
                    <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <label className="font-bold text-rose-400 block">الاستجابة الحركية (Motor - 6):</label>
                      <select
                        value={gcsMotor}
                        onChange={(e) => setGcsMotor(Number(e.target.value))}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                      >
                        <option value={6}>6 - ينفذ الأوامر (Obeys commands)</option>
                        <option value={5}>5 - يحدد موضع الألم (Localizes pain)</option>
                        <option value={4}>4 - سحب بالانسحاب (Withdrawal)</option>
                        <option value={3}>3 - انثناء شاذ Decorticate</option>
                        <option value={2}>2 - انبساط شاذ Decerebrate</option>
                        <option value={1}>1 - لا استجابة (None)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                    <span className="text-slate-300">
                      التصنيف السريري: <strong className="text-white">{gcsSeverity}</strong>
                    </span>
                    {gcsTotal <= 8 && (
                      <span className="text-[11px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40">
                        ⚠️ يتطلب تأمين مجرى الهواء (Intubate if GCS ≤ 8)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isBiochem && (
              /* BIOCHEMISTRY ANION GAP & ACID-BASE CALCULATOR */
              <div className="p-5 rounded-2xl bg-black/60 border border-emerald-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <span>🧪</span>
                    <span>حاسبة الفجوة الشاردية وتوازن الحمض والقاعدة (Anion Gap & DKA)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">معادلة: Na - (Cl + HCO3)</span>
                </div>

                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <label className="text-[10px] text-slate-400 block">الصوديوم Na+ (mmol/L):</label>
                    <input
                      type="number"
                      value={serumNa}
                      onChange={(e) => setSerumNa(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <label className="text-[10px] text-slate-400 block">الكلور Cl- (mmol/L):</label>
                    <input
                      type="number"
                      value={serumCl}
                      onChange={(e) => setSerumCl(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <label className="text-[10px] text-slate-400 block">البيكربونات HCO3- (mmol/L):</label>
                    <input
                      type="number"
                      value={serumHco3}
                      onChange={(e) => setSerumHco3(Number(e.target.value))}
                      className="w-full mt-1 p-2 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-300">
                      قيمة الفجوة الشاردية: <strong className="text-xl font-mono text-cyan-400">{anionGap}</strong> mmol/L
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border ${
                        isHighGap
                          ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      }`}
                    >
                      {isHighGap ? 'فجوة شاردية مرتفعة (HAGMA)' : 'فجوة شاردية طبيعية (8-12)'}
                    </span>
                  </div>

                  {isHighGap ? (
                    <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1">
                      <span className="font-bold text-rose-300 block">🚨 أسباب الفجوة المرتفعة (اختصار MUDPILES):</span>
                      <p className="text-slate-200 leading-relaxed">
                        Methanol (ميثانول)، Uremia (يوريميا وفشل كلوي)، <strong>DKA (الحماض الكيتوني السكري)</strong>، Propylene glycol، Isoniazid/Iron، Lactic acidosis (حمض اللبنيك)، Ethylene glycol، Salicylates (أسبرين).
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-1">
                      <span className="font-bold text-emerald-300 block">✅ أسباب الفجوة الطبيعية (اختصار HARDASS):</span>
                      <p className="text-slate-200 leading-relaxed">
                        Hyperalimentation، Addison disease، Renal tubular acidosis (RTA)، Diarrhea (الإسهال الشديد)، Acetazolamide، Spironolactone، Saline infusion.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isPharma && (
              /* PHARMACOLOGY TOXICOLOGY & ANTIDOTE MATRIX */
              <div className="p-5 rounded-2xl bg-black/60 border border-teal-900/40 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                    <span>💊</span>
                    <span>مصفوفة الترياقات النوعية وحالات التسمم الحاد (Toxicology Antidotes Matrix)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">انقر لاختيار المادة السامة</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                  {[
                    { id: 'opioids', label: 'الأفيونات' },
                    { id: 'benzos', label: 'المهدئات Benzos' },
                    { id: 'paracetamol', label: 'الباراسيتامول' },
                    { id: 'beta_blockers', label: 'حاصرات بيتا' },
                    { id: 'digoxin', label: 'الديجوكسين' },
                    { id: 'warfarin', label: 'الوارفارين' },
                    { id: 'heparin', label: 'الهيبارين' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedToxin(item.id as any)}
                      className={`py-2 px-1 rounded-xl border transition text-center ${
                        selectedToxin === item.id
                          ? 'bg-teal-500 text-slate-950 font-black border-teal-400'
                          : 'bg-slate-900/80 text-slate-300 border-slate-800'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
                  <h3 className="font-black text-teal-300 text-sm">{antidotesData[selectedToxin].toxin}</h3>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-slate-400 block text-[11px]">⚠️ الأعراض والعلامات السريرية:</span>
                    <p className="text-slate-200">{antidotesData[selectedToxin].manifestation}</p>
                  </div>
                  <div className="p-3 bg-teal-950/40 rounded-xl border border-teal-500/30 space-y-1">
                    <span className="font-bold text-teal-300 block text-[11px]">💉 الترياق النوعي وطريقة عمله:</span>
                    <p className="text-white font-bold text-sm">{antidotesData[selectedToxin].antidote}</p>
                    <p className="text-slate-300 text-xs mt-1">{antidotesData[selectedToxin].mechanism}</p>
                  </div>
                </div>
              </div>
            )}

            {/* High-Yield Clinical Lecture Notes */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <h3 className="font-black text-white text-sm">
                ملخص المحاضرة والنقاط السريرية المركزة (High-Yield Core Pearls):
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 text-sm mt-0.5">▪</span>
                  <span>
                    <strong>التشخيص التفريقي المتزن:</strong> لا تكتفِ بتشخيص واحد مبكر (Anchoring Bias)؛ دائماً فكّر في الحالات الخطيرة المهددة للحياة (Rule out worst-case scenario) أولاً قبل الحالات الحميدة.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 text-sm mt-0.5">▪</span>
                  <span>
                    <strong>الأمان الدوائي وضبط الجرعة:</strong> تحقق دائماً من وظائف الكلى (GFR/CrCl) ووظائف الكبد قبل وصف الأدوية ذات النطاق العلاجي الضيق (Narrow Therapeutic Index).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-cyan-400 text-sm mt-0.5">▪</span>
                  <span>
                    <strong>تفسير التحاليل في سياق المريض:</strong> الرقم المخبري وحده لا يعالج مريضاً؛ عالج المريض وأعراضه السريرية وليس مجرد الورقة المخبرية (Treat the patient, not the lab sheet).
                  </span>
                </li>
              </ul>
            </div>

            {/* Interactive Module Knowledge Check (Quiz) */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                  <span>🎯</span>
                  <span>اختبار تثبيت الفهم الفوري (Module Checkpoint Quiz)</span>
                </span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-bold">
                  +25 XP
                </span>
              </div>

              <p className="text-xs font-bold text-white leading-relaxed">{activeQuiz.q}</p>

              <div className="space-y-2">
                {activeQuiz.options.map((opt, oIdx) => {
                  const isSelected = quizAnswer === oIdx;
                  const isCorrect = oIdx === activeQuiz.correctIdx;
                  let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700';

                  if (quizSubmitted) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                    }
                  } else if (isSelected) {
                    btnStyle = 'bg-indigo-950 border-indigo-500 text-white font-bold';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={quizSubmitted}
                      onClick={() => setQuizAnswer(oIdx)}
                      className={`w-full text-right p-3 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      {quizSubmitted && isCorrect && <span className="text-emerald-400 font-bold">✓ صحيح</span>}
                      {quizSubmitted && isSelected && !isCorrect && (
                        <span className="text-rose-400 font-bold">✗ خطأ</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!quizSubmitted ? (
                <button
                  disabled={quizAnswer === null}
                  onClick={() => setQuizSubmitted(true)}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
                >
                  تأكيد الإجابة
                </button>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
                  <span className="font-bold text-cyan-400 block">💡 التفسير السريري المعتمد:</span>
                  <p className="text-slate-300 leading-relaxed">{activeQuiz.rationale}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
