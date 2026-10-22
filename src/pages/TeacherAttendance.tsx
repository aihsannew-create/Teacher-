import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { ClassLevel, Batch, StudentProfile } from '../types';
import { CalendarCheck, CheckCircle2, Clock, AlertCircle, Save, Users } from 'lucide-react';

export const TeacherAttendance: React.FC = () => {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [attendanceState, setAttendanceState] = useState<Record<string, { status: 'present' | 'absent' | 'late'; remarks: string }>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const clsRes = await apiFetch('/api/classes');
        setClasses(clsRes.classes || []);
        setBatches(clsRes.batches || []);
        if (clsRes.classes?.length > 0) {
          setSelectedClass(clsRes.classes[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, []);

  const loadStudentsAndExistingAttendance = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const [studentsRes, attRes] = await Promise.all([
        apiFetch(`/api/students?classId=${selectedClass}${selectedBatch !== 'all' ? `&batchId=${selectedBatch}` : ''}`),
        apiFetch(`/api/attendance?date=${date}&classId=${selectedClass}`)
      ]);

      const stList: StudentProfile[] = studentsRes.students || [];
      setStudents(stList);

      const existingRecords: any[] = attRes.attendance || [];
      const newMap: Record<string, { status: 'present' | 'absent' | 'late'; remarks: string }> = {};

      stList.forEach(s => {
        const found = existingRecords.find(r => r.studentId === s.id);
        if (found) {
          newMap[s.id] = { status: found.status, remarks: found.remarks || '' };
        } else {
          newMap[s.id] = { status: 'present', remarks: '' }; // default present
        }
      });

      setAttendanceState(newMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentsAndExistingAttendance();
  }, [selectedClass, selectedBatch, date]);

  const handleMarkAll = (status: 'present' | 'absent') => {
    setAttendanceState(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(k => {
        updated[k] = { ...updated[k], status };
      });
      return updated;
    });
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setSavedSuccess(null);
    try {
      const entries = Object.keys(attendanceState).map(studentId => ({
        studentId,
        status: attendanceState[studentId].status,
        remarks: attendanceState[studentId].remarks
      }));

      await apiFetch('/api/attendance/batch-record', {
        method: 'POST',
        body: JSON.stringify({
          date,
          classId: selectedClass,
          batchId: selectedBatch,
          entries
        })
      });

      setSavedSuccess(`Classroom attendance saved for ${entries.length} students on ${date}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Teacher Cabin · Daily Register</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Daily Classroom Attendance Register
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Mark physical classroom presence, late arrivals, and absent compliance
            </p>
          </div>

          <button
            onClick={handleSaveAttendance}
            disabled={saving}
            className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-1.5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Today\'s Register'}</span>
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{savedSuccess}</span>
          </div>
        )}

        {/* Filter / Selector Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-sm text-xs">
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Attendance Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Target Class</label>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Batch Slot</label>
            <select
              value={selectedBatch}
              onChange={e => setSelectedBatch(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Batches</option>
              {batches.filter(b => b.classId === selectedClass).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action strip */}
        <div className="flex items-center justify-between text-xs px-1">
          <div className="text-slate-500">
            Enrolled: <strong className="text-slate-900 font-semibold">{students.length} students</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleMarkAll('present')}
              className="px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-50 text-xs font-semibold shadow-xs transition-colors"
            >
              Mark All Present
            </button>
            <button
              onClick={() => handleMarkAll('absent')}
              className="px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold shadow-xs transition-colors"
            >
              Mark All Absent
            </button>
          </div>
        </div>

        {/* Student Register Table */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 overflow-hidden shadow-xl shadow-blue-500/5">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading attendance roster...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No students enrolled in this class yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 border-b border-blue-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Roll No</th>
                  <th className="py-3 px-4 font-semibold">Student Name</th>
                  <th className="py-3 px-4 font-semibold">Class & Batch</th>
                  <th className="py-3 px-4 font-semibold">Attendance Status</th>
                  <th className="py-3 px-4 font-semibold">Teacher Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50/80">
                {students.map(s => {
                  const current = attendanceState[s.id] || { status: 'present', remarks: '' };
                  return (
                    <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {s.rollNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-500">{s.phone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {s.batchName || 'General'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="inline-flex rounded-xl bg-slate-100 border border-slate-200 p-0.5">
                          <button
                            type="button"
                            onClick={() => setAttendanceState(prev => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], status: 'present' }
                            }))}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              current.status === 'present'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceState(prev => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], status: 'late' }
                            }))}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              current.status === 'late'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => setAttendanceState(prev => ({
                              ...prev,
                              [s.id]: { ...prev[s.id], status: 'absent' }
                            }))}
                            className={`px-3 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                              current.status === 'absent'
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <input
                          type="text"
                          value={current.remarks}
                          onChange={e => setAttendanceState(prev => ({
                            ...prev,
                            [s.id]: { ...prev[s.id], remarks: e.target.value }
                          }))}
                          placeholder="Optional remarks (e.g. sick leave, late 15m)"
                          className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
