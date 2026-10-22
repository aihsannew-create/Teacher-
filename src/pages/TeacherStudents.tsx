import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { StudentProfile, ClassLevel, Batch } from '../types';
import { Users, Search, Plus, CheckCircle2, UserX, UserCheck, ShieldAlert, Edit2, History, X, AlertCircle, Trash2, Lock } from 'lucide-react';

interface TeacherStudentsProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const TeacherStudents: React.FC<TeacherStudentsProps> = ({ onNavigate }) => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentProfile | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<StudentProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: 'student123',
    classId: '',
    batchId: '',
    rollNumber: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Father',
    customFee: '',
    notes: '',
    initialStatus: 'active'
  });

  // History modal
  const [historyStudent, setHistoryStudent] = useState<any>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedClass !== 'all') queryParams.set('classId', selectedClass);
      if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
      if (search.trim()) queryParams.set('search', search.trim());

      const [studentsRes, classesRes] = await Promise.all([
        apiFetch(`/api/students?${queryParams.toString()}`),
        apiFetch('/api/classes')
      ]);

      setStudents(studentsRes.students || []);
      setClasses(classesRes.classes || []);
      setBatches(classesRes.batches || []);

      if (classesRes.classes?.length > 0 && !formData.classId) {
        setFormData(prev => ({ ...prev, classId: classesRes.classes[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    try {
      await apiFetch(`/api/students/${studentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: 'student123',
      classId: classes[0]?.id || '',
      batchId: '',
      rollNumber: '',
      guardianName: '',
      guardianPhone: '',
      guardianRelation: 'Father',
      customFee: '',
      notes: '',
      initialStatus: 'active'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (s: StudentProfile) => {
    setEditingStudent(s);
    setFormData({
      name: s.name,
      email: s.email,
      phone: s.phone,
      password: (s as any).passwordPreview || 'student123',
      classId: s.classId,
      batchId: s.batchId,
      rollNumber: s.rollNumber,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      guardianRelation: s.guardianRelation,
      customFee: s.customFee ? String(s.customFee) : '',
      notes: s.notes || '',
      initialStatus: s.status
    });
    setShowAddModal(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await apiFetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...formData,
            customFee: formData.customFee ? Number(formData.customFee) : undefined
          })
        });
      } else {
        await apiFetch('/api/students', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            customFee: formData.customFee ? Number(formData.customFee) : undefined
          })
        });
      }
      setShowAddModal(false);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to save student');
    }
  };

  const handleDeleteStudentConfirm = async () => {
    if (!deletingStudent) return;
    setIsDeleting(true);
    try {
      await apiFetch(`/api/students/${deletingStudent.id}`, { method: 'DELETE' });
      setDeletingStudent(null);
      await fetchStudents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete student');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewHistory = async (studentId: string) => {
    try {
      const data = await apiFetch(`/api/students/${studentId}/history`);
      setHistoryStudent(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load history');
    }
  };

  const handleExportCsv = () => {
    window.open('/api/reports/export-csv?type=students', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              <span>Teacher Cabin · Student Directory</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Student Directory & Batch Enrollment
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Admissions, pending approval queue, batch shifts, and 360° student records
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white/90 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-xs"
            >
              Export CSV
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student Manually</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-sm text-xs">
          <form onSubmit={handleSearchSubmit} className="md:col-span-4 relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, roll no, phone..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-blue-500" />
          </form>

          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-slate-500 font-medium shrink-0">Class:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-4 flex items-center gap-2">
            <span className="text-slate-500 font-medium shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending_approval">Pending Approval (New)</option>
              <option value="expired">Expired / Overdue</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 overflow-hidden shadow-xl shadow-blue-500/5">
          <div className="p-4 border-b border-blue-100/80 bg-blue-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Student Enrollment Roster</h3>
            </div>
            <span className="text-xs text-blue-700 bg-blue-100/70 border border-blue-200 px-2.5 py-0.5 rounded-full font-mono font-bold">
              {students.length} Student{students.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading student directory...</div>
          ) : students.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No students found matching your filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-blue-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Roll No</th>
                    <th className="py-3 px-4 font-semibold">Student & Contact</th>
                    <th className="py-3 px-4 font-semibold">Class & Batch</th>
                    <th className="py-3 px-4 font-semibold">Guardian Details</th>
                    <th className="py-3 px-4 font-semibold">Membership Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/80">
                  {students.map(s => {
                    const isPending = s.status === 'pending_approval';
                    const isExpired = s.status === 'expired';

                    return (
                      <tr key={s.id} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                          {s.rollNumber}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{s.name}</div>
                          <div className="text-[11px] text-slate-500">{s.phone} · {s.email}</div>
                          <div className="text-[10px] text-amber-800 font-mono mt-0.5 flex items-center gap-1">
                            <span className="text-slate-400">Pass:</span>
                            <span className="bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 font-bold font-mono">
                              {(s as any).passwordPreview || 'student123'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800 font-medium">{s.className}</div>
                          <div className="text-[11px] text-slate-500">{s.batchName}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800">{s.guardianName} ({s.guardianRelation})</div>
                          <div className="text-[11px] text-slate-500 font-mono">{s.guardianPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          {isPending ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                              PENDING APPROVAL
                            </span>
                          ) : isExpired ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-full">
                              EXPIRED / DUE
                            </span>
                          ) : s.status === 'suspended' ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 rounded-full">
                              SUSPENDED
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                              ACTIVE (until {s.membership?.expiryDate || 'N/A'})
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {isPending ? (
                            <button
                              onClick={() => handleStatusChange(s.id, 'active')}
                              className="px-3 py-1 text-[11px] font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 shadow-sm"
                            >
                              Approve
                            </button>
                          ) : isExpired ? (
                            <button
                              onClick={() => onNavigate('teacher-payments', { studentId: s.id })}
                              className="px-3 py-1 text-[11px] font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-sm"
                            >
                              Record Fee
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(s.id, 'expired')}
                              className="px-2.5 py-1 text-[11px] font-medium text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors"
                              title="Mark Expired"
                            >
                              Expire
                            </button>
                          )}

                          <button
                            onClick={() => handleViewHistory(s.id)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="View 360° History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingStudent(s)}
                            className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                            title="Delete Student Account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingStudent ? `Edit Student: ${editingStudent.name}` : 'Add Student Manually'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Student Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email / Login ID *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-amber-50 border border-amber-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    value={formData.rollNumber}
                    onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                    placeholder="Auto-generated"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value, batchId: '' })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Batch</label>
                  <select
                    value={formData.batchId}
                    onChange={e => setFormData({ ...formData, batchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">Unassigned / All</option>
                    {batches.filter(b => b.classId === formData.classId).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Name</label>
                  <input
                    type="text"
                    value={formData.guardianName}
                    onChange={e => setFormData({ ...formData, guardianName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone</label>
                  <input
                    type="tel"
                    value={formData.guardianPhone}
                    onChange={e => setFormData({ ...formData, guardianPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fee Override (₹)</label>
                  <input
                    type="number"
                    value={formData.customFee}
                    onChange={e => setFormData({ ...formData, customFee: e.target.value })}
                    placeholder="Standard class fee"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Teacher Private Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Private observations on student's performance or fee concessions..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-3 border-t border-blue-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Student Modal */}
      {deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-red-100 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Student Account?</h3>
                <p className="text-xs text-slate-500">Remove this student and their login credentials</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/50 border border-red-100 text-xs space-y-1">
              <div className="font-bold text-slate-900">{deletingStudent.name}</div>
              <div className="text-slate-600 font-mono">Roll: {deletingStudent.rollNumber} • {deletingStudent.email}</div>
              <div className="text-slate-500 font-mono">Password: {(deletingStudent as any).passwordPreview || 'student123'}</div>
              <div className="text-red-700 text-[11px] pt-1">⚠️ This will delete the student's login access and associated records.</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingStudent(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteStudentConfirm}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl flex items-center gap-1.5 shadow-md shadow-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 360-Degree History Modal */}
      {historyStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Student Record: {historyStudent.student.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Roll: {historyStudent.student.rollNumber} · Class: {historyStudent.className} · Batch: {historyStudent.batchName}
                </p>
              </div>
              <button
                onClick={() => setHistoryStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attendance history */}
            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">Classroom Attendance Log:</div>
              <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 max-h-36 overflow-y-auto space-y-1.5 text-xs">
                {historyStudent.attendance.length === 0 ? (
                  <div className="text-slate-500">No attendance records.</div>
                ) : (
                  historyStudent.attendance.map((a: any) => (
                    <div key={a.id} className="flex justify-between items-center text-[11px] py-1 border-b border-blue-100/50 last:border-none">
                      <span className="font-mono text-slate-700">{a.date}</span>
                      <span className={`capitalize font-semibold ${a.status === 'present' ? 'text-emerald-700' : a.status === 'late' ? 'text-amber-700' : 'text-rose-700'}`}>
                        {a.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Homework Submissions */}
            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">Homework Submissions & Grades:</div>
              <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 max-h-36 overflow-y-auto space-y-2 text-xs">
                {historyStudent.submissions.length === 0 ? (
                  <div className="text-slate-500">No submissions yet.</div>
                ) : (
                  historyStudent.submissions.map((sub: any) => (
                    <div key={sub.id} className="p-2.5 rounded-xl bg-white border border-blue-100 text-[11px] space-y-1 shadow-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800">Status: {sub.status}</span>
                        <span className="font-mono text-blue-600 font-bold">{sub.obtainedMarks} Marks</span>
                      </div>
                      {sub.teacherFeedback && (
                        <div className="text-slate-600 italic">"{sub.teacherFeedback}"</div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Verified Payment Receipts */}
            <div>
              <div className="text-xs font-bold text-slate-800 mb-2">Fee Receipts:</div>
              <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 max-h-36 overflow-y-auto space-y-1.5 text-xs">
                {historyStudent.receipts.length === 0 ? (
                  <div className="text-slate-500">No fee receipts on record.</div>
                ) : (
                  historyStudent.receipts.map((r: any) => (
                    <div key={r.receiptNumber} className="flex justify-between items-center text-[11px] py-1 border-b border-blue-100/50 last:border-none">
                      <span className="font-mono font-bold text-blue-600">#{r.receiptNumber}</span>
                      <span className="text-slate-700">{r.billingMonth}</span>
                      <span className="font-mono font-bold text-emerald-700">₹{r.amount}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
