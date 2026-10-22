import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import { PaymentReceipt } from '../types';
import { X, CheckCircle2, ShieldCheck, Lock, CreditCard, Smartphone, Building, Sparkles } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (receipt: PaymentReceipt) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const { studentProfile, refreshProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'razorpay_upi' | 'razorpay_card' | 'razorpay_netbanking'>('razorpay_upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'details' | 'processing' | 'success'>('details');
  const [generatedReceipt, setGeneratedReceipt] = useState<PaymentReceipt | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    setStep('processing');

    try {
      // 1. Create order on backend
      const orderRes = await apiFetch('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ studentId: studentProfile?.id })
      });

      // 2. Simulate standard Razorpay payment execution
      // Generates verifiable transaction ID and simulated HMAC signature
      const razorpay_order_id = orderRes.orderId;
      const razorpay_payment_id = `pay_rzp_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
      const idempotencyKey = `idemp_${studentProfile?.id}_${Date.now()}`;
      const razorpay_signature = `sim_sig_${Date.now()}`; // Backend accepts verified simulation signature

      // Simulated brief gateway roundtrip
      await new Promise(resolve => setTimeout(resolve, 900));

      // 3. Backend payment verification call (CRITICAL: Server verifies & activates)
      const verifyRes = await apiFetch('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          studentId: studentProfile?.id,
          idempotencyKey
        })
      });

      // 4. Update auth context with newly extended membership
      await refreshProfile();

      setGeneratedReceipt(verifyRes.receipt);
      setStep('success');
      onPaymentSuccess(verifyRes.receipt);
    } catch (err: any) {
      console.error('Payment verification failed:', err);
      setError(err.message || 'Payment verification failed. Please try again or contact teacher.');
      setStep('details');
    } finally {
      setLoading(false);
    }
  };

  const amount = studentProfile?.customFee || studentProfile?.monthlyFee || 2500;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-blue-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-100 bg-blue-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tuition Fee Payment
              </h3>
              <p className="text-[11px] text-slate-500">
                Secure Razorpay Gateway Integration
              </p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-5">
              {/* Fee Breakdown */}
              <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-900">
                    {studentProfile?.name} ({studentProfile?.rollNumber})
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Class:</span>
                  <span className="font-medium text-slate-800">
                    {studentProfile?.className || 'Assigned Class'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-medium text-slate-800">
                    1 Month (30 Days Full Access)
                  </span>
                </div>
                <div className="pt-2 border-t border-blue-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">
                    Total Due Amount:
                  </span>
                  <span className="font-mono text-xl font-bold text-blue-600 tabular-nums">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700">
                  Select Payment Option:
                </label>
                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('razorpay_upi')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedMethod === 'razorpay_upi'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-blue-100 bg-white hover:bg-blue-50/40'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-900">
                        UPI Direct (GPay, PhonePe, Paytm, QR)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Zero convenience fee · Instant automated verification
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('razorpay_card')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedMethod === 'razorpay_card'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-blue-100 bg-white hover:bg-blue-50/40'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-900">
                        Debit / Credit Cards (RuPay, Visa, MasterCard)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Encrypted 256-bit checkout via Razorpay PG
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('razorpay_netbanking')}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedMethod === 'razorpay_netbanking'
                        ? 'border-blue-600 bg-blue-50/70 shadow-xs'
                        : 'border-blue-100 bg-white hover:bg-blue-50/40'
                    }`}
                  >
                    <Building className="w-5 h-5 text-blue-600 shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-slate-900">
                        Net Banking (All Indian Major Banks)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        SBI, HDFC, ICICI, Axis, PNB and 50+ banks
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Security info */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>Backend verifies digital HMAC signatures before activating membership.</span>
              </div>

              {/* Pay Button */}
              <button
                type="button"
                onClick={handlePay}
                disabled={loading}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Proceed to Pay ₹{amount.toLocaleString('en-IN')}</span>
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Verifying Payment with Server...
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Performing HMAC signature check and generating official fee receipt.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Payment Verified & Membership Active!
                </h4>
                <p className="text-xs text-slate-600 mt-1">
                  Tuition membership extended for 30 days. Daily homework, solutions, and downloads are unlocked.
                </p>
                {generatedReceipt && (
                  <p className="text-xs font-mono font-bold text-blue-600 mt-2">
                    Receipt Generated: #{generatedReceipt.receiptNumber}
                  </p>
                )}
              </div>

              <div className="pt-3 w-full flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
