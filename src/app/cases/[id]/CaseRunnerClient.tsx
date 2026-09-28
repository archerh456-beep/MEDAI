'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClinicalCase, User } from '@/lib/db';
import EcgCanvasMonitor from '@/app/components/EcgCanvasMonitor';

export default function CaseRunnerClient({
  clinicalCase,
  currentUser,
}: {
  clinicalCase: ClinicalCase;
  currentUser: User | null;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [caseFinished, setCaseFinished] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Dynamic vitals that update as patient improves
  const [vitals, setVitals] = useState(clinicalCase.patientProfile.vitals);

  const steps = clinicalCase.steps || [];
  const currentStep = steps[currentStepIndex];
  const selectedOption = currentStep?.options.find((o) => o.id === selectedOptionId);

  const handleSelect = (optId: string) => {
    if (isAnswerSubmitted) return;
    setSelectedOptionId(optId);
  };

  const handleConfirmDecision = () => {
    if (!selectedOption) return;
    setIsAnswerSubmitted(true);

    if (selectedOption.isCorrect) {
      setEarnedPoints((prev) => prev + Math.round(clinicalCase.pointsReward / steps.length));
      // Improve patient vitals visually!
      if (currentStepIndex === 0) {
        setVitals((v) => ({ ...v, bloodPressure: '138/86 mmHg', heartRate: '92 bpm' }));
      } else if (currentStepIndex === 1) {
        setVitals((v) => ({ ...v, bloodPressure: '124/80 mmHg', heartRate: '80 bpm', oxygenSaturation: '98%' }));
      }
    }
  };

  const handleNextStep = async () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
      setSelectedOptionId(null);
      setIsAnswerSubmitted(false);
    } else {
      setCaseFinished(true);
      if (currentUser) {
        try {
          await fetch('/api/arena/record-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, pointsEarned: earnedPoints }),
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/cases"
          className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition"
        >
          <span>←</span>
          <span>العودة لقائمة الحالات السريرية</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-xl bg-teal-950 text-teal-300 border border-teal-500/40 text-xs font-bold">
            {clinicalCase.specialty}
          </span>
          <span className="text-xs font-black text-amber-400">
            +{clinicalCase.pointsReward} XP
          </span>
        </div>
      </div>

      {/* Main Clinical Case Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Telemetry Monitor & Patient Profile */}
        <div className="lg:col-span-4 space-y-4">
          {/* Patient Card */}
          <div className="p-5 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl p-2 rounded-xl bg-slate-900 border border-slate-800">
                  {clinicalCase.patientProfile.gender === 'ذكر' ? '👨' : '👩'}
                </span>
                <div>
                  <h3 className="font-bold text-white text-sm">{clinicalCase.patientProfile.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {clinicalCase.patientProfile.age} سنة • {clinicalCase.patientProfile.gender}
                  </p>
                </div>
              </div>
              <span className="text-[10px] bg-rose-950/80 text-rose-300 border border-rose-500/40 font-bold px-2 py-0.5 rounded-full">
                حالة طارئة
              </span>
            </div>

            <div className="text-xs space-y-2 pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-400 font-bold block mb-0.5">الشكوى الرئيسية:</span>
                <p className="text-slate-200 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  {clinicalCase.patientProfile.chiefComplaint}
                </p>
              </div>

              {clinicalCase.patientProfile.history && (
                <div>
                  <span className="text-slate-400 font-bold block mb-0.5">التاريخ المرضي السابق:</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {clinicalCase.patientProfile.history}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ICU Telemetry Monitor */}
          <div className="p-5 rounded-3xl bg-black border border-cyan-900/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-900/40">
              <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                BEDSIDE MONITOR 04
              </span>
              <span className="font-mono text-[11px] text-emerald-400">STABLE</span>
            </div>

            {/* Vitals Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">NIBP (ضغط الدم)</span>
                <span className="text-lg font-black font-mono text-rose-400">{vitals.bloodPressure}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">HR (النبض)</span>
                <span className="text-lg font-black font-mono text-emerald-400">{vitals.heartRate}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">SpO2 (الأكسجين)</span>
                <span className="text-lg font-black font-mono text-cyan-400">{vitals.oxygenSaturation}</span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">RR (التنفس)</span>
                <span className="text-lg font-black font-mono text-amber-400">{vitals.respiratoryRate}</span>
              </div>
            </div>

            {/* Live ECG Waveform Oscilloscope Monitor */}
            <EcgCanvasMonitor
              bpm={parseInt(vitals.heartRate) || 85}
              isStemi={clinicalCase.title.includes('STEMI') || (clinicalCase.ecgSnippet ? clinicalCase.ecgSnippet.includes('ST-elevation') : false)}
              height={75}
            />

            {clinicalCase.ecgSnippet && (
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-cyan-500/20 text-[11px] text-cyan-300 font-mono">
                <span className="font-bold block text-slate-400">تقرير التخطيط (ECG):</span>
                {clinicalCase.ecgSnippet}
              </div>
            )}

            {clinicalCase.labResults && (
              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-amber-500/20 text-[11px] text-amber-300 font-mono">
                <span className="font-bold block text-slate-400">المختبر والغازات:</span>
                {clinicalCase.labResults}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Step-by-Step Decision Runner */}
        <div className="lg:col-span-8 space-y-6">
          {!caseFinished ? (
            <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/30">
                    محطة القرار {currentStepIndex + 1} من {steps.length}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">
                    {currentStepIndex === 0 ? 'الفرز والتدبير الفوري' : currentStepIndex === 1 ? 'التشخيص وتحديد الشريان/السبب' : 'العلاج التداخلي النهائي'}
                  </span>
                </div>

                <span className="text-xs font-black text-amber-400">
                  +{Math.round(clinicalCase.pointsReward / steps.length)} XP
                </span>
              </div>

              {/* Prompt */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white leading-relaxed">
                  {currentStep?.prompt}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentStep?.options.map((opt) => {
                  const isSelected = selectedOptionId === opt.id;
                  let style = 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-200';
                  if (isAnswerSubmitted) {
                    if (opt.isCorrect) {
                      style = 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/10';
                    } else if (isSelected && !opt.isCorrect) {
                      style = 'bg-rose-950 border-rose-500 text-rose-200';
                    }
                  } else if (isSelected) {
                    style = 'bg-teal-950 border-teal-500 text-teal-200';
                  }

                  return (
                    <button
                      key={opt.id}
                      disabled={isAnswerSubmitted}
                      onClick={() => handleSelect(opt.id)}
                      className={`w-full text-right p-4 rounded-2xl border transition flex items-center justify-between text-xs sm:text-sm font-semibold ${style}`}
                    >
                      <span>{opt.text}</span>
                      <span className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-xs">
                        {isAnswerSubmitted && opt.isCorrect ? '✓' : isAnswerSubmitted && isSelected && !opt.isCorrect ? '✕' : isSelected ? '●' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Confirm / Next Button & Explanation */}
              <div className="pt-4 border-t border-slate-800 space-y-4">
                {!isAnswerSubmitted ? (
                  <button
                    disabled={!selectedOptionId}
                    onClick={handleConfirmDecision}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 text-slate-950 font-black text-xs shadow-md disabled:opacity-40 transition"
                  >
                    تأكيد القرار السريري 🩺
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Clinical Explanation Card */}
                    <div
                      className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                        selectedOption?.isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                          : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                      }`}
                    >
                      <span className="font-bold block mb-1">
                        {selectedOption?.isCorrect ? '🎯 قرار سريري مثالي ومطابق للتوصيات العالمية!' : '⚠️ قرار غير مثالي - راجع التعليل الطبي:'}
                      </span>
                      <p>{selectedOption?.explanation}</p>
                    </div>

                    <button
                      onClick={handleNextStep}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 text-slate-950 font-black text-xs shadow-md transition"
                    >
                      {currentStepIndex < steps.length - 1 ? 'الانتقال للخطوة السريرية التالية ←' : 'استكمال وإنهاء الحالة 🏁'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Case Completed Success Screen */
            <div className="p-8 rounded-3xl bg-[#0c142b] border border-emerald-500/40 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl">
                🌟
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  تم استقرار وإنقاذ المريض بنجاح!
                </span>
                <h3 className="text-2xl font-black text-white">إنجاز سريري متميز، دكتور</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  اتخذت القرارات التشخيصية والعلاجية الصحيحة في الوقت المناسب. تم حفظ نقاط الخبرة في ملفك الأكاديمي.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm mx-auto space-y-1">
                <span className="text-xs text-slate-400 font-bold block">مجموع النقاط المكتسبة</span>
                <span className="text-4xl font-black text-amber-400">+{earnedPoints} XP</span>
              </div>

              <div className="flex justify-center gap-4">
                <Link
                  href="/cases"
                  className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black text-xs shadow-md transition"
                >
                  استعراض الحالات الأخرى ←
                </Link>
                <Link
                  href="/assessment"
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs border border-slate-700 transition"
                >
                  فحص رادارك المعرفي 🕸️
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
