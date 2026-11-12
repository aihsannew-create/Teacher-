import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UiTextProvider } from './context/UiTextContext';
import { Navbar } from './components/Navbar';
import { StudentBottomNav } from './components/StudentBottomNav';
import { NotificationDrawer } from './components/NotificationDrawer';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { ClassesInfoPage } from './pages/ClassesInfoPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HomeworkGatePage } from './pages/HomeworkGatePage';
import { FaqPage } from './pages/FaqPage';
import { ContactPage } from './pages/ContactPage';

// Owner Cabin Page
import { OwnerAccessControl } from './pages/OwnerAccessControl';

// Student Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { StudentHomework } from './pages/StudentHomework';
import { StudentAttendance } from './pages/StudentAttendance';
import { StudentPayments } from './pages/StudentPayments';
import { StudentProfilePage } from './pages/StudentProfile';

// Teacher Pages
import { TeacherDashboard } from './pages/TeacherDashboard';
import { TeacherHomework } from './pages/TeacherHomework';
import { TeacherSubmissions } from './pages/TeacherSubmissions';
import { TeacherStudents } from './pages/TeacherStudents';
import { TeacherAttendance } from './pages/TeacherAttendance';
import { TeacherPayments } from './pages/TeacherPayments';
import { TeacherClasses } from './pages/TeacherClasses';
import { TeacherReports } from './pages/TeacherReports';
import { TeacherSettingsPage } from './pages/TeacherSettings';

import { ArrowLeft } from 'lucide-react';
import { OpeningSplashScreen } from './components/OpeningSplashScreen';

