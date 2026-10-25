import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { Homework, HomeworkSubmission, ClassLevel } from '../types';
import {
  BookOpen,
  Clock,
  FileText,
  Download,
  CheckCircle2,
  Upload,
  X,
  ShieldAlert,
  Award,
  ExternalLink,
  ArrowLeft,
  Calendar,
  Image as ImageIcon,
  Maximize2,
  Layers,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  Trash2,
  Sparkles,
  CreditCard
} from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { AccessCountdownTimer } from '../components/AccessCountdownTimer';
import { SubmitPaymentProofModal } from '../components/SubmitPaymentProofModal';

interface StudentHomeworkProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const StudentHomework: React.FC<StudentHomeworkProps> = ({ onNavigate }) => {
  const { studentProfile, membership, refreshProfile } = useAuth();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>(studentProfile?.classId || 'all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [loading, setLoading] = useState(true);
  const [membershipExpired, setMembershipExpired] = useState(false);
  const [membershipWarning, setMembershipWarning] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [accessValidity, setAccessValidity] = useState<any>(null);
  
  // Gallery viewer with multi-image previous/next navigation
  const [galleryViewer, setGalleryViewer] = useState<{
    images: Array<{ url: string; title: string }>;
    index: number;
  } | null>(null);

  // Submit Modal
  const [activeHwForSubmit, setActiveHwForSubmit] = useState<Homework | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; fileType: 'pdf' | 'image'; fileUrl: string; size: string }[]>([]);
  const [compressingFiles, setCompressingFiles] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchHomework = async () => {
    setLoading(true);
    try {
      const [data, clsRes, statusRes] = await Promise.all([
        apiFetch(`/api/homework${selectedClass !== 'all' ? `?classId=${selectedClass}` : ''}`),
        apiFetch('/api/classes').catch(() => ({ classes: [] })),
        apiFetch('/api/payments/my-status').catch(() => null)
      ]);
      setHomeworkList(data.homework || []);
      setClasses(clsRes.classes || []);
      if (data.accessValidity) {
        setAccessValidity(data.accessValidity);
      }
      if (statusRes?.pendingRequest) {
        setPendingPayment(statusRes.pendingRequest);
      } else {
        setPendingPayment(null);
      }
      setMembershipExpired(false);
    } catch (err: any) {
      if (err.status === 403 && (err.data?.error === 'membership_expired' || err.data?.locked)) {
        setMembershipExpired(true);
        if (err.data?.pendingRequest) {
          setPendingPayment(err.data.pendingRequest);
        } else {
          apiFetch('/api/payments/my-status')
            .then(res => {
              if (res?.pendingRequest) setPendingPayment(res.pendingRequest);
            })
            .catch(() => {});
        }
      } else {
        console.error('Failed to load homework:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomework();
  }, [membership, selectedClass]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setCompressingFiles(true);
    const fileArray = Array.from(files);
    let processed = 0;

    fileArray.forEach(file => {
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const reader = new FileReader();

      reader.onload = (loadEvent) => {
        const rawData = loadEvent.target?.result as string;

        if (isPdf) {
          const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
          setSelectedFiles(prev => [
            ...prev,
            {
              name: file.name,
              fileType: 'pdf',
              fileUrl: rawData,
              size: sizeStr
            }
          ]);
          processed += 1;
          if (processed === fileArray.length) {
            setCompressingFiles(false);
          }
        } else {
          // Compress image via canvas
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

            setSelectedFiles(prev => [
              ...prev,
              {
                name: file.name,
                fileType: 'image',
                fileUrl: compressedUrl,
                size: `${sizeKb} KB`
              }
            ]);

            processed += 1;
            if (processed === fileArray.length) {
              setCompressingFiles(false);
            }
          };
          img.onerror = () => {
            processed += 1;
            if (processed === fileArray.length) {
              setCompressingFiles(false);
            }
          };
          img.src = rawData;
        }
      };

      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeHwForSubmit) return;
    setSubmitting(true);

    try {
      await apiFetch(`/api/homework/${activeHwForSubmit.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          solutionText,
          attachments: selectedFiles.map((f, i) => ({
            id: `att_sub_${Date.now()}_${i}`,
            ...f
          }))
        })
      });

      setSubmitSuccess(`Homework for "${activeHwForSubmit.chapter}" submitted to Er. Rajesh Sharma!`);
      setActiveHwForSubmit(null);
      setSolutionText('');
      setSelectedFiles([]);
      await fetchHomework();
    } catch (err: any) {
      alert(err.message || 'Failed to submit homework');
    } finally {
      setSubmitting(false);
    }
  };

  const subjects = ['all', ...Array.from(new Set(homeworkList.map(h => h.subject)))];

  const filteredHw = homeworkList.filter(h => {
    if (selectedSubject !== 'all' && h.subject !== selectedSubject) return false;
    if (statusFilter === 'pending' && h.isSubmitted) return false;
    if (statusFilter === 'completed' && !h.isSubmitted) return false;
    return true;
  });

  const getDeadlineInfo = (deadlineIso: string) => {
    const diff = new Date(deadlineIso).getTime() - Date.now();
    if (diff <= 0) {
      return { text: 'Deadline Passed', isOverdue: true };
    }
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 24) {
      return { text: `Due in ${hours} hour${hours === 1 ? '' : 's'}`, isOverdue: false, isUrgent: true };
    }
    const days = Math.floor(hours / 24);
    return { text: `Due in ${days} day${days === 1 ? '' : 's'}`, isOverdue: false };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header with Back Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-blue-100/90">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('back')}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer group"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 group-hover:text-blue-600 transition-transform" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Daily Classroom Homework & Notes
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                  {studentProfile?.className || 'My Class'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                "Aaj class mein kya padhaya gaya", blackboard photos, homework instructions, and verified grading
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Enrolled Student:</span>
            <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
              {studentProfile?.name} ({studentProfile?.rollNumber})
            </span>
          </div>
        </div>

        {/* Class Selection Tabs ("Har Homework Class Ke Hisab Se") */}
        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 shadow-xs space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-800 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Select Class to View Daily Homework ("Class Ke Hisab Se"):</span>
            </span>
            <span className="text-[11px] text-slate-500">
              Active: <strong className="text-blue-700">{selectedClass === 'all' ? 'All Classes' : classes.find(c => c.id === selectedClass)?.name || selectedClass}</strong>
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              onClick={() => setSelectedClass('all')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedClass === 'all'
                  ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                  : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-200'
              }`}
            >
              <span>🎓 All Classes</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedClass === 'all' ? 'bg-blue-800 text-white' : 'bg-slate-200 text-slate-700'}`}>
                {homeworkList.length}
              </span>
            </button>

            {classes.map(c => {
              const count = homeworkList.filter(h => h.classId === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedClass(c.id)}
                  className={`px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedClass === c.id
                      ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-200'
                  }`}
                >
                  <span>{c.name}</span>
                  {c.id === studentProfile?.classId && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-emerald-500 text-white">
                      MY CLASS
                    </span>
                  )}
                  {selectedClass === 'all' && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Success toast banner */}
        {submitSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="font-medium">{submitSuccess}</span>
            </div>
            <button onClick={() => setSubmitSuccess(null)} className="text-emerald-600 hover:text-emerald-950">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Live 30-Day Access Countdown Timer (Active State) */}
        {!membershipExpired && (
          <AccessCountdownTimer
            expiryDate={membership?.expiryDate || accessValidity?.expiryDate}
            startDate={membership?.startDate}
            onExpire={() => setMembershipExpired(true)}
            onOpenPaymentModal={() => setShowProofModal(true)}
          />
        )}

        {/* Membership Expired / 30-Day Completed Gated Screen */}
        {membershipExpired ? (
          <div className="p-6 sm:p-10 rounded-3xl bg-white/95 backdrop-blur-xl border border-red-200 shadow-xl text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-red-50 border-2 border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-10 h-10 animate-bounce" />
            </div>

            <div className="space-y-2 max-w-xl mx-auto">
              <span className="px-3 py-1 text-xs font-black uppercase rounded-full bg-red-100 text-red-700 border border-red-300">
                🔒 Homework Section Band Hai (Locked)
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                30 Din Ka Tuition Access Samapt Ho Gaya Hai
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Niyam anusar <strong>{studentProfile?.className}</strong> ke daily homework, class summaries, blackboard photos aur solution submit karne ke liye fees jama hona avashyak hai. 30 din pura hote hi access automatically band kar diya gaya hai.
              </p>
            </div>

            {/* Pending Verification Notice if student has already submitted payment ID */}
            {pendingPayment ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-left space-y-2 max-w-xl mx-auto shadow-sm">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                  <span>⏳ Payment Verification Pending (Admin Review Kar Rahe Hain)</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Aapne Payment ID / UTR <strong className="font-mono text-blue-700 font-bold">{pendingPayment.utrNumber || pendingPayment.id}</strong> (₹{pendingPayment.amount}) submit kiya hua hai. Admin (AIHSAN ANSARI) dwara approve karte hi aapko <strong>30 din ka purna access</strong> mil jayega aur live timer chalu hoga.
                </p>
                <div className="text-[11px] text-amber-800 font-semibold pt-1">
                  Submitted at: {new Date(pendingPayment.createdAt).toLocaleString('en-IN')}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 max-w-xl mx-auto text-left text-xs space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>30 Din Ka Access Kaise Kholein?</span>
                </div>
                <p className="text-slate-600">
                  1. PhonePe / UPI par tuition fees transfer karein.<br />
                  2. Neeche diye gaye button par click karke apna <strong>Payment ID / UTR</strong> submit karein.<br />
                  3. Admin panel me notification aayegi aur Admin approve karte hi homework khul jayega!
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowProofModal(true)}
                className="w-full sm:w-auto px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>{pendingPayment ? 'Naya Payment ID Submit Karein' : 'Payment ID / UTR Submit Karein (30 Din Access)'}</span>
              </button>

              <button
                onClick={() => setShowPayModal(true)}
                className="w-full sm:w-auto px-5 py-3.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer shadow-xs"
              >
                Online Gateway (Cards / UPI)
              </button>

              <button
                onClick={() => onNavigate('student-payments')}
                className="w-full sm:w-auto px-4 py-3.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:underline"
              >
                Payment Ledger
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Filter Tabs in Frosted Glass Panel */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)] text-xs">
              {/* Subject filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-slate-500 font-semibold mr-1 shrink-0">Subject:</span>
                {subjects.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSubject(s)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap capitalize ${
                      selectedSubject === s
                        ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                        : 'bg-slate-50 border border-slate-200/90 text-slate-600 hover:bg-white hover:text-blue-600'
                    }`}
                  >
                    {s === 'all' ? 'All Subjects' : s}
                  </button>
                ))}
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold mr-1">Status:</span>
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    statusFilter === 'all' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    statusFilter === 'pending' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Pending ({homeworkList.filter(h => !h.isSubmitted).length})
                </button>
                <button
                  onClick={() => setStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    statusFilter === 'completed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Completed ({homeworkList.filter(h => h.isSubmitted).length})
                </button>
              </div>
            </div>

            {/* Homework List in Frosted Glass Cards */}
            {loading ? (
              <div className="text-center py-16 text-xs text-slate-400">Loading daily homework...</div>
            ) : filteredHw.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-500 bg-white/80 rounded-3xl border border-blue-100 p-8 space-y-2">
                <BookOpen className="w-8 h-8 text-blue-300 mx-auto" />
                <div className="font-bold text-slate-700">No homework matching selected filter.</div>
                <p className="text-slate-400">All assignments for this category are completed or none assigned today.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredHw.map(hw => {
                  const deadline = getDeadlineInfo(hw.deadlineDate);
                  const isSubmitted = hw.isSubmitted;
                  const submission = hw.mySubmission;

                  return (
                    <div
                      key={hw.id}
                      className="p-6 sm:p-7 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100/90 shadow-[0_10px_30px_rgba(37,99,235,0.04)] space-y-5"
                    >
                      {/* Top Bar of Card: Chapter Name, Class, Subject */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">
                            {hw.chapter}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5 text-xs">
                            <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-lg">
                              {hw.className}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                              {hw.subject}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* Attached Images (Multi-Image Gallery or Single High-Res Preview) */}
                      {(() => {
                        const hwImages = (hw.attachments || []).filter(
                          a => a.fileType === 'image' || a.fileUrl?.startsWith('data:image') || a.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i)
                        );

                        if (hwImages.length === 1) {
                          return (
                            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 relative group">
                              <img
                                src={hwImages[0].fileUrl}
                                alt={hw.chapter}
                                className="w-full max-h-[460px] object-cover sm:object-contain rounded-2xl cursor-pointer transition-transform group-hover:scale-[1.01]"
                                onClick={() => setGalleryViewer({
                                  images: hwImages.map(img => ({ url: img.fileUrl, title: `${hw.chapter} - ${img.name}` })),
                                  index: 0
                                })}
                              />
                              <button
                                type="button"
                                onClick={() => setGalleryViewer({
                                  images: hwImages.map(img => ({ url: img.fileUrl, title: `${hw.chapter} - ${img.name}` })),
                                  index: 0
                                })}
                                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-bold backdrop-blur-md flex items-center gap-1.5 shadow-md cursor-pointer"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Zoom Image</span>
                              </button>
                            </div>
                          );
                        }

                        if (hwImages.length > 1) {
                          return (
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between text-xs text-blue-900 font-bold bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-200/60">
                                <span className="flex items-center gap-1.5">
                                  <Camera className="w-3.5 h-3.5 text-blue-600" />
                                  <span>{hwImages.length} Blackboard Photos & Notes Pages</span>
                                </span>
                                <span className="text-[11px] text-blue-600 font-medium">Click any photo to zoom & browse</span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                                {hwImages.map((img, idx) => (
                                  <div
                                    key={idx}
                                    onClick={() => setGalleryViewer({
                                      images: hwImages.map(item => ({ url: item.fileUrl, title: `${hw.chapter} - ${item.name}` })),
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
                          );
                        }

                        return null;
                      })()}

                      {/* PDF Documents & Reference Links */}
                      {((hw.attachments && hw.attachments.some(a => a.fileType !== 'image' && !a.fileUrl?.startsWith('data:image') && !a.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i))) || (hw.referenceLinks && hw.referenceLinks.length > 0)) && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="text-xs font-bold text-slate-600">
                            Downloadable PDFs & Reference Links:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {hw.attachments
                              ?.filter(a => a.fileType !== 'image' && !a.fileUrl?.startsWith('data:image') && !a.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i))
                              .map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-700 hover:border-blue-400 hover:text-blue-700 shadow-2xs transition-colors"
                                >
                                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="font-semibold truncate max-w-[200px]">{att.name}</span>
                                  {att.size && <span className="text-[10px] text-slate-400">({att.size})</span>}
                                  <Download className="w-3 h-3 text-slate-400" />
                                </a>
                              ))}

                            {hw.referenceLinks?.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                <span>{link.title}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Submission Status or Trigger */}
                      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {isSubmitted ? (
                          <div className="w-full space-y-2">
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-medium">
                                  Submitted on: {new Date(submission!.submissionDate).toLocaleString()}
                                </span>
                                {submission?.obtainedMarks !== undefined && (
                                  <span className="font-mono text-sm font-extrabold text-emerald-700">
                                    Score: {submission.obtainedMarks} / {hw.maxMarks} M
                                  </span>
                                )}
                              </div>

                              {submission?.solutionText && (
                                <div className="text-xs text-slate-700 italic">
                                  Your Note: "{submission.solutionText}"
                                </div>
                              )}

                              {submission?.teacherFeedback && (
                                <div className="mt-2 p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs">
                                  <div className="font-bold text-emerald-900 flex items-center gap-1 mb-0.5">
                                    <Award className="w-3.5 h-3.5 text-emerald-600" /> Er. Rajesh Sharma's Feedback:
                                  </div>
                                  <p className="text-emerald-800 leading-relaxed font-medium">
                                    "{submission.teacherFeedback}"
                                  </p>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => {
                                setActiveHwForSubmit(hw);
                                setSolutionText(submission?.solutionText || '');
                              }}
                              className="text-xs text-blue-600 hover:underline font-bold"
                            >
                              Need to re-upload correction? Click here
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs text-slate-500 font-medium">
                              Submit fair notebook photos or PDF before the deadline for full marks.
                            </div>
                            <button
                              onClick={() => {
                                setActiveHwForSubmit(hw);
                                setSolutionText('');
                                setSelectedFiles([]);
                              }}
                              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/25 flex items-center gap-1.5 shrink-0"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Submit Homework Solution</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Homework Submission Modal in Frosted Glass */}
      {activeHwForSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Submit Homework: {activeHwForSubmit.subject}
                </h3>
                <p className="text-xs text-slate-500">{activeHwForSubmit.chapter}</p>
              </div>
              <button
                onClick={() => setActiveHwForSubmit(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitSolution} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Solution Remarks or Specific Doubts
                </label>
                <textarea
                  rows={3}
                  value={solutionText}
                  onChange={e => setSolutionText(e.target.value)}
                  placeholder="e.g. Sir, solved all 6 questions in notebook. In Question 4 part (b), used the discriminant method."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Photos of Notebook or PDF (Recommended)
                </label>
                <div className="border-2 border-dashed border-blue-200 hover:border-blue-500 rounded-2xl p-5 text-center cursor-pointer bg-blue-50/40 transition-colors relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                  <div className="text-xs text-slate-800 font-bold">
                    Click to select photos or PDF documents
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Supports JPEG, PNG, PDF from phone camera or gallery
                  </div>
                </div>

                {/* Selected Files & Notebook Images Preview */}
                {selectedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                      <span>{selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} ready for submission:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedFiles.map((file, i) => (
                        <div
                          key={i}
                          className="group relative rounded-xl overflow-hidden border border-blue-200 bg-white aspect-4/3 flex flex-col justify-end shadow-2xs"
                        >
                          {file.fileType === 'image' ? (
                            <img
                              src={file.fileUrl}
                              alt={file.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-blue-50 flex flex-col items-center justify-center p-2 text-center">
                              <FileText className="w-8 h-8 text-blue-600 mb-1" />
                              <span className="text-[10px] font-bold text-blue-900 truncate max-w-full">{file.name}</span>
                            </div>
                          )}
                          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-white text-[9px] font-bold">
                            #{i + 1}
                          </div>
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                            {file.fileType === 'image' && (
                              <button
                                type="button"
                                onClick={() => setGalleryViewer({
                                  images: selectedFiles
                                    .filter(f => f.fileType === 'image')
                                    .map(f => ({ url: f.fileUrl, title: f.name })),
                                  index: selectedFiles.filter(f => f.fileType === 'image').findIndex(f => f.name === file.name)
                                })}
                                className="p-1 rounded-md bg-black/60 hover:bg-black text-white"
                                title="Zoom"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                              className="p-1 rounded-md bg-rose-600 hover:bg-rose-500 text-white"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="relative z-10 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-1.5 text-[10px] text-white truncate flex items-center justify-between">
                            <span className="truncate max-w-[70%] font-medium">{file.name}</span>
                            <span className="text-[9px] text-blue-200 shrink-0 font-mono">{file.size}</span>
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
                  onClick={() => setActiveHwForSubmit(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || compressingFiles}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : compressingFiles ? 'Compressing Photos...' : 'Upload & Submit for Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onPaymentSuccess={() => {
          setShowPayModal(false);
          refreshProfile();
          fetchHomework();
        }}
      />

      {/* Submit Payment Proof Modal */}
      <SubmitPaymentProofModal
        isOpen={showProofModal}
        onClose={() => setShowProofModal(false)}
        onSuccess={() => {
          setShowProofModal(false);
          refreshProfile();
          fetchHomework();
        }}
      />

      {/* ================= MODAL: MULTI-IMAGE GALLERY LIGHTBOX ================= */}
      {galleryViewer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setGalleryViewer(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-3xl p-3 sm:p-4 overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
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
                    onClick={e => {
                      e.stopPropagation();
                      setGalleryViewer(prev =>
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
                    onClick={e => {
                      e.stopPropagation();
                      setGalleryViewer(prev =>
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

            {/* Thumbnail Navigation Row if multiple images */}
            {galleryViewer.images.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
                {galleryViewer.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setGalleryViewer(prev => (prev ? { ...prev, index: idx } : null))}
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
