import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api';
import {
  X,
  CreditCard,
  QrCode,
  Check,
  Copy,
  Upload,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Clock,
  ExternalLink
} from 'lucide-react';

interface SubmitPaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubmitPaymentProofModal: React.FC<SubmitPaymentProofModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { studentProfile, refreshProfile } = useAuth();

  const [transactionId, setTransactionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'gpay' | 'paytm' | 'upi_direct' | 'cash' | 'bank_transfer'>('phonepe');
  const [amount, setAmount] = useState<number>(studentProfile?.customFee || studentProfile?.monthlyFee || 2500);
  const [notes, setNotes] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [compressing, setCompressing] = useState(false);

  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);

  if (!isOpen) return null;

  const upiId = '9905847357@ybl';
  const accountName = 'AIHSAN ANSARI';

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompressing(true);
    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const raw = loadEvent.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setScreenshotUrl(compressed);
        setCompressing(false);
      };
      img.onerror = () => setCompressing(false);
      img.src = raw;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!transactionId.trim()) {
      setError('Kripya Payment Transaction ID ya UTR number darj karein.');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Kripya sahi tuition fee amount darj karein.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/payments/submit-proof', {
        method: 'POST',
        body: JSON.stringify({
          studentId: studentProfile?.id,
          transactionId: transactionId.trim(),
          amount,
          paymentMethod,
          screenshotUrl,
          notes: notes.trim()
        })
      });

      setIsSuccess(true);
      setSuccessDetails(res.payment);
      await refreshProfile();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Payment ID submit karne mein truti aayi. Kripya punah prayas karein.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl border border-blue-200 text-slate-800">
        {/* Header */}
        <div className="sticky top-0 z-10 px-5 sm:px-6 py-4 border-b border-blue-100 bg-gradient-to-r from-blue-50/95 via-indigo-50/90 to-blue-50/95 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/25">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Submit Payment ID (30 Din Ka Access)
              </h2>
              <p className="text-[11px] text-slate-500">
                Payment karein aur ID darj karein · Admin verify karke 30 din ka access kholenge
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs">
          {isSuccess ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900">
                  Payment ID Safalta Se Submit Ho Gayi!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  Aapka Payment ID <strong className="font-mono text-blue-700">{transactionId}</strong> Admin panel me bhej diya gaya hai. Admin notification check karke jald hi aapko 30 din ka access approve karenge.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Kya hoga agla kadam?</span>
                </div>
                <ul className="text-slate-600 space-y-1 list-disc list-inside">
                  <li>Admin (AIHSAN ANSARI) transaction verify karenge.</li>
                  <li>Approve hote hi aapke homework panel me <strong>30-Day Live Countdown Timer</strong> chalu ho jayega.</li>
                  <li>30 din pure hone par system automatically lock hoga jab tak agla mahina pay na ho.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Theek Hai (Close)
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Step 1: Scan & Pay Details */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                    <QrCode className="w-4 h-4 text-blue-600" />
                    <span>Step 1: PhonePe / GPay / Paytm QR Code Se Pay Karein</span>
                  </span>
                  <span className="font-extrabold text-blue-700 font-mono text-sm">
                    ₹{amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                  {/* PhonePe QR Image */}
                  <div className="relative group shrink-0">
                    <img
                      src="/assets/aistudio/phonepe_qr_card.png"
                      alt="PhonePe QR Code"
                      className="w-36 h-36 object-contain rounded-2xl border-2 border-indigo-200 shadow-md bg-white p-1"
                    />
                    <a
                      href="/assets/aistudio/phonepe_qr_card.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/80 text-white text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Zoom</span>
                    </a>
                  </div>

                  {/* UPI Details Box */}
                  <div className="flex-1 space-y-2 text-[11px] w-full">
                    <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                      <div className="text-slate-400 font-medium">Official Tuition UPI ID:</div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-blue-700 text-xs sm:text-sm selection:bg-blue-200">
                          {upiId}
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {copiedUpi ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-[10px] text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="text-[10px]">Copy ID</span>
                            </>
                          )}
                        </button>
                      </div>
                      <div className="text-[10px] text-slate-500 pt-0.5">
                        Account Name: <strong className="text-slate-800">{accountName}</strong>
                      </div>
                    </div>

                    <p className="text-slate-500 leading-tight">
                      Kisi bhi UPI app (PhonePe, GPay, Paytm, BHIM) se upar diye QR code ko scan karke ya UPI ID par fee transfer karein.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2: Enter Transaction ID / UTR */}
              <div className="space-y-3.5">
                <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>Step 2: Payment Hone Ke Baad UTR / Transaction ID Darj Karein</span>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                    Kis App / Madhyam Se Pay Kiya?
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {[
                      { id: 'phonepe', label: 'PhonePe' },
                      { id: 'gpay', label: 'Google Pay' },
                      { id: 'paytm', label: 'Paytm' },
                      { id: 'upi_direct', label: 'Other UPI' },
                      { id: 'cash', label: 'Cash (Desk)' },
                      { id: 'bank_transfer', label: 'Bank IMPS' }
                    ].map(m => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 px-1 text-center font-bold rounded-xl border transition-all cursor-pointer text-[11px] ${
                          paymentMethod === m.id
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transaction ID / UTR Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Transaction ID / UTR Number / Reference ID <span className="text-red-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="e.g. UTR 492048204820 ya T261025..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-blue-300 font-mono text-xs sm:text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    PhonePe / GPay receipt me 12 anko ka UTR / UPI Ref ID hota hai.
                  </p>
                </div>

                {/* Amount Field */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Amount Paid (₹)
                    </label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 font-mono text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Student Roll / Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${studentProfile?.name} (${studentProfile?.rollNumber})`}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium text-xs cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Screenshot Upload (Optional) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Payment Screenshot (Optional / Tezi Se Verify Ke Liye)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>{compressing ? 'Compressing...' : screenshotUrl ? 'Change Screenshot' : 'Choose File / Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleScreenshotUpload}
                        className="hidden"
                      />
                    </label>
                    {screenshotUrl && (
                      <div className="flex items-center gap-2">
                        <img
                          src={screenshotUrl}
                          alt="Proof preview"
                          className="w-9 h-9 object-cover rounded-lg border border-slate-200 shadow-2xs"
                        />
                        <span className="text-[10px] text-emerald-700 font-bold">Screenshot Attached ✓</span>
                        <button
                          type="button"
                          onClick={() => setScreenshotUrl('')}
                          className="text-red-500 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Note */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Note / Message (Optional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Papa ke account se pay kiya hai, Class 10 morning batch"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{submitting ? 'Submitting to Admin...' : 'Submit Payment ID & Request 30-Day Access'}</span>
                </button>
                <p className="text-[10px] text-center text-slate-400 mt-2">
                  Admin dwara approve hote hi aapka 30 din ka access chalu hoga aur live timer chalega.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