function AppContent() {
  const { user, loading } = useAuth();
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [history, setHistory] = useState<string[]>(['landing']);
  const [navigationExtra, setNavigationExtra] = useState<any>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getDefaultHomeView = () => {
    if (!user) return 'landing';
    if (user.role === 'owner') return 'owner-access';
    if (user.role === 'teacher') return 'teacher-dashboard';
    return 'student-dashboard';
  };

  // Automatically route to appropriate dashboard if logged in and currently on landing/login/register
  useEffect(() => {
    if (user) {
      if (currentView === 'landing' || currentView === 'login' || currentView === 'register') {
        const target = user.role === 'owner' ? 'owner-access' : user.role === 'teacher' ? 'teacher-dashboard' : 'student-dashboard';
        setCurrentView(target);
        setHistory(prev => [...prev, target]);
      }
    }
  }, [user]);

  const handleNavigate = (view: string, extra?: any) => {
    if (view === 'back') {
      if (history.length > 1) {
        const newHist = [...history];
        newHist.pop(); // remove current view
        const prevView = newHist[newHist.length - 1];
        setHistory(newHist);
        setCurrentView(prevView);
      } else {
        const fallback = getDefaultHomeView();
        setHistory([fallback]);
        setCurrentView(fallback);
      }
      return;
    }

    if (view !== currentView) {
      setHistory(prev => [...prev, view]);
    }
    setCurrentView(view);
    if (extra !== undefined) {
      setNavigationExtra(extra);
    }
  };

  // Readable breadcrumb title for the current view
  const getViewTitle = (view: string) => {
    switch (view) {
      case 'classes-info': return 'Classes & Batch Schedules';
      case 'faq': return 'Frequently Asked Questions (FAQ)';
      case 'contact': return 'Contact & Admissions Desk';
      case 'homework-gate': return 'Homework';
      case 'login': return 'Account Login';
      case 'register': return 'Student Registration';
      case 'owner-access': return 'Owner Control & Credentials';
      case 'student-dashboard': return 'Student Portal Dashboard';
      case 'student-homework': return 'Daily Homework & Class Diary';
      case 'student-attendance': return 'Student Attendance Record';
      case 'student-payments': return 'Fee Receipts & Validity';
      case 'student-profile': return 'My Profile';
      case 'teacher-dashboard': return 'Academic Cabin Overview';
      case 'teacher-homework': return 'Daily Homework & Class Diary Manager';
      case 'teacher-submissions': return 'Student Homework Submissions';
      case 'teacher-students': return 'Enrolled Students & Batches';
      case 'teacher-attendance': return 'Daily Class Attendance';
      case 'teacher-payments': return 'Tuition Fee Ledger';
      case 'teacher-classes': return 'Class & Batch Management';
      case 'teacher-reports': return 'Academic & Fee Reports';
      case 'teacher-settings': return 'Tuition System Settings';
      default: return view.replace(/-/g, ' ');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Cinematic Opening Splash & Loading Screen */}
      <OpeningSplashScreen
        isVisible={showSplash || loading}
        onComplete={() => setShowSplash(false)}
      />

      {/* Main Responsive Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleNavigate}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Persistent Universal Top Back Bar on Every Page (except root landing) */}
      {currentView !== 'landing' && (
        <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-16 z-30 px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between text-xs shadow-2xs">
          <button
            type="button"
            onClick={() => handleNavigate('back')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 font-bold border border-slate-200 hover:border-blue-300 transition-all cursor-pointer shadow-2xs group"
            title="Go back to previous page"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 group-hover:text-blue-600 transition-transform" />
            <span>← Wapas Jayein (Back)</span>
          </button>

          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] truncate max-w-[220px] sm:max-w-none">
            <button
              onClick={() => handleNavigate('landing')}
              className="hover:text-blue-600 transition-colors"
            >
              Home
            </button>
            <span>/</span>
            <span className="font-bold text-slate-800 truncate">
              {getViewTitle(currentView)}
            </span>
          </div>
        </div>
      )}

      {/* Page Routing */}
      <main className="flex-1 pb-16 md:pb-0">
        {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'classes-info' && <ClassesInfoPage onNavigate={handleNavigate} />}
        {currentView === 'faq' && <FaqPage onNavigate={handleNavigate} />}
        {currentView === 'contact' && <ContactPage onNavigate={handleNavigate} />}
        {currentView === 'about-teacher' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'homework-gate' && <HomeworkGatePage onNavigate={handleNavigate} />}
        {currentView === 'login' && <LoginPage onNavigate={handleNavigate} extra={navigationExtra} />}
        {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}

        {/* Owner Views */}
        {currentView === 'owner-access' && <OwnerAccessControl />}

        {/* Student Views */}
        {currentView === 'student-dashboard' && <StudentDashboard onNavigate={handleNavigate} />}
        {currentView === 'student-homework' && <StudentHomework onNavigate={handleNavigate} />}
        {currentView === 'student-attendance' && <StudentAttendance />}
        {currentView === 'student-payments' && <StudentPayments />}
        {currentView === 'student-profile' && <StudentProfilePage onNavigate={handleNavigate} />}

        {/* Teacher Cabin Views */}
        {currentView === 'teacher-dashboard' && <TeacherDashboard onNavigate={handleNavigate} />}
        {currentView === 'teacher-homework' && <TeacherHomework onNavigate={handleNavigate} />}
        {currentView === 'teacher-submissions' && (
          <TeacherSubmissions homeworkId={navigationExtra} onNavigate={handleNavigate} />
        )}
        {currentView === 'teacher-students' && <TeacherStudents onNavigate={handleNavigate} />}
        {currentView === 'teacher-attendance' && <TeacherAttendance />}
        {currentView === 'teacher-payments' && (
          <TeacherPayments initialStudentId={navigationExtra?.studentId} />
        )}
        {currentView === 'teacher-classes' && <TeacherClasses />}
        {currentView === 'teacher-reports' && <TeacherReports />}
        {currentView === 'teacher-settings' && <TeacherSettingsPage />}
      </main>

      {/* Student Mobile Bottom Nav (Visible only on mobile for student role) */}
      {user && user.role === 'student' && (
        <StudentBottomNav currentView={currentView} setCurrentView={handleNavigate} />
      )}

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        onNavigate={handleNavigate}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UiTextProvider>
        <AppContent />
      </UiTextProvider>
    </AuthProvider>
  );
}
