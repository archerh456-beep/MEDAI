import Link from 'next/link';
import { getDb } from '@/lib/db';

export default async function CasesPage() {
  const db = await getDb();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-indigo-950/60 border border-teal-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-black border border-teal-500/30 mb-2">
            <span>🏥</span>
            <span>المحاكي السريري التفاعلي (Clinical Patient Simulator)</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            محاكي الحالات السريرية وغرفة الطوارئ
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            عش تجربة الطبيب المعالج داخل قسم الطوارئ والعيادات. راقب المؤشرات الحيوية للمريض، اتخذ قرارات الفحص والعلاج الفوري، وشاهد تأثير قراراتك السريرية على استقرار المريض.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-teal-500/30 text-center min-w-[170px]">
          <span className="text-xs text-slate-400 font-bold block">إجمالي الحالات المتاحة</span>
          <span className="text-3xl font-black text-teal-400">{db.clinicalCases.length} حالات</span>
          <span className="text-[11px] block text-cyan-400 font-bold mt-0.5">سيناريوهات تفاعلية كاملة</span>
        </div>
      </div>

      {/* Cases Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {db.clinicalCases.map((c) => (
          <div
            key={c.id}
            className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 hover:border-teal-500/50 transition group flex flex-col justify-between space-y-4 shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-black">
                  {c.specialty}
                </span>
                <span className="text-xs font-black text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  +{c.pointsReward} XP
                </span>
              </div>

              <h2 className="text-lg font-black text-white group-hover:text-teal-300 transition">
                {c.title}
              </h2>

              {/* Patient Card Preview */}
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-200 font-bold">
                  <span>المريض: {c.patientProfile.name} ({c.patientProfile.age} سنة - {c.patientProfile.gender})</span>
                  <span className="text-rose-400 font-mono">BP: {c.patientProfile.vitals.bloodPressure}</span>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {c.patientProfile.chiefComplaint}
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    HR: {c.patientProfile.vitals.heartRate}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    SpO2: {c.patientProfile.vitals.oxygenSaturation}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Temp: {c.patientProfile.vitals.temperature}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">
                الصعوبة: <strong className="text-slate-200">{c.difficulty}</strong>
              </span>
              <Link
                href={`/cases/${c.id}`}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black transition flex items-center gap-1.5 shadow-md shadow-teal-500/20"
              >
                <span>دخول غرفة الفحص</span>
                <span>←</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
