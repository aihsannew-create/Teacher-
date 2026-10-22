import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Homework, HomeworkSubmission } from '../types';
import { ArrowLeft, Award, FileText, ExternalLink } from 'lucide-react';

interface TeacherSubmissionsProps {
  homeworkId?: string;
  onNavigate: (view: string) => void;
}

export const TeacherSubmissions: React.FC<TeacherSubmissionsProps> = ({ homeworkId, onNavigate }) => {
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [selectedHwId, setSelectedHwId] = useState<string>(homeworkId || '');
  const [currentHw, setCurrentHw] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // Active grading modal / panel
  const [activeGradingSub, setActiveGradingSub] = useState<HomeworkSubmission | null>(null);
  const [marks, setMarks] = useState<number>(0);
  const [status, setStatus] = useState<'completed' | 'needs_correction' | 'incomplete'>('completed');
  const [feedback, setFeedback] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadAllHw = async () => {
      try {
        const data = await apiFetch('/api/homework');
        const list: Homework[] = data.homework || [];
        setHomeworkList(list);

        const targetId = selectedHwId || (list.length > 0 ? list[0].id : '');
        if (targetId) {
          setSelectedHwId(targetId);
          await loadSubmissions(targetId);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAllHw();
  }, []);

  const loadSubmissions = async (hwId: string) => {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/homework/${hwId}`);
      setCurrentHw(data.homework);
      setSubmissions(data.submissions || []);
      if (data.submissions?.length > 0 && !activeGradingSub) {
        openGrading(data.submissions[0], data.homework);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHw = (hwId: string) => {
    setSelectedHwId(hwId);
    loadSubmissions(hwId);
  };

  const openGrading = (sub: HomeworkSubmission, hw: Homework | null) => {
    setActiveGradingSub(sub);
    setMarks(sub.obtainedMarks !== undefined ? sub.obtainedMarks : (hw?.maxMarks || 20));
    setStatus(sub.status === 'submitted' ? 'completed' : sub.status);
    setFeedback(sub.teacherFeedback || '');
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGradingSub) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/homework/submissions/${activeGradingSub.id}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          marks,
          feedback
        })
      });

      setSubmissions(prev => prev.map(s => s.id === activeGradingSub.id ? res.submission : s));
      setActiveGradingSub(res.submission);
      alert('Marks and feedback saved! Student has been notified in-app.');
    } catch (err: any) {
      alert(err.message || 'Failed to save grade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100/90">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('teacher-homework')}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 shadow-2xs"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
                Grade Homework Submissions
              </h1>
              <p className="text-xs text-slate-500">
                Review uploaded notebook photos, assign marks, and write constructive teacher feedback
              </p>
            </div>
          </div>

          {/* Homework assignment picker */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600 shrink-0">Assignment:</label>
            <select
              value={selectedHwId}
              onChange={e => handleSelectHw(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 max-w-xs shadow-2xs"
            >
              {homeworkList.map(h => (
                <option key={h.id} value={h.id}>
                  {h.subject}: {h.chapter} ({h.className})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2-Column Interface: Submissions Queue on Left, Grading Workstation on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submissions List in White Glass */}
          <div className="lg:col-span-5 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 p-5 space-y-4 shadow-[0_10px_30px_rgba(37,99,235,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Student Submissions</h3>
              <span className="text-xs text-slate-500 font-mono font-medium">
                {submissions.length} submitted
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">Loading submissions...</div>
            ) : submissions.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No submissions received for this homework yet.
              </div>
            ) : (
              <div className="space-y-2">
                {submissions.map(sub => {
                  const isSelected = activeGradingSub?.id === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => openGrading(sub, currentHw)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-300 shadow-sm'
                          : 'bg-white border-slate-200/80 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{sub.studentName}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          sub.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : sub.status === 'needs_correction'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {sub.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                        <span className="font-mono">{sub.rollNumber}</span>
                        <span className="font-semibold text-blue-700">
                          {sub.obtainedMarks !== undefined ? `${sub.obtainedMarks} / ${currentHw?.maxMarks || 20} M` : 'Not graded'}
                        </span>
                      </div>

                      {sub.solutionText && (
                        <p className="mt-1.5 text-[11px] text-slate-600 truncate italic">
                          "{sub.solutionText}"
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Grading & Feedback Workstation in White Glass */}
          <div className="lg:col-span-7 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 p-6 space-y-5 shadow-[0_10px_30px_rgba(37,99,235,0.04)]">
            {activeGradingSub ? (
              <div className="space-y-5">
                <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Reviewing: {activeGradingSub.studentName}
                    </h3>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Roll Number: <strong className="font-mono text-slate-800">{activeGradingSub.rollNumber}</strong> · 
                      Submitted: <span className="font-mono text-slate-600">{new Date(activeGradingSub.submissionDate).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Student's Typed Notes */}
                {activeGradingSub.solutionText && (
                  <div>
                    <div className="text-xs font-bold text-slate-600 mb-1">Student Note:</div>
                    <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed italic">
                      "{activeGradingSub.solutionText}"
                    </div>
                  </div>
                )}

                {/* Uploaded Notebook Solutions / Attachments */}
                <div>
                  <div className="text-xs font-bold text-slate-600 mb-2">
                    Submitted Solution Attachments:
                  </div>
                  {activeGradingSub.attachments && activeGradingSub.attachments.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeGradingSub.attachments.map((att, i) => (
                        <a
                          key={i}
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-3 rounded-2xl bg-white border border-blue-200 hover:border-blue-500 flex items-center justify-between text-xs text-slate-800 transition-colors shadow-2xs group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="truncate font-medium">{att.name}</span>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-2" />
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic">No attachments attached by student.</div>
                  )}
                </div>

                {/* Teacher Grading Form */}
                <form onSubmit={handleSaveGrade} className="pt-4 border-t border-slate-100 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Obtained Marks (out of {currentHw?.maxMarks || 20}) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={currentHw?.maxMarks || 100}
                        required
                        value={marks}
                        onChange={e => setMarks(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Evaluation Status *
                      </label>
                      <select
                        value={status}
                        onChange={e => setStatus(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      >
                        <option value="completed">Completed / Passed</option>
                        <option value="needs_correction">Needs Correction (Re-attempt)</option>
                        <option value="incomplete">Incomplete Submission</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Teacher Feedback & Mentorship Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="e.g. Excellent presentation! In Question 4 part (b), check the sign when taking square roots. Well done!"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Grade & Notify Student'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="py-24 text-center text-xs text-slate-400">
                Select a student submission from the left list to review and grade.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
