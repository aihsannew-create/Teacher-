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
  GraduationCap
} from 'lucide-react';

interface PendingPayment {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  className: string;
  batchName: string;
  amount: number;
  periodStart: string;
  status: 'pending';
  paymentMethod: string;
  utrNumber?: string;
  screenshotUrl?: string;
  teacherNotes?: string;
  createdAt: string;
  studentPhone?: string;
  guardianPhone?: string;
  guardianName?: string;
  currentMembershipStatus?: string;
  currentExpiryDate?: string;
  isCurrentExpired?: boolean;
}

interface PendingPaymentApprovalsProps {
  onApprovalSuccess?: () => void;
  title?: string;
  showCardWrapper?: boolean;
}

export const PendingPaymentApprovals: React.FC<PendingPaymentApprovalsProps> = ({
  onApprovalSuccess,
  title = 'Student Fee Payment ID Verification & 30-Day Access Grant',
  showCardWrapper = true
}) => {
  const [requests, setRequests] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customDaysMap, setCustomDaysMap] = useState<Record<string, number>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/payments/pending-requests');
      setRequests(data.pendingRequests || []);
    } catch (err: any) {
      console.error('Failed to load pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApprove = async (paymentId: string, studentName: string) => {
    const days = customDaysMap[paymentId] || 30;
    setActionLoadingId(paymentId);
    setErrorMsg(null);
    try {
      const res = await apiFetch(`/api/payments/approve-request/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify({
          accessDays: days,
          adminRemarks: `Approved by Admin. ${days} Days full access granted.`
        })
      });

      setSuccessMsg(`✓ ${studentName} ko ${days} din ka homework access safaltapurvak pradan kar diya gaya! (Valid till: ${new Date(res.newExpiryDate).toLocaleDateString('en-IN')})`);
      setTimeout(() => setSuccessMsg(null), 5000);
      await fetchPending();
      if (onApprovalSuccess) onApprovalSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment approve karne me truti aayi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (paymentId: string, studentName: string) => {
    const reason = window.prompt(
      `Student "${studentName}" ka payment reject karne ka karan darj karein:`,
      'Bank statement me transaction ID / UTR verify nahi ho saka.'
    );
    if (!reason) return;

    setActionLoadingId(paymentId);
    try {
      await apiFetch(`/api/payments/reject-request/${paymentId}`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });

      setSuccessMsg(`Payment ID for ${studentName} rejected.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      await fetchPending();
      if (onApprovalSuccess) onApprovalSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment reject karne me truti aayi.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const content = (
    <div className="space-y-4">
      {/* Notifications */}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-blue-100/80">
        <div>
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span>{title}</span>
            {requests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white animate-pulse">
                {requests.length} Action Required
              </span>
            )}
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Bache dwara PhonePe/UPI se fees bharne ke baad submit ki gayi Transaction ID / UTR verify karein aur 30 din ka access khol dein.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold border border-slate-200 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Requests</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400 space-y-2">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading pending verification requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-800">
            Koi Pending Payment Request Nahi Hai
          </h4>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Jab bhi koi bachha PhonePe ya UPI QR se fees jama karke Transaction ID / UTR submit karega, yahan turant notification aayega.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map(req => {
            const days = customDaysMap[req.id] || 30;
            const isProcessing = actionLoadingId === req.id;

            return (
              <div
                key={req.id}
                className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/20 border-2 border-blue-200 shadow-sm transition-all hover:border-blue-400 space-y-4"
              >
                {/* Row 1: Student info & Amount */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-sm text-slate-900">
                        {req.studentName}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        {req.rollNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                        {req.className}
                      </span>
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                        req.isCurrentExpired
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {req.isCurrentExpired ? 'Current: Expired / Locked' : 'Current: Active'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-0.5">
                      {req.studentPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>Student: {req.studentPhone}</span>
                        </span>
                      )}
                      {req.guardianPhone && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>Parent: {req.guardianPhone} ({req.guardianName || 'Guardian'})</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Submitted: {new Date(req.createdAt).toLocaleString('en-IN')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Fee Amount Tag */}
                  <div className="text-left sm:text-right shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Submitted Fee
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 tabular-nums">
                      ₹{req.amount.toLocaleString('en-IN')}
                    </div>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      via {req.paymentMethod.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Row 2: Submitted Transaction ID / UTR and Screenshot */}
                <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">
                        Payment Transaction ID / UTR:
                      </span>
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 text-xs sm:text-sm selection:bg-blue-200">
                        {req.utrNumber || req.id}
                      </span>
                      <button
                        onClick={() => handleCopy(req.utrNumber || req.id, req.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="Copy UTR ID"
                      >
                        {copiedId === req.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {req.screenshotUrl && (
                      <button
                        onClick={() => setSelectedScreenshot(req.screenshotUrl!)}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold border border-indigo-200 transition-all flex items-center gap-1.5 text-[11px] cursor-pointer self-start sm:self-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Screenshot Proof</span>
                      </button>
                    )}
                  </div>

                  {req.teacherNotes && (
                    <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                      <strong>Student Note:</strong> {req.teacherNotes}
                    </div>
                  )}
                </div>

                {/* Row 3: Admin Approval Action Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">Grant Duration:</span>
                    <select
                      value={days}
                      onChange={e => setCustomDaysMap(prev => ({ ...prev, [req.id]: Number(e.target.value) }))}
                      className="px-3 py-1.5 rounded-xl border border-blue-300 bg-white font-bold text-blue-800 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                    >
                      <option value={30}>30 Days (Standard 1 Month Access)</option>
                      <option value={60}>60 Days (2 Months)</option>
                      <option value={90}>90 Days (Quarterly / 3 Months)</option>
                      <option value={15}>15 Days (Half Month)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleReject(req.id, req.studentName)}
                      disabled={isProcessing}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApprove(req.id, req.studentName)}
                      disabled={isProcessing}
                      className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-600/25 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isProcessing ? 'Granting Access...' : `Approve & Grant ${days} Days Access`}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
                ✕
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
