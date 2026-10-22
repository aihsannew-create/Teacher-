import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { AttendanceRecord } from '../types';
import { CalendarCheck, CheckCircle2, AlertCircle, Clock, Award } from 'lucide-react';

export const StudentAttendance: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const data = await apiFetch('/api/attendance');
        setRecords(data.attendance || []);
        setSummary(data.summary || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Classroom Attendance & Compliance Log
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Physical classroom attendance marked daily by Er. Rajesh Sharma
          </p>
        </div>

        {/* Attendance Statistics in Frosted Glass Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="text-[11px] text-slate-500 font-semibold">Overall Attendance</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-blue-700 tabular-nums">
              {summary?.percentage || 96}%
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <Award className="w-3 h-3" /> Excellent Discipline
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="text-[11px] text-slate-500 font-semibold">Total Lectures</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 tabular-nums">
              {summary?.totalClasses || records.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Conducted this term</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="text-[11px] text-slate-500 font-semibold">Present Days</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-emerald-600 tabular-nums">
              {summary?.present || 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Full attendance</div>
          </div>

          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="text-[11px] text-slate-500 font-semibold">Late / Absent</div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-amber-600 tabular-nums">
              {(summary?.late || 0) + (summary?.absent || 0)}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {summary?.late || 0} Late · {summary?.absent || 0} Absent
            </div>
          </div>
        </div>

        {/* Daily Attendance History */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 overflow-hidden shadow-[0_10px_30px_rgba(37,99,235,0.04)]">
          <div className="p-4 border-b border-blue-100/90 flex items-center justify-between bg-blue-50/40">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Daily Attendance Records</h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">Official Physical Register</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading attendance log...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No attendance records logged yet.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {records.map(rec => (
                <div key={rec.id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-blue-50/30 transition-colors">
                  <div>
                    <div className="font-mono font-bold text-slate-900">{rec.date}</div>
                    {rec.remarks && (
                      <div className="text-[11px] text-slate-500 italic mt-0.5">
                        Note: "{rec.remarks}"
                      </div>
                    )}
                  </div>

                  <div>
                    {rec.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Present
                      </span>
                    ) : rec.status === 'late' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-700">
                        <Clock className="w-3.5 h-3.5" /> Late Arrival
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-50 border border-red-200 text-red-700">
                        <AlertCircle className="w-3.5 h-3.5" /> Absent
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
