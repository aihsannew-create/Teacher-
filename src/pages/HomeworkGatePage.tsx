import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { Homework, ClassLevel } from '../types';
import { 
  BookOpen, 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle,
  Clock,
  LogOut,
  Maximize2,
  Plus,
  X,
  Trash2,
  FileText,
  Target
} from 'lucide-react';

interface HomeworkGatePageProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const HomeworkGatePage: React.FC<HomeworkGatePageProps> = ({ onNavigate }) => {
  const { user, login, logout } = useAuth();

  // Role selector on login: 'student' | 'teacher' | 'owner'
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | 'owner'>('student');
  
  // ID and Password: NEVER auto-filled, must be typed in manually
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 5-Attempt Security Lockout with Timer
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [attemptsLeftMsg, setAttemptsLeftMsg] = useState<string | null>(null);

  // Homework data when logged in
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [fetchingHw, setFetchingHw] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Class category selection ("Homework me class ko category me divide kro")
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Teacher Upload Modal (Only for Teachers)
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newHwClass, setNewHwClass] = useState('cls_10');
  const [newHwSubject, setNewHwSubject] = useState('Mathematics');
  const [newHwChapter, setNewHwChapter] = useState('');
  const [newHwForWhom, setNewHwForWhom] = useState('All Students');
  const [newHwText, setNewHwText] = useState('');
  const [newHwImageUrl, setNewHwImageUrl] = useState('');
  const [uploadingHw, setUploadingHw] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setError(null);
          setAttemptsLeftMsg('Security lockout expired. You can try logging in now.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutSeconds]);

  // Load homework when user is logged in
  useEffect(() => {
    if (user) {
      loadHomework();
    }
  }, [user]);

  const loadHomework = async () => {
    setFetchingHw(true);
    try {
      const [hwRes, clsRes] = await Promise.all([
        apiFetch('/api/homework'),
        apiFetch('/api/classes').catch(() => ({ classes: [] }))
      ]);
      setHomeworkList(hwRes.homework || []);
      setClasses(clsRes.classes || []);
    } catch (err) {
      console.error('Failed to load homework:', err);
    } finally {
      setFetchingHw(false);
    }
  };

  const handleRoleSelect = (role: 'student' | 'teacher' | 'owner') => {
    setSelectedRole(role);
    setError(null);
    setAttemptsLeftMsg(null);
    // Clear inputs - NO auto-fill when switching roles
    setUsername('');
    setPassword('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    if (!username.trim() || !password) {
      setError('Please enter your ID and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setAttemptsLeftMsg(null);

    try {
      await login(username.trim(), password);
      setFailedAttempts(0);
      setUsername('');
      setPassword('');
    } catch (err: any) {
      const nextFails = failedAttempts + 1;
      setFailedAttempts(nextFails);

      if (err.data?.code === 'SECURITY_LOCKOUT' || err.status === 429 || nextFails >= 5) {
        const sec = err.data?.remainingSeconds || 60;
        setLockoutSeconds(sec);
        setError(`Security lockout: 5 failed attempts reached. Please wait ${sec}s before retrying.`);
        setAttemptsLeftMsg(null);
      } else {
        const remaining = Math.max(0, 5 - nextFails);
        setError(err.message || 'Invalid ID or password.');
        setAttemptsLeftMsg(`Warning: ${remaining} attempt(s) remaining before temporary lockout.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getHomeworkImage = (hw: Homework) => {
    const imgAtt = hw.attachments?.find(
      (a) => a.fileType === 'image' || a.fileUrl?.startsWith('data:image') || a.name?.match(/\.(jpeg|jpg|png|webp)$/i)
    );
    return imgAtt?.fileUrl || null;
  };

  // Delete ENTIRE Homework (Teacher / Owner) - NO window.confirm popup (works 100% in iframes)
  const handleDeleteHomework = async (hwId: string) => {
    setActionLoadingId(hwId);
    setConfirmDeleteId(null);

    const prevList = homeworkList;
    // Optimistic UI update: instantly removes from view
    setHomeworkList((prev) => prev.filter((h) => h.id !== hwId));

    try {
      await apiFetch(`/api/homework/${encodeURIComponent(hwId)}`, { method: 'DELETE' });
    } catch (err: any) {
      console.error('Failed to delete homework:', err);
      // Rollback on failure
      setHomeworkList(prevList);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHwChapter.trim()) return;

    setUploadingHw(true);
    try {
      const selectedClassObj = classes.find((c) => c.id === newHwClass);
      const attachments = newHwImageUrl.trim()
        ? [{ id: 'att_' + Date.now(), name: 'Homework_Photo.jpg', fileType: 'image' as const, fileUrl: newHwImageUrl.trim(), size: '450 KB' }]
        : [];

      const hwText = newHwText.trim() || 'Practice given questions and complete fair notebook exercises.';
      const forWhom = newHwForWhom.trim() || 'All Students';

      await apiFetch('/api/homework', {
        method: 'POST',
        body: JSON.stringify({
          classId: newHwClass,
          className: selectedClassObj?.name || 'Class 10',
          subject: newHwSubject,
          chapter: newHwChapter.trim(),
          topic: forWhom,
          teachingSummary: hwText,
          instructions: hwText,
          attachments,
          batchIds: ['all'],
          maxMarks: 20
        })
      });

      setShowUploadModal(false);
      setNewHwChapter('');
      setNewHwForWhom('All Students');
      setNewHwText('');
      setNewHwImageUrl('');
      await loadHomework();
    } catch (err: any) {
      alert(err.message || 'Failed to publish homework');
    } finally {
      setUploadingHw(false);
    }
  };

  // ========================================================
  // VIEW 1: NOT LOGGED IN -> CLEAN LOGIN PAGE (NO AUTO-FILL)
  // ========================================================
  if (!user) {
    return (
      <div className="min-h-[85vh] bg-slate-50 flex flex-col justify-center items-center py-10 px-4 text-slate-800">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2 border border-blue-100">
              <BookOpen className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Homework</h1>
            <p className="text-xs text-slate-500">
              Select your role and enter your ID and password.
            </p>
          </div>

          {/* 3 Role Options at the top: Student / Teacher / Owner */}
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => handleRoleSelect('student')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedRole === 'student'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('teacher')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedRole === 'teacher'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('owner')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedRole === 'owner'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Owner
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 5-Attempt Warning Message */}
          {attemptsLeftMsg && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{attemptsLeftMsg}</span>
            </div>
          )}

          {/* Security Lockout Timer Countdown */}
          {lockoutSeconds > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-center space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-700">
                <Clock className="w-4 h-4 animate-spin text-rose-600" />
                <span>Security Lockout Active</span>
              </div>
              <div className="text-3xl font-mono font-black text-rose-700">
                {formatTimer(lockoutSeconds)}
              </div>
              <p className="text-[11px] text-rose-600 font-medium">
                5 galat password attempts ki wajah se security lock laga hai. Kripya timer poora hone ka intezar karein.
              </p>
            </div>
          )}

          {/* Login Form: ID & Password (NO AUTO-FILL) */}
          <form onSubmit={handleLoginSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ID (Username / Email / Phone)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  disabled={lockoutSeconds > 0}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter ID"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  disabled={lockoutSeconds > 0}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || lockoutSeconds > 0}
              className="w-full py-3 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span>Logging in...</span>
              ) : lockoutSeconds > 0 ? (
                <span>Locked ({formatTimer(lockoutSeconds)})</span>
              ) : (
                <>
                  <span>Login to Homework</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: LOGGED IN -> STRICTLY VIEW-ONLY FOR STUDENTS (NO UPLOAD/CHANGES)
  // "sirf chapter name class subject oe niche image"
  // Class categories definition ("Homework me class ko category me divide kro")
  const classCategories = [
    { id: 'all', label: 'All Classes' },
    { id: 'cls_08', label: 'Class 8' },
    { id: 'cls_09', label: 'Class 9' },
    { id: 'cls_10', label: 'Class 10' },
    { id: 'cls_12_pcm', label: 'Class 12' }
  ];

  const isHomeworkInClass = (hw: Homework, targetClassId: string) => {
    if (targetClassId === 'all') return true;
    if (hw.classId === targetClassId) return true;
    const lowerClassId = (hw.classId || '').toLowerCase();
    const lowerClassName = (hw.className || '').toLowerCase();
    if (targetClassId === 'cls_08' && (lowerClassId.includes('08') || lowerClassName.includes('8'))) return true;
    if (targetClassId === 'cls_09' && (lowerClassId.includes('09') || lowerClassName.includes('9'))) return true;
    if (targetClassId === 'cls_10' && (lowerClassId.includes('10') || lowerClassName.includes('10'))) return true;
    if (targetClassId === 'cls_12_pcm' && (lowerClassId.includes('12') || lowerClassName.includes('12'))) return true;
    return false;
  };

  const getCountForClass = (targetClassId: string) => {
    if (targetClassId === 'all') return homeworkList.length;
    return homeworkList.filter((hw) => isHomeworkInClass(hw, targetClassId)).length;
  };

  const filteredHomeworkList = homeworkList.filter((hw) => isHomeworkInClass(hw, selectedClassId));
  const activeCategory = classCategories.find((c) => c.id === selectedClassId) || classCategories[0];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              <span>Homework</span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged in as <strong className="text-slate-800">{user.name}</strong> ({user.role.toUpperCase()})
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Only Teacher has option to upload homework */}
            {user.role === 'teacher' && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Homework</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => logout()}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Class Category Bar: Divided by Class ("jis class ko select kre usi ka homework open ho") */}
        <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-bold text-slate-700">
              Select Class:
            </span>
            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-100">
              {activeCategory.label} ({filteredHomeworkList.length})
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {classCategories.map((cat) => {
              const isSelected = selectedClassId === cat.id;
              const count = getCountForClass(cat.id);

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedClassId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Homework Items: STRICTLY Chapter Name, Class, Subject, and Image below it */}
        {fetchingHw ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading homework...</div>
        ) : filteredHomeworkList.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-slate-200 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No Homework for {activeCategory.label}</h3>
            <p className="text-xs text-slate-400">Select another class or wait for teacher updates.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredHomeworkList.map((hw) => {
              const imageUrl = getHomeworkImage(hw);

              return (
                <div
                  key={hw.id}
                  className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4"
                >
                  {/* Header: Chapter Name + Delete Button for Teacher/Owner */}
                  <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      {/* Chapter Name */}
                      <h2 className="text-lg font-black text-slate-900">
                        {hw.chapter}
                      </h2>

                      {/* Class and Subject */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                          {hw.className}
                        </span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                          {hw.subject}
                        </span>
                      </div>
                    </div>

                    {/* Delete Homework Button (Teacher / Owner ONLY - Students have NO delete button) */}
                    {(user.role === 'teacher' || user.role === 'owner') && (
                      <div className="shrink-0 flex items-center">
                        {confirmDeleteId === hw.id ? (
                          <div className="flex items-center gap-1.5 bg-rose-50 border border-rose-300 p-1.5 rounded-xl shadow-xs">
                            <span className="text-[11px] font-bold text-rose-700 pl-1">
                              Pura homework delete karein?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteHomework(hw.id)}
                              disabled={actionLoadingId === hw.id}
                              className="px-2.5 py-1 text-[11px] font-black text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingId === hw.id ? 'Deleting...' : 'Haan, Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(hw.id)}
                            disabled={actionLoadingId === hw.id}
                            className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 border border-rose-200 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                            title="Delete Entire Homework"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Homework</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Kis ke liye homework hai */}
                  <div className="text-xs text-slate-700 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-xl flex items-center gap-2">
                    <Target className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      <strong className="text-slate-900">Kis ke liye homework hai:</strong>{' '}
                      <span className="text-slate-700 font-medium">{hw.topic || 'All Students in this class'}</span>
                    </span>
                  </div>

                  {/* Kya Homework Hai (Homework Text) */}
                  <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 text-xs text-slate-800 space-y-1.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Kya Homework Hai:</span>
                    </div>
                    <p className="whitespace-pre-line text-slate-700 leading-relaxed font-normal">
                      {hw.instructions || hw.teachingSummary || 'Practice assigned work and complete notebook exercises.'}
                    </p>
                  </div>

                  {/* Homework Image (Directly below text, with Zoom option) */}
                  {imageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 relative group">
                      <img
                        src={imageUrl}
                        alt={hw.chapter}
                        className="w-full max-h-[480px] object-cover sm:object-contain bg-slate-950 rounded-2xl cursor-pointer transition-transform group-hover:scale-[1.01]"
                        onClick={() => setViewingImage(imageUrl)}
                      />
                      <button
                        type="button"
                        onClick={() => setViewingImage(imageUrl)}
                        className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Zoom Image</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Teacher: Upload Homework Modal (Only accessible to Teachers) */}
      {showUploadModal && user?.role === 'teacher' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Upload New Homework</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateHomework} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class</label>
                  <select
                    value={newHwClass}
                    onChange={(e) => setNewHwClass(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="cls_10">Class 10</option>
                    <option value="cls_09">Class 9</option>
                    <option value="cls_08">Class 8</option>
                    <option value="cls_12_pcm">Class 12 (PCM)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    value={newHwSubject}
                    onChange={(e) => setNewHwSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Mathematics">Mathematics</option>
                    <option value="Science">Science (Physics & Chem)</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Chapter Name</label>
                <input
                  type="text"
                  required
                  value={newHwChapter}
                  onChange={(e) => setNewHwChapter(e.target.value)}
                  placeholder="e.g. Chapter 4: Quadratic Equations"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Kis ke liye homework hai */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kis ke liye homework hai (Target / Batch / Purpose)
                </label>
                <input
                  type="text"
                  value={newHwForWhom}
                  onChange={(e) => setNewHwForWhom(e.target.value)}
                  placeholder="e.g. All Students / Board Special / Ch-4 Practice"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Kya Homework Hai (Text) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kya Homework Hai (Homework Text / Instructions / Questions)
                </label>
                <textarea
                  rows={3}
                  value={newHwText}
                  onChange={(e) => setNewHwText(e.target.value)}
                  placeholder="e.g. Exercise 4.3 ke questions 1 se 6 notebook me solve karein. Quadratic formula use karein."
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Homework Photo / Image (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Homework Photo / Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={newHwImageUrl}
                  onChange={(e) => setNewHwImageUrl(e.target.value)}
                  placeholder="Paste image link or select photo from device below"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none"
                />
                <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-500">
                  <input
                    type="file"
                    accept="image/*"
                    id="hw-photo-file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => setNewHwImageUrl(reader.result as string);
                      reader.readAsDataURL(file);
                    }}
                  />
                  <label
                    htmlFor="hw-photo-file"
                    className="text-blue-600 hover:underline cursor-pointer font-bold"
                  >
                    Select photo from device
                  </label>
                  {newHwImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewHwImageUrl('')}
                      className="ml-auto text-rose-500 hover:text-rose-700 text-[11px] font-semibold cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingHw}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {uploadingHw ? 'Uploading...' : 'Publish Homework'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Screen Image Zoom Modal */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setViewingImage(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/75 hover:bg-black text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={viewingImage} alt="Zoomed Homework" className="max-w-full max-h-[85vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};
