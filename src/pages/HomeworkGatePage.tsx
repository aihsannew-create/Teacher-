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
  Target,
  Image as ImageIcon,
  Upload,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Check,
  CreditCard,
  QrCode
} from 'lucide-react';
import { AccessCountdownTimer } from '../components/AccessCountdownTimer';
import { SubmitPaymentProofModal } from '../components/SubmitPaymentProofModal';

interface HomeworkGatePageProps {
  onNavigate: (view: string, extra?: any) => void;
}

interface UploadedImageItem {
  id: string;
  name: string;
  fileUrl: string;
  size: string;
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

  // Gallery Lightbox Modal (Supports single or multiple images navigation)
  const [galleryViewer, setGalleryViewer] = useState<{
    images: Array<{ url: string; title: string }>;
    index: number;
  } | null>(null);

  // Class category selection ("Homework me class ko category me divide kro")
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Teacher Upload Modal (Only for Teachers) - Multi-Image Support
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newHwClass, setNewHwClass] = useState('cls_10');
  const [newHwSubject, setNewHwSubject] = useState('Mathematics');
  const [newHwChapter, setNewHwChapter] = useState('');
  const [newHwForWhom, setNewHwForWhom] = useState('All Students');
  const [newHwText, setNewHwText] = useState('');
  const [newHwImages, setNewHwImages] = useState<UploadedImageItem[]>([]);
  const [manualImageUrl, setManualImageUrl] = useState('');
  const [compressingImages, setCompressingImages] = useState(false);
  const [uploadingHw, setUploadingHw] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // 30-Day Access & Homework Gate Lock Status
  const [membershipExpired, setMembershipExpired] = useState(false);
  const [pendingReq, setPendingReq] = useState<any>(null);
  const [membershipDetails, setMembershipDetails] = useState<{ expiryDate?: string; isExpired?: boolean } | null>(null);
  const [showSubmitProof, setShowSubmitProof] = useState(false);

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
      if (user?.role === 'student') {
        try {
          const statusRes = await apiFetch('/api/payments/my-status');
          setMembershipDetails({ expiryDate: statusRes.expiryDate, isExpired: statusRes.isExpired });
          setPendingReq(statusRes.pendingRequest);
          if (statusRes.isExpired) {
            setMembershipExpired(true);
            setFetchingHw(false);
            return;
          }
        } catch (e) {
          console.error('Membership check:', e);
        }
      }

      const [hwRes, clsRes] = await Promise.all([
        apiFetch('/api/homework'),
        apiFetch('/api/classes').catch(() => ({ classes: [] }))
      ]);
      setHomeworkList(hwRes.homework || []);
      setClasses(clsRes.classes || []);
      setMembershipExpired(false);
    } catch (err: any) {
      console.error('Failed to load homework:', err);
      if (err.status === 403 || err.data?.locked) {
        setMembershipExpired(true);
        if (err.data?.pendingRequest) {
          setPendingReq(err.data.pendingRequest);
        }
      }
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

  // Extract all attached images for a given homework assignment
  const getHomeworkImages = (hw: Homework): Array<{ name: string; fileUrl: string; size?: string }> => {
    return (hw.attachments || [])
      .filter((a) => a.fileType === 'image' || a.fileUrl?.startsWith('data:image') || a.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i))
      .map((a, i) => ({
        name: a.name || `Photo ${i + 1}`,
        fileUrl: a.fileUrl,
        size: a.size
      }));
  };

  // Multiple image upload handler with client-side canvas compression
  const handleMultipleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressingImages(true);
    const fileArray = Array.from(files);
    let processed = 0;

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const rawData = loadEvent.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
          const sizeKb = Math.round((compressedUrl.length * 3 / 4) / 1024);

          setNewHwImages((prev) => [
            ...prev,
            {
              id: `att_img_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
              name: file.name || `Board_Photo_${prev.length + 1}.jpg`,
              fileUrl: compressedUrl,
              size: `${sizeKb} KB`
            }
          ]);

          processed += 1;
          if (processed === fileArray.length) {
            setCompressingImages(false);
          }
        };
        img.onerror = () => {
          processed += 1;
          if (processed === fileArray.length) {
            setCompressingImages(false);
          }
        };
        img.src = rawData;
      };
      reader.readAsDataURL(file);
    });

    // Reset input value so same files can be chosen again if needed
    e.target.value = '';
  };

  const handleRemoveImage = (imgId: string) => {
    setNewHwImages((prev) => prev.filter((img) => img.id !== imgId));
  };

  const handleAddManualImageUrl = () => {
    const url = manualImageUrl.trim();
    if (!url) return;
    setNewHwImages((prev) => [
      ...prev,
      {
        id: `att_url_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: `Photo_${prev.length + 1}.jpg`,
        fileUrl: url,
        size: 'Link'
      }
    ]);
    setManualImageUrl('');
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
      const attachments = newHwImages.map((img, i) => ({
        id: img.id || `att_${Date.now()}_${i}`,
        name: img.name,
        fileType: 'image' as const,
        fileUrl: img.fileUrl,
        size: img.size
      }));

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
      setNewHwImages([]);
      setManualImageUrl('');
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

        {/* 30-Day Access Countdown Timer for Students */}
        {user.role === 'student' && (
          <AccessCountdownTimer
            expiryDate={membershipDetails?.expiryDate}
            onExpire={() => setMembershipExpired(true)}
          />
        )}

        {/* Gated Access Lock When 30 Days Complete */}
        {user.role === 'student' && membershipExpired ? (
          <div className="bg-white rounded-3xl border-2 border-red-200/80 shadow-xl p-8 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100 shadow-inner">
              <Lock className="w-8 h-8 text-red-600" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-red-100 text-red-700 tracking-wider inline-block">
                Homework Access Locked
              </span>
              <h2 className="text-2xl font-black text-slate-900">
                30 Din Ka Access Samapt Ho Chuka Hai
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aapki monthly coaching fees ki 30 din ki validity puri ho gayi hai. Homework questions, class notes aur blackboard photos open karne ke liye payment karein aur Transaction ID submit karein.
              </p>
            </div>

            {pendingReq ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left max-w-lg mx-auto space-y-2">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>Payment Verification In Progress</span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Aapka payment proof (UTR: <span className="font-mono font-bold">{pendingReq.utrNumber || pendingReq.transactionId}</span>) admin ko bhej diya gaya hai. Admin/Teacher cabin se approve hote hi <strong>30 din ka naya access</strong> shuru ho jayega!
                </p>
                <div className="text-[11px] text-amber-700 font-mono">
                  Submitted at: {new Date(pendingReq.submittedAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitProof(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Submit Payment ID / UTR & Unlock</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('student-payments')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-slate-500" />
                  <span>View Fee QR & Validity</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
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
              const hwImages = getHomeworkImages(hw);

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

                  {/* Homework Images (Multi-Image Gallery with Zoom & Browse) */}
                  {hwImages.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {hwImages.length === 1 ? (
                        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900/5 relative group">
                          <img
                            src={hwImages[0].fileUrl}
                            alt={hwImages[0].name}
                            className="w-full max-h-[480px] object-cover sm:object-contain bg-slate-950 rounded-2xl cursor-pointer transition-transform group-hover:scale-[1.01]"
                            onClick={() => setGalleryViewer({
                              images: hwImages.map((img) => ({ url: img.fileUrl, title: `${hw.chapter} - ${img.name}` })),
                              index: 0
                            })}
                          />
                          <button
                            type="button"
                            onClick={() => setGalleryViewer({
                              images: hwImages.map((img) => ({ url: img.fileUrl, title: `${hw.chapter} - ${img.name}` })),
                              index: 0
                            })}
                            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>Zoom Image</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-xs text-blue-900 font-bold bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200/60">
                            <span className="flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5 text-blue-600" />
                              <span>{hwImages.length} Images / Pages Attached</span>
                            </span>
                            <span className="text-[11px] text-blue-600 font-medium">Click any photo to zoom & browse</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                            {hwImages.map((img, idx) => (
                              <div
                                key={idx}
                                onClick={() => setGalleryViewer({
                                  images: hwImages.map((item) => ({ url: item.fileUrl, title: `${hw.chapter} - ${item.name}` })),
                                  index: idx
                                })}
                                className="group relative rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 bg-slate-900 aspect-4/3 cursor-pointer shadow-2xs hover:shadow-md transition-all flex flex-col justify-end"
                              >
                                <img
                                  src={img.fileUrl}
                                  alt={img.name}
                                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-lg bg-black/75 text-white text-[10px] font-black backdrop-blur-xs flex items-center gap-1">
                                  <span>Page {idx + 1}</span>
                                </div>
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 z-10">
                                  <Eye className="w-4 h-4" />
                                  <span>View</span>
                                </div>
                                <div className="relative z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 text-[10px] text-white truncate flex items-center justify-between">
                                  <span className="truncate max-w-[80%] font-medium">{img.name}</span>
                                  {img.size && <span className="text-[9px] text-blue-200 shrink-0 font-mono">{img.size}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
          </>
        )}

      </div>

      {/* Submit Payment Proof Modal for Students */}
      {showSubmitProof && (
        <SubmitPaymentProofModal
          isOpen={showSubmitProof}
          onClose={() => setShowSubmitProof(false)}
          onSuccess={() => {
            setShowSubmitProof(false);
            loadHomework();
          }}
        />
      )}

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

              {/* Multiple Images Upload Section */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Upload Photos / Notes (Multiple Images Support)</span>
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Ek saath multiple blackboard photos, notebook pages ya worksheets select karein
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-xs transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{compressingImages ? 'Compressing...' : '+ Select Photos'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={compressingImages}
                      onChange={handleMultipleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Optional Image URL Input */}
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="Or paste an image web link..."
                    className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualImageUrl}
                    disabled={!manualImageUrl.trim()}
                    className="px-3 py-1.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  >
                    + Add Link
                  </button>
                </div>

                {/* Uploaded Photos Preview List */}
                {newHwImages.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-blue-200/60">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-900 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{newHwImages.length} image{newHwImages.length > 1 ? 's' : ''} ready to attach</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setNewHwImages([])}
                        className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {newHwImages.map((img, idx) => (
                        <div
                          key={img.id || idx}
                          className="group relative rounded-xl overflow-hidden border border-blue-200 bg-white aspect-4/3 flex flex-col justify-end shadow-2xs"
                        >
                          <img
                            src={img.fileUrl}
                            alt={img.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold">
                            #{idx + 1}
                          </div>
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setGalleryViewer({
                                images: newHwImages.map(item => ({ url: item.fileUrl, title: item.name })),
                                index: idx
                              })}
                              className="p-1 rounded-md bg-black/60 hover:bg-black text-white"
                              title="Preview"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(img.id)}
                              className="p-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="relative z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 text-[10px] text-white truncate flex items-center justify-between">
                            <span className="truncate max-w-[70%] font-medium">{img.name}</span>
                            <span className="text-[9px] text-blue-200 shrink-0 font-mono">{img.size}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

      {/* Gallery Lightbox Modal (Supports single or multi-image carousel browsing) */}
      {galleryViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setGalleryViewer(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-3xl p-3 sm:p-4 overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Title, counter, close */}
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2 truncate max-w-[70%]">
                <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">
                  {galleryViewer.images[galleryViewer.index]?.title || 'Homework Photo'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {galleryViewer.images.length > 1 && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-bold">
                    {galleryViewer.index + 1} / {galleryViewer.images.length}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setGalleryViewer(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Main Image with Navigation Arrows */}
            <div className="relative overflow-auto max-h-[75vh] flex items-center justify-center p-2 bg-black/40 rounded-2xl my-2">
              <img
                src={galleryViewer.images[galleryViewer.index]?.url}
                alt="Homework Preview"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />

              {galleryViewer.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryViewer((prev) =>
                        prev
                          ? {
                              ...prev,
                              index: (prev.index - 1 + prev.images.length) % prev.images.length
                            }
                          : null
                      );
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-blue-600 text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
                    title="Previous Photo"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setGalleryViewer((prev) =>
                        prev
                          ? {
                              ...prev,
                              index: (prev.index + 1) % prev.images.length
                            }
                          : null
                      );
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-blue-600 text-white backdrop-blur-md shadow-lg transition-all cursor-pointer"
                    title="Next Photo"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Thumbnail Row if multiple images */}
            {galleryViewer.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
                {galleryViewer.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGalleryViewer((prev) => (prev ? { ...prev, index: idx } : null))}
                    className={`relative w-14 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      idx === galleryViewer.index ? 'border-blue-500 scale-105 shadow-md' : 'border-slate-700 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img.url} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
