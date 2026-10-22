import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { ClassLevel, Batch } from '../types';
import { BookOpen, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

interface RegisterPageProps {
  onNavigate: (view: string) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    classId: '',
    batchId: '',
    guardianName: '',
    guardianPhone: '',
    guardianRelation: 'Father'
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/classes');
        setClasses(data.classes || []);
        setBatches(data.batches || []);
        if (data.classes && data.classes.length > 0) {
          setForm(prev => ({ ...prev, classId: data.classes[0].id }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, []);

  const availableBatches = batches.filter(b => b.classId === form.classId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await register({
        ...form,
        batchId: form.batchId || (availableBatches[0]?.id || 'all')
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/60 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="flex justify-center mb-3">
          <button
            onClick={() => onNavigate('landing')}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 transition-transform hover:scale-105"
          >
            <BookOpen className="w-6 h-6" />
          </button>
        </div>
        <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900">
          Student Coaching Registration
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 font-medium">
          Enrolled Offline Students: Register to access daily class summaries and digital homework
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white/90 backdrop-blur-xl py-8 px-6 shadow-[0_20px_50px_rgba(37,99,235,0.08)] rounded-3xl border border-blue-100 sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Account Created Successfully!</h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Your admission details have been submitted to <strong>Er. Rajesh Sharma</strong>. You can now log in, view your assigned batch, and activate your monthly tuition membership.
              </p>
              <button
                onClick={() => onNavigate('student-dashboard')}
                className="mt-4 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25"
              >
                Go to Student Portal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Student Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Rohan Verma"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9822055443"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="e.g. rohan@student.com"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Create Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Choose a strong password"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  />
                </div>
              </div>

              {/* Class & Batch Selection */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Class *
                  </label>
                  <select
                    value={form.classId}
                    onChange={e => setForm({ ...form, classId: e.target.value, batchId: '' })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (₹{c.monthlyFee}/mo)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Preferred Batch Slot
                  </label>
                  <select
                    value={form.batchId}
                    onChange={e => setForm({ ...form, batchId: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  >
                    {availableBatches.length > 0 ? (
                      availableBatches.map(b => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))
                    ) : (
                      <option value="all">Any Available Slot</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Parent/Guardian Info */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-slate-800">Parent / Guardian Contact:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">Guardian Name</label>
                    <input
                      type="text"
                      value={form.guardianName}
                      onChange={e => setForm({ ...form, guardianName: e.target.value })}
                      placeholder="e.g. Amit Verma"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">Guardian Mobile</label>
                    <input
                      type="tel"
                      value={form.guardianPhone}
                      onChange={e => setForm({ ...form, guardianPhone: e.target.value })}
                      placeholder="e.g. 9822055400"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 font-medium mb-1">Relationship</label>
                    <select
                      value={form.guardianRelation}
                      onChange={e => setForm({ ...form, guardianRelation: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting Registration...' : 'Complete Registration'}</span>
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-600">
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
