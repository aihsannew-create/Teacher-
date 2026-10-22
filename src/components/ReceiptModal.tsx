import React from 'react';
import { PaymentReceipt } from '../types';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  receipt: PaymentReceipt | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose }) => {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-blue-100 bg-blue-50/60 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-900">
              Official Fee Receipt
            </span>
            <span className="text-xs font-mono text-blue-600 font-bold">
              #{receipt.receiptNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-blue-600" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-8 overflow-y-auto space-y-6 text-slate-900 bg-white">
          {/* Academy Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-blue-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Prerna Tuition Academy
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full">
                  OFFICIAL RECEIPT
                </span>
              </div>
              <p className="text-xs text-slate-600 max-w-sm">
                Cabin 304, Sharda Complex, Near City Library, MG Road, Pune, Maharashtra 411001
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Teacher: Er. Rajesh V. Sharma (M.Tech) · Phone: +91 98765 43210
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <div className="text-xs text-slate-500">Receipt Number</div>
              <div className="font-mono text-base font-bold text-blue-600">
                {receipt.receiptNumber}
              </div>
              <div className="text-xs text-slate-500">
                Date: <span className="font-mono font-semibold text-slate-800">{receipt.receiptDate}</span>
              </div>
            </div>
          </div>

          {/* Student & Billing Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-blue-50/40 border border-blue-100">
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Student Name</div>
              <div className="text-sm font-semibold text-slate-900 mt-0.5">{receipt.studentName}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Roll Number</div>
              <div className="text-sm font-mono font-bold text-blue-600 mt-0.5">{receipt.rollNumber}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Enrolled Class</div>
              <div className="text-sm font-medium text-slate-800 mt-0.5">{receipt.className}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-medium">Billing Period</div>
              <div className="text-sm font-medium text-slate-800 mt-0.5">{receipt.billingMonth}</div>
            </div>
          </div>

          {/* Fee Itemization Table */}
          <div className="border border-blue-100 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600 font-semibold border-b border-blue-100">
                <tr>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Period / Cadence</th>
                  <th className="py-2.5 px-4 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-50">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">
                      Monthly Tuition & Classroom Coaching Fee
                    </div>
                    <div className="text-xs text-slate-500">
                      Includes offline lectures, daily digital homework, verified tests & materials
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-600">
                    30 Days
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                    ₹{receipt.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-blue-50/50 border-t border-blue-100">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-right text-xs font-bold text-slate-700">
                    Total Amount Received:
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-base font-bold text-blue-600 tabular-nums">
                    ₹{receipt.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment Transaction Details */}
          <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Payment Mode:</span>
                <span className="capitalize font-semibold text-slate-900">
                  {receipt.paymentMethod === 'razorpay' ? 'Online Gateway (Razorpay)' : receipt.paymentMethod.replace('_', ' ')}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Verified
                </span>
              </div>
              <div className="text-slate-500">
                Txn Ref: <span className="font-mono text-slate-800 font-medium">{receipt.transactionId}</span>
              </div>
              {receipt.teacherNotes && (
                <div className="text-slate-500 italic">
                  Note: "{receipt.teacherNotes}"
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-medium">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Backend Verified & Audited</span>
              </div>
            </div>
          </div>

          {/* Signatures & Academy Seal */}
          <div className="pt-4 flex justify-between items-end border-t border-blue-100">
            <div className="text-[11px] text-slate-500 max-w-xs">
              * This is a computer-verified official payment receipt generated by Prerna Tuition OS. Valid for offline attendance and digital portal access.
            </div>
            <div className="text-center">
              <div className="font-serif italic text-sm text-slate-800 font-semibold mb-1">
                Rajesh V. Sharma
              </div>
              <div className="w-36 border-t border-blue-200 pt-1 text-[11px] text-slate-500 font-medium">
                Authorized Faculty Signatory
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
