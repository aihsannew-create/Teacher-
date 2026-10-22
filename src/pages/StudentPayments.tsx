import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { PaymentTransaction, PaymentReceipt } from '../types';
import { CreditCard, Receipt, Printer, AlertCircle } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';

export const StudentPayments: React.FC = () => {
  const { studentProfile, membership, refreshProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/payments/history');
      setPayments(data.payments || []);
      setReceipts(data.receipts || []);
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
            Official payment history, automated membership renewal, and computer-verified receipts
          </p>
        </div>

        {/* Current Membership Status in Frosted Glass Card */}
        <div className={`p-6 rounded-3xl border shadow-[0_10px_30px_rgba(37,99,235,0.05)] backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${
          isExpired
            ? 'bg-red-50/90 border-red-200'
            : 'bg-gradient-to-r from-blue-50/95 via-white/95 to-indigo-50/80 border-blue-200/90'
        }`}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 text-xs font-bold uppercase rounded-lg tracking-wider ${
                isExpired
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {isExpired ? 'Overdue / Expired' : 'Active Membership'}
              </span>
              <span className="text-xs text-slate-500 font-medium">Class: {studentProfile?.className}</span>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900">
              {isExpired ? 'Tuition Fee Due for Renewal' : 'All Dues Cleared & Coaching Active'}
            </h3>

            <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
              {isExpired
                ? 'Your monthly coaching membership expired. Pay online via UPI or Cards to instantly resume homework downloads, lecture summaries, and test submissions.'
                : `Your monthly coaching membership is active until ${membership?.expiryDate}. Next scheduled renewal is on ${membership?.expiryDate}.`
              }
            </p>

            <div className="pt-1 flex items-center gap-4 text-xs font-mono">
              <span className="text-slate-500 font-medium">Monthly Tuition: <strong className="text-blue-700">₹{feeAmount.toLocaleString('en-IN')}</strong></span>
              <span className="text-slate-500 font-medium">Roll: <strong className="text-slate-900">{studentProfile?.rollNumber}</strong></span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => setShowPayModal(true)}
              className={`px-6 py-3 text-xs font-bold text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2 ${
                isExpired
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-500/25'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/25'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{isExpired ? 'Pay Now & Activate' : 'Renew / Extend 30 Days'}</span>
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
    </div>
  );
};
