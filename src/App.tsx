import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StudentBottomNav } from './components/StudentBottomNav';
import { NotificationDrawer } from './components/NotificationDrawer';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { ClassesInfoPage } from './pages/ClassesInfoPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

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

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('landing');
  const [navigationExtra, setNavigationExtra] = useState<any>(null);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Automatically route to appropriate dashboard if logged in and currently on landing/login/register
  useEffect(() => {
    if (user) {
      if (currentView === 'landing' || currentView === 'login' || currentView === 'register') {
        if (user.role === 'owner') {
          setCurrentView('owner-access');
        } else if (user.role === 'teacher') {
          setCurrentView('teacher-dashboard');
        } else {
          setCurrentView('student-dashboard');
        }
      }
    }
  }, [user]);

  const handleNavigate = (view: string, extra?: any) => {
    setCurrentView(view);
    if (extra !== undefined) {
      setNavigationExtra(extra);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 space-y-3">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-slate-700">Starting Prerna Tuition OS...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Main Responsive Navbar */}
      <Navbar
        currentView={currentView}
        setCurrentView={handleNavigate}
        onOpenNotifications={() => setIsNotifOpen(true)}
      />

      {/* Page Routing */}
      <main className="flex-1 pb-16 md:pb-0">
        {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'classes-info' && <ClassesInfoPage onNavigate={handleNavigate} />}
        {currentView === 'about-teacher' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'contact' && <LandingPage onNavigate={handleNavigate} />}
        {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}
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
      <AppContent />
    </AuthProvider>
  );
}
