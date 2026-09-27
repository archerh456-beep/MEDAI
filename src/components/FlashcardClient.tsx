'use client';

import { useState } from 'react';
import { Flashcard, User } from '@/lib/db';

export default function FlashcardClient({
  flashcards,
  currentUser,
}: {
  flashcards: Flashcard[];
  currentUser: User | null;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [cardsLearned, setCardsLearned] = useState(0);
  const [selectedDeck, setSelectedDeck] = useState<string>('ALL');

  const filteredCards =
    selectedDeck === 'ALL'
      ? flashcards
      : flashcards.filter((f) => f.category.toLowerCase() === selectedDeck.toLowerCase());

  const currentCard = filteredCards[currentIdx] || filteredCards[0];

  const handleRate = async (rating: 'hard' | 'good' | 'easy') => {
    setIsFlipped(false);
    setCardsLearned((prev) => prev + 1);

    if (currentIdx < filteredCards.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setCurrentIdx(0);
    }

    // Award small XP for spaced repetition if logged in
    if (currentUser) {
      try {
        await fetch('/api/arena/record-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id, pointsEarned: 15 }),
        });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-cyan-950/60 via-slate-900 to-indigo-950/60 border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-black border border-cyan-500/30 mb-2">
            <span>🎴</span>
            <span>نظام التكرار المتباعد (Spaced Repetition Flashcards)</span>
          </div>
          <h1 className="text-3xl font-black text-white">
            بطاقات الاستذكار السريع للمفاهيم الطبية
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
            ترسيخ المعارف الطبية المركزة وأسئلة امتحانات البورد والـ USMLE في الذاكرة طويلة المدى من خلال مراجعة البطاقات الذكية وتقييم مدى صعوبتها.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 text-center min-w-[170px]">
          <span className="text-xs text-slate-400 font-bold block">البطاقات المكتملة اليوم</span>
          <span className="text-3xl font-black text-cyan-400">{cardsLearned}</span>
          <span className="text-[11px] block text-emerald-400 font-bold mt-0.5">تم ترسيخ المفاهيم 🧠</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 text-xs font-bold scrollbar-none">
        {['ALL', 'Pharmacology', 'Cardiology', 'Surgery', 'Pediatrics'].map((deck) => (
          <button
            key={deck}
            onClick={() => {
              setSelectedDeck(deck);
              setCurrentIdx(0);
              setIsFlipped(false);
            }}
            className={`px-4 py-2 rounded-xl transition ${
              selectedDeck === deck
                ? 'bg-cyan-500 text-slate-950 font-black'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {deck === 'ALL' ? 'جميع التخصصات' : deck}
          </button>
        ))}
      </div>

      {/* Flashcard Active Area */}
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Card indicator */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            البطاقة {currentIdx + 1} من {filteredCards.length}
          </span>
          <span className="px-2.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
            {currentCard?.deck}
          </span>
        </div>

        {/* 3D Flip Card */}
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className="cursor-pointer min-h-[280px] p-8 rounded-3xl bg-[#0c142b] border border-cyan-500/30 hover:border-cyan-400/60 shadow-2xl transition transform hover:scale-[1.01] flex flex-col justify-between text-center select-none"
        >
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-amber-400 font-bold">
              {currentCard?.highYield ? '⭐ HIGH YIELD USMLE' : 'طبي معتمد'}
            </span>
            <span className="text-slate-500">اضغط لقلب البطاقة ↻</span>
          </div>

          <div className="py-6 space-y-3">
            {!isFlipped ? (
              <div className="space-y-2">
                <span className="text-xs text-cyan-400 font-mono font-bold block">السؤال / المفهوم السريري:</span>
                <h3 className="text-lg sm:text-xl font-black text-white leading-relaxed">
                  {currentCard?.front}
                </h3>
              </div>
            ) : (
              <div className="space-y-2">
                <span className="text-xs text-emerald-400 font-mono font-bold block">الإجابة واللؤلؤة السريرية:</span>
                <p className="text-base sm:text-lg font-bold text-slate-100 leading-relaxed whitespace-pre-line">
                  {currentCard?.back}
                </p>
              </div>
            )}
          </div>

          <div className="text-center text-xs text-slate-400">
            {isFlipped ? '✅ تم كشف الإجابة - قيّم مدى تذكرك بالأسفل' : '❓ حاول استرجاع الإجابة ذهنياً أولاً'}
          </div>
        </div>

        {/* Rating Buttons */}
        {isFlipped && (
          <div className="grid grid-cols-3 gap-4 pt-2">
            <button
              onClick={() => handleRate('hard')}
              className="py-3 px-4 rounded-xl bg-rose-950/70 border border-rose-500/40 text-rose-300 font-bold text-xs hover:bg-rose-900 transition flex flex-col items-center"
            >
              <span>🔴 صعب</span>
              <span className="text-[10px] text-slate-400">تكرار بعد قليل</span>
            </button>

            <button
              onClick={() => handleRate('good')}
              className="py-3 px-4 rounded-xl bg-amber-950/70 border border-amber-500/40 text-amber-300 font-bold text-xs hover:bg-amber-900 transition flex flex-col items-center"
            >
              <span>🟡 متوسط</span>
              <span className="text-[10px] text-slate-400">تكرار غداً (+15 XP)</span>
            </button>

            <button
              onClick={() => handleRate('easy')}
              className="py-3 px-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold text-xs hover:bg-emerald-900 transition flex flex-col items-center"
            >
              <span>🟢 سهل</span>
              <span className="text-[10px] text-slate-400">تكرار بعد 4 أيام (+15 XP)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
