'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
}

export default function AiTutorClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `أهلاً بك زميلي الطبيب! أنا مساعدك السقراطي للذكاء الاصطناعي الطبي في MedAI Academy.
يمكنني مساعدتك في:
1. تحليل الحالات السريرية المعقدة واقتراح التشخيص التفريقي (Differential Diagnosis).
2. تبسيط الآليات الإمراضية (Pathophysiology) والدوائية (Pharmacology).
3. اختبار معلوماتك بأسلوب سقراطي تفاعلي وطرح أسئلة توجهك لاكتشاف التشخيص بنفسك.

بماذا تود أن نبدأ اليوم؟ يمكنك أيضاً اختيار أحد المواضيع السريعة بالأسفل.`,
      time: 'الآن',
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const presetQuestions = [
    'اشرح لي متلازمة الشريان التاجي الحادة (ACS: STEMI vs NSTEMI)',
    'ما هو اختصار MUDPILES لأسباب الحماض الاستقلابي عالي الفجوة؟',
    'اختبرني في حالة سريرية غامضة بطب الطوارئ بأسلوب سقراطي',
    'ما هي حزمة الساعة الأولى لتدبير الصدمة الإنتانية (Sepsis Hour-1 Bundle)؟',
  ];

  const handleSend = (textToSend?: string) => {
    const prompt = textToSend || input;
    if (!prompt.trim()) return;

    const userMsg: Message = {
      role: 'user',
      content: prompt,
      time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      let reply = '';
      const p = prompt.toLowerCase();

      if (p.includes('stemi') || p.includes('التاجي') || p.includes('acs')) {
        reply = `🩺 **متلازمة الشريان التاجي الحادة (Acute Coronary Syndromes - ACS):**

تنقسم إلى ثلاثة أنماط سريرية حاسمة تحدد قرار التدخل القسطري الفوري:
1. **STEMI (ST-Elevation MI):**
   • انسداد تام وحاد للشريان التاجي بخثرة ليفينية حمراء (Transmural Ischemia).
   • يظهر ارتفاع ST > 1mm في مسريين متجاورين (أو >2mm في V2-V3).
   • **التدبير الفوري:** قسطرة إسعافية أولية (Primary PCI) خلال أقل من 90 دقيقة (Door-to-Balloon).
2. **NSTEMI (Non-ST-Elevation MI):**
   • انسداد جزئي أو تدفق حرج، مع نخر خلوي قلبي مؤكد بارتفاع التروبونين (Troponin Positive).
   • التخطيط: انخفاض ST أو انقلاب موجات T، دون ارتفاع ST مستمر.
3. **الذبحة الصدرية غير المستقرة (Unstable Angina):**
   • أعراض إقفارية أثناء الراحة دون ارتفاع في إنزيمات القلب (Troponin Negative).

💡 **لؤلؤة سريرية:** في النوبات السفلية (Inferior STEMI - II, III, aVF)، تذكر دائماً عمل مساري الجانب الأيمن (V4R) لاستبعاد احتشاء البطين الأيمن قبل إعطاء النيتروجليسرين!`;
      } else if (p.includes('mudpiles') || p.includes('حماض') || p.includes('فجوة')) {
        reply = `🧪 **اختصار MUDPILES لأسباب الحماض الاستقلابي عالي فجوة الصواعد (High Anion Gap Metabolic Acidosis):**

فجوة الصواعد الطبيعية = Na - (Cl + HCO3) وتكون بين 8 إلى 12 mEq/L. عند ارتفاعها فوق 12:

• **M** - Methanol (تسمم الميثانول - أذية العصب البصري والعمى).
• **U** - Uremia (القصور الكلوي وتراكم الأحماض الكبريتية والفوسفاتية).
• **D** - DKA (الحماض الكيتوني السكري، الكحول، أو المجاعة).
• **P** - Propylene glycol / Paracetamol.
• **I** - Iron / Isoniazid / Infection.
• **L** - Lactic Acidosis (نقص التروية، الصدمة، والإنتان).
• **E** - Ethylene glycol (مانع تجمد السيارات - بلورات أكسالات الكالسيوم بالبول).
• **S** - Salicylates (التسمم بالأسبرين - يسبب حماضاً استقلابياً وقلاء تنفسي معاً).`;
      } else if (p.includes('sepsis') || p.includes('إنتان') || p.includes('صدمة')) {
        reply = `⚡ **حزمة الساعة الأولى لتدبير الصدمة الإنتانية (Surviving Sepsis Hour-1 Bundle):**

يجب تطبيق الخطوات الخمس التالية في غضون 60 دقيقة من تشخيص الإنتان الحاد:
1. **قياس اللاكتات بالدم (Lactate Level):** إعادة القياس إذا كان > 2 mmol/L.
2. **أخذ مزارع الدم (Blood Cultures):** عينتين من موضعين مختلفين قبل إعطاء المضاد الحيوي.
3. **بدء المضادات الحيوية واسعة الطيف (Broad-Spectrum Antibiotics):** وريدياً دون أي تأخير.
4. **الإنعاش بالسوائل الوريدية (Crystalloid Fluids):** إعطاء 30 mL/kg من محلول متوازن (مثل Ringer Lactate) عند وجود هبوط ضغط أو لاكتات ≥ 4 mmol/L.
5. **بدء رافعات الضغط (Vasopressors):** النورأدرينالين (Norepinephrine) هو الخيار الأول للحفاظ على ضغط الشريان الوسطي MAP ≥ 65 mmHg إذا لم يستجب المريض للسوائل.`;
      } else {
        reply = `سؤال سريري ممتاز!
بناءً على المعايير الطبية المعتمدة (UpToDate & Medscape 2026):
في هذه الحالة، يجب دائماً فحص العلامات الحيوية أولاً وفق قاعدة (ABCDE):
1. **Airway & Breathing:** التأكد من سالكية المجرى الهوائي وكفاية الأكسجة (SpO2 > 94%).
2. **Circulation:** فحص النبض المحيطي، ملء الشعيرات الدموية، وضغط الدم والبدء بالسوائل إن لزم.
3. **Disability:** مقياس غلاسكو للغيبوبة (GCS) وسكر الدم العاجل بجانب السرير.

هل تود أن نتعمق أكثر في التشخيص التفريقي أم تفضل الانتقال لمعالجة سيناريو سريري محايد؟`;
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: reply,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-cyan-950/60 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/30 mb-2">
            <span>🤖</span>
            <span>المحاور السقراطي الطبي بالذكاء الاصطناعي (Socratic AI Tutor)</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            المساعد الطبي والسريري الذكي
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            محاور طبي ذكي مدرب على إرشادات التعليم الطبي المعتمد. يمكنك سؤاله عن أي تشخيص تفريقي، تفاعلات دوائية، تفسير تخطيط القلب، أو إجراء جلسة نقاش حالة سريرية معقدة.
          </p>
        </div>

        <button
          onClick={() =>
            setMessages([
              {
                role: 'assistant',
                content: 'تم بدء جلسة محادثة طبية جديدة. تفضل بطرح سؤالك أو الحالة السريرية!',
                time: 'الآن',
              },
            ])
          }
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition"
        >
          جلسة جديدة 🔄
        </button>
      </div>

      {/* Preset Fast Prompts */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {presetQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-teal-500 text-slate-300 text-xs font-semibold whitespace-nowrap transition"
          >
            💬 {q}
          </button>
        ))}
      </div>

      {/* Chat Messages Container */}
      <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 min-h-[450px] max-h-[600px] overflow-y-auto space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
              <span>{m.role === 'user' ? 'أنت (الطبيب / المطور)' : '🩺 المساعد الطبي الذكي'}</span>
              <span>• {m.time}</span>
            </div>

            <div
              className={`p-4 rounded-2xl max-w-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-line shadow-md ${
                m.role === 'user'
                  ? 'bg-teal-600 text-white rounded-br-none'
                  : 'bg-slate-900/90 text-slate-200 border border-slate-800 rounded-bl-none'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-xs text-teal-400 font-bold animate-pulse">
            <span>🩺 المساعد الطبي يفكر ويكتب التحليل السريري...</span>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="اطرح استفساراً طبياً، اسأل عن آلية دوائية، أو اطلب مناقشة حالة سريرية..."
          className="flex-1 px-5 py-3.5 rounded-2xl bg-[#0c142b] border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-teal-500 shadow-inner"
        />
        <button
          type="submit"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-teal-500/20 transition transform hover:scale-105"
        >
          إرسال 🚀
        </button>
      </form>
    </div>
  );
}
