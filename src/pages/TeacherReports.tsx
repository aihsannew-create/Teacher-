import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { TrendingUp, Users, Download, AlertTriangle, BookOpen, Calendar, CheckCircle2, FileSpreadsheet } from 'lucide-react';

export const TeacherReports: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [complianceList, setComplianceList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [dashRes, compRes] = await Promise.all([
          apiFetch('/api/reports/dashboard'),
          apiFetch('/api/attendance/compliance')
        ]);
        setDashboard(dashRes);
        setComplianceList(compRes.complianceList || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const downloadCsv = (type: 'payments' | 'students') => {
    window.open(`/api/reports/export-csv?type=${type}`, '_blank');
  };

  const m = dashboard?.metrics;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Teacher Cabin · Analytics & Reports</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reports, Compliance & Academic Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Grounded exclusively in real database records: fee revenue, missing homework, and attendance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadCsv('payments')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white/90 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Payments CSV</span>
            </button>
            <button
              onClick={() => downloadCsv('students')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white/90 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <span>Students Roster CSV</span>
            </button>
          </div>
        </div>

        {/* Collections Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 space-y-2 shadow-xl shadow-blue-500/5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">This Month's Fee Collection</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-emerald-700 tabular-nums">
              ₹{(m?.thisMonthRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500">
              Total Lifetime Revenue: <strong className="text-slate-800 font-semibold">₹{(m?.totalRevenue || 0).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 space-y-2 shadow-xl shadow-blue-500/5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Total Outstanding Dues</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-amber-700 tabular-nums">
              ₹{(m?.outstandingFees || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-xs text-slate-500">
              Across <strong className="text-slate-800 font-semibold">{m?.overdueMemberships || 0} students</strong> with expired membership
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 space-y-2 shadow-xl shadow-blue-500/5">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold">Homework Submissions Handled</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-mono font-bold text-blue-700 tabular-nums">
              {m?.totalSubmissions || 0}
            </div>
            <div className="text-xs text-slate-500">
              <span className="text-emerald-700 font-semibold">{m?.completedSubmissions || 0} graded</span> · 
              <span className="text-amber-700 font-semibold"> {m?.pendingReviewSubmissions || 0} pending review</span>
            </div>
          </div>
        </div>

        {/* Student Compliance Table (Missing Homework & Attendance Rate) */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 overflow-hidden shadow-xl shadow-blue-500/5">
          <div className="p-4 border-b border-blue-100/80 bg-blue-50/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Homework & Attendance Compliance Tracker
              </h3>
            </div>
            <span className="text-xs text-blue-700 font-medium">Daily Accountability Roster</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading compliance data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-blue-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Roll No</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Guardian Contact</th>
                    <th className="py-3 px-4 font-semibold text-center">Missing HW</th>
                    <th className="py-3 px-4 font-semibold text-center">Submitted HW</th>
                    <th className="py-3 px-4 font-semibold text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/80">
                  {complianceList.map(item => (
                    <tr key={item.studentId} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {item.rollNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div>{item.guardianName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{item.guardianPhone}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.missingHwCount > 0 ? (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-mono">
                            {item.missingHwCount} Missing
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                            Up to date
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {item.submittedHwCount} / {item.totalAssignedHw}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                        <span className={item.attendancePercentage < 75 ? 'text-rose-600' : 'text-emerald-700'}>
                          {item.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
