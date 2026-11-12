import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { ClassLevel, LandingContent } from '../types';
import { AllUiTextEditor } from '../components/AllUiTextEditor';
import { PendingPaymentApprovals } from '../components/PendingPaymentApprovals';
import { TeacherHomework } from './TeacherHomework';
import {
  Shield,
  KeyRound,
  UserCheck,
  UserX,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Lock,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  BookOpen,
  DollarSign,
  Globe,
  Edit3,
  Trash2,
  Save,
  RotateCcw,
  Type,
  CreditCard
} from 'lucide-react';

interface TeacherItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  teacherTitle: string;
  assignedSubjects: string[];
  loginAccessGranted: boolean;
  passwordPreview: string;
  createdAt: string;
}

interface StudentItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  classId?: string;
  className: string;
  batchName: string;
  userEmail: string;
  passwordPreview: string;
  loginAccessGranted: boolean;
  membershipStatus: string;
  subscriptionStatus?: 'active' | 'expired' | 'pending' | 'none';
  membershipStartDate?: string | null;
  membershipExpiryDate?: string | null;
  approvedByOwnerAt?: string;
}

interface SummaryData {
  totalTeachers: number;
  activeTeachers: number;
  totalStudents: number;
  pendingStudentsCount: number;
  approvedStudentsCount: number;
}

