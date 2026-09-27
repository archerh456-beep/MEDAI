'use client';

import { useEffect, useRef, useState } from 'react';

interface EcgCanvasMonitorProps {
  bpm?: number;
  isStemi?: boolean;
  leadLabel?: string;
  height?: number;
}

export default function EcgCanvasMonitor({
  bpm = 80,
  isStemi = false,
  leadLabel = 'LEAD II (25 mm/s - 10 mm/mV)',
  height = 90,
}: EcgCanvasMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play a short bedside telemetry beep
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High-pitch ICU tone (880Hz A5)
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } catch {
      // AudioContext not allowed or not ready
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = canvas.width;
    let ch = canvas.height;

    // Handle responsive resize
    const handleResize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      width = canvas.width;
      ch = canvas.height;
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // ECG parameters
    let currentX = 0;
    let prevY = ch * 0.55;
    const baseLine = ch * 0.55;
    const amplitude = ch * 0.38;

    // Cycle duration in pixels: 60 sec / bpm. Speed = 100 pixels per sec
    const cycleLengthPx = Math.max(90, Math.min(220, (60 / bpm) * 160));
    let lastRPeak = -1;

    // Function to calculate ECG voltage at phase [0, 1] of cardiac cycle
    const getEcgVoltage = (phase: number) => {
      // phase: 0.0 to 1.0
      // P wave: 0.12 - 0.20
      if (phase >= 0.12 && phase < 0.20) {
        const p = (phase - 0.12) / 0.08;
        return Math.sin(p * Math.PI) * 0.15;
      }
      // PR segment: 0.20 - 0.26
      if (phase >= 0.20 && phase < 0.26) {
        return 0;
      }
      // Q wave: 0.26 - 0.29
      if (phase >= 0.26 && phase < 0.29) {
        const q = (phase - 0.26) / 0.03;
        return -Math.sin(q * Math.PI) * 0.14;
      }
      // R wave (Tall spike): 0.29 - 0.35
      if (phase >= 0.29 && phase < 0.35) {
        const r = (phase - 0.29) / 0.06;
        return Math.sin(r * Math.PI) * 1.0;
      }
      // S wave: 0.35 - 0.39
      if (phase >= 0.35 && phase < 0.39) {
        const s = (phase - 0.35) / 0.04;
        return -Math.sin(s * Math.PI) * 0.28;
      }
      // ST segment (0.39 - 0.50): Elevated if STEMI!
      if (phase >= 0.39 && phase < 0.50) {
        if (isStemi) {
          const st = (phase - 0.39) / 0.11;
          // Tombstone ST elevation!
          return 0.32 + Math.sin(st * Math.PI) * 0.15;
        }
        return 0;
      }
      // T wave: 0.50 - 0.68
      if (phase >= 0.50 && phase < 0.68) {
        const t = (phase - 0.50) / 0.18;
        return Math.sin(t * Math.PI) * (isStemi ? 0.38 : 0.26);
      }
      // Isoelectric baseline: 0.68 - 1.00
      return 0;
    };

    // Draw background grid
    const drawGrid = (c: CanvasRenderingContext2D, w: number, h: number) => {
      c.fillStyle = '#020617';
      c.fillRect(0, 0, w, h);

      // Fine grid
      c.strokeStyle = '#064e3b26';
      c.lineWidth = 1;
      const step = 15 * (window.devicePixelRatio || 1);
      for (let x = 0; x < w; x += step) {
        c.beginPath();
        c.moveTo(x, 0);
        c.lineTo(x, h);
        c.stroke();
      }
      for (let y = 0; y < h; y += step) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(w, y);
        c.stroke();
      }
    };

    // Initial grid render
    drawGrid(ctx, width, ch);

    let lastTime = performance.now();
    const speed = 2.2 * (window.devicePixelRatio || 1); // pixels per frame

    const render = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // Erase ahead bar
      const eraserWidth = 24 * (window.devicePixelRatio || 1);
      ctx.fillStyle = '#020617';
      ctx.fillRect(currentX, 0, eraserWidth, ch);

      // Re-draw grid lines in the erased section
      ctx.strokeStyle = '#064e3b33';
      ctx.lineWidth = 1;
      const step = 15 * (window.devicePixelRatio || 1);
      const startGridX = Math.floor(currentX / step) * step;
      for (let gx = startGridX; gx <= currentX + eraserWidth; gx += step) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, ch);
        ctx.stroke();
      }

      // Compute next coordinate
      const nextX = currentX + speed;
      const phase = (currentX % cycleLengthPx) / cycleLengthPx;
      const voltage = getEcgVoltage(phase);
      const nextY = baseLine - voltage * amplitude;

      // Detect R-wave peak for auditory beep
      if (phase >= 0.31 && phase <= 0.34 && lastRPeak !== Math.floor(currentX / cycleLengthPx)) {
        lastRPeak = Math.floor(currentX / cycleLengthPx);
        playBeep();
      }

      // Draw the neon phosphor trace
      ctx.shadowBlur = 8;
      ctx.shadowColor = isStemi ? '#f43f5e' : '#10b981';
      ctx.strokeStyle = isStemi ? '#fb7185' : '#34d399';
      ctx.lineWidth = 2.2 * (window.devicePixelRatio || 1);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(currentX, prevY);
      ctx.lineTo(nextX, nextY);
      ctx.stroke();

      // Reset shadow for subsequent drawings
      ctx.shadowBlur = 0;

      prevY = nextY;
      currentX = nextX;

      if (currentX >= width) {
        currentX = 0;
        prevY = baseLine;
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [bpm, isStemi, height, soundEnabled]);

  return (
    <div className="relative rounded-2xl bg-black border border-emerald-900/40 p-2.5 overflow-hidden shadow-inner">
      {/* Telemetry Header */}
      <div className="flex items-center justify-between pb-1 mb-1 border-b border-emerald-950 text-[11px] font-mono">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-emerald-400 font-bold">{leadLabel}</span>
          {isStemi && (
            <span className="px-1.5 py-0.2 bg-rose-950 text-rose-300 border border-rose-500/50 rounded text-[9px] font-black animate-pulse">
              ⚠️ ST-ELEVATION DETECTED
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-emerald-300 font-bold">
            HR: <strong className="text-white text-xs">{bpm}</strong> bpm
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'كتم صوت تخطيط القلب' : 'تشغيل صوت النبض الحي'}
            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition flex items-center gap-1 ${
              soundEnabled
                ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <span>{soundEnabled ? '🔊' : '🔇'}</span>
            <span>{soundEnabled ? 'النبض مفعّل' : 'صامت'}</span>
          </button>
        </div>
      </div>

      {/* Live Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full block rounded-lg cursor-crosshair"
        style={{ height: `${height}px` }}
      />
    </div>
  );
}
