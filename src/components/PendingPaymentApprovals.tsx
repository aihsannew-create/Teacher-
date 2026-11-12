import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Check,
  Search,
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCw,
  Phone,
  User,
  GraduationCap,
  Calendar,
  Layers,
  X
} from 'lucide-react';

interface PaymentRequestItem {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  className: string;
  batchName?: string;
  amount: number;
  periodStart?: string;
  periodEnd?: string;
  status: 'pending' | 'success' | 'rejected';
  paymentMethod: string;
  utrNumber?: string;
  screenshotUrl?: string;
  teacherNotes?: string;
  adminRemarks?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
  studentPhone?: string;
  studentEmail?: string;
  guardianPhone?: string;
  guardianName?: string;
  currentMembershipStatus?: string;
  currentExpiryDate?: string;
  currentStartDate?: string;
  isCurrentExpired?: boolean;
}

interface PendingPaymentApprovalsProps {
  onApprovalSuccess?: () => void;
  title?: string;
  showCardWrapper?: boolean;
}

export const PendingPaymentApprovals: React.FC<PendingPaymentApprovalsProps> = ({
  onApprovalSuccess,
  title = 'Student Fee Payment Verification & Approval',
  showCardWrapper = true
}) => {
  const [pendingRequests, setPendingRequests] = useState<PaymentRequestItem[]>([]);
  const [allRequests, setAllRequests] = useState<PaymentRequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reject Modal State (no window.prompt!)
  const [rejectModalReq, setRejectModalReq] = useState<PaymentRequestItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/payments/pending-requests');
      setPendingRequests(data.pendingRequests || []);
      setAllRequests(data.allRequests || data.pendingRequests || []);
    } catch (err: any) {
      console.error('Failed to load payment requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (paymentId: string, studentName: string) => {
    setActionLoadingId(paymentId);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/payments/approve-request/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify({
          adminRemarks: 'Approved by Admin. Exactly 1 calendar month access activated.'
        })
      });

      const expiryFormatted = res.expiryDate
        ? new Date(res.expiryDate).toLocaleDateString('en-IN')
        : '1 Month';
      setSuccessMsg(`✓ ${studentName}'s payment approved! Subscription activated for 1 calendar month (Valid until: ${expiryFormatted}).`);
      setTimeout(() => setSuccessMsg(null), 6000);
      await fetchRequests();
      if (onApprovalSuccess) onApprovalSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error approving payment request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (req: PaymentRequestItem) => {
    setRejectModalReq(req);
    setRejectReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;
    const paymentId = rejectModalReq.id;
    const studentName = rejectModalReq.studentName;

    setActionLoadingId(paymentId);
    setErrorMsg(null);
    try {
      await apiFetch(`/api/payments/reject-request/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason.trim() })
      });

      setSuccessMsg(`Payment request for ${studentName} has been rejected.`);
      setTimeout(() => setSuccessMsg(null), 5000);
      setRejectModalReq(null);
      await fetchRequests();
      if (onApprovalSuccess) onApprovalSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting payment.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const displayedList = (activeTab === 'pending' ? pendingRequests : allRequests).filter(req => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      req.studentName.toLowerCase().includes(q) ||
      (req.rollNumber && req.rollNumber.toLowerCase().includes(q)) ||
      (req.className && req.className.toLowerCase().includes(q)) ||
      (req.utrNumber && req.utrNumber.toLowerCase().includes(q))
    );
  });

  const content = (
    <div className="space-y-4">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-950">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-300 text-red-800 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-700 hover:text-red-950">✕</button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-blue-100">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>{title}</span>
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                {pendingRequests.length} Pending Approval
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Verify student UPI UTR and payment screenshot. Approving activates access for exactly 1 calendar month from approval time.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={fetchRequests}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pending'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending Requests ({pendingRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Requests History ({allRequests.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by student, class, UTR..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading payment requests...</p>
        </div>
      ) : displayedList.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800">
            {activeTab === 'pending' ? 'No Pending Fee Approval Requests' : 'No Payment Requests Found'}
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            {activeTab === 'pending'
              ? 'When students submit UPI monthly fee proof with their UTR and screenshot, it will appear here for Admin verification.'
              : 'All historical fee approval submissions will be logged here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedList.map(req => {
            const isProcessing = actionLoadingId === req.id;
            const isPending = req.status === 'pending';
            const isApproved = req.status === 'success';
            const isRejected = req.status === 'rejected';

            return (
              <div
                key={req.id}
                className={`p-4 sm:p-5 rounded-2xl border-2 shadow-xs transition-all space-y-4 ${
                  isPending
                    ? 'bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 border-blue-200 hover:border-blue-400'
                    : isApproved
                    ? 'bg-white border-emerald-200'
                    : 'bg-white border-slate-200 opacity-80'
                }`}
              >
                {/* Row 1: Student Details & Amount */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        {req.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        ID: {req.rollNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                        Class: {req.className}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold border ${
                        isPending
                          ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                          : isApproved
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}>
                        {isPending ? '⏳ Pending Approval' : isApproved ? '✓ Approved (1 Month Active)' : '✕ Rejected'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                      {req.studentEmail && (
                        <span>Email: <strong className="text-slate-700 font-mono">{req.studentEmail}</strong></span>
                      )}
                      {req.studentPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>Phone: {req.studentPhone}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Submitted: {new Date(req.createdAt).toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Fee Amount */}
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Fee Amount
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 tabular-nums">
                      ₹{req.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      via {req.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Row 2: UTR, Screenshot & Student Notes */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        Transaction ID / UTR:
                      </span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 text-xs sm:text-sm selection:bg-blue-200">
                        {req.utrNumber || req.id}
                      </span>
                      <button
                        onClick={() => handleCopy(req.utrNumber || req.id, req.id)}
                        className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                        title="Copy UTR ID"
                      >
                        {copiedId === req.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {req.screenshotUrl ? (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedScreenshot(req.screenshotUrl!)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all flex items-center gap-1.5 text-[11px] cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Screenshot Proof</span>
                        </button>
                        <img
                          src={req.screenshotUrl}
                          alt="Thumbnail"
                          onClick={() => setSelectedScreenshot(req.screenshotUrl!)}
                          className="w-8 h-8 rounded-lg object-cover border border-slate-300 cursor-pointer shadow-2xs hover:opacity-80 transition-opacity"
                        />
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No screenshot attached</span>
                    )}
                  </div>

                  {req.teacherNotes && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                      <strong>Student Note:</strong> {req.teacherNotes}
                    </div>
                  )}

                  {req.adminRemarks && (
                    <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200 bg-white p-2 rounded-lg">
                      <strong>Admin Remarks:</strong> {req.adminRemarks}
                    </div>
                  )}

                  {isApproved && req.periodStart && req.periodEnd && (
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded-lg border border-emerald-200">
                      <span className="font-bold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                        <span>1 Calendar Month Active:</span>
                      </span>
                      <span>Start: <strong>{new Date(req.periodStart).toLocaleDateString('en-IN')}</strong></span>
                      <span>·</span>
                      <span>Expiry: <strong>{new Date(req.periodEnd).toLocaleDateString('en-IN')}</strong></span>
                    </div>
                  )}
                </div>

                {/* Row 3: Action Buttons (Approve / Reject) */}
                {isPending && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Approving activates subscription for <strong>exactly 1 calendar month</strong> from approval time.</span>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => openRejectModal(req)}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApprove(req.id, req.studentName)}
                        disabled={isProcessing}
                        className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{isProcessing ? 'Activating 1 Month...' : 'Approve (1 Calendar Month)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Modal with Optional Rejection Reason */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-6 border border-slate-200 shadow-2xl space-y-4 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-red-600 font-extrabold text-sm sm:text-base">
                <XCircle className="w-5 h-5" />
                <span>Reject Payment Request</span>
              </div>
              <button
                onClick={() => setRejectModalReq(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-slate-600">
                You are rejecting the payment submitted by <strong>{rejectModalReq.studentName}</strong> ({rejectModalReq.rollNumber}) for <strong>₹{rejectModalReq.amount}</strong> (UTR: <code className="text-blue-700">{rejectModalReq.utrNumber || rejectModalReq.id}</code>).
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Rejection Reason (Optional):
                </label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. UTR not found in bank statement, incorrect amount, or unclear screenshot..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-red-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  If provided, this reason will be displayed to the student so they can submit a renewal request with the correct details.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={actionLoadingId === rejectModalReq.id}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md shadow-red-500/25 flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{actionLoadingId === rejectModalReq.id ? 'Rejecting...' : 'Confirm Reject'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Payment Screenshot */}
      {selectedScreenshot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setSelectedScreenshot(null)}
        >
          <div
            className="relative max-w-xl max-h-[90vh] bg-white rounded-3xl p-4 overflow-hidden border border-slate-700 shadow-2xl flex flex-col space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-800 text-xs">Payment Screenshot Proof</span>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-auto max-h-[75vh] flex items-center justify-center">
              <img
                src={selectedScreenshot}
                alt="Payment Proof"
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!showCardWrapper) {
    return content;
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl p-5 sm:p-6 rounded-3xl border border-blue-100 shadow-xs">
      {content}
    </div>
  );
};
