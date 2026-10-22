import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { ClassLevel, Batch } from '../types';
import { BookOpen, Plus, Clock, Users, X, Edit2 } from 'lucide-react';

export const TeacherClasses: React.FC = () => {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  // Class Modal
  const [showClassModal, setShowClassModal] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    code: '',
    subjects: 'Mathematics, Science',
    monthlyFee: 2500,
    description: ''
  });

  // Batch Modal
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    classId: '',
    name: '',
    timing: '07:00 AM - 08:30 AM',
    days: 'Mon, Tue, Wed, Thu, Fri, Sat',
    maxCapacity: 25
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/classes');
      setClasses(data.classes || []);
      setBatches(data.batches || []);
      if (data.classes?.length > 0 && !batchForm.classId) {
        setBatchForm(prev => ({ ...prev, classId: data.classes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/classes', {
        method: 'POST',
        body: JSON.stringify({
          ...classForm,
          subjects: classForm.subjects.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      setShowClassModal(false);
      setClassForm({ name: '', code: '', subjects: 'Mathematics, Science', monthlyFee: 2500, description: '' });
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to create class');
    }
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/classes/batch', {
        method: 'POST',
        body: JSON.stringify({
          ...batchForm,
          days: batchForm.days.split(',').map(d => d.trim()).filter(Boolean)
        })
      });
      setShowBatchModal(false);
      await fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to add batch');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Teacher Cabin · Academic Structure</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Classes & Batch Slot Configuration
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure coaching academic levels, standard monthly tuition fees, and offline batch timings
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (classes.length > 0) setBatchForm(prev => ({ ...prev, classId: classes[0].id }));
                setShowBatchModal(true);
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white/90 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-xs"
            >
              + Add Batch Slot
            </button>
            <button
              onClick={() => setShowClassModal(true)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Class</span>
            </button>
          </div>
        </div>

        {/* Classes List */}
        {loading ? (
          <div className="text-center py-16 text-xs text-slate-500">Loading coaching classes...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => {
              const classBatches = batches.filter(b => b.classId === cls.id);
              return (
                <div
                  key={cls.id}
                  className="rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 p-6 flex flex-col justify-between shadow-xl shadow-blue-500/5 space-y-4 hover:shadow-2xl hover:border-blue-200 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-mono font-bold text-blue-600">{cls.code}</span>
                        <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                      </div>
                      <span className="text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold tabular-nums">
                        ₹{cls.monthlyFee}/mo
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {cls.description || 'Board coaching and problem-solving drills.'}
                    </p>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-700 mb-1">Subjects:</div>
                      <div className="flex flex-wrap gap-1">
                        {cls.subjects.map((sub, i) => (
                          <span key={i} className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-blue-100">
                      <div className="text-[11px] font-semibold text-slate-700 mb-1.5">Batches ({classBatches.length}):</div>
                      <div className="space-y-1.5">
                        {classBatches.map(b => (
                          <div key={b.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-blue-100 text-xs">
                            <div className="font-semibold text-slate-900">{b.name}</div>
                            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                              <span>{b.timing}</span>
                              <span className="font-mono">Cap: {b.maxCapacity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Enrolled: <strong className="text-slate-900 font-semibold">{cls.studentCount || 0}</strong> students</span>
                    <button
                      onClick={() => {
                        setBatchForm(prev => ({ ...prev, classId: cls.id }));
                        setShowBatchModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      + Add Batch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <h3 className="text-sm font-bold text-slate-900">Create New Class Level</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  value={classForm.name}
                  onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="e.g. Class 8 (Foundation)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Class Code</label>
                <input
                  type="text"
                  value={classForm.code}
                  onChange={e => setClassForm({ ...classForm, code: e.target.value })}
                  placeholder="e.g. CLS-08"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Subjects (Comma separated) *</label>
                <input
                  type="text"
                  required
                  value={classForm.subjects}
                  onChange={e => setClassForm({ ...classForm, subjects: e.target.value })}
                  placeholder="Mathematics, Science, Foundation Physics"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Monthly Tuition Fee (₹) *</label>
                <input
                  type="number"
                  required
                  value={classForm.monthlyFee}
                  onChange={e => setClassForm({ ...classForm, monthlyFee: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Curriculum & Description</label>
                <textarea
                  rows={2}
                  value={classForm.description}
                  onChange={e => setClassForm({ ...classForm, description: e.target.value })}
                  placeholder="Brief summary of syllabus and targeted exams..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Batch Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <h3 className="text-sm font-bold text-slate-900">Add Batch Slot</h3>
              <button onClick={() => setShowBatchModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Target Class *</label>
                <select
                  value={batchForm.classId}
                  onChange={e => setBatchForm({ ...batchForm, classId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={batchForm.name}
                  onChange={e => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="e.g. Morning Alpha Batch"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Timing Slot *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.timing}
                    onChange={e => setBatchForm({ ...batchForm, timing: e.target.value })}
                    placeholder="07:00 AM - 08:30 AM"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Max Capacity *</label>
                  <input
                    type="number"
                    required
                    value={batchForm.maxCapacity}
                    onChange={e => setBatchForm({ ...batchForm, maxCapacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                  Save Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
