'use client';

import { useState, useEffect } from 'react';
import { ArenaBattle, User } from '@/lib/db';

export default function ArenaClient({
  battle,
  allUsers,
  currentUser,
}: {
  battle: ArenaBattle;
  allUsers: User[];
  currentUser: User | null;
}) {
  const [inBattle, setInBattle] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(1.0);
  const [battleFinished, setBattleFinished] = useState(false);
  const [usersList, setUsersList] = useState<User[]>(allUsers);
  const [userPoints, setUserPoints] = useState(currentUser?.points || 0);
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'overall' | 'weekly' | 'accuracy'>('overall');

  const questions = battle?.questions || [];
  const currentQ = questions[currentQIndex];

  // Timer countdown
  useEffect(() => {
    if (!inBattle || battleFinished || selectedOption !== null) return;

    if (timeLeft <= 0) {
      handleSelectOption(-1); // Timeout penalty
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [inBattle, battleFinished, timeLeft, selectedOption]);

  const startBattle = () => {
    setInBattle(true);
    setCurrentQIndex(0);
    setTimeLeft(20);
    setSelectedOption(null);
    setIsCorrect(null);
    setScore(0);
    setCombo(1.0);
    setBattleFinished(false);
  };

  const handleSelectOption = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);

    const correct = idx === currentQ.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      const timeBonus = Math.max(1, Math.floor(timeLeft / 2));
      const gained = Math.round((50 + timeBonus * 5) * combo);
      setScore((prev) => prev + gained);
      setCombo((prev) => Math.min(3.0, Number((prev + 0.5).toFixed(1))));
    } else {
      setCombo(1.0);
    }
  };

  const handleNext = async () => {
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      setTimeLeft(20);
    } else {
      // Battle finished!
      setBattleFinished(true);
      setInBattle(false);

      if (currentUser) {
        try {
          const res = await fetch('/api/arena/record-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: currentUser.id, pointsEarned: score }),
          });
          const data = await res.json();
          if (data.success) {
            setUserPoints(data.newPoints);
            // Update leaderboard locally
            const updated = usersList.map((u) => (u.id === currentUser.id ? { ...u, points: data.newPoints } : u));
            updated.sort((a, b) => b.points - a.points);
            updated.forEach((u, i) => {
              u.rank = i + 1;
            });
            setUsersList(updated);
          }
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-orange-950/60 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 mb-2">
            <span>🏆</span>
            <span>حلبة التنافس والمسابقات الطبية الكبرى</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            حلبة التحدي ولوحة الشرف الوطنية
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            تنافس في سيناريوهات سريرية وطب طوارئ مباشرة مع زملائك من كليات الطب المختلفة. سرعة التشخيص ودقة القرار تمنحك مضاعف نقاط Combo وترفع ترتيبك الوطني!
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 text-center min-w-[180px]">
          <span className="text-xs text-slate-400 font-bold block">رصيدك في الحلبة</span>
          <span className="text-3xl font-black text-amber-400">{userPoints.toLocaleString()} XP</span>
          <span className="text-[11px] block text-emerald-400 font-bold mt-0.5">
            الترتيب العام: {currentUser ? `#${usersList.find((u) => u.id === currentUser.id)?.rank || 1}` : 'وضع الضيف'}
          </span>
        </div>
      </div>

      {/* Main Grid: Battle Arena on Left, Leaderboard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Battle Arena Area */}
        <div className="lg:col-span-7 space-y-6">
          {!inBattle && !battleFinished ? (
            /* Battle Start Screen */
            <div className="p-8 rounded-3xl bg-[#0c142b] border border-amber-500/30 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-4xl shadow-lg shadow-amber-500/10">
                ⚔️
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 text-xs font-bold">
                  الجولة المباشرة الأسبوعية
                </span>
                <h3 className="text-2xl font-black text-white">{battle.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  5 أسئلة سريرية عاجلة. لديك 20 ثانية لكل سؤال. الإجابات المتتالية الصحيحة تمنحك مضاعف نقاط حتى x3.0!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto text-xs font-bold text-slate-300">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="block text-amber-400 text-base">⏱️ 20 ث</span>
                  <span>لكل سؤال</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="block text-cyan-400 text-base">⚡ x3.0</span>
                  <span>أقصى مضاعف</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="block text-emerald-400 text-base">+{battle.prizePoints}</span>
                  <span>XP الجائزة</span>
                </div>
              </div>

              <button
                onClick={startBattle}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-slate-950 font-black text-base shadow-xl shadow-amber-500/30 transition transform hover:scale-105"
              >
                ابدأ المواجهة السريرية الآن 🚀
              </button>
            </div>
          ) : inBattle ? (
            /* Active Battle Screen */
            <div className="p-6 rounded-3xl bg-[#0c142b] border border-amber-500/40 space-y-6">
              {/* Battle HUD */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold">
                    السؤال {currentQIndex + 1} / {questions.length}
                  </span>
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-950 border border-amber-500/40 text-amber-400 text-xs font-black">
                    <span>🔥 COMBO</span>
                    <span>x{combo}</span>
                  </div>
                </div>

                {/* Score & Timer */}
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black text-emerald-400">
                    +{score} XP
                  </span>
                  <div
                    className={`px-3 py-1 rounded-xl font-mono font-black text-sm border flex items-center gap-1 ${
                      timeLeft <= 5
                        ? 'bg-rose-950 border-rose-500 text-rose-300 animate-pulse'
                        : 'bg-slate-900 border-cyan-500/40 text-cyan-300'
                    }`}
                  >
                    <span>⏱️</span>
                    <span>{timeLeft}s</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar Timer */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    timeLeft <= 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-400 to-cyan-400'
                  }`}
                  style={{ width: `${(timeLeft / 20) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <div className="py-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQ?.q}
                </h3>
              </div>

              {/* Options */}
              <div className="space-y-3">
                {currentQ?.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isTargetCorrect = idx === currentQ.correctIndex;

                  let btnStyle = 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200';
                  if (selectedOption !== null) {
                    if (isTargetCorrect) {
                      btnStyle = 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20';
                    } else if (isSelected && !isTargetCorrect) {
                      btnStyle = 'bg-rose-950 border-rose-500 text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={selectedOption !== null}
                      onClick={() => handleSelectOption(idx)}
                      className={`w-full text-right p-4 rounded-2xl border transition flex items-center justify-between text-xs sm:text-sm font-semibold ${btnStyle}`}
                    >
                      <span>{opt}</span>
                      <span className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-xs">
                        {selectedOption !== null && isTargetCorrect ? '✓' : selectedOption !== null && isSelected ? '✕' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Instant explanation / next button */}
              {selectedOption !== null && (
                <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                  <span className={`text-xs font-bold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isCorrect ? '🎯 إجابة صحيحة خارقة! مضاعف النقاط ارتفع!' : '⚠️ إجابة غير دقيقة - تمت إعادة المضاعف إلى 1.0'}
                  </span>

                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-md hover:brightness-110 transition"
                  >
                    {currentQIndex < questions.length - 1 ? 'السؤال التالي ←' : 'عرض النتيجة النهائية 🏁'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Battle Finished Screen */
            <div className="p-8 rounded-3xl bg-[#0c142b] border border-emerald-500/40 text-center space-y-6">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-4xl">
                🎉
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
                  اكتمل التحدي بنجاح
                </span>
                <h3 className="text-2xl font-black text-white">أداء سريري مذهل!</h3>
                <p className="text-xs text-slate-400">
                  تم تسجيل درجاتك وإضافتها إلى رصيدك وترتيبك في لوحة الشرف الوطنية.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 max-w-sm mx-auto space-y-2">
                <span className="text-xs text-slate-400 font-bold block">النقاط المكتسبة في هذه الجولة</span>
                <span className="text-4xl font-black text-amber-400">+{score} XP</span>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={startBattle}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition"
                >
                  جولة جديدة 🔄
                </button>
              </div>
            </div>
          )}
        </div>

        {/* National Leaderboard Area */}
        <div id="leaderboard" className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-[#0c142b] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <span>🥇</span>
                  <span>لوحة الشرف وتصنيف الطلاب</span>
                </h3>
                <p className="text-[11px] text-slate-400">التحديث المباشر للمتصدرين</p>
              </div>

              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                مباشر ●
              </span>
            </div>

            {/* Leaderboard tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-900 text-center text-xs font-bold">
              <button
                onClick={() => setActiveLeaderboardTab('overall')}
                className={`py-1.5 rounded-lg transition ${
                  activeLeaderboardTab === 'overall' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                النقاط العامة
              </button>
              <button
                onClick={() => setActiveLeaderboardTab('weekly')}
                className={`py-1.5 rounded-lg transition ${
                  activeLeaderboardTab === 'weekly' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                دوري الأسبوع
              </button>
              <button
                onClick={() => setActiveLeaderboardTab('accuracy')}
                className={`py-1.5 rounded-lg transition ${
                  activeLeaderboardTab === 'accuracy' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                دقة التشخيص
              </button>
            </div>

            {/* Podium (Top 3) */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center items-end">
              {/* Rank 2 */}
              {usersList[1] && (
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex flex-col items-center">
                  <span className="text-xl">🥈</span>
                  <img src={usersList[1].avatar} className="w-10 h-10 rounded-xl bg-slate-800 my-1" alt="" />
                  <span className="text-xs font-bold text-white truncate w-full">{usersList[1].name.split(' ')[1] || usersList[1].name}</span>
                  <span className="text-[10px] text-emerald-400 font-black">{usersList[1].points.toLocaleString()}</span>
                </div>
              )}

              {/* Rank 1 (Tallest) */}
              {usersList[0] && (
                <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/50 flex flex-col items-center transform -translate-y-2 shadow-lg shadow-amber-500/10">
                  <span className="text-2xl">👑</span>
                  <img src={usersList[0].avatar} className="w-12 h-12 rounded-xl bg-amber-900/30 my-1 border border-amber-500/40" alt="" />
                  <span className="text-xs font-black text-amber-300 truncate w-full">{usersList[0].name.split(' ')[0]}</span>
                  <span className="text-xs text-amber-400 font-black">{usersList[0].points.toLocaleString()} XP</span>
                </div>
              )}

              {/* Rank 3 */}
              {usersList[2] && (
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex flex-col items-center">
                  <span className="text-xl">🥉</span>
                  <img src={usersList[2].avatar} className="w-10 h-10 rounded-xl bg-slate-800 my-1" alt="" />
                  <span className="text-xs font-bold text-white truncate w-full">{usersList[2].name.split(' ')[1] || usersList[2].name}</span>
                  <span className="text-[10px] text-emerald-400 font-black">{usersList[2].points.toLocaleString()}</span>
                </div>
              )}
            </div>

            {/* List of remaining ranks */}
            <div className="space-y-2 pt-2">
              {usersList.slice(3).map((user) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-xl flex items-center justify-between border text-xs ${
                    currentUser && user.id === currentUser.id
                      ? 'bg-amber-950/30 border-amber-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px]">
                      {user.rank}
                    </span>
                    <img src={user.avatar} className="w-7 h-7 rounded-lg bg-slate-800" alt="" />
                    <div>
                      <p className="font-bold text-white">{user.name}</p>
                      <p className="text-[10px] text-slate-400">{user.university}</p>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="font-black text-emerald-400 block">{user.points.toLocaleString()} XP</span>
                    <span className="text-[10px] text-amber-400 font-bold">🔥 {user.streak}d</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
