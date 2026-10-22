import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LogOut, Bell, Shield, KeyRound } from 'lucide-react';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onOpenNotifications?: () => void;
  unreadCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenNotifications,
  unreadCount = 0
}) => {
  const { user, studentProfile, logout } = useAuth();

  const handleBrandClick = () => {
    if (!user) {
      setCurrentView('landing');
    } else if (user.role === 'owner') {
      setCurrentView('owner-access');
    } else if (user.role === 'teacher') {
      setCurrentView('teacher-dashboard');
    } else {
      setCurrentView('student-dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-blue-100 shadow-xs shadow-blue-500/5 text-slate-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleBrandClick}
            className="flex items-center gap-2.5 text-left group transition-transform focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:shadow-blue-600/30 transition-shadow">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                Prerna Tuition OS
              </span>
              <span className="hidden sm:block text-[11px] text-blue-600 font-bold tracking-wide">
                {user?.role === 'owner' ? '👑 Owner Control System' : 'Offline Coaching & Daily HW'}
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links based on Role */}
        <nav className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-semibold text-slate-600">
          {!user ? (
            <>
              <button
                onClick={() => setCurrentView('landing')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'landing' ? 'text-blue-600 font-bold' : ''}`}
              >
                Overview
              </button>
              <button
                onClick={() => setCurrentView('classes-info')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'classes-info' ? 'text-blue-600 font-bold' : ''}`}
              >
                Classes & Fees
              </button>
              <button
                onClick={() => setCurrentView('about-teacher')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'about-teacher' ? 'text-blue-600 font-bold' : ''}`}
              >
                Faculty
              </button>
            </>
          ) : user.role === 'owner' ? (
            <>
              <button
                onClick={() => setCurrentView('owner-access')}
                className={`whitespace-nowrap transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${
                  currentView === 'owner-access'
                    ? 'bg-indigo-50 text-indigo-700 font-extrabold border border-indigo-200'
                    : 'hover:text-indigo-600'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Teacher IDs & Student Access</span>
              </button>
              <button
                onClick={() => setCurrentView('teacher-dashboard')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'teacher-dashboard' ? 'text-blue-600 font-bold' : ''}`}
              >
                Academic Cabin
              </button>
              <button
                onClick={() => setCurrentView('teacher-homework')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView.startsWith('teacher-homework') ? 'text-blue-600 font-bold' : ''}`}
              >
                Daily Homework
              </button>
              <button
                onClick={() => setCurrentView('teacher-payments')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'teacher-payments' ? 'text-blue-600 font-bold' : ''}`}
              >
                Fee Ledger
              </button>
            </>
          ) : user.role === 'teacher' ? (
            <>
              <button
                onClick={() => setCurrentView('teacher-dashboard')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'teacher-dashboard' ? 'text-blue-600 font-bold' : ''}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('teacher-homework')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView.startsWith('teacher-homework') ? 'text-blue-600 font-bold' : ''}`}
              >
                Daily Homework
              </button>
              <button
                onClick={() => setCurrentView('teacher-students')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'teacher-students' ? 'text-blue-600 font-bold' : ''}`}
              >
                Students & Batches
              </button>
              <button
                onClick={() => setCurrentView('teacher-attendance')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'teacher-attendance' ? 'text-blue-600 font-bold' : ''}`}
              >
                Attendance
              </button>
              <button
                onClick={() => setCurrentView('teacher-payments')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'teacher-payments' ? 'text-blue-600 font-bold' : ''}`}
              >
                Fee Ledger
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setCurrentView('student-dashboard')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'student-dashboard' ? 'text-blue-600 font-bold' : ''}`}
              >
                My Dashboard
              </button>
              <button
                onClick={() => setCurrentView('student-homework')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'student-homework' ? 'text-blue-600 font-bold' : ''}`}
              >
                Daily Homework
              </button>
              <button
                onClick={() => setCurrentView('student-attendance')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'student-attendance' ? 'text-blue-600 font-bold' : ''}`}
              >
                Attendance Log
              </button>
              <button
                onClick={() => setCurrentView('student-payments')}
                className={`whitespace-nowrap transition-colors hover:text-blue-600 ${currentView === 'student-payments' ? 'text-blue-600 font-bold' : ''}`}
              >
                Fee & Membership
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Account Menu */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              {onOpenNotifications && (
                <button
                  onClick={onOpenNotifications}
                  className="relative p-2 text-slate-600 hover:text-blue-600 rounded-xl hover:bg-blue-50/80 transition-colors border border-transparent hover:border-blue-100"
                  aria-label="View notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              )}

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[150px]">
                  {user.name}
                </span>
                <span className="text-[11px] font-bold text-blue-600 flex items-center justify-end gap-1">
                  {user.role === 'owner' ? (
                    <span className="text-indigo-700 font-extrabold flex items-center gap-0.5">
                      <Shield className="w-3 h-3 text-indigo-600" />
                      Owner Cabin
                    </span>
                  ) : user.role === 'teacher' ? (
                    'Teacher Cabin'
                  ) : (
                    studentProfile?.rollNumber || 'Student'
                  )}
                </span>
              </div>

              <button
                onClick={() => {
                  logout();
                  setCurrentView('landing');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white/90 border border-slate-200/90 rounded-xl hover:bg-slate-50 hover:text-slate-900 shadow-2xs transition-all whitespace-nowrap"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('login')}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/25 whitespace-nowrap cursor-pointer"
              >
                Login
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
