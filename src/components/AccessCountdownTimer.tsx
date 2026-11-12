import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface AccessCountdownTimerProps {
  expiryDate?: string | null;
  startDate?: string | null;
  onExpire?: () => void;
  onOpenPaymentModal?: () => void;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
  isExpired: boolean;
}

export const AccessCountdownTimer: React.FC<AccessCountdownTimerProps> = ({
  expiryDate,
  startDate,
  onExpire,
  onOpenPaymentModal,
  compact = false
}) => {
  const calculateTime = (): TimeRemaining => {
    if (!expiryDate) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true };
    }

    const expiryMs = new Date(expiryDate).getTime();
    const nowMs = Date.now();
    const diff = expiryMs - nowMs;

    if (isNaN(expiryMs) || diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds, totalMs: diff, isExpired: false };
  };

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(calculateTime);

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateTime();
      setTimeLeft(updated);
      if (updated.isExpired && !timeLeft.isExpired) {
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  // Compute progress percentage across subscription window (exact calendar month duration or default 30 days)
  const totalWindowMs = startDate && expiryDate && !isNaN(new Date(startDate).getTime()) && !isNaN(new Date(expiryDate).getTime())
    ? Math.max(1, new Date(expiryDate).getTime() - new Date(startDate).getTime())
    : 30 * 24 * 60 * 60 * 1000;
  const elapsedMs = totalWindowMs - timeLeft.totalMs;
  const progressPercent = Math.min(100, Math.max(0, (elapsedMs / totalWindowMs) * 100));
  const remainingPercent = Math.max(0, 100 - progressPercent);

  const isUrgent = !timeLeft.isExpired && timeLeft.days < 3;

  if (compact) {
    if (timeLeft.isExpired) {
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
          <ShieldAlert className="w-3.5 h-3.5 text-red-600 animate-pulse" />
          <span>Access Expired</span>
        </div>
      );
    }

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold shadow-2xs ${
        isUrgent
          ? 'bg-amber-50 border-amber-300 text-amber-800'
          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
      }`}>
        <Clock className={`w-3.5 h-3.5 ${isUrgent ? 'text-amber-600 animate-pulse' : 'text-emerald-600'}`} />
        <span className="tabular-nums">
          {timeLeft.days}d {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
        </span>
      </div>
    );
  }

  // Full Banner Mode with Real-Time Glowing Timer
  return (
    <div className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border backdrop-blur-xl transition-all shadow-md relative overflow-hidden ${
      timeLeft.isExpired
        ? 'bg-gradient-to-r from-red-50/95 via-rose-50/90 to-red-100/80 border-red-300 shadow-red-500/10'
        : isUrgent
        ? 'bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-amber-100/70 border-amber-300 shadow-amber-500/10'
        : 'bg-gradient-to-r from-emerald-50/95 via-teal-50/90 to-cyan-50/70 border-emerald-300 shadow-emerald-500/10'
    }`}>
      {/* Background soft glow decoration */}
      <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full bg-white/40 blur-2xl pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Status & Expiry Description */}
        <div className="space-y-1.5 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 text-[11px] font-extrabold uppercase rounded-lg tracking-wider flex items-center gap-1.5 ${
              timeLeft.isExpired
                ? 'bg-red-600 text-white'
                : isUrgent
                ? 'bg-amber-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {timeLeft.isExpired ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>30 Din Pure: Access Band (Locked)</span>
                </>
              ) : isUrgent ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Expiring Soon (30 Din Pure Hone Wale Hain)</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>30-Day Tuition Access Active</span>
                </>
              )}
            </span>

            {expiryDate && (
              <span className="text-[11px] text-slate-600 font-medium">
                Valid till: <strong className="text-slate-900 font-bold">{new Date(expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            {timeLeft.isExpired
              ? 'Aapke 30 Din Ka Homework Access Samapt Ho Chuka Hai'
              : isUrgent
              ? 'Dhyan dein! Aapke 30 din ka access jald hi automatically lock ho jayega'
              : 'Daily Classroom Homework & Class Diary Access Active Hai'}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            {timeLeft.isExpired
              ? 'Niyam anusar 30 din pura hone par homework section automatic band ho gaya hai. Agle 30 din ke access ke liye payment ID / UTR submit karein.'
              : isUrgent
              ? 'Nirantar padhai ke liye samay par fees ID submit karein taaki homework section lock na ho.'
              : 'Admin dwara pradan kiye gaye 30 din ke dauran aap daily homework, blackboard notes aur solutions submit kar sakte hain.'}
          </p>
        </div>

        {/* Right: Live Glowing Digital Countdown Timer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="bg-white/95 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-2 sm:gap-3 text-center">
            {/* Days Box */}
            <div className="min-w-[50px] sm:min-w-[58px] py-1 px-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className={`block text-xl sm:text-2xl font-black font-mono tabular-nums ${
                timeLeft.isExpired ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {String(timeLeft.days).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Days</span>
            </div>

            <span className="text-lg font-black text-slate-300">:</span>

            {/* Hours Box */}
            <div className="min-w-[50px] sm:min-w-[58px] py-1 px-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className={`block text-xl sm:text-2xl font-black font-mono tabular-nums ${
                timeLeft.isExpired ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {String(timeLeft.hours).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Hours</span>
            </div>

            <span className="text-lg font-black text-slate-300">:</span>

            {/* Minutes Box */}
            <div className="min-w-[50px] sm:min-w-[58px] py-1 px-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className={`block text-xl sm:text-2xl font-black font-mono tabular-nums ${
                timeLeft.isExpired ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {String(timeLeft.minutes).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mins</span>
            </div>

            <span className="text-lg font-black text-slate-300">:</span>

            {/* Seconds Box */}
            <div className="min-w-[50px] sm:min-w-[58px] py-1 px-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className={`block text-xl sm:text-2xl font-black font-mono tabular-nums animate-pulse ${
                timeLeft.isExpired ? 'text-red-600' : isUrgent ? 'text-amber-700' : 'text-emerald-700'
              }`}>
                {String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Secs</span>
            </div>
          </div>

          {onOpenPaymentModal && (
            <button
              onClick={onOpenPaymentModal}
              className={`px-4 py-3 rounded-2xl font-bold text-xs text-white transition-all shadow-md shrink-0 cursor-pointer flex items-center gap-2 ${
                timeLeft.isExpired
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/30 ring-2 ring-red-400'
                  : 'bg-slate-900 hover:bg-blue-600 shadow-slate-900/20'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{timeLeft.isExpired ? 'Fees ID Submit Karein (Unlock)' : 'Renew / Extend Access'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar of 30-Day Window */}
      {!timeLeft.isExpired && (
        <div className="mt-4 pt-3 border-t border-slate-200/60">
          <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mb-1">
            <span>30-Day Access Timeline</span>
            <span className="font-mono text-slate-700">{remainingPercent.toFixed(1)}% Remaining ({timeLeft.days} days left)</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200/70 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isUrgent ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
