import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Shield
} from 'lucide-react';

interface LoginPageProps {
  onNavigate: (view: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ownerBlockedStudent, setOwnerBlockedStudent] = useState<{
    name?: string;
    roll?: string;
    message: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOwnerBlockedStudent(null);
    try {
      await login(username, password);
    } catch (err: any) {
      if (err.code === 'owner_approval_required' || err.message?.includes('Institute Owner')) {
        setOwnerBlockedStudent({
          name: err.studentName || 'Student',
          roll: err.rollNumber || '',
          message: err.message
        });
      } else {
        setError(err.message || 'Authentication failed. Please verify username and password.');
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
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs font-bold text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-white shadow-xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
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
          {/* Error Banner */}
          {error && (
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
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter username, email or mobile"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
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
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Please wait...' : 'Submit'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
