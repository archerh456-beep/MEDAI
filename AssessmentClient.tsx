'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Quiz, User } from '@/lib/db';

interface AssessmentClientProps {
  initialQuiz: Quiz;
  currentUser: User | null;
}

export default function AssessmentClient({
  initialQuiz,
  currentUser,
}: AssessmentClientProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, 'high' | 'medium' | 'low'>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialScores = {
    clinicalReasoning: currentUser?.cognitiveScores?.clinicalReasoning || 82,
    pharmacology: currentUser?.cognitiveScores?.pharmacology || 80,
    pathophysiology: currentUser?.cognitiveScores?.pathophysiology || currentUser?.cognitiveScores?.foundational || 85,
    diagnosticsLab: currentUser?.cognitiveScores?.diagnosticsLab || 80,
    emergencySpeed: currentUser?.cognitiveScores?.emergencySpeed || 78,
    evidenceEthics: currentUser?.cognitiveScores?.evidenceEthics || 84,
  };

  const [scores, setScores] = useState(initialScores);

  const questions = initialQuiz?.questions || [];
  const currentQ = questions[currentIdx];

  const handleSelectOption = (optId: string) => {
    if (submitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQ.id]: optId,
    });
    // Set default confidence if not already chosen
    if (!confidenceLevels[currentQ.id]) {
      setConfidenceLevels({
        ...confidenceLevels,
        [currentQ.id]: 'medium',
      });
    }
  };

  const handleSetConfidence = (level: 'high' | 'medium' | 'low') => {
    if (submitted) return;
    setConfidenceLevels({
      ...confidenceLevels,
      [currentQ.id]: level,
    });
  };

  const handleFinish = async () => {
    setSaving(true);

    const domainResults: Record<string, { correctWeight: number; totalWeight: number }> = {
      clinicalReasoning: { correctWeight: 0, totalWeight: 0 },
      pharmacology: { correctWeight: 0, totalWeight: 0 },
      pathophysiology: { correctWeight: 0, totalWeight: 0 },
      diagnosticsLab: { correctWeight: 0, totalWeight: 0 },
      emergencySpeed: { correctWeight: 0, totalWeight: 0 },
      evidenceEthics: { correctWeight: 0, totalWeight: 0 },
    };

    questions.forEach((q) => {
      const selected = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect)?.id;
      const confidence = confidenceLevels[q.id] || 'medium';

      const weight = confidence === 'high' ? 1.5 : confidence === 'medium' ? 1.0 : 0.7;
      const domainKey = q.domain || 'clinicalReasoning';

      if (domainResults[domainKey]) {
        domainResults[domainKey].totalWeight += weight;
        if (selected === correctOpt) {
          domainResults[domainKey].correctWeight += weight;
        } else if (confidence === 'high') {
          // Penalty for overconfidence on lethal errors
          domainResults[domainKey].correctWeight -= 0.3;
        }
      }
    });

    const calcScore = (key: string, base: number) => {
      const res = domainResults[key];
      if (!res || res.totalWeight === 0) return base;
      const ratio = Math.max(0, Math.min(1, res.correctWeight / res.totalWeight));
      return Math.round(55 + ratio * 45); // Scale from 55 to 100
    };

    const newScores = {
      clinicalReasoning: calcScore('clinicalReasoning', scores.clinicalReasoning),
      pharmacology: calcScore('pharmacology', scores.pharmacology),
      pathophysiology: calcScore('pathophysiology', scores.pathophysiology),
      diagnosticsLab: calcScore('diagnosticsLab', scores.diagnosticsLab),
      emergencySpeed: calcScore('emergencySpeed', scores.emergencySpeed),
      evidenceEthics: calcScore('evidenceEthics', scores.evidenceEthics),
    };

    setScores(newScores);
    setSubmitted(true);

    // Save to server if logged in
    if (currentUser) {
      try {
        await fetch('/api/assessment/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            scores: newScores,
          }),
        });
      } catch (e) {
        console.error('Failed to sync scores:', e);
      } finally {
        setSaving(false);
      }
    } else {
      setSaving(false);
    }
  };

  // Helper to compute polygon points for 6-Axis Radar Chart (center 160, 160, max radius 110)
  // Angles for 6 axes: -90, -30, 30, 90, 150, 210 degrees
  const getRadarPoints = (vals: typeof scores) => {
    const cx = 160;
    const cy = 160;
    const maxR = 110;
    const angles = [-90, -30, 30, 90, 150, 210];

    const keys: (keyof typeof scores)[] = [
      'clinicalReasoning',
      'pharmacology',
      'pathophysiology',
      'diagnosticsLab',
      'emergencySpeed',
      'evidenceEthics',
    ];

    return keys
      .map((k, i) => {
        const val = Math.max(20, Math.min(100, vals[k] || 75));
        const r = (val / 100) * maxR;
        const rad = (angles[i] * Math.PI) / 180;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // National Benchmark Points (Average 75 across all dimensions)
  const getBenchmarkPoints = () => {
    const cx = 160;
    const cy = 160;
    const r = (75 / 100) * 110;
    const angles = [-90, -30, 30, 90, 150, 210];
    return angles
      .map((deg) => {
        const rad = (deg * Math.PI) / 180;
        return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
      })
      .join(' ');
  };

  const overallScore = Math.round(
    (scores.clinicalReasoning +
      scores.pharmacology +
      scores.pathophysiology +
      scores.diagnosticsLab +
      scores.emergencySpeed +
      scores.evidenceEthics) /
      6
  );

  const clinicalReadinessRank =
    overallScore >= 90
      ? 'استشاري متمرس (Clinical Master)'
      : overallScore >= 80
      ? 'ممارس سريري دقيق (Adept Practitioner)'
      : overallScore >= 70
      ? 'طبيب في مسار التطور السريري (Developing Acumen)'
      : 'بحاجة إلى تعزيز الأساسيات الدوائية والسريرية';

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d1633] via-slate-900 to-[#0c142b] border border-cyan-500/40 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-xs font-black">
              🕸️ مصفوفة الرادار المعرفي الطبي 6D
            </span>
            <span className="text-xs text-slate-400 font-mono">
              المعايير المعتمدة لتقييم الكفاءة السريرية
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            الاختبار التشخيصي الشامل لتقييم الكفاءة السريرية
          </h1>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            قياس كمي ودقيق للأبعاد الستة: الاستدلال السريري، الأمان الدوائي، الفيزيولوجيا المرضية، الفحوصات ورسم القلب، سرعة الطوارئ، والطب المسند بالأدلة.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold block">معدل جاهزيتك الحالي</span>
            <span className="text-2xl font-black text-cyan-400 font-mono">{overallScore}%</span>
          </div>
          <div className="border-r border-slate-800 h-8"></div>
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold block">المعيار الوطني</span>
            <span className="text-2xl font-black text-slate-400 font-mono">75%</span>
          </div>
        </div>
      </div>

      {!submitted ? (
        /* ========================================================================= */
        /* Phase 1: Interactive Cognitive Assessment Session                         */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Question Card (Left 7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 shadow-xl space-y-6">
              {/* Progress & Domain Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs border border-indigo-500/40">
                    {currentQ.domainName || 'البُعد المعرفي'}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    السؤال {currentIdx + 1} من {questions.length}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {questions.map((_, i) => (
                    <span
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition ${
                        i === currentIdx
                          ? 'bg-cyan-400 scale-125'
                          : selectedAnswers[questions[i].id]
                          ? 'bg-emerald-500'
                          : 'bg-slate-700'
                      }`}
                    ></span>
                  ))}
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-3">
                <span className="text-xs text-cyan-400 font-bold block">
                  السيناريو السريري وحالة المريض:
                </span>
                <p className="text-sm sm:text-base font-bold text-white leading-relaxed">
                  {currentQ.question}
                </p>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-3 pt-2">
                {currentQ.options.map((opt) => {
                  const isSelected = selectedAnswers[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt.id)}
                      className={`w-full text-right p-4 rounded-2xl border text-xs sm:text-sm font-semibold transition flex items-start gap-3 ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs uppercase shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="leading-relaxed">{opt.text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Confidence-Weighted Medical Scoring Metric */}
              {selectedAnswers[currentQ.id] && (
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 animate-in fade-in">
                  <span className="text-xs font-bold text-slate-300 block">
                    مستوى ثقتك السريرية في هذا القرار (Clinical Confidence Weight):
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleSetConfidence('high')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        confidenceLevels[currentQ.id] === 'high'
                          ? 'bg-emerald-900/80 border border-emerald-400 text-emerald-200 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🟢</span>
                      <span>واثق تماماً (100%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetConfidence('medium')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        confidenceLevels[currentQ.id] === 'medium'
                          ? 'bg-amber-900/80 border border-amber-400 text-amber-200 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>🟡</span>
                      <span>مرجح (75%)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSetConfidence('low')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        confidenceLevels[currentQ.id] === 'low'
                          ? 'bg-purple-900/80 border border-purple-400 text-purple-200 shadow-sm'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>⚪</span>
                      <span>تخمين / متردد</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    * الثقة المفرطة في خيار خاطئ تخصم نقاطاً تحذيرية، بينما الإجابة الصحيحة الواثقة ترفع الرادار بامتياز.
                  </p>
                </div>
              )}

              {/* Navigation Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(currentIdx - 1)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition disabled:opacity-30"
                >
                  السابق
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    disabled={!selectedAnswers[currentQ.id]}
                    onClick={() => setCurrentIdx(currentIdx + 1)}
                    className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-md transition disabled:opacity-40"
                  >
                    السؤال التالي ←
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!selectedAnswers[currentQ.id] || saving}
                    onClick={handleFinish}
                    className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/25 transition disabled:opacity-40"
                  >
                    {saving ? 'جارٍ تحليل الرادار...' : 'اعتماد وإنهاء التقييم الشامل 🏁'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Real-time Live SVG 6-Axis Radar Visualizer (Right 5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 shadow-xl space-y-5 text-center">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>🕸️</span>
                  <span>الرادار المعرفي المباشر</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold">
                  تحديث تلقائي مع كل إجابة
                </span>
              </div>

              {/* 6-Axis SVG Radar Polygon */}
              <div className="relative flex items-center justify-center py-4">
                <svg viewBox="0 0 320 320" className="w-full max-w-[280px] h-auto overflow-visible">
                  {/* Outer Concentric Hexagons */}
                  {[0.25, 0.5, 0.75, 1.0].map((scale, sIdx) => {
                    const r = scale * 110;
                    const angles = [-90, -30, 30, 90, 150, 210];
                    const pts = angles
                      .map((deg) => {
                        const rad = (deg * Math.PI) / 180;
                        return `${(160 + r * Math.cos(rad)).toFixed(1)},${(160 + r * Math.sin(rad)).toFixed(1)}`;
                      })
                      .join(' ');
                    return (
                      <polygon
                        key={sIdx}
                        points={pts}
                        fill="none"
                        stroke="#1e293b"
                        strokeWidth="1.2"
                        strokeDasharray={scale === 1.0 ? 'none' : '3 3'}
                      />
                    );
                  })}

                  {/* 6 Axes Lines */}
                  {[-90, -30, 30, 90, 150, 210].map((deg, i) => {
                    const rad = (deg * Math.PI) / 180;
                    const x = 160 + 110 * Math.cos(rad);
                    const y = 160 + 110 * Math.sin(rad);
                    return (
                      <line
                        key={i}
                        x1="160"
                        y1="160"
                        x2={x}
                        y2={y}
                        stroke="#334155"
                        strokeWidth="1.5"
                      />
                    );
                  })}

                  {/* Benchmark Polygon (75%) */}
                  <polygon
                    points={getBenchmarkPoints()}
                    fill="rgba(148, 163, 184, 0.08)"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                  />

                  {/* Student Dynamic Score Polygon */}
                  <polygon
                    points={getRadarPoints(scores)}
                    fill="rgba(6, 182, 212, 0.25)"
                    stroke="#22d3ee"
                    strokeWidth="2.5"
                    className="transition-all duration-700 ease-out"
                  />

                  {/* Axis Text Labels */}
                  <text x="160" y="32" textAnchor="middle" fill="#93c5fd" fontSize="9" fontWeight="bold">الاستدلال السريري</text>
                  <text x="280" y="100" textAnchor="start" fill="#c084fc" fontSize="9" fontWeight="bold">الأمان الدوائي</text>
                  <text x="280" y="235" textAnchor="start" fill="#2dd4bf" fontSize="9" fontWeight="bold">الفيزيولوجيا</text>
                  <text x="160" y="295" textAnchor="middle" fill="#38bdf8" fontSize="9" fontWeight="bold">التحاليل والـ ECG</text>
                  <text x="40" y="235" textAnchor="end" fill="#fbbf24" fontSize="9" fontWeight="bold">سرعة الطوارئ</text>
                  <text x="40" y="100" textAnchor="end" fill="#34d399" fontSize="9" fontWeight="bold">الأخلاقيات</text>
                </svg>
              </div>

              {/* Legend */}
              <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-800 text-[11px] font-bold">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <span className="w-3 h-3 rounded-full bg-cyan-400"></span>
                  <span>رادارك السريري</span>
                </span>
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-slate-500"></span>
                  <span>المتوسط الوطني (75%)</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* Phase 2: Comprehensive Post-Assessment Diagnostic Report                  */
        /* ========================================================================= */
        <div className="space-y-8 animate-in fade-in">
          {/* Result Highlight Card */}
          <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-[#0c142b] border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 text-center md:text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <span>🎉</span>
                <span>تم إنجاز التقييم وحفظ الدرجات في ملفك الأكاديمي (+150 XP)</span>
              </div>
              <h2 className="text-3xl font-black text-white">
                مؤشر الجاهزية السريرية العام: {overallScore}%
              </h2>
              <p className="text-sm font-bold text-cyan-300">
                الرتبة الممنوحة: {clinicalReadinessRank}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/profile"
                className="px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 transition transform hover:-translate-y-0.5"
              >
                العودة إلى لوحة تحكم الطالب ←
              </Link>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setCurrentIdx(0);
                  setSelectedAnswers({});
                  setConfidenceLevels({});
                }}
                className="px-5 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition border border-slate-700"
              >
                إعادة التقييم التشخيصي 🔄
              </button>
            </div>
          </div>

          {/* 6D Breakdown Detailed Cards */}
          <div className="p-6 sm:p-8 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <span>📊</span>
              <span>التحليل التفصيلي للأبعاد المعرفية السريرية</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Card 1 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>🧠</span>
                    <span>الاستدلال السريري</span>
                  </span>
                  <span className="font-black text-indigo-400 text-base">{scores.clinicalReasoning}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${scores.clinicalReasoning}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {scores.clinicalReasoning >= 80
                    ? 'ممتاز: تظهر قدرة متقدمة على تكوين تشخيص تفريقي واستبعاد الحالات المهددة للحياة.'
                    : 'بحاجة لتعزيز: ركز على ربط الأعراض بالمتلازمات الشائعة ومراجعة الحالات الباطنية.'}
                </p>
              </div>

              {/* Card 2 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>💊</span>
                    <span>الأمان الدوائي</span>
                  </span>
                  <span className="font-black text-purple-400 text-base">{scores.pharmacology}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${scores.pharmacology}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {scores.pharmacology >= 80
                    ? 'أمان عالٍ: حساسية دقيقة لموانع الاستعمال وتداخلات مثبطات CYP وتوازن الكهارل.'
                    : 'تحذير سريري: احذر من الجمع بين أدوية تحبس البوتاسيوم وتجنب مضادات الالتهاب مع القصور الكلوي.'}
                </p>
              </div>

              {/* Card 3 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>🔬</span>
                    <span>الفيزيولوجيا المرضية</span>
                  </span>
                  <span className="font-black text-cyan-400 text-base">{scores.pathophysiology}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${scores.pathophysiology}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {scores.pathophysiology >= 80
                    ? 'عمق معرفي: استيعاب سليم لآليات الصدمة الإنتانية والتغيرات الخلوية الوعائية.'
                    : 'يوصى بمراجعة ديناميكا السوائل وآليات المقاومة الوعائية في الإنتان والحروق.'}
                </p>
              </div>

              {/* Card 4 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>📊</span>
                    <span>الفحوصات والـ ECG</span>
                  </span>
                  <span className="font-black text-teal-400 text-base">{scores.diagnosticsLab}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full" style={{ width: `${scores.diagnosticsLab}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {scores.diagnosticsLab >= 80
                    ? 'دقة ممتازة في حساب الفجوة الأيونية (Anion Gap) وتحديد مساري احتشاء الشريان التاجي.'
                    : 'احرص على دراسة معادلة Winter للتعويض التنفسي وقراءة مساري الـ ECG الـ 12 بدقة.'}
                </p>
              </div>

              {/* Card 5 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>⚡</span>
                    <span>سرعة الطوارئ والإنعاش</span>
                  </span>
                  <span className="font-black text-amber-400 text-base">{scores.emergencySpeed}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${scores.emergencySpeed}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {scores.emergencySpeed >= 80
                    ? 'استجابة إنقاذ حاسمة: إدراك أن الأدرينالين العضلي هو التدخل الحاسم الوحيد في الصدمة التأقية.'
                    : 'تذكر دائماً: في الحساسية المفرطة، لا تؤخر الأدرينالين لانتظار الكورتيزون أو مضادات الهيستامين.'}
                </p>
              </div>

              {/* Card 6 */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>⚖️</span>
                    <span>الأخلاقيات والطب المسند</span>
                  </span>
                  <span className="font-black text-emerald-400 text-base">{scores.evidenceEthics}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${scores.evidenceEthics}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {scores.evidenceEthics >= 80
                    ? 'نضج مهني: احترام استقلالية المريض (Autonomy) وتطبيق مبادئ الموافقة المستنيرة السليمة.'
                    : 'راجع الأطر القانونية والأخلاقية لحق المريض البالغ في رفض العلاج وبدائل نقل الدم.'}
                </p>
              </div>
            </div>
          </div>

          {/* Personalized Clinical Learning Prescription */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#0d1633] via-slate-900 to-[#0a1024] border border-cyan-500/30 space-y-4">
            <h3 className="font-black text-white text-lg flex items-center gap-2">
              <span>🩺</span>
              <span>وصفة التعلم السريري المخصصة لسد الفجوات المعرفية (Clinical Rx)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">مقرر أمراض القلب والشريان التاجي</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">دراسة بروتوكول Door-to-Balloon وتخطيط الـ ECG</p>
                </div>
                <Link
                  href="/courses/cardio_101"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs"
                >
                  بدء المقرر ←
                </Link>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">محاكي طب الطوارئ والإنعاش الحاد</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">تدريب على حالات الصدمة التحسسية والقلبية الحادة</p>
                </div>
                <Link
                  href="/courses/emergency_201"
                  className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-black text-xs"
                >
                  بدء المقرر ←
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
