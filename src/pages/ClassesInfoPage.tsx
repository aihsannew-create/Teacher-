import React, { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { ClassLevel, Batch } from '../types';
import { Clock, Users, ArrowLeft } from 'lucide-react';

interface ClassesInfoPageProps {
  onNavigate: (view: string) => void;
}

export const ClassesInfoPage: React.FC<ClassesInfoPageProps> = ({ onNavigate }) => {
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiFetch('/api/classes');
        setClasses(data.classes || []);
        setBatches(data.batches || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <button
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Overview</span>
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Coaching Batches, Timings & Transparent Fees
          </h1>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">
            Offline classroom coaching with small batch sizes (capped at 20-25 students) to ensure every student receives personal focus, doubt resolution, and daily verified homework correction.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-16 text-sm text-slate-500">Loading batch details...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => {
              const classBatches = batches.filter(b => b.classId === cls.id);
              return (
                <div
                  key={cls.id}
                  className="rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 shadow-[0_10px_30px_rgba(37,99,235,0.05)] p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs font-mono font-bold text-blue-600 uppercase">
                        {cls.code}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 mt-1">{cls.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {cls.description || 'Comprehensive board & concept coaching.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Subjects Covered:</div>
                      <div className="flex flex-wrap gap-1.5">
                        {cls.subjects.map((sub, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-blue-50 border border-blue-200/70 rounded-lg text-blue-700"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Available Batches:</div>
                      <div className="space-y-2">
                        {classBatches.length > 0 ? (
                          classBatches.map(b => (
                            <div
                              key={b.id}
                              className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs"
                            >
                              <div className="font-bold text-slate-900">{b.name}</div>
                              <div className="flex items-center gap-3 text-slate-500 mt-1 text-[11px]">
                                <span className="flex items-center gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-blue-600" /> {b.timing}
                                </span>
                                <span className="flex items-center gap-1 font-medium">
                                  <Users className="w-3 h-3 text-slate-400" /> Max {b.maxCapacity}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-slate-400">Contact office for timing slots</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-blue-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Monthly Tuition Fee</span>
                      <div className="text-xl font-extrabold font-mono text-blue-700 tabular-nums">
                        ₹{cls.monthlyFee.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500"> / mo</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onNavigate('register')}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/25"
                    >
                      Enroll in Batch
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
