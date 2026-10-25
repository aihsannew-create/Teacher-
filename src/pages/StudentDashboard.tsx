import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUiText } from '../context/UiTextContext';
import { apiFetch } from '../api';
import { Homework, PaymentReceipt } from '../types';
import { BookOpen, CalendarCheck, CreditCard, AlertTriangle, CheckCircle2, Clock, ChevronRight, ShieldAlert } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { AccessCountdownTimer } from '../components/AccessCountdownTimer';
import { SubmitPaymentProofModal } from '../components/SubmitPaymentProofModal';

interface StudentDashboardProps {
  onNavigate: (view: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onNavigate }) => {
  const { user, studentProfile, membership, refreshProfile } = useAuth();
  const { uiTexts } = useUiText();
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [membershipExpired, setMembershipExpired] = useState(false);
  const [membershipWarning, setMembershipWarning] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        try {
          const hwData = await apiFetch('/api/homework');
          setHomeworkList(hwData.homework || []);
          if (hwData.membershipWarning) {
            setMembershipWarning(hwData.membershipWarning.message);
          }
          setMembershipExpired(false);
        } catch (err: any) {
          if (err.status === 403 && (err.data?.error === 'membership_expired' || err.data?.locked)) {
            setMembershipExpired(true);
          }
        }

        try {
          const statusRes = await apiFetch('/api/payments/my-status');
          if (statusRes?.pendingRequest) {
            setPendingPayment(statusRes.pendingRequest);
          } else {
            setPendingPayment(null);
          }
          if (statusRes?.isExpired) {
            setMembershipExpired(true);
          }
        } catch {}

        try {
          const attData = await apiFetch('/api/attendance');
          setAttendanceSummary(attData.summary);
        } catch (err) {
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [membership]);

  const isPendingApproval = studentProfile?.status === 'pending_approval';
  const pendingHw = homeworkList.filter(h => !h.isSubmitted);
  const completedHw = homeworkList.filter(h => h.isSubmitted);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-blue-100/90">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Namaste, {studentProfile?.name || user?.name}!
              </h1>
              <span className="px-2.5 py-0.5 text-[11px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                {studentProfile?.rollNumber}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Class: <span className="text-slate-800 font-semibold">{studentProfile?.className || 'Assigned Class'}</span> · 
              Batch: <span className="text-slate-800 font-semibold">{studentProfile?.batchName || 'Default Batch'}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('student-homework')}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/25 flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>Today's Homework</span>
            </button>
          </div>
        </div>

        {/* Pending Approval Notice */}
        {isPendingApproval && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/90 backdrop-blur-md flex items-start gap-3 text-xs text-amber-900 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-900">Admission Pending Teacher Approval</div>
              <p className="mt-0.5 text-amber-800/90 leading-relaxed">
                Your admission request is awaiting review by Er. Rajesh Sharma in the teacher cabin. You can browse homework once approved, or speak to the teacher in class.
              </p>
            </div>
          </div>
        )}

        {/* Pending Verification Notice if student submitted payment ID */}
        {pendingPayment && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
              <div>
                <span className="font-bold text-amber-950">Payment Verification Pending (Admin Review)</span>
                <p className="text-slate-600 mt-0.5">
                  Aapne Payment ID / UTR <strong className="font-mono text-blue-700 font-bold">{pendingPayment.utrNumber || pendingPayment.id}</strong> (₹{pendingPayment.amount}) submit kiya hai. Admin approve karte hi 30 din ka timer chalu ho jayega.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowProofModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold shrink-0 transition-colors cursor-pointer"
            >
              Update / Submit Again
            </button>
          </div>
        )}

        {/* Live 30-Day Access Countdown Timer Panel */}
        <AccessCountdownTimer
          expiryDate={membership?.expiryDate}
          startDate={membership?.startDate}
          onExpire={() => setMembershipExpired(true)}
          onOpenPaymentModal={() => setShowProofModal(true)}
        />

        {/* KPI Strip in Frosted White Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Pending Homework</span>
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
              {membershipExpired ? 'Locked' : pendingHw.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Due for review by tomorrow morning
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Completed Homework</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-slate-900 tabular-nums">
              {completedHw.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Submitted and verified by teacher
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Attendance Rate</span>
              <CalendarCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="mt-2 text-2xl font-extrabold font-mono text-blue-700 tabular-nums">
              {attendanceSummary?.percentage || 96}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Physical classroom attendance
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_4px_20px_rgba(37,99,235,0.03)]">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Monthly Fee Status</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div className={`mt-2 text-base font-extrabold capitalize ${membershipExpired ? 'text-red-600' : 'text-emerald-600'}`}>
              {membershipExpired ? 'Overdue / Expired' : 'Paid & Active'}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Next due: {membership?.expiryDate || 'N/A'}
            </div>
          </div>
        </div>

        {/* Today's Homework Highlight */}
        <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 shadow-[0_10px_30px_rgba(37,99,235,0.04)] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Today's Classwork & Homework</h3>
              <p className="text-xs text-slate-500">Class summaries published by Er. Rajesh Sharma</p>
            </div>
            <button
              onClick={() => onNavigate('student-homework')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-bold"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {membershipExpired ? (
            <div className="py-8 text-center text-xs text-slate-600 bg-red-50/50 rounded-2xl border border-red-100 p-6 space-y-3">
              <ShieldAlert className="w-8 h-8 text-red-500 mx-auto" />
              <div className="font-bold text-slate-900 text-sm">
                Homework access is locked due to expired membership.
              </div>
              <p className="max-w-md mx-auto text-slate-600">
                Please clear your monthly tuition dues to unlock "Aaj class mein kya padhaya gaya", assignment sheets, and solution submission.
              </p>
              <button
                onClick={() => setShowPayModal(true)}
                className="px-5 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 shadow-md shadow-blue-500/25"
              >
                Clear Tuition Due (₹{studentProfile?.monthlyFee || 2500})
              </button>
            </div>
          ) : homeworkList.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No homework published for today yet. Check back after your offline class!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {homeworkList.slice(0, 2).map(hw => (
                <div
                  key={hw.id}
                  className="p-5 rounded-2xl bg-white border border-blue-100/90 shadow-xs flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-blue-700">{hw.subject}</span>
                      <span className="font-mono font-medium">Max: {hw.maxMarks} M</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1">{hw.chapter}</h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{hw.topic}</p>

                    <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-xs">
                      <div className="text-[11px] font-bold text-blue-900 mb-0.5">
                        Aaj Class Mein Kya Padhaya Gaya:
                      </div>
                      <p className="text-slate-700 text-[11px] line-clamp-2 leading-relaxed">
                        {hw.teachingSummary}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-500">
                      Status: {hw.isSubmitted ? (
                        <span className="text-emerald-700 font-bold">Submitted ({hw.mySubmission?.status})</span>
                      ) : (
                        <span className="text-amber-700 font-bold">Pending Submission</span>
                      )}
                    </span>
                    <button
                      onClick={() => onNavigate('student-homework')}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-500 shadow-xs"
                    >
                      {hw.isSubmitted ? 'View Details' : 'Submit Solution'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onPaymentSuccess={(rcp) => {
          setSelectedReceipt(rcp);
          setShowPayModal(false);
          refreshProfile();
        }}
      />

      {/* Receipt Viewer */}
      <ReceiptModal
        receipt={selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Submit Payment Proof Modal */}
      <SubmitPaymentProofModal
        isOpen={showProofModal}
        onClose={() => setShowProofModal(false)}
        onSuccess={() => {
          setShowProofModal(false);
          refreshProfile();
        }}
      />
    </div>
  );
};
