import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Homework, ClassLevel, Batch } from '../types';
import {
  BookOpen,
  Plus,
  Trash2,
  Copy,
  Edit3,
  FileText,
  X,
  AlertCircle,
  Eye,
  CheckCircle2,
  Paperclip,
  ArrowLeft,
  Camera,
  Upload,
  Image as ImageIcon,
  Maximize2,
  Calendar,
  Clock,
  Layers
} from 'lucide-react';

interface TeacherHomeworkProps {
  onNavigate: (view: string, extra?: any) => void;
  embedded?: boolean;
}

export const TeacherHomework: React.FC<TeacherHomeworkProps> = ({ onNavigate, embedded = false }) => {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingHw, setEditingHw] = useState<Homework | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Image Upload & Lightbox Zoom State
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null);
  const [imageCompressing, setImageCompressing] = useState(false);

  // Reliable Delete Confirmation & Notification States
  const [deletingHw, setDeletingHw] = useState<Homework | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAttachmentInput, setShowAttachmentInput] = useState(false);
  const [customAttachmentName, setCustomAttachmentName] = useState('');

  const [formData, setFormData] = useState({
    classId: '',
    batchIds: ['all'],
    subject: 'Mathematics',
    chapter: '',
    topic: '',
    teachingSummary: '',
    instructions: '',
    deadlineDate: '',
    maxMarks: 20,
    priority: 'normal' as 'normal' | 'high' | 'urgent',
    attachments: [] as any[],
    isDraft: false
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hwRes, clsRes] = await Promise.all([
        apiFetch(`/api/homework${selectedClass !== 'all' ? `?classId=${selectedClass}` : ''}`),
        apiFetch('/api/classes')
      ]);
      setHomeworkList(hwRes.homework || []);
      setClasses(clsRes.classes || []);
      setBatches(clsRes.batches || []);

      if (clsRes.classes.length > 0 && !formData.classId) {
        setFormData(prev => ({ ...prev, classId: clsRes.classes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedClass]);

  const openCreateModal = () => {
    setEditingHw(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(7, 0, 0, 0);

    setFormData({
      classId: classes[0]?.id || '',
      batchIds: ['all'],
      subject: 'Mathematics',
      chapter: '',
      topic: '',
      teachingSummary: '',
      instructions: '',
      deadlineDate: tomorrow.toISOString().slice(0, 16),
      maxMarks: 20,
      priority: 'normal',
      attachments: [],
      isDraft: false
    });
    setFormError(null);
    setShowModal(true);
  };

  const openEditModal = (hw: Homework) => {
    setEditingHw(hw);
    setFormData({
      classId: hw.classId,
      batchIds: hw.batchIds,
      subject: hw.subject,
      chapter: hw.chapter,
      topic: hw.topic,
      teachingSummary: hw.teachingSummary,
      instructions: hw.instructions,
      deadlineDate: new Date(hw.deadlineDate).toISOString().slice(0, 16),
      maxMarks: hw.maxMarks,
      priority: hw.priority,
      attachments: hw.attachments || [],
      isDraft: hw.isDraft
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleDuplicate = async (hw: Homework) => {
    try {
      await apiFetch(`/api/homework/${hw.id}/duplicate`, { method: 'POST', body: JSON.stringify({}) });
      await fetchData();
      setToastMsg({ type: 'success', text: `Homework "${hw.chapter}" duplicated successfully as draft.` });
      setTimeout(() => setToastMsg(null), 4000);
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Failed to duplicate homework.' });
      setTimeout(() => setToastMsg(null), 4000);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHw) return;
    setDeleteLoading(true);
    try {
      await apiFetch(`/api/homework/${deletingHw.id}`, { method: 'DELETE' });
      setHomeworkList(prev => prev.filter(h => h.id !== deletingHw.id));
      setToastMsg({
        type: 'success',
        text: `Daily topic & homework entry for "${deletingHw.subject} - ${deletingHw.chapter}" deleted successfully.`
      });
      setTimeout(() => setToastMsg(null), 4000);
      setDeletingHw(null);
    } catch (err: any) {
      setToastMsg({ type: 'error', text: err.message || 'Failed to delete homework.' });
      setTimeout(() => setToastMsg(null), 4000);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.chapter || !formData.instructions) {
      setFormError('Please select a class and fill in the homework title/chapter and description/instructions.');
      return;
    }

    const payload = {
      ...formData,
      subject: formData.subject.trim() || 'General Studies',
      teachingSummary: formData.teachingSummary.trim() || `Daily lecture guide and notes for ${formData.chapter}. Complete assigned tasks before deadline.`
    };

    setSaving(true);
    setFormError(null);
    try {
      if (editingHw) {
        await apiFetch(`/api/homework/${editingHw.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setToastMsg({ type: 'success', text: 'Homework & assignment updated successfully!' });
      } else {
        await apiFetch('/api/homework', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setToastMsg({ type: 'success', text: 'New class homework published successfully!' });
      }
      setTimeout(() => setToastMsg(null), 4000);
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save homework');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImageCompressing(true);
    let processed = 0;
    const fileList = Array.from(files);

    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawData = event.target?.result as string;
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

          setFormData(prev => ({
            ...prev,
            attachments: [
              ...prev.attachments,
              {
                id: `att_img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                name: file.name,
                fileType: 'image',
                fileUrl: compressedUrl,
                size: `${sizeKb} KB`
              }
            ]
          }));

          processed += 1;
          if (processed === fileList.length) {
            setImageCompressing(false);
          }
        };
        img.onerror = () => {
          processed += 1;
          if (processed === fileList.length) {
            setImageCompressing(false);
          }
        };
        img.src = rawData;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter(a => a.id !== attachmentId && a.name !== attachmentId)
    }));
  };

  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target?.result as string;
        const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
        setFormData(prev => ({
          ...prev,
          attachments: [
            ...prev.attachments,
            {
              id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              name: file.name,
              fileType: isPdf ? 'pdf' : 'doc',
              fileUrl: dataUrl,
              size: `${sizeMb} MB`
            }
          ]
        }));
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddAttachment = (nameToAdd?: string) => {
    const name = nameToAdd || customAttachmentName.trim();
    if (!name) return;
    setFormData(prev => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          id: `att_${Date.now()}`,
          name,
          fileType: name.endsWith('.pdf') ? 'pdf' : 'image',
          fileUrl: 'https://example.com/notes/' + encodeURIComponent(name),
          size: '1.2 MB'
        }
      ]
    }));
    setCustomAttachmentName('');
    setShowAttachmentInput(false);
  };

  const content = (
    <div className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto space-y-6'}>
      {/* Header with Back Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/90">
        <div className="flex items-center gap-3">
          {!embedded && (
            <button
              type="button"
              onClick={() => onNavigate('back')}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer group"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 group-hover:-translate-x-0.5 group-hover:text-blue-600 transition-transform" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
                Class-Wise Homework Management
              </h1>
              <span className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                {embedded ? 'Admin Dashboard' : 'Teacher Cabin'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Select class, add homework title, description, deadline, and upload PDF worksheets or images
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish Homework (With Photos)</span>
            </button>
          </div>
        </div>

        {/* In-app Toast Banner */}
        {toastMsg && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in ${
              toastMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{toastMsg.text}</span>
            </div>
            <button onClick={() => setToastMsg(null)} className="opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Class Tabs: Prominent Class-Wise Filter */}
        <div className="p-4 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 shadow-xs space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-800 font-bold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Class-Wise Homework Selection ("Har Homework Class Ke Hisab Se"):</span>
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
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
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
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 ring-2 ring-blue-600/20'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-white hover:text-blue-600 hover:border-blue-200'
                  }`}
                >
                  <span>{c.name}</span>
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

        {/* Homework Cards in Frosted White Glass */}
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading homework records...</div>
        ) : homeworkList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 bg-white/80 rounded-3xl border border-blue-100 p-8 space-y-2">
            <BookOpen className="w-8 h-8 text-blue-300 mx-auto" />
            <div className="font-bold text-slate-700">No homework published yet for this class.</div>
            <p className="text-slate-400">Click "Publish Homework (With Photos)" to post today's teaching summary.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {homeworkList.map(hw => (
              <div
                key={hw.id}
                className="p-6 sm:p-7 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 shadow-[0_10px_30px_rgba(37,99,235,0.04)] space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg font-black bg-blue-100 text-blue-800 text-[11px]">
                        🎓 {hw.className}
                      </span>
                      <span className="font-extrabold text-blue-600 uppercase tracking-wide">
                        {hw.subject}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500 font-medium">Max {hw.maxMarks} Marks</span>
                      {hw.isDraft && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                          DRAFT
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{hw.chapter}</h3>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Topic: {hw.topic}</div>

                    {/* Published Date & Time Info */}
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-2 font-medium">
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

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onNavigate('teacher-submissions', hw.id)}
                      className="px-3.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Submissions ({hw.submissionsCount || 0})</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(hw)}
                      className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs"
                      title="Duplicate to another class"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(hw)}
                      className="p-2 text-slate-400 hover:text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 shadow-2xs"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingHw(hw)}
                      className="p-2 text-red-500 hover:text-red-700 bg-red-50/80 border border-red-200 rounded-xl hover:bg-red-100 shadow-2xs transition-all"
                      title="Delete Homework & Class Diary"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Aaj Class Mein Kya Padhaya Gaya (Prominent Blue Glass Panel) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-200/90 space-y-1">
                  <div className="text-xs font-extrabold text-blue-900 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-700" />
                    <span>Aaj Class Mein Kya Padhaya Gaya (Today's Lecture Summary):</span>
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                    {hw.teachingSummary}
                  </p>
                </div>

                {/* Instructions */}
                <div className="text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80">
                  <span className="font-bold text-slate-800">Homework Questions & Instructions: </span>
                  <span className="whitespace-pre-line">{hw.instructions}</span>
                </div>

                {/* Attached Board Photos & Worksheets Gallery */}
                {hw.attachments && hw.attachments.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                      <span>Attached Blackboard Photos & Worksheets ({hw.attachments.length}):</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {hw.attachments.map((att: any, idx: number) => {
                        const isImg = att.fileType === 'image' || att.fileUrl?.startsWith('data:image') || att.name?.match(/\.(jpeg|jpg|png|webp|gif)$/i);
                        return isImg ? (
                          <div
                            key={att.id || idx}
                            onClick={() => setViewingImage({ url: att.fileUrl, title: `${hw.subject} - ${att.name}` })}
                            className="group relative cursor-pointer rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all w-28 sm:w-36 aspect-4/3"
                          >
                            <img src={att.fileUrl} alt={att.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Enlarge Photo</span>
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-[9px] text-white truncate px-1.5">
                              {att.name}
                            </div>
                          </div>
                        ) : (
                          <a
                            key={att.id || idx}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 text-xs font-bold transition-all shadow-2xs"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            <span className="truncate max-w-[150px]">{att.name}</span>
                            {att.size && <span className="text-[10px] text-blue-500 font-mono">({att.size})</span>}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Submission stats ticker */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <div className="flex items-center gap-4">
                    <span className="text-red-700 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due: <strong className="font-mono text-slate-900">{new Date(hw.deadlineDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </span>
                    <span>Reviewed: <strong className="text-emerald-700">{hw.completedCount || 0}</strong></span>
                    <span>Pending: <strong className="text-amber-700">{hw.pendingReviewCount || 0}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Create / Edit Homework Modal in White Glass */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingHw ? 'Edit Daily Homework' : 'Publish Daily Homework'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveHomework} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Class *</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="e.g. Mathematics or Science"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chapter Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.chapter}
                    onChange={e => setFormData({ ...formData, chapter: e.target.value })}
                    placeholder="e.g. Chapter 4: Quadratic Equations"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specific Topic</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={e => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Nature of Roots & Discriminant"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>
              </div>

              {/* Teaching summary */}
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1">
                  "Aaj Class Mein Kya Padhaya Gaya" (Today's Lecture Summary) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.teachingSummary}
                  onChange={e => setFormData({ ...formData, teachingSummary: e.target.value })}
                  placeholder="Detail what concepts, derivations, and board questions were taught today in class..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Homework Instructions & Exercise Numbers *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.instructions}
                  onChange={e => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Specify textbook questions, steps to show in fair notebook, and required format..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Deadline *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.deadlineDate}
                    onChange={e => setFormData({ ...formData, deadlineDate: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={formData.maxMarks}
                    onChange={e => setFormData({ ...formData, maxMarks: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Dedicated Image Upload Section ("teacher panel me homework dalne ka section bbao jisme image upload kr ske") */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 to-indigo-50/70 border-2 border-blue-200/90 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-black text-blue-950 flex items-center gap-1.5">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>Upload Board Photos & Handwritten Notes (Image Upload) *</span>
                    </label>
                    <p className="text-[11px] text-blue-800 mt-0.5">
                      Blackboard ki photo kheench kar ya fair copy/questions sheet ki images upload karein
                    </p>
                  </div>

                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{imageCompressing ? 'Processing Image...' : '+ Upload Photo(s)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={imageCompressing}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Images Grid */}
                {formData.attachments.filter((a: any) => a.fileType === 'image' || a.fileUrl?.startsWith('data:image')).length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-blue-200/60">
                    {formData.attachments
                      .filter((a: any) => a.fileType === 'image' || a.fileUrl?.startsWith('data:image'))
                      .map((att: any, idx: number) => (
                        <div
                          key={att.id || idx}
                          className="group relative rounded-xl overflow-hidden border border-blue-200 bg-white shadow-2xs aspect-4/3 flex flex-col justify-end"
                        >
                          <img
                            src={att.fileUrl}
                            alt={att.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-1.5 text-[10px] text-white truncate flex items-center justify-between">
                            <span className="truncate max-w-[80%] font-medium">{att.name}</span>
                            <span className="font-mono text-[9px] text-blue-200 shrink-0">{att.size}</span>
                          </div>
                          <div className="absolute top-1.5 right-1.5 z-20 flex items-center gap-1 opacity-90 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setViewingImage({ url: att.fileUrl, title: att.name })}
                              className="p-1 rounded-lg bg-black/60 hover:bg-black text-white"
                              title="Zoom Preview"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id || att.name)}
                              className="p-1 rounded-lg bg-red-600 hover:bg-red-500 text-white"
                              title="Remove"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="py-3 px-4 rounded-xl border border-dashed border-blue-300 bg-white/60 text-center text-[11px] text-blue-700 font-medium">
                    No photos uploaded yet. Click "+ Upload Photo(s)" to attach blackboard or worksheet images.
                  </div>
                )}
              </div>

              {/* Attachments (PDF/Docs tool) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">PDF / Document Attachments</label>
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-blue-600 font-bold hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                      <Upload className="w-3 h-3 text-blue-600" />
                      <span>+ Upload PDF / Document</span>
                      <input
                        type="file"
                        accept="application/pdf,image/*,.doc,.docx"
                        multiple
                        onChange={handlePdfUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAttachmentInput(!showAttachmentInput)}
                      className="text-[11px] text-slate-500 font-semibold hover:underline flex items-center gap-1"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>{showAttachmentInput ? 'Hide' : 'Quick Presets'}</span>
                    </button>
                  </div>
                </div>

                {showAttachmentInput && (
                  <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl mb-2 space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-500 font-semibold">Quick add:</span>
                      <button
                        type="button"
                        onClick={() => handleAddAttachment(`${formData.subject}_Worksheet.pdf`)}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100"
                      >
                        + {formData.subject}_Worksheet.pdf
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddAttachment(`NCERT_${formData.chapter || 'Solutions'}.pdf`)}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100"
                      >
                        + NCERT_Solutions.pdf
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddAttachment('Daily_Practice_Problems_DPP.pdf')}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100"
                      >
                        + DPP_Problems.pdf
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customAttachmentName}
                        onChange={e => setCustomAttachmentName(e.target.value)}
                        placeholder="Or enter custom file name (e.g. Unit_Test_Paper.pdf)"
                        className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAttachment()}
                        disabled={!customAttachmentName.trim()}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50"
                      >
                        Attach
                      </button>
                    </div>
                  </div>
                )}

                {/* PDF files preview */}
                {formData.attachments.filter((a: any) => a.fileType !== 'image' && !a.fileUrl?.startsWith('data:image')).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.attachments
                      .filter((a: any) => a.fileType !== 'image' && !a.fileUrl?.startsWith('data:image'))
                      .map((att, i) => (
                        <span key={i} className="px-2.5 py-1 text-xs bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1.5 text-slate-800">
                          <FileText className="w-3.5 h-3.5 text-blue-600" />
                          <span className="font-medium">{att.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAttachment(att.id || att.name)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* Draft toggle */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isDraft"
                  checked={formData.isDraft}
                  onChange={e => setFormData({ ...formData, isDraft: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-0"
                />
                <label htmlFor="isDraft" className="text-xs text-slate-700 font-medium">
                  Save as Draft (Do not notify students yet)
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || imageCompressing}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center gap-1.5"
                >
                  <span>{saving ? 'Publishing...' : editingHw ? 'Update Homework' : 'Publish to Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RELIABLE DELETE CONFIRMATION ================= */}
      {deletingHw && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-red-100 shadow-2xl max-w-md w-full p-6 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Delete Daily Class Topic & Homework?
                </h3>
                <p className="text-xs text-slate-500">
                  Are you sure you want to delete this lecture entry?
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-red-50/40 border border-red-100/90 space-y-2 mb-5">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-700">
                  {deletingHw.subject}
                </span>
                <span className="text-xs font-extrabold text-slate-900">
                  {deletingHw.chapter} {deletingHw.topic ? `(${deletingHw.topic})` : ''}
                </span>
              </div>
              <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/80">
                <span className="font-bold text-blue-900 block mb-0.5">Aaj Class Mein Kya Padhaya Gaya:</span>
                <p className="italic text-slate-600">{deletingHw.teachingSummary}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingHw(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow-md shadow-red-500/25 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{deleteLoading ? 'Deleting...' : 'Yes, Delete Entry'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
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

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      {content}
    </div>
  );
};
