import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Homework, ClassLevel, Batch } from '../types';
import { BookOpen, Plus, Trash2, Copy, Edit3, FileText, X, AlertCircle, Eye } from 'lucide-react';

interface TeacherHomeworkProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const TeacherHomework: React.FC<TeacherHomeworkProps> = ({ onNavigate }) => {
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
    if (!window.confirm(`Duplicate homework "${hw.chapter}" as a draft?`)) return;
    try {
      await apiFetch(`/api/homework/${hw.id}/duplicate`, { method: 'POST', body: JSON.stringify({}) });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this homework?')) return;
    try {
      await apiFetch(`/api/homework/${id}`, { method: 'DELETE' });
      setHomeworkList(prev => prev.filter(h => h.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.classId || !formData.subject || !formData.chapter || !formData.teachingSummary || !formData.instructions) {
      setFormError('Please fill in class, subject, chapter, lecture summary, and instructions.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (editingHw) {
        await apiFetch(`/api/homework/${editingHw.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await apiFetch('/api/homework', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      await fetchData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save homework');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAttachment = () => {
    const name = window.prompt('Enter attachment file name (e.g. Chapter4_Worksheet.pdf):');
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/90">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Daily Classroom Homework Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Publish class-specific daily lecture summaries, worksheets, and review student solutions
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Publish New Homework</span>
            </button>
          </div>
        </div>

        {/* Filter Bar in Frosted Glass */}
        <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)] text-xs">
          <span className="text-slate-500 font-semibold">Filter by Class:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedClass('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                selectedClass === 'all'
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'bg-slate-50 border border-slate-200/90 text-slate-600 hover:bg-white hover:text-blue-600'
              }`}
            >
              All Classes
            </button>
            {classes.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  selectedClass === c.id
                    ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                    : 'bg-slate-50 border border-slate-200/90 text-slate-600 hover:bg-white hover:text-blue-600'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Homework Cards in Frosted White Glass */}
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-400">Loading homework records...</div>
        ) : homeworkList.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-500 bg-white/80 rounded-3xl border border-blue-100 p-8 space-y-2">
            <BookOpen className="w-8 h-8 text-blue-300 mx-auto" />
            <div className="font-bold text-slate-700">No homework published yet for this class.</div>
            <p className="text-slate-400">Click "Publish New Homework" to post today's teaching summary.</p>
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
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-extrabold text-blue-600 uppercase tracking-wide">
                        {hw.subject}
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-700 font-bold">{hw.className}</span>
                      <span className="text-slate-300">·</span>
                      <span className="font-mono text-slate-500 font-medium">Max {hw.maxMarks} Marks</span>
                      {hw.isDraft && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded">
                          DRAFT
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">{hw.chapter}</h3>
                    <div className="text-xs text-slate-500 font-medium mt-0.5">Topic: {hw.topic}</div>
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
                      onClick={() => handleDelete(hw.id)}
                      className="p-2 text-slate-400 hover:text-red-500 bg-white border border-slate-200 rounded-xl hover:bg-red-50 shadow-2xs"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Aaj Class Mein Kya Padhaya Gaya (Prominent Blue Glass Panel) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/60 to-blue-50/90 border border-blue-200/90 space-y-1">
                  <div className="text-xs font-extrabold text-blue-900">
                    Aaj Class Mein Kya Padhaya Gaya (Teaching Summary):
                  </div>
                  <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-medium">
                    {hw.teachingSummary}
                  </p>
                </div>

                {/* Instructions */}
                <div className="text-xs text-slate-600">
                  <span className="font-bold text-slate-800">Instructions: </span>
                  <span>{hw.instructions}</span>
                </div>

                {/* Submission stats ticker */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                    <span>Deadline: <strong className="font-mono text-slate-800">{new Date(hw.deadlineDate).toLocaleString()}</strong></span>
                    <span>Reviewed: <strong className="text-emerald-700">{hw.completedCount || 0}</strong></span>
                    <span>Pending Review: <strong className="text-amber-700">{hw.pendingReviewCount || 0}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

              {/* Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Attachments & Worksheets</label>
                  <button
                    type="button"
                    onClick={handleAddAttachment}
                    className="text-[11px] text-blue-600 font-bold hover:underline"
                  >
                    + Add Worksheet / PDF
                  </button>
                </div>
                {formData.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {formData.attachments.map((att, i) => (
                      <span key={i} className="px-2.5 py-1 text-xs bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1.5 text-slate-800">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span className="font-medium">{att.name}</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, attachments: formData.attachments.filter((_, idx) => idx !== i) })}
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
                  disabled={saving}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25"
                >
                  {saving ? 'Publishing...' : editingHw ? 'Update Homework' : 'Publish to Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
