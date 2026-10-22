import React from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, ShieldAlert, GraduationCap, Sparkles, Eye, Shield } from 'lucide-react';

interface DemoRoleSwitcherProps {
  currentView: string;
  setCurrentView: (view: string) => void;
}

export const DemoRoleSwitcher: React.FC<DemoRoleSwitcherProps> = ({ currentView, setCurrentView }) => {
  const { user, studentProfile, demoLogin, logout } = useAuth();

  const handleSwitch = async (role: 'owner' | 'teacher' | 'student' | 'visitor', studentKey?: string) => {
    if (role === 'visitor') {
      logout();
      setCurrentView('landing');
      return;
    }

    try {
      await demoLogin(role, studentKey);
      if (role === 'owner') {
        setCurrentView('owner-access');
      } else if (role === 'teacher') {
        setCurrentView('teacher-dashboard');
      } else {
        setCurrentView('student-dashboard');
      }
    } catch (err: any) {
      // If student is blocked by owner, navigate to login page to show the owner block banner
      setCurrentView('login');
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50/95 via-indigo-50/90 to-blue-50/95 backdrop-blur-md border-b border-blue-100 text-slate-700 px-3 py-1.5 text-xs shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-700 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Demo Switcher:
          </span>
          <span className="text-[11px] text-slate-500 hidden xl:inline">
            Test Owner Access Control, Teacher Cabin, or Student Portal:
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
          {/* Owner button */}
          <button
            onClick={() => handleSwitch('owner')}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
              user?.role === 'owner'
                ? 'bg-gradient-to-r from-indigo-700 to-violet-700 text-white shadow-xs shadow-indigo-600/30'
                : 'bg-white/95 border border-indigo-200 text-indigo-900 hover:bg-indigo-50 hover:text-indigo-800'
            }`}
          >
            <Shield className="w-3 h-3 text-current" />
            <span>👑 Institute Owner</span>
          </button>

          {/* Teacher button */}
          <button
            onClick={() => handleSwitch('teacher')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
              user?.role === 'teacher'
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                : 'bg-white/90 border border-blue-200/80 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
            }`}
          >
            <UserCheck className="w-3 h-3 text-current" />
            <span>Teacher (Er. Rajesh)</span>
          </button>

          {/* Student Active */}
          <button
            onClick={() => handleSwitch('student', 'aarav')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
              user?.role === 'student' && studentProfile?.name === 'Aarav Patel'
                ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-500/20'
                : 'bg-white/90 border border-emerald-200/80 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <GraduationCap className="w-3 h-3 text-current" />
            <span>Student (Active - Aarav)</span>
          </button>

          {/* Student Expired / Overdue */}
          <button
            onClick={() => handleSwitch('student', 'priya')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
              user?.role === 'student' && studentProfile?.name === 'Priya Deshmukh'
                ? 'bg-amber-600 text-white shadow-xs shadow-amber-500/20'
                : 'bg-white/90 border border-amber-200/80 text-slate-700 hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-current" />
            <span>Student (Expired - Priya)</span>
          </button>

          {/* Student Pending Approval */}
          <button
            onClick={() => handleSwitch('student', 'rohan')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
              user?.role === 'student' && studentProfile?.name === 'Rohan Verma'
                ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-500/20'
                : 'bg-white/90 border border-amber-200 text-amber-900 hover:bg-amber-50'
            }`}
            title="Attempts login with unapproved student account"
          >
            <span>🔒 Student (Unapproved - Rohan)</span>
          </button>

          {/* Visitor */}
          <button
            onClick={() => handleSwitch('visitor')}
            className={`px-2 py-1 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1 ${
              !user
                ? 'bg-slate-800 text-white'
                : 'bg-white/80 border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Eye className="w-3 h-3 text-current" />
            <span>Public Site</span>
          </button>
        </div>
      </div>
    </div>
  );
};
