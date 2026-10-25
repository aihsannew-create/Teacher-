import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { PaymentTransaction, PaymentReceipt, StudentProfile } from '../types';
import { CreditCard, Plus, Receipt, Printer, Search, Download, CheckCircle2, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { ReceiptModal } from '../components/ReceiptModal';
import { PendingPaymentApprovals } from '../components/PendingPaymentApprovals';

interface TeacherPaymentsProps {
  initialStudentId?: string;
}

export const TeacherPayments: React.FC<TeacherPaymentsProps> = ({ initialStudentId }) => {
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Offline Payment Modal
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId || '');
  const [amount, setAmount] = useState<number>(2500);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi_direct' | 'bank_transfer'>('cash');
  const [transactionRef, setTransactionRef] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('Offline payment verified at coaching cabin');
  const [billingMonth, setBillingMonth] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Active Receipt to view/print
  const [activeReceipt, setActiveReceipt] = useState<PaymentReceipt | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const [payRes, stuRes] = await Promise.all([
        apiFetch(`/api/payments/history${search ? `?search=${encodeURIComponent(search)}` : ''}`),
        apiFetch('/api/students')
      ]);

      setPayments(payRes.payments || []);
      setReceipts(payRes.receipts || []);
      setStudents(stuRes.students || []);

      if (initialStudentId) {
        setSelectedStudentId(initialStudentId);
        const target = stuRes.students?.find((s: any) => s.id === initialStudentId);
        if (target) {
          setAmount(target.customFee || target.monthlyFee || 2500);
        }
        setShowRecordModal(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [search]);

  // Set default billing month
  useEffect(() => {
    const nextMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
    setBillingMonth(nextMonth);
  }, []);

  const handleStudentSelect = (stuId: string) => {
    setSelectedStudentId(stuId);
    const stu = students.find(s => s.id === stuId);
    if (stu) {
      setAmount(stu.customFee || stu.monthlyFee || 2500);
    }
  };

  const handleRecordOffline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !amount) {
      alert('Please select student and enter amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/payments/record-offline', {
        method: 'POST',
        body: JSON.stringify({
          studentId: selectedStudentId,
          amount,
          paymentMethod,
          transactionRef,
          teacherNotes,
          billingMonth
        })
      });

      setShowRecordModal(false);
      setActiveReceipt(res.receipt);
      await fetchPayments();
    } catch (err: any) {
      alert(err.message || 'Failed to record offline payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/reports/export-csv?type=payments', '_blank');
  };

  const viewReceiptForNum = (receiptNumber?: string) => {
    if (!receiptNumber) return;
    const found = receipts.find(r => r.receiptNumber === receiptNumber);
    if (found) {
      setActiveReceipt(found);
    }
  };

  // Overdue students quick list
  const overdueStudents = students.filter(s => s.status === 'expired' || s.status === 'pending_payment');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-blue-100/80">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Teacher Cabin · Fee Collections</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Fee Ledger & Payment Receipts
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Record verified offline cash/bank fees, manage online gateway receipts, and audit transactions
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white/90 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => {
                if (students.length > 0 && !selectedStudentId) {
                  handleStudentSelect(students[0].id);
                }
                setShowRecordModal(true);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record Cash / Bank Fee</span>
            </button>
          </div>
        </div>

        {/* Unpaid / Overdue Alert Strip */}
        {overdueStudents.length > 0 && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong className="font-semibold">{overdueStudents.length} students have overdue tuition fees.</strong> Homework access is protected by subscription policy.
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto">
              {overdueStudents.slice(0, 3).map(s => (
                <button
                  key={s.id}
                  onClick={() => {
                    handleStudentSelect(s.id);
                    setShowRecordModal(true);
                  }}
                  className="px-3 py-1 text-[11px] font-semibold bg-amber-100 hover:bg-amber-200/80 text-amber-800 border border-amber-300 rounded-xl whitespace-nowrap transition-colors"
                >
                  Collect from {s.name} (₹{s.monthlyFee || 2500})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Pending Payment Verification & 30-Day Access Approvals */}
        <PendingPaymentApprovals onApprovalSuccess={() => fetchPayments()} />

        {/* Search & Filter Bar */}
        <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-sm text-xs flex items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by student name, roll number, receipt number..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-blue-500" />
          </div>

          <div className="text-xs text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full font-mono font-bold">
            {payments.length} Transaction{payments.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Transactions Table */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 overflow-hidden shadow-xl shadow-blue-500/5">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading payment records...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No fee transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 border-b border-blue-100">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Receipt No</th>
                    <th className="py-3 px-4 font-semibold">Student Name</th>
                    <th className="py-3 px-4 font-semibold">Roll No</th>
                    <th className="py-3 px-4 font-semibold">Payment Mode</th>
                    <th className="py-3 px-4 font-semibold">Date</th>
                    <th className="py-3 px-4 font-semibold">Valid Until</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount</th>
                    <th className="py-3 px-4 font-semibold text-right">Official Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-50/80">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-blue-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                        {p.receiptNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {p.studentName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {p.rollNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="capitalize text-slate-700 font-medium">
                          {p.paymentMethod === 'razorpay' ? 'Razorpay PG' : p.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {p.createdAt.split('T')[0]}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-emerald-700 font-bold">
                        {p.periodEnd}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-right text-slate-900 tabular-nums">
                        ₹{p.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {p.receiptNumber ? (
                          <button
                            onClick={() => viewReceiptForNum(p.receiptNumber)}
                            className="px-3 py-1.5 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs"
                          >
                            <Printer className="w-3 h-3 text-blue-600" />
                            <span>View Receipt</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono italic">
                            {p.status === 'pending' ? 'Verification Pending' : 'No Receipt'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Record Offline Fee Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Record Offline Tuition Payment
                </h3>
              </div>
              <button
                onClick={() => setShowRecordModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordOffline} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Select Student *</label>
                <select
                  value={selectedStudentId}
                  onChange={e => handleStudentSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.rollNumber}) · {s.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="cash">Cash (Received in Cabin)</option>
                    <option value="upi_direct">Direct UPI (GPay/PhonePe)</option>
                    <option value="bank_transfer">Bank NEFT / IMPS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Billing Month</label>
                <input
                  type="text"
                  value={billingMonth}
                  onChange={e => setBillingMonth(e.target.value)}
                  placeholder="e.g. November 2026"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Transaction Ref / Cheque No</label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  placeholder="Optional reference ID or cash receipt tag"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Teacher Notes</label>
                <input
                  type="text"
                  value={teacherNotes}
                  onChange={e => setTeacherNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[11px] text-blue-800 space-y-1">
                <div className="font-semibold text-blue-900 mb-0.5">Automated Actions on Submit:</div>
                <div>✓ Auto-extends student membership by 30 days</div>
                <div>✓ Generates official sequential receipt number (RCP-2026-XXXX)</div>
                <div>✓ Sends in-app confirmation notification to student</div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                  {submitting ? 'Generating Receipt...' : 'Record Payment & Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Receipt Viewer */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  );
};
