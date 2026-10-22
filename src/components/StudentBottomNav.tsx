import React from 'react';
import { BookOpen, CalendarCheck, CreditCard, LayoutDashboard } from 'lucide-react';

interface StudentBottomNavProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  pendingHwCount?: number;
}

export const StudentBottomNav: React.FC<StudentBottomNavProps> = ({
  currentView,
  setCurrentView,
  pendingHwCount = 0
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-blue-100/90 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <button
        onClick={() => setCurrentView('student-dashboard')}
        className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
          currentView === 'student-dashboard' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setCurrentView('student-homework')}
        className={`relative flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
          currentView === 'student-homework' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <BookOpen className="w-5 h-5 mb-0.5" />
        <span>Homework</span>
        {pendingHwCount > 0 && (
          <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-blue-600" />
        )}
      </button>

      <button
        onClick={() => setCurrentView('student-attendance')}
        className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
          currentView === 'student-attendance' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <CalendarCheck className="w-5 h-5 mb-0.5" />
        <span>Attendance</span>
      </button>

      <button
        onClick={() => setCurrentView('student-payments')}
        className={`flex flex-col items-center py-1 px-3 text-[11px] font-medium transition-colors ${
          currentView === 'student-payments' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
        }`}
      >
        <CreditCard className="w-5 h-5 mb-0.5" />
        <span>Fees</span>
      </button>
    </div>
  );
};
