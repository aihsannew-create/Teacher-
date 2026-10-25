import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { PaymentTransaction, PaymentReceipt } from '../types';
import { CreditCard, Receipt, Printer, AlertCircle, Clock, ShieldCheck, QrCode } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { AccessCountdownTimer } from '../components/AccessCountdownTimer';
import { SubmitPaymentProofModal } from '../components/SubmitPaymentProofModal';

export const StudentPayments: React.FC = () => {
  const { studentProfile, membership, refreshProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showProofModal, setShowProofModal] = useState(false);
  const [pendingPayment, setPendingPayment] = useState<any>(null);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const [data, statusRes] = await Promise.all([
        apiFetch('/api/payments/history'),
        apiFetch('/api/payments/my-status').catch(() => null)
      ]);
      setPayments(data.payments || []);
      setReceipts(data.receipts || []);
      if (statusRes?.pendingRequest) {
        setPendingPayment(statusRes.pendingRequest);
      } else {
        setPendingPayment(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [membership]);

  const isExpired = membership?.status === 'expired' || (membership && new Date(membership.expiryDate).getTime() < Date.now());
  const feeAmount = studentProfile?.customFee || studentProfile?.monthlyFee || 2500;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Tuition Membership & Fee Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Official payment history, 30-day access validity tracking, and computer-verified receipts
          </p>
        </div>

        {/* Pending Verification Notice */}
        {pendingPayment && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-spin" />
              <div>
                <span className="font-bold text-amber-950">Payment ID Verification Pending</span>
                <p className="text-slate-600 mt-0.5">
                  Aapka Payment ID / UTR <strong className="font-mono text-blue-700 font-bold">{pendingPayment.utrNumber || pendingPayment.id}</strong> (₹{pendingPayment.amount}) Admin (AIHSAN ANSARI) ke paas verify hone ke liye pending hai. Approve hote hi 30 din ka access chalu ho jayega.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowProofModal(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold shrink-0 transition-colors cursor-pointer"
            >
              Update Payment ID
            </button>
          </div>
        )}

        {/* Live 30-Day Access Countdown Timer */}
        <AccessCountdownTimer
          expiryDate={membership?.expiryDate}
          startDate={membership?.startDate}
          onOpenPaymentModal={() => setShowProofModal(true)}
        />

        {/* Action Bar for submitting payment */}
        <div className="p-4 rounded-2xl bg-white/90 border border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="text-xs text-slate-600">
            Monthly Coaching Fee: <strong className="text-slate-900 font-mono font-bold text-sm">₹{feeAmount.toLocaleString('en-IN')}</strong> · Roll: <strong className="font-mono text-blue-700">{studentProfile?.rollNumber}</strong>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowProofModal(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Submit Payment ID / UTR (QR)</span>
            </button>
            <button
              onClick={() => setShowPayModal(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay Online Gateway</span>
            </button>
          </div>
        </div>

        {/* Payment History Table in White Glass Card */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 overflow-hidden shadow-[0_10px_30px_rgba(37,99,235,0.04)]">
          <div className="p-4 border-b border-blue-100/90 flex items-center justify-between bg-blue-50/40">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Payment Receipts & Transactions</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono font-medium">
              {receipts.length} Official Receipt{receipts.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading payment history...</div>
          ) : receipts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No fee payments recorded yet. Pay your first month fee above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Receipt No</th>
                    <th className="py-3 px-4 font-semibold">Billing Period</th>
                    <th className="py-3 px-4 font-semibold">Payment Mode</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.map(rcp => (
                    <tr key={rcp.receiptNumber} className="hover:bg-blue-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                        {rcp.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium">
                        {rcp.billingMonth}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-slate-700 font-medium">
                          {rcp.paymentMethod === 'razorpay' ? 'Razorpay PG' : rcp.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {rcp.receiptDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-right text-slate-900 tabular-nums">
                        ₹{rcp.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveReceipt(rcp)}
                          className="px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 shadow-2xs transition-all inline-flex items-center gap-1.5"
                        >
                          <Printer className="w-3 h-3 text-blue-600" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={showPayModal}
        onClose={() => setShowPayModal(false)}
        onPaymentSuccess={(rcp) => {
          setShowPayModal(false);
          setActiveReceipt(rcp);
          fetchHistory();
          refreshProfile();
        }}
      />

      {/* Official Receipt Viewer */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* Submit Payment Proof Modal */}
      <SubmitPaymentProofModal
        isOpen={showProofModal}
        onClose={() => setShowProofModal(false)}
        onSuccess={() => {
          setShowProofModal(false);
          fetchHistory();
          refreshProfile();
        }}
      />
    </div>
  );
};
