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
  Layers
} from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';

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
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);

  // Submit Modal
  const [activeHwForSubmit, setActiveHwForSubmit] = useState<Homework | null>(null);
  const [solutionText, setSolutionText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<{ name: string; fileType: 'pdf' | 'image'; fileUrl: string; size: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const fetchHomework = async () => {
    setLoading(true);
    try {
      const [data, clsRes] = await Promise.all([
        apiFetch(`/api/homework${selectedClass !== 'all' ? `?classId=${selectedClass}` : ''}`),
        apiFetch('/api/classes').catch(() => ({ classes: [] }))
      ]);
      setHomeworkList(data.homework || []);
      setClasses(clsRes.classes || []);
      if (data.membershipWarning) {
        setMembershipWarning(data.membershipWarning.message);
      }
      setMembershipExpired(false);
    } catch (err: any) {
      if (err.status === 403 && err.data?.error === 'membership_expired') {
        setMembershipExpired(true);
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

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
      const sizeStr = `${(file.size / 1024).toFixed(1)} KB`;

      reader.onload = (loadEvent) => {
        const fileUrl = loadEvent.target?.result as string;
        setSelectedFiles(prev => [
          ...prev,
          {
            name: file.name,
            fileType: isPdf ? 'pdf' : 'image',
            fileUrl,
            size: sizeStr
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
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

        {/* Membership Expired Paywall Banner */}
        {membershipExpired ? (
          <div className="p-8 rounded-3xl bg-white/95 backdrop-blur-xl border border-red-200 shadow-[0_15px_40px_rgba(239,68,68,0.08)] text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-xs">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">
              Tuition Membership Access Locked
            </h2>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Your monthly coaching membership for <strong className="text-slate-900 font-semibold">{studentProfile?.className}</strong> is overdue. Daily homework assignments, teaching summaries, notes downloads, and solution submissions are protected by server-side authorization.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => setShowPayModal(true)}
                className="px-6 py-3 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-all shadow-md shadow-blue-500/25"
              >
                Pay Monthly Tuition Fee (₹{studentProfile?.monthlyFee || 2500})
              </button>
              <button
                onClick={() => onNavigate('student-payments')}
                className="px-4 py-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
              >
                View Payment History
              </button>
            </div>

            <p className="text-[11px] text-slate-400 pt-2 font-medium">
              Once verified on our server, your membership will immediately unlock all homework and records automatically.
            </p>
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
                      {/* Top Bar of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-extrabold text-blue-600 uppercase tracking-wide">
                              {hw.subject}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800 text-[10px]">
                              🎓 {hw.className}
                            </span>
                            <span className="text-slate-300">·</span>
                            <span className="font-mono text-slate-500">Max {hw.maxMarks} Marks</span>
                          </div>
                          <h3 className="text-lg font-extrabold text-slate-900 mt-1">
                            {hw.chapter}
                          </h3>
                          <div className="text-xs text-blue-700 font-semibold mt-0.5">
                            Topic: {hw.topic || 'General Practice'}
                          </div>

                          {/* Published Date & Time Info */}
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2 font-medium">
                            <span className="flex items-center gap-1 text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-blue-600" />
                              <span>Class Date: <strong>{new Date(hw.publishDate || hw.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</strong></span>
                            </span>
                            <span className="flex items-center gap-1 text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              <span>Lecture Time: <strong>{new Date(hw.publishDate || hw.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`px-2.5 py-1 text-[11px] font-mono font-bold rounded-lg flex items-center gap-1 ${
                              deadline.isOverdue
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : deadline.isUrgent
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{deadline.text}</span>
                          </span>

                          {isSubmitted ? (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{submission?.status === 'completed' ? 'Graded' : 'Submitted'}</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800 rounded-lg">
                              Pending
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Aaj Class Mein Kya Padhaya Gaya (Prominent Blue Glass Panel) */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-200/90 space-y-1.5 shadow-2xs">
                        <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-900">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          <span>Aaj Class Mein Kya Padhaya Gaya (Teacher's Lecture Summary):</span>
                        </div>
                        <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                          {hw.teachingSummary}
                        </p>
                      </div>

                      {/* Instructions */}
                      <div>
                        <div className="text-xs font-bold text-slate-700 mb-1">
                          Homework Instructions & Questions:
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/80">
                          {hw.instructions}
                        </p>
                      </div>

                      {/* Attached Blackboard Photos / Worksheets Gallery */}
                      {hw.attachments && hw.attachments.some(a => a.fileType === 'image' || a.fileUrl?.startsWith('data:image') || a.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i)) && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <ImageIcon className="w-4 h-4 text-blue-600" />
                            <span>Blackboard Photos & Handwritten Notes (Click to Zoom):</span>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {hw.attachments
                              .filter(att => att.fileType === 'image' || att.fileUrl?.startsWith('data:image') || att.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i))
                              .map((att, idx) => (
                                <div
                                  key={att.id || idx}
                                  onClick={() => setViewingImage({ url: att.fileUrl, title: `${hw.subject} - ${att.name}` })}
                                  className="group relative cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all w-28 sm:w-36 aspect-4/3"
                                >
                                  <img src={att.fileUrl} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                    <span>Zoom</span>
                                  </div>
                                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] text-white truncate px-1.5">
                                    {att.name}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

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

                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {selectedFiles.map((file, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-blue-100 text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate font-medium text-slate-800">{file.name}</span>
                          <span className="text-[10px] text-slate-400">({file.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
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
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Submitting...' : 'Upload & Submit for Review'}</span>
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

      {/* ================= MODAL: FULL RESOLUTION IMAGE LIGHTBOX ================= */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in"
          onClick={() => setViewingImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[92vh] w-full bg-slate-900 rounded-3xl p-3 sm:p-4 overflow-hidden border border-slate-700 shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 px-2 border-b border-slate-800 text-white">
              <div className="flex items-center gap-2 truncate max-w-[85%]">
                <ImageIcon className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs sm:text-sm font-bold truncate">{viewingImage.title}</span>
              </div>
              <button
                onClick={() => setViewingImage(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto max-h-[78vh] flex items-center justify-center p-2 bg-black/40 rounded-2xl my-2">
              <img
                src={viewingImage.url}
                alt={viewingImage.title}
                className="max-w-full max-h-[74vh] object-contain rounded-xl shadow-lg"
              />
            </div>
            <div className="flex items-center justify-between px-2 pt-2 text-[11px] text-slate-400">
              <span>Full High-Resolution Blackboard / Notes Preview</span>
              <a
                href={viewingImage.url}
                download={viewingImage.title}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Open in Tab</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