export const OwnerAccessControl: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'fee-approvals' | 'homework' | 'ui-text' | 'fees'>('teachers');
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [teachers, setTeachers] = useState<TeacherItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fee Structure State
  const [classesList, setClassesList] = useState<ClassLevel[]>([]);
  const [editingClass, setEditingClass] = useState<ClassLevel | null>(null);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCode, setNewClassCode] = useState('');
  const [newClassFee, setNewClassFee] = useState<number | ''>(2500);
  const [newClassDesc, setNewClassDesc] = useState('');
  const [newClassSubjects, setNewClassSubjects] = useState('Mathematics, Science (Physics & Chem)');

  // Website & Main Text Editor State
  const [websiteContent, setWebsiteContent] = useState<LandingContent>({
    heroTitle: 'AIHSAN ANSARI',
    heroTagline: 'A simple tool for teachers to manage assignments and for students to stay on top of their work.',
    contactPhone: '9905847357',
    stat1Value: '10+',
    stat1Label: 'Years Board Coaching',
    stat2Value: '98.4%',
    stat2Label: 'Board Pass Excellence',
    stat3Value: '25 Max',
    stat3Label: 'Students Per Batch',
    journeyTitle: 'Your Learning Journey Starts Here.',
    journeySubtitle: 'Everything you need to learn, practice, and stay ahead — all in one place.',
    journeyPoints: [
      'Homework & Assignments',
      'Study Materials & Notes',
      'Progress Tracking',
      'Secure Student Access'
    ],
    hybridFeature1Title: '"Aaj Class Mein Kya Padhaya Gaya"',
    hybridFeature1Desc: 'After every offline lecture, the teacher publishes the exact concept summary and key formulas taught that day. Absent or revising students are never left behind.',
    hybridFeature2Title: 'Daily Photo/PDF Solution Uploads',
    hybridFeature2Desc: 'Students solve problems in fair notebooks and submit clear pictures before the next morning\'s deadline. Teacher reviews and assigns verified marks with corrections.',
    hybridFeature3Title: 'Transparent Fee Receipts & Validity',
    hybridFeature3Desc: 'No disputes over unrecorded cash or pending dates. Pay online or in person; receive official computer-verified receipts with exact membership validity and next due dates.'
  });

  // Teacher Creation Modal
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newTeacherEmail, setNewTeacherEmail] = useState('');
  const [newTeacherPassword, setNewTeacherPassword] = useState('faculty@2026');
  const [newTeacherPhone, setNewTeacherPhone] = useState('');
  const [newTeacherTitle, setNewTeacherTitle] = useState('Senior Faculty Member');
  const [newTeacherSubjects, setNewTeacherSubjects] = useState<string>('Physics, Mathematics');

  // Teacher Edit Data & Password Modal State
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [editTeacherName, setEditTeacherName] = useState('');
  const [editTeacherEmail, setEditTeacherEmail] = useState('');
  const [editTeacherPhone, setEditTeacherPhone] = useState('');
  const [editTeacherTitle, setEditTeacherTitle] = useState('');
  const [editTeacherPassword, setEditTeacherPassword] = useState('');
  const [editTeacherSubjects, setEditTeacherSubjects] = useState('');

  // Teacher Delete Modal State
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherItem | null>(null);

  // Student Direct Creation Modal
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentPassword, setNewStudentPassword] = useState('student123');
  const [newStudentRollNumber, setNewStudentRollNumber] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('cls_10');
  const [newStudentSubscriptionStatus, setNewStudentSubscriptionStatus] = useState<'expired' | 'active'>('expired');
  const [newStudentGuardian, setNewStudentGuardian] = useState('');
  const [newStudentGuardianPhone, setNewStudentGuardianPhone] = useState('');

  // Student Edit Data & Password Modal State
  const [editingStudent, setEditingStudent] = useState<StudentItem | null>(null);
  const [editStudentName, setEditStudentName] = useState('');
  const [editStudentEmail, setEditStudentEmail] = useState('');
  const [editStudentPhone, setEditStudentPhone] = useState('');
  const [editStudentRollNumber, setEditStudentRollNumber] = useState('');
  const [editStudentClassId, setEditStudentClassId] = useState('cls_10');
  const [editStudentPassword, setEditStudentPassword] = useState('');

  // Student Delete Modal State
  const [deletingStudent, setDeletingStudent] = useState<StudentItem | null>(null);
  const [recentlyCreatedStudentId, setRecentlyCreatedStudentId] = useState<string | null>(null);

  // Filter & Search
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [sumRes, teachRes, studRes, classRes, contentRes, payReqRes] = await Promise.all([
        apiFetch('/api/owner/summary'),
        apiFetch('/api/owner/teachers'),
        apiFetch('/api/owner/students'),
        apiFetch('/api/owner/classes'),
        apiFetch('/api/owner/content'),
        apiFetch('/api/payments/pending-requests').catch(() => ({ totalPending: 0 }))
      ]);
      setSummary(sumRes);
      setTeachers(teachRes.teachers || []);
      setStudents(studRes.students || []);
      setPendingPaymentsCount(payReqRes.totalPending || payReqRes.pendingRequests?.length || 0);
      if (classRes.classes) setClassesList(classRes.classes);
      if (contentRes.landingContent) setWebsiteContent(contentRes.landingContent);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load owner control panel data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Create Teacher
  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const subjectsArray = newTeacherSubjects
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await apiFetch('/api/owner/teachers', {
        method: 'POST',
        body: JSON.stringify({
          name: newTeacherName,
          email: newTeacherEmail,
          password: newTeacherPassword,
          phone: newTeacherPhone,
          teacherTitle: newTeacherTitle,
          assignedSubjects: subjectsArray
        })
      });

      showNotification(res.message || 'Teacher account created successfully!');
      setShowCreateTeacherModal(false);
      setNewTeacherName('');
      setNewTeacherEmail('');
      setNewTeacherPhone('');
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create teacher account.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Toggle Teacher Access
  const handleToggleTeacherAccess = async (teacherId: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/owner/teachers/${teacherId}/toggle-access`, {
        method: 'PUT'
      });
      showNotification(res.message);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to toggle teacher access.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Teacher Edit Modal with prefilled values
  const openEditTeacherModal = (t: TeacherItem) => {
    setEditingTeacher(t);
    setEditTeacherName(t.name);
    setEditTeacherEmail(t.email);
    setEditTeacherPhone(t.phone || '');
    setEditTeacherTitle(t.teacherTitle || 'Senior Faculty Member');
    setEditTeacherPassword(t.passwordPreview);
    setEditTeacherSubjects(t.assignedSubjects?.join(', ') || 'Physics, Mathematics');
  };

  // 3. Update Teacher Data & Password
  const handleUpdateTeacherDataAndPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/owner/teachers/${editingTeacher.id}/credentials`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editTeacherName,
          email: editTeacherEmail,
          phone: editTeacherPhone,
          teacherTitle: editTeacherTitle,
          password: editTeacherPassword,
          assignedSubjects: editTeacherSubjects
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
        })
      });
      showNotification(res.message || 'Teacher data & password updated successfully.');
      setEditingTeacher(null);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update teacher data & password.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3b. Delete Teacher Permanently
  const handleDeleteTeacherConfirm = async () => {
    if (!deletingTeacher) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/owner/teachers/${deletingTeacher.id}`, {
        method: 'DELETE'
      });
      showNotification(res.message || 'Teacher account permanently deleted.');
      setDeletingTeacher(null);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete teacher account.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Toggle Student Access
  const handleToggleStudentAccess = async (studentId: string) => {
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/owner/students/${studentId}/toggle-access`, {
        method: 'PUT'
      });
      showNotification(res.message);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update student access.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Grant All Pending Students
  const handleGrantAllPending = async () => {
    setActionLoading(true);
    try {
      const res = await apiFetch('/api/owner/students/grant-all-pending', {
        method: 'POST'
      });
      showNotification(res.message);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to approve pending students.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Direct Create Student
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/owner/students', {
        method: 'POST',
        body: JSON.stringify({
          name: newStudentName,
          email: newStudentEmail,
          password: newStudentPassword,
          rollNumber: newStudentRollNumber.trim() || undefined,
          phone: newStudentPhone,
          classId: newStudentClass,
          initialSubscriptionStatus: newStudentSubscriptionStatus,
          guardianName: newStudentGuardian,
          guardianPhone: newStudentGuardianPhone
        })
      });

      showNotification(res.message || 'Student account created & authorized by Owner!');
      setShowCreateStudentModal(false);
      const createdId = res.student?.id;
      if (createdId) {
        setRecentlyCreatedStudentId(createdId);
      }
      setNewStudentName('');
      setNewStudentEmail('');
      setNewStudentRollNumber('');
      setNewStudentPhone('');
      setNewStudentSubscriptionStatus('expired');
      setNewStudentGuardian('');
      setNewStudentGuardianPhone('');

      // Auto-switch to students tab and reset filters so the newly created student is immediately visible below!
      setActiveTab('students');
      setStudentFilter('all');
      setStudentSearch('');

      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create student.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6b. Open Edit Student Modal
  const openEditStudentModal = (s: StudentItem) => {
    setEditingStudent(s);
    setEditStudentName(s.name);
    setEditStudentEmail(s.userEmail || s.email);
    setEditStudentPhone(s.phone || '');
    setEditStudentRollNumber(s.rollNumber || '');
    setEditStudentClassId(s.classId || 'cls_10');
    setEditStudentPassword(s.passwordPreview || 'student123');
  };

  // 6c. Update Student Data & Password
  const handleUpdateStudentCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/owner/students/${editingStudent.id}/credentials`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editStudentName,
          email: editStudentEmail,
          phone: editStudentPhone,
          rollNumber: editStudentRollNumber,
          classId: editStudentClassId,
          password: editStudentPassword
        })
      });
      showNotification(res.message || 'Student data & password updated successfully.');
      setEditingStudent(null);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update student credentials.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6d. Delete Student Permanently
  const handleDeleteStudentConfirm = async () => {
    if (!deletingStudent) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/owner/students/${deletingStudent.id}`, {
        method: 'DELETE'
      });
      showNotification(res.message || 'Student and ID/Password permanently deleted.');
      setDeletingStudent(null);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete student.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6e. Delete Login Credentials (ID & Password) Only
  const handleDeleteStudentCredentialsOnly = async () => {
    if (!deletingStudent) return;
    setActionLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/owner/students/${deletingStudent.id}/credentials`, {
        method: 'DELETE'
      });
      showNotification(res.message || 'Student login ID & password credentials removed.');
      setDeletingStudent(null);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to remove student credentials.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Handle Add or Edit Class Program & Fee
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || newClassFee === '') return;
    setActionLoading(true);
    try {
      const subs = newClassSubjects.split(',').map(s => s.trim()).filter(Boolean);
      if (editingClass) {
        await apiFetch(`/api/owner/classes/${editingClass.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: newClassName,
            code: newClassCode,
            monthlyFee: Number(newClassFee),
            description: newClassDesc,
            subjects: subs
          })
        });
        showNotification('Class fee structure updated successfully.');
      } else {
        await apiFetch('/api/owner/classes', {
          method: 'POST',
          body: JSON.stringify({
            name: newClassName,
            code: newClassCode,
            monthlyFee: Number(newClassFee),
            description: newClassDesc,
            subjects: subs
          })
        });
        showNotification('New class fee program added successfully.');
      }
      setShowAddClassModal(false);
      setEditingClass(null);
      setNewClassName('');
      setNewClassCode('');
      setNewClassFee(2500);
      setNewClassDesc('');
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save class program.');
    } finally {
      setActionLoading(false);
    }
  };

  // 8. Delete Class Program
  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    setActionLoading(true);
    try {
      await apiFetch(`/api/owner/classes/${id}`, { method: 'DELETE' });
      showNotification(`Class ${name} removed.`);
      await fetchAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete class.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter students
  const filteredStudents = students.filter(s => {
    const name = s.name || '';
    const roll = s.rollNumber || '';
    const email = s.userEmail || s.email || '';
    const phone = s.phone || '';
    const q = studentSearch.toLowerCase();
    const matchesSearch =
      name.toLowerCase().includes(q) ||
      roll.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.includes(q);

    if (!matchesSearch) return false;
    if (studentFilter === 'pending') return s.loginAccessGranted === false;
    if (studentFilter === 'approved') return s.loginAccessGranted === true;
    return true;
  });

  const pendingStudentsList = students.filter(s => s.loginAccessGranted === false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/40 text-slate-800 pb-16">
      {/* Top Banner / Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-blue-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Institute Owner / Director Cabin
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    👑 Supreme Admin
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">
                  Exclusive Control: Generate Teacher IDs & Passwords • Grant or Revoke Student Login Authorization
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Live State</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mt-6">
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-blue-100 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Faculty
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-extrabold text-slate-900">
                  {summary?.totalTeachers ?? teachers.length}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  {summary?.activeTeachers ?? teachers.filter(t => t.loginAccessGranted).length} Active
                </span>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-blue-100 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Enrolled Students
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-extrabold text-slate-900">
                  {summary?.totalStudents ?? students.length}
                </span>
                <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                  Total Roster
                </span>
              </div>
            </div>

            <div className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-xs ${
              (summary?.pendingStudentsCount || pendingStudentsList.length) > 0
                ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400/20'
                : 'bg-white/90 border-blue-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  Pending Logins
                </span>
                {(summary?.pendingStudentsCount || pendingStudentsList.length) > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-extrabold text-amber-900">
                  {summary?.pendingStudentsCount ?? pendingStudentsList.length}
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200">
                  Needs Action
                </span>
              </div>
            </div>

            {/* 4th KPI: Fee Approvals (30-Day Access) */}
            <div
              onClick={() => setActiveTab('fee-approvals')}
              className={`p-4 rounded-2xl border backdrop-blur-md transition-all shadow-xs cursor-pointer ${
                pendingPaymentsCount > 0
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-emerald-400 ring-2 ring-emerald-400/20 shadow-md'
                  : 'bg-white/90 border-blue-100 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Fee Approvals (30-Day)
                </span>
                {pendingPaymentsCount > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-extrabold text-emerald-900">
                  {pendingPaymentsCount}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                  pendingPaymentsCount > 0 ? 'bg-red-500 text-white border-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}>
                  {pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Action Required` : 'All Clear'}
                </span>
              </div>
            </div>

            <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-blue-100 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Authorized Logins
              </span>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-2xl font-extrabold text-emerald-700">
                  {summary?.approvedStudentsCount ?? students.filter(s => s.loginAccessGranted).length}
                </span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Alerts */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              ✕
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-900">
              ✕
            </button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-white/90 backdrop-blur-md rounded-2xl border border-blue-100 shadow-xs w-full sm:w-fit mb-6">
          <button
            onClick={() => setActiveTab('teachers')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'teachers'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Teacher IDs & Passwords</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'teachers' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {teachers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Student IDs & Passwords</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'students' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {students.length}
            </span>
            {pendingStudentsList.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500 text-white animate-pulse font-extrabold">
                {pendingStudentsList.length} Pending
              </span>
            )}
          </button>

          {/* Fee Approvals & 30-Day Access Tab */}
          <button
            onClick={() => setActiveTab('fee-approvals')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'fee-approvals'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/25'
                : 'text-slate-700 hover:text-emerald-700 hover:bg-emerald-50/50'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-300" />
            <span>Fee Approvals & 30-Day Access</span>
            {pendingPaymentsCount > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-black animate-pulse">
                {pendingPaymentsCount} New
              </span>
            ) : (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'fee-approvals' ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}`}>
                0
              </span>
            )}
          </button>

          {/* Class-Wise Homework Tab */}
          <button
            onClick={() => setActiveTab('homework')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'homework'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Class-Wise Homework</span>
          </button>

          <button
            onClick={() => setActiveTab('ui-text')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'ui-text'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25'
                : 'text-slate-700 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <Type className="w-4 h-4 text-amber-300" />
            <span>All UI Text Editor (A to Z)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-xs">
              👑 A to Z
            </span>
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'fees'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-blue-600 hover:bg-blue-50/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Class Fees & Programs</span>
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === 'fees' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
              {classesList.length}
            </span>
          </button>
        </div>

        {/* ================= TAB 1: TEACHER ID & PASSWORD MANAGER ================= */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>Teacher ID & Password Control (Faculty Credentials)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Only you (the Institute Owner) have the supreme authority to create teacher login credentials, reset faculty passwords, and toggle teacher cabin access.
                </p>
              </div>

              <button
                onClick={() => setShowCreateTeacherModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 flex items-center gap-2 self-start md:self-auto transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Teacher ID & Password</span>
              </button>
            </div>

            {/* Teachers Table */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-blue-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-blue-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Faculty Member</th>
                      <th className="py-3.5 px-4">Login ID / Email</th>
                      <th className="py-3.5 px-4">Current Password</th>
                      <th className="py-3.5 px-4">Subjects Taught</th>
                      <th className="py-3.5 px-4">Login Status</th>
                      <th className="py-3.5 px-4 text-right">Owner Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teachers.map(t => (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{t.name}</div>
                          <div className="text-[11px] text-blue-600 font-medium">{t.teacherTitle}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{t.phone}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-mono font-medium text-slate-800 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200 inline-block">
                            {t.email}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-slate-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-bold">
                              {t.passwordPreview}
                            </span>
                            <button
                              onClick={() => copyToClipboard(t.passwordPreview, t.id)}
                              className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                              title="Copy password"
                            >
                              {copiedId === t.id ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex flex-wrap gap-1 max-w-[220px]">
                            {t.assignedSubjects.map((sub, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100"
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {t.loginAccessGranted ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>Login Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <UserX className="w-3 h-3 text-red-600" />
                              <span>Suspended</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditTeacherModal(t)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-2xs"
                              title="Edit teacher data, email, subjects & password"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Data & Pass</span>
                            </button>
                            <button
                              onClick={() => handleToggleTeacherAccess(t.id)}
                              disabled={actionLoading}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
                                t.loginAccessGranted
                                  ? 'text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100'
                                  : 'text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {t.loginAccessGranted ? 'Suspend' : 'Enable'}
                            </button>
                            <button
                              onClick={() => setDeletingTeacher(t)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1 shadow-2xs"
                              title="Permanently delete teacher account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: STUDENT LOGIN AUTHORIZATION CENTER ================= */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Pending alert box if any student is waiting for owner approval */}
            {pendingStudentsList.length > 0 && (
              <div className="bg-amber-50/90 backdrop-blur-xl border-2 border-amber-300 p-5 rounded-3xl shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-amber-950">
                        {pendingStudentsList.length} Student(s) Awaiting Owner Login Authorization
                      </h3>
                      <p className="text-xs text-amber-800 mt-0.5">
                        These students cannot log into the mobile/web app until you grant them access. Click below to approve them individually or grant all at once.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleGrantAllPending}
                    disabled={actionLoading}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 flex items-center gap-1.5 self-start md:self-auto transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Grant All Pending ({pendingStudentsList.length})</span>
                  </button>
                </div>

                {/* List of pending students */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-amber-200/80">
                  {pendingStudentsList.map(s => (
                    <div key={s.id} className="bg-white/90 p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{s.name}</div>
                        <div className="text-[11px] text-slate-500">{s.rollNumber} • {s.className}</div>
                        <div className="text-[10px] text-amber-700 font-semibold mt-0.5">Blocked from login</div>
                      </div>
                      <button
                        onClick={() => handleToggleStudentAccess(s.id)}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-500 transition-colors shadow-xs"
                      >
                        Grant Access
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student Authorization Controls Header */}
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>Student Login Permission & ID Management</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Only the Owner can grant or revoke student login access. You can also generate student accounts directly with instant ID & Password.
                </p>
              </div>

              <button
                onClick={() => setShowCreateStudentModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-md shadow-blue-500/25 hover:from-blue-500 hover:to-indigo-500 flex items-center gap-2 self-start md:self-auto transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Issue Direct Student ID & Pass</span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-blue-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={e => setStudentSearch(e.target.value)}
                  placeholder="Search student name, roll number, or email..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    studentFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  All ({students.length})
                </button>
                <button
                  onClick={() => setStudentFilter('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    studentFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  Pending Approval ({pendingStudentsList.length})
                </button>
                <button
                  onClick={() => setStudentFilter('approved')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    studentFilter === 'approved'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  Authorized ({students.filter(s => s.loginAccessGranted).length})
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-blue-100 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-blue-100 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Student Details</th>
                      <th className="py-3.5 px-4">Class & Batch</th>
                      <th className="py-3.5 px-4">Login ID (Email)</th>
                      <th className="py-3.5 px-4">Initial Password</th>
                      <th className="py-3.5 px-4">Monthly Fee Status</th>
                      <th className="py-3.5 px-4">Owner Login Access</th>
                      <th className="py-3.5 px-4 text-right">Owner Controls & ID/Pass</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                          <UserX className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <div className="font-bold text-slate-600">No students found matching your search.</div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Click &quot;Issue Direct Student ID & Pass&quot; above to create a new student account.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredStudents.map(s => (
                        <tr key={s.id} className={`hover:bg-blue-50/30 transition-colors ${s.id === recentlyCreatedStudentId ? 'bg-emerald-50/40 ring-1 ring-emerald-300' : ''}`}>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900">{s.name}</span>
                              {s.id === recentlyCreatedStudentId && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse">
                                  Naya ID Pass ✨
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-blue-600 font-bold">{s.rollNumber}</div>
                            <div className="text-[10px] text-slate-400">{s.phone}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{s.className}</div>
                            <div className="text-[11px] text-slate-500">{s.batchName}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 inline-block">
                              {s.userEmail}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-slate-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 font-semibold">
                                {s.passwordPreview}
                              </span>
                              <button
                                onClick={() => copyToClipboard(s.passwordPreview, s.id)}
                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                title="Copy password"
                              >
                                {copiedId === s.id ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            {s.subscriptionStatus === 'active' || (s.membershipExpiryDate && new Date(s.membershipExpiryDate).getTime() > Date.now()) ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Active (1 Month Access)</span>
                                </span>
                                {s.membershipExpiryDate && (
                                  <div className="text-[10px] text-slate-500">
                                    Valid till: {new Date(s.membershipExpiryDate).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <AlertCircle className="w-3 h-3 text-rose-500" />
                                  <span>Expired / Unpaid</span>
                                </span>
                                <div className="text-[10px] text-slate-400">Needs Fee Approval</div>
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {s.loginAccessGranted ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Authorized by Owner</span>
                                </span>
                                {s.approvedByOwnerAt && (
                                  <div className="text-[10px] text-slate-400">
                                    Approved: {new Date(s.approvedByOwnerAt).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                <span>Login Blocked (Pending)</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditStudentModal(s)}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-2xs"
                                title="Edit student data, email, class & password"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit Data & Pass</span>
                              </button>

                              <button
                                onClick={() => handleToggleStudentAccess(s.id)}
                                disabled={actionLoading}
                                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-2xs ${
                                  s.loginAccessGranted
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                                    : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-500/20'
                                }`}
                              >
                                {s.loginAccessGranted ? 'Revoke Login' : 'Grant Login'}
                              </button>

                              <button
                                onClick={() => setDeletingStudent(s)}
                                disabled={actionLoading}
                                className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors flex items-center gap-1 shadow-2xs"
                                title="Delete student ID/Password or remove account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete ID/Pass</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: ALL UI TEXT EDITOR (A to Z) ================= */}
        {activeTab === 'ui-text' && (
          <AllUiTextEditor onSuccess={showNotification} onError={setErrorMsg} />
        )}

        {/* ================= TAB 4: CLASS PROGRAMS & FEE STRUCTURE ================= */}
        {activeTab === 'fees' && (
          <div className="space-y-6">
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Tuition Class Programs & Monthly Fee Structure</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Configure classes, monthly fees, subjects, and batch descriptions that are displayed publicly on the landing page and applied to student fee receipts.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingClass(null);
                  setNewClassName('');
                  setNewClassCode('');
                  setNewClassFee(2500);
                  setNewClassDesc('');
                  setNewClassSubjects('Mathematics, Science (Physics & Chem)');
                  setShowAddClassModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/25 flex items-center gap-2 self-start md:self-auto transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Class Program</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {classesList.map(cls => (
                <div
                  key={cls.id}
                  className="rounded-3xl bg-white/95 backdrop-blur-xl border border-blue-100 shadow-xs p-6 flex flex-col justify-between hover:border-blue-200 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {cls.code || 'CLS'}
                      </span>
                      <div className="font-mono text-xl font-black text-slate-900">
                        ₹{cls.monthlyFee.toLocaleString()}<span className="text-xs font-normal text-slate-500">/mo</span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{cls.name}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{cls.description || 'No description provided.'}</p>

                    <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                      {cls.subjects?.map((sub, i) => (
                        <span key={i} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingClass(cls);
                        setNewClassName(cls.name);
                        setNewClassCode(cls.code || '');
                        setNewClassFee(cls.monthlyFee);
                        setNewClassDesc(cls.description || '');
                        setNewClassSubjects(cls.subjects?.join(', ') || '');
                        setShowAddClassModal(true);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all"
                    >
                      Edit Fee
                    </button>
                    <button
                      onClick={() => handleDeleteClass(cls.id, cls.name)}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: FEE APPROVALS & 30-DAY ACCESS ================= */}
        {activeTab === 'fee-approvals' && (
          <div className="space-y-6">
            <PendingPaymentApprovals onApprovalSuccess={() => fetchAllData()} />
          </div>
        )}

        {/* ================= TAB 6: CLASS-WISE HOMEWORK ================= */}
        {activeTab === 'homework' && (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-blue-100 p-4 sm:p-6 shadow-xs">
            <TeacherHomework onNavigate={() => {}} embedded />
          </div>
        )}
      </div>

      {/* ================= MODAL: CREATE TEACHER ID & PASSWORD ================= */}
      {showCreateTeacherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-6 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  👨‍🏫
                </div>
                <h3 className="text-base font-bold text-slate-900">Create Teacher ID & Password</h3>
              </div>
              <button
                onClick={() => setShowCreateTeacherModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTeacher} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  value={newTeacherName}
                  onChange={e => setNewTeacherName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email ID (Login Username)</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={newTeacherEmail}
                    onChange={e => setNewTeacherEmail(e.target.value)}
                    placeholder="e.g. rajesh.physics@prerna.edu"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <Mail className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setNewTeacherPassword(`teach_${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newTeacherPassword}
                    onChange={e => setNewTeacherPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-50/60 font-mono font-bold border border-amber-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                  <Lock className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newTeacherPhone}
                    onChange={e => setNewTeacherPhone(e.target.value)}
                    placeholder="e.g. 9822011223"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty Title</label>
                  <input
                    type="text"
                    value={newTeacherTitle}
                    onChange={e => setNewTeacherTitle(e.target.value)}
                    placeholder="Senior Faculty"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={newTeacherSubjects}
                  onChange={e => setNewTeacherSubjects(e.target.value)}
                  placeholder="Physics, Mathematics, Chemistry"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[11px] text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  The teacher will be able to log in immediately and manage assigned homework and classes.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateTeacherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25"
                >
                  {actionLoading ? 'Creating...' : 'Save & Issue Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT TEACHER DATA & PASSWORD ================= */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Teacher Data & Password
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Update profile, login ID, subjects or set a new password.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTeacher(null)}
                className="text-slate-400 hover:text-slate-600 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateTeacherDataAndPassword} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teacher Full Name</label>
                <input
                  type="text"
                  required
                  value={editTeacherName}
                  onChange={e => setEditTeacherName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email / Login ID</label>
                <input
                  type="email"
                  required
                  value={editTeacherEmail}
                  onChange={e => setEditTeacherEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block font-semibold text-slate-700">Login Password</label>
                  <button
                    type="button"
                    onClick={() => setEditTeacherPassword(`teach_${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editTeacherPassword}
                  onChange={e => setEditTeacherPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-amber-50/70 border border-amber-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editTeacherPhone}
                    onChange={e => setEditTeacherPhone(e.target.value)}
                    placeholder="9822011223"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Faculty Title</label>
                  <input
                    type="text"
                    value={editTeacherTitle}
                    onChange={e => setEditTeacherTitle(e.target.value)}
                    placeholder="Senior Faculty"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={editTeacherSubjects}
                  onChange={e => setEditTeacherSubjects(e.target.value)}
                  placeholder="Physics, Mathematics"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25"
                >
                  {actionLoading ? 'Saving...' : 'Save Teacher Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE TEACHER CONFIRMATION ================= */}
      {deletingTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-100 shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Teacher Account?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to permanently delete this faculty member?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-1.5 mb-5 text-xs">
              <div className="font-bold text-slate-900 text-sm">{deletingTeacher.name}</div>
              <div className="text-slate-600 font-mono">{deletingTeacher.email}</div>
              <div className="text-slate-500">{deletingTeacher.teacherTitle} • {deletingTeacher.phone || 'No phone'}</div>
              <div className="text-[11px] text-red-700 font-medium pt-1 border-t border-red-100 mt-2">
                ⚠️ This teacher will no longer be able to log in or manage classroom homework.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingTeacher(null)}
                disabled={actionLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeacherConfirm}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow-md shadow-red-500/25 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Deleting...' : 'Yes, Permanently Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DIRECT ISSUE STUDENT ID & PASSWORD ================= */}
      {showCreateStudentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-6 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  🎓
                </div>
                <h3 className="text-base font-bold text-slate-900">Direct Student ID & Password</h3>
              </div>
              <button
                onClick={() => setShowCreateStudentModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                  placeholder="e.g. Sameer Kulkarni"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Email (Login ID)</label>
                  <input
                    type="email"
                    required
                    value={newStudentEmail}
                    onChange={e => setNewStudentEmail(e.target.value)}
                    placeholder="sameer@student.com"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    required
                    value={newStudentPassword}
                    onChange={e => setNewStudentPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-50 font-mono font-bold border border-amber-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Standard</label>
                  <select
                    value={newStudentClass}
                    onChange={e => setNewStudentClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {classesList.length > 0 ? (
                      classesList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="cls_08">Class 8 (Pre-Foundation Batch)</option>
                        <option value="cls_09">Class 9 (Foundation Batch)</option>
                        <option value="cls_10">Class 10 (Board Excellence)</option>
                        <option value="cls_12">Class 12 (Board & Entrance)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Phone</label>
                  <input
                    type="text"
                    value={newStudentPhone}
                    onChange={e => setNewStudentPhone(e.target.value)}
                    placeholder="9823000000"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Student ID / Roll No <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={newStudentRollNumber}
                    onChange={e => setNewStudentRollNumber(e.target.value)}
                    placeholder="Auto (e.g. PTA-10-05)"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Subscription Status</label>
                  <select
                    value={newStudentSubscriptionStatus}
                    onChange={e => setNewStudentSubscriptionStatus(e.target.value as 'expired' | 'active')}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="expired">Unpaid / Expired (Requires Fee Approval)</option>
                    <option value="active">Active (Pre-Approve 1 Month Subscription)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={newStudentGuardian}
                    onChange={e => setNewStudentGuardian(e.target.value)}
                    placeholder="Father/Mother"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="text"
                    value={newStudentGuardianPhone}
                    onChange={e => setNewStudentGuardianPhone(e.target.value)}
                    placeholder="9823111111"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Since this is created directly by the Owner, login access is <strong>instantly authorized</strong> with no extra approval step needed.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateStudentModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/25"
                >
                  {actionLoading ? 'Creating...' : 'Create & Authorize'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT STUDENT DATA & PASSWORD ================= */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Edit Student & Password</h3>
                  <p className="text-[11px] text-slate-500">Update login ID, password preview and academic profile</p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateStudentCredentials} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={editStudentName}
                  onChange={e => setEditStudentName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Login ID (Email/Username)</label>
                  <input
                    type="text"
                    required
                    value={editStudentEmail}
                    onChange={e => setEditStudentEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="text"
                    required
                    value={editStudentPassword}
                    onChange={e => setEditStudentPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-amber-50 font-mono font-bold border border-amber-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Standard</label>
                  <select
                    value={editStudentClassId}
                    onChange={e => setEditStudentClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  >
                    {classesList.length > 0 ? (
                      classesList.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="cls_08">Class 8 (Pre-Foundation Batch)</option>
                        <option value="cls_09">Class 9 (Foundation Batch)</option>
                        <option value="cls_10">Class 10 (Board Excellence)</option>
                        <option value="cls_12">Class 12 (Board & Entrance)</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={editStudentRollNumber}
                    onChange={e => setEditStudentRollNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={editStudentPhone}
                  onChange={e => setEditStudentPhone(e.target.value)}
                  placeholder="Student or parent phone"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25"
                >
                  {actionLoading ? 'Saving...' : 'Save Changes & Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE STUDENT ID & PASSWORD ================= */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-100 shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Student ID & Password?
                </h3>
                <p className="text-xs text-slate-500">
                  Choose how you want to remove this student from the system.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-1.5 mb-5 text-xs">
              <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                <span>{deletingStudent.name}</span>
                <span className="font-mono text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {deletingStudent.rollNumber}
                </span>
              </div>
              <div className="text-slate-600 font-mono">Login ID: {deletingStudent.userEmail || deletingStudent.email}</div>
              <div className="text-slate-500 font-mono">Password: {deletingStudent.passwordPreview}</div>
              <div className="text-slate-500">{deletingStudent.className} • {deletingStudent.phone || 'No phone'}</div>
              <div className="text-[11px] text-red-700 font-medium pt-1.5 border-t border-red-100 mt-2">
                ⚠️ Choose an option below:
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleDeleteStudentConfirm}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow-md shadow-red-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{actionLoading ? 'Deleting...' : 'Delete Student Account Permanently'}</span>
              </button>

              <button
                type="button"
                onClick={handleDeleteStudentCredentialsOnly}
                disabled={actionLoading}
                className="w-full px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Remove Login ID & Password Only (Keep Profile)</span>
              </button>

              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={actionLoading}
                className="w-full px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT CLASS ================= */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-6 text-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <DollarSign className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingClass ? 'Edit Class Fee Program' : 'Add New Class Fee Program'}
                </h3>
              </div>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Class Program Name</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="e.g. Class 10 (Board Excellence)"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Code / Identifier</label>
                  <input
                    type="text"
                    value={newClassCode}
                    onChange={e => setNewClassCode(e.target.value)}
                    placeholder="e.g. CLS-10"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Fee (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newClassFee}
                    onChange={e => setNewClassFee(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Subjects (comma-separated)</label>
                <input
                  type="text"
                  value={newClassSubjects}
                  onChange={e => setNewClassSubjects(e.target.value)}
                  placeholder="Mathematics, Science, English"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Program Description</label>
                <textarea
                  rows={2}
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  placeholder="Focus on NCERT Exemplar, board mock tests, and daily numerical drills."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25"
                >
                  {actionLoading ? 'Saving...' : editingClass ? 'Update Class' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
