import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { Users, CreditCard, BookOpen, AlertCircle, TrendingUp, Download, Plus, Clock } from 'lucide-react';
import { PaymentReceipt } from '../types';
import { ReceiptModal } from '../components/ReceiptModal';
import { PendingPaymentApprovals } from '../components/PendingPaymentApprovals';
import { useUiText } from '../context/UiTextContext';

interface TeacherDashboardProps {
  onNavigate: (view: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate }) => {
  const { uiTexts } = useUiText();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);
  const [batchStats, setBatchStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  const fetchDashboard = async () => {
    try {
      const data = await apiFetch('/api/reports/dashboard');
      setMetrics(data.metrics);
      setRecentPayments(data.recentPayments || []);
      setBatchStats(data.batchStats || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleExportPayments = () => {
    const a = document.createElement('a');
    a.href = '/api/reports/export-csv?type=payments';
    a.download = 'tuition_payments.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-blue-100/90">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md ring-2 ring-blue-500/20 border border-white shrink-0 bg-slate-900">
              <img
                src="/assets/teacher_photo.png"
                alt={uiTexts.teacherName || 'Faculty'}
                className="w-full h-full object-cover object-[center_18%]"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  {uiTexts.teacherCabinTitle || 'Teacher Cabin & Control Center'}
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {uiTexts.teacherName} · {uiTexts.teacherCabinSubtitle || 'Offline Batches & Digital Homework Oversight'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('teacher-homework')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-md shadow-blue-500/25 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{uiTexts.publishHomeworkPrompt || 'Publish Daily Homework'}</span>
            </button>

            <button
              onClick={() => onNavigate('teacher-payments')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-2xs transition-all flex items-center gap-1.5"
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Record Cash Fee</span>
            </button>

            <button
              onClick={handleExportPayments}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:text-blue-700 shadow-2xs transition-all flex items-center gap-1.5"
              title="Download CSV"
            >
              <Download className="w-4 h-4 text-slate-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Primary Metrics Strip in Frosted White Glass */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Total Enrolled</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
              {metrics?.totalStudents || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-700 font-bold">{metrics?.activeStudents || 0} Active</span>
              <span>· {metrics?.overdueMemberships || 0} Overdue</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Monthly Collection</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-emerald-600 tabular-nums">
              ₹{(metrics?.thisMonthRevenue || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Total lifetime: ₹{(metrics?.totalRevenue || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Outstanding Fees</span>
              <AlertCircle className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-amber-600 tabular-nums">
              ₹{(metrics?.outstandingFees || 0).toLocaleString('en-IN')}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              {metrics?.overdueMemberships || 0} students with pending dues
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Pending Reviews</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-blue-700 tabular-nums">
              {metrics?.pendingReviewSubmissions || 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Homework submissions waiting for grading
            </div>
          </div>
        </div>

        {/* Pending UPI Fee Verification & Approvals (Requirement 1) */}
        <PendingPaymentApprovals onApprovalSuccess={fetchDashboard} />

        {/* Quick Review Alert If Pending Homework */}
        {metrics?.pendingReviewSubmissions > 0 && (
          <div className="p-4 rounded-2xl bg-blue-50/90 backdrop-blur-md border border-blue-200/90 flex items-center justify-between gap-4 text-xs shadow-xs">
            <div className="flex items-center gap-2.5 text-blue-950 font-medium">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                You have <strong>{metrics.pendingReviewSubmissions} student homework submissions</strong> waiting for marks and feedback.
              </span>
            </div>
            <button
              onClick={() => onNavigate('teacher-submissions')}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 whitespace-nowrap shadow-xs"
            >
              Grade Submissions
            </button>
          </div>
        )}

        {/* Two-Column Split in White Glass Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Batches Overview */}
          <div className="lg:col-span-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 p-6 space-y-4 shadow-[0_10px_30px_rgba(37,99,235,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Active Coaching Batches</h3>
                <p className="text-xs text-slate-500">Class timing and seat capacity</p>
              </div>
              <button
                onClick={() => onNavigate('teacher-classes')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                Manage Classes
              </button>
            </div>

            <div className="space-y-3">
              {batchStats.map(b => (
                <div
                  key={b.batchId}
                  className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{b.batchName}</span>
                    <span className="text-slate-500 font-mono text-[11px] font-medium">{b.timing}</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-500 text-[11px]">
                    <span className="font-medium">Class: {b.className}</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {b.enrolled} / {b.capacity} Students Enrolled
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full"
                      style={{ width: `${Math.min(100, (b.enrolled / b.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Fee Collection */}
          <div className="lg:col-span-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 p-6 space-y-4 shadow-[0_10px_30px_rgba(37,99,235,0.04)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Recent Fee Collection</h3>
                <p className="text-xs text-slate-500">Computer-verified transactions</p>
              </div>
              <button
                onClick={() => onNavigate('teacher-payments')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                View Full Ledger
              </button>
            </div>

            {recentPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No payment records yet.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentPayments.map(p => (
                  <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{p.studentName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {p.rollNumber} · {p.receiptNumber} · <span className="capitalize">{p.paymentMethod}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-extrabold text-emerald-700 tabular-nums">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
