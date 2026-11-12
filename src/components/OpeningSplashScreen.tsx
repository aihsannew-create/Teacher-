import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, GraduationCap, ShieldCheck, CheckCircle2, Sparkles, Award } from 'lucide-react';
import { useUiText } from '../context/UiTextContext';

interface OpeningSplashScreenProps {
  isVisible: boolean;
  onComplete: () => void;
}

const LOADING_STEPS = [
  'Initializing XOLARA CLASS Academic Engine...',
  'Syncing Class-Wise Daily Homework & Study Material...',
  'Verifying Student Subscriptions & Faculty Cabin...',
  'Welcome to XOLARA CLASS Portal!'
];

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({
  isVisible,
  onComplete
}) => {
  const { uiTexts } = useUiText();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const duration = 2300; // 2.3 seconds crisp cinematic opening

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 30) setStepIndex(0);
      else if (pct < 65) setStepIndex(1);
      else if (pct < 92) setStepIndex(2);
      else setStepIndex(3);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 280);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isVisible, onComplete]);

  const brandTitle = uiTexts?.brandName || 'XOLARA CLASS';
  const brandTagline = uiTexts?.brandTagline || 'Offline Coaching & Daily Homework Platform';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="xolara-opening-splash"
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.04,
            filter: 'blur(10px)',
            transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] }
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between overflow-hidden bg-slate-950 text-white select-none px-6 py-8"
        >
          {/* Ambient Glowing Background Orbs & Grid */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              className="absolute -top-32 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-blue-600/25 blur-[130px] animate-pulse"
            />
            <div
              className="absolute -bottom-40 left-1/4 w-[450px] h-[450px] rounded-full bg-indigo-600/20 blur-[120px]"
            />
            <div
              className="absolute top-1/3 right-10 w-[320px] h-[320px] rounded-full bg-violet-500/15 blur-[110px]"
            />
            {/* Subtle radial grid pattern */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #60a5fa 1px, transparent 1px), linear-gradient(to bottom, #60a5fa 1px, transparent 1px)',
                backgroundSize: '44px 44px'
              }}
            />
          </div>

          {/* Top Bar: Institute Badge + Skip */}
          <div className="relative z-10 w-full max-w-4xl flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase text-blue-300"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official Academic Portal • 2026-27</span>
            </motion.div>

            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={onComplete}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
            >
              Skip Intro →
            </motion.button>
          </div>

          {/* Center Hero Emblem, Title & Progress */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-xl w-full my-auto py-6">
            {/* Animated Orbital Crest */}
            <div className="relative flex items-center justify-center mb-8">
              {/* Outer spinning dashed ring */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border border-dashed border-blue-400/35 flex items-center justify-center"
              />
              {/* Counter-rotating glow ring */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                className="absolute w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-transparent border-t-blue-400 border-r-indigo-400/60 shadow-[0_0_40px_rgba(59,130,246,0.35)]"
              />
              {/* Pulsing aura */}
              <motion.div
                animate={{ scale: [1, 1.12, 1], opacity: [0.4, 0.75, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute w-24 h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-violet-500 blur-xl"
              />
              {/* Core 3D Badge */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0, rotate: -12 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 16 }}
                className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-2xl shadow-blue-500/40"
              >
                <div className="w-full h-full rounded-[22px] bg-slate-950/30 backdrop-blur-xs flex flex-col items-center justify-center border border-white/25">
                  <GraduationCap className="w-9 h-9 sm:w-11 sm:h-11 text-white drop-shadow" />
                  <BookOpen className="w-4 h-4 text-blue-200 -mt-1" />
                </div>
              </motion.div>
            </div>

            {/* Brand Title */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.55 }}
              className="space-y-2.5"
            >
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-blue-100 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
                {brandTitle}
              </h1>
              <p className="text-xs sm:text-sm font-bold tracking-widest uppercase text-blue-400">
                {brandTagline}
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Disciplined Offline Classroom Learning • Daily Homework Diary • Verified Monthly Subscription Portal
              </p>
            </motion.div>

            {/* Progress Bar & Live Status */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="w-full max-w-md mt-9 space-y-3"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-200/90 flex items-center gap-2 truncate pr-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  <span className="truncate">{LOADING_STEPS[stepIndex]}</span>
                </span>
                <span className="font-mono font-bold text-blue-400 shrink-0">
                  {progress}%
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 rounded-full bg-slate-900/90 border border-white/10 p-0.5 overflow-hidden shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 shadow-[0_0_16px_rgba(59,130,246,0.8)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>

              {/* Feature Pills */}
              <div className="pt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold text-slate-300">
                <div className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Class-Wise HW</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="truncate">Student ID Lock</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/[0.04] border border-white/10">
                  <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">Verified Fees</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Director Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="relative z-10 text-center space-y-1"
          >
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              Managed & Directed By <span className="text-blue-400">AIHSAN ANSARI</span>
            </p>
            <p className="text-[10px] text-slate-500">
              Secure Academic Management System • Class 6th to 12th
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
