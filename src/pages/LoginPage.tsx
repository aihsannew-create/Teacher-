import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield,
  ShieldAlert,
  Clock
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: string, extra?: any) => void;
  extra?: any;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, extra }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeftMsg, setAttemptsLeftMsg] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number>(0);
  const [lockoutTier, setLockoutTier] = useState<number>(1);
  const [ownerBlockedStudent, setOwnerBlockedStudent] = useState<{
    name?: string;
    roll?: string;
    message: string;
  } | null>(null);

  const isHomeworkPortal = extra?.intent === 'homework';

  // Live countdown timer for security lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setError(null);
          setAttemptsLeftMsg('Security lock expired. You can now try logging in again.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setLoading(true);
    setError(null);
    setAttemptsLeftMsg(null);
    setOwnerBlockedStudent(null);

    try {
      await login(username, password);
      // If user came with intent: 'homework', App.tsx handles routing
    } catch (err: any) {
      if (err.data?.code === 'SECURITY_LOCKOUT' || err.status === 429) {
        const sec = err.data?.remainingSeconds || 60;
        setLockoutSeconds(sec);
        setLockoutTier(err.data?.lockoutTier || 1);
        setError(err.message || 'Security lockout triggered due to 5 failed password attempts.');
      } else if (err.code === 'owner_approval_required' || err.message?.includes('Institute Owner')) {
        setOwnerBlockedStudent({
          name: err.studentName || 'Student',
          roll: err.rollNumber || '',
          message: err.message
        });
      } else {
        setError(err.message || 'Authentication failed. Please verify username and password.');
        if (err.data?.attemptsLeft !== undefined) {
          setAttemptsLeftMsg(`Warning: ${err.data.attemptsLeft} password attempt(s) remaining before temporary lockout.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/60 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-800 relative">
      {/* Top Back Navigation Button */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
        <button
          type="button"
          onClick={() => onNavigate('back')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-white shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>← Back</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-3">
        <div className="flex justify-center mb-2">
          <button
            onClick={() => onNavigate('landing')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 transition-transform hover:scale-105 cursor-pointer"
            aria-label="Home"
          >
            <BookOpen className="w-6 h-6" />
          </button>
        </div>
        <div className="text-sm font-black text-slate-900 tracking-tight">
          Prerna Tuition Academy
        </div>
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/95 backdrop-blur-xl py-8 px-6 shadow-[0_20px_50px_rgba(37,99,235,0.08)] rounded-3xl border border-blue-100 sm:px-9">
          {/* Homework Portal Special Banner */}
          {isHomeworkPortal && (
            <div className="mb-5 p-3.5 rounded-2xl bg-indigo-50/90 border border-indigo-200 text-indigo-950 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs text-indigo-900">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>Daily Homework & Class Diary Access</span>
              </div>
              <p className="text-[11px] text-indigo-800 leading-relaxed">
                Class homework dekhne ke liye apna <strong>Student ID</strong> ya <strong>Teacher/Admin ID & Password</strong> daalein.
              </p>
            </div>
          )}

          {/* Progressive Lockout Security Card */}
          {lockoutSeconds > 0 && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500 text-amber-950 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-amber-900 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
                  <span>Security Lock Active ({lockoutTier === 1 ? '1 Min' : lockoutTier === 2 ? '10 Min' : '30 Min'} Lock)</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Timer</span>
                </div>
              </div>

              <div className="text-center py-2 bg-white/80 rounded-xl border border-amber-200 shadow-2xs">
                <div className="text-2xl font-mono font-black text-amber-700 tracking-wider">
                  {formatTimer(lockoutSeconds)}
                </div>
                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">
                  5 galat password ke baad temporary lock laga hai
                </div>
              </div>

              <p className="text-[11px] text-amber-800 leading-relaxed">
                Kripya <strong>{formatTimer(lockoutSeconds)}</strong> intezar karein. Timer zero hote hi aap dubara sahi password se login kar sakenge. Agle 5 galat prayas par 10 minute ka lock lagega.
              </p>
            </div>
          )}

          {/* Attempts remaining warning */}
          {attemptsLeftMsg && lockoutSeconds <= 0 && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>{attemptsLeftMsg}</span>
            </div>
          )}

          {/* Standard Error Banner */}
          {error && lockoutSeconds <= 0 && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Owner Approval Notice if unapproved student attempts access */}
          {ownerBlockedStudent && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-black text-amber-950">
                    Owner Authorization Required
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    Account access for <strong>{ownerBlockedStudent.name}</strong> ({ownerBlockedStudent.roll || 'Enrolled'}) has not been approved yet. Only the <strong>Institute Owner</strong> can authorize student portal access.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={lockoutSeconds > 0 || loading}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username, email or mobile"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
                <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  disabled={lockoutSeconds > 0 || loading}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading || lockoutSeconds > 0}
              className="w-full mt-2 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Please wait...' : lockoutSeconds > 0 ? `Locked (${formatTimer(lockoutSeconds)})` : 'Submit & Login'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
