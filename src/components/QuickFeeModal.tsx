import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { PaymentReceipt } from '../types';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Search,
  Sparkles,
  Copy,
  Check,
  User,
  GraduationCap,
  Calendar,
  AlertCircle,
  Loader2,
  ExternalLink,
  Download,
  Eye,
  Smartphone,
  Maximize2
} from 'lucide-react';

interface QuickStudent {
  id: string;
  name: string;
  rollNumber: string;
  phone: string;
  classId: string;
  className: string;
  monthlyFee: number;
  status: string;
  expiryDate?: string;
}

interface QuickClass {
  id: string;
  name: string;
  code: string;
  monthlyFee: number;
  subjects: string[];
}

interface QuickFeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (receipt: PaymentReceipt) => void;
}

export const QuickFeeModal: React.FC<QuickFeeModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [students, setStudents] = useState<QuickStudent[]>([]);
  const [classes, setClasses] = useState<QuickClass[]>([]);
  const [upiDetails, setUpiDetails] = useState<{ upiId: string; accountName: string }>({
    upiId: '9905847357@ybl',
    accountName: 'AIHSAN ANSARI'
  });
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [showFullQrModal, setShowFullQrModal] = useState(false);

  // Student selection state
  const [isExistingStudent, setIsExistingStudent] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<QuickStudent | null>(null);

  // New student form state
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newClassId, setNewClassId] = useState('cls_10');

  // Payment details
  const [billingMonth, setBillingMonth] = useState(() => {
    return new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  });
  const [amount, setAmount] = useState<number>(2500);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card'>('upi');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');

  // UI state
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load quick info on modal open
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setLoadingInfo(true);
      apiFetch('/api/payments/quick-info')
        .then(data => {
          if (data.students) setStudents(data.students);
          if (data.classes) {
            setClasses(data.classes);
            if (data.classes.length > 0 && !newClassId) {
              setNewClassId(data.classes[0].id);
            }
          }
          if (data.upiDetails) setUpiDetails(data.upiDetails);
        })
        .catch(err => {
          console.error('Failed to load quick info:', err);
        })
        .finally(() => {
          setLoadingInfo(false);
        });
    }
  }, [isOpen]);

  // Update amount when a registered student is selected
  const handleSelectStudent = (stu: QuickStudent) => {
    setSelectedStudent(stu);
    setSearchQuery(`${stu.name} (${stu.rollNumber})`);
    if (stu.monthlyFee) {
      setAmount(stu.monthlyFee);
    }
  };

  // Update amount when new class is changed
  const handleClassChange = (cId: string) => {
    setNewClassId(cId);
    const cls = classes.find(c => c.id === cId);
    if (cls) {
      setAmount(cls.monthlyFee);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiDetails.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const studentName = isExistingStudent ? selectedStudent?.name : newName.trim();
    if (!studentName) {
      setError(isExistingStudent ? 'Please select an enrolled student or switch to New Student.' : 'Please enter student full name.');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Please enter a valid tuition fee amount.');
      return;
    }

    const matchedClass = isExistingStudent
      ? classes.find(c => c.id === selectedStudent?.classId)
      : classes.find(c => c.id === newClassId);

    setSubmitting(true);
    try {
      const res = await apiFetch('/api/payments/public-deposit', {
        method: 'POST',
        body: JSON.stringify({
          studentId: isExistingStudent ? selectedStudent?.id : undefined,
          studentName,
          rollNumber: isExistingStudent ? selectedStudent?.rollNumber : undefined,
          phone: isExistingStudent ? selectedStudent?.phone : newPhone,
          classId: isExistingStudent ? selectedStudent?.classId : newClassId,
          className: matchedClass?.name || 'Coaching Class',
          amount,
          billingMonth,
          paymentMethod,
          transactionRef: transactionRef.trim() || undefined,
          notes: notes.trim() || undefined
        })
      });

      if (res.receipt) {
        onSuccess(res.receipt);
        onClose();
      }
    } catch (err: any) {
      console.error('Fee submission error:', err);
      setError(err.message || 'Failed to submit fee. Please try again or contact faculty.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Filter student list for autocomplete
  const filteredStudents = searchQuery.trim()
    ? students.filter(
        s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.phone && s.phone.includes(searchQuery))
      )
    : students.slice(0, 5);

  const monthOptions = [
    'October 2026',
    'November 2026',
    'December 2026',
    'January 2027',
    'Quarterly (3 Months Advance)'
  ];

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiDetails.upiId)}&pn=${encodeURIComponent(upiDetails.accountName || 'Prerna Coaching')}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Tuition Fee ${billingMonth}`)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <CreditCard className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Coaching Fee Deposit
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-400 text-slate-950 rounded-full uppercase tracking-wider">
                  Official
                </span>
              </div>
              <p className="text-xs text-blue-100 font-medium">
                Instant computer-generated receipt with verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close fee modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-800">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Toggle: Enrolled Student vs Direct Walk-in */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Select Student Type / छात्र प्रकार चुनें</span>
              <span className="text-[11px] text-blue-600 font-semibold">Step 1 of 3</span>
            </label>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setIsExistingStudent(true);
                  setError(null);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isExistingStudent
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Registered Student
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsExistingStudent(false);
                  setSelectedStudent(null);
                  setError(null);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isExistingStudent
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                New / Direct Walk-in
              </button>
            </div>
          </div>

          {/* Existing Student Search */}
          {isExistingStudent ? (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Search Student (Name or Roll Number)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="e.g. Aarav Patel or PRN-2026-001"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (selectedStudent && e.target.value !== selectedStudent.name) {
                      setSelectedStudent(null);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                />
              </div>

              {/* Suggestions dropdown / quick chips */}
              {!selectedStudent && filteredStudents.length > 0 && (
                <div className="border border-slate-200 rounded-2xl bg-white shadow-lg overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {filteredStudents.map(stu => (
                    <button
                      key={stu.id}
                      type="button"
                      onClick={() => handleSelectStudent(stu)}
                      className="w-full p-2.5 text-left hover:bg-blue-50/70 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">{stu.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {stu.className} · Roll #{stu.rollNumber}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-blue-600">
                          ₹{stu.monthlyFee}
                        </span>
                        <div className="text-[10px] text-emerald-600 font-semibold capitalize">
                          {stu.status}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Student Confirmation Pill */}
              {selectedStudent && (
                <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      {selectedStudent.name[0]}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-950">{selectedStudent.name}</div>
                      <div className="text-[11px] text-blue-700">
                        {selectedStudent.className} · Roll: {selectedStudent.rollNumber}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setSearchQuery('');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* New Walk-in Student Form */
            <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Parent / Student Mobile Number
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit number"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Enrolled Class *
                </label>
                <select
                  value={newClassId}
                  onChange={e => handleClassChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:border-blue-500 outline-none"
                >
                  {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} (Monthly Fee: ₹{cls.monthlyFee})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Billing Month & Fee Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Billing Period / Month</span>
              </label>
              <select
                value={billingMonth}
                onChange={e => setBillingMonth(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
              >
                {monthOptions.map(m => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1 flex items-center justify-between">
                <span>Fee Amount (₹)</span>
                <span className="text-[10px] text-slate-400 font-normal">Editable</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 font-bold text-slate-500 text-xs">₹</span>
                <input
                  type="number"
                  min="100"
                  step="50"
                  required
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-blue-700 focus:bg-white focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Step 2: Payment Mode */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Select Payment Mode / भुगतान माध्यम चुनें</span>
              <span className="text-[11px] text-blue-600 font-semibold">Step 2 of 3</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'upi'
                    ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <QrCode className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">UPI / QR Code</span>
                <span className="text-[10px] text-slate-500">GPay, PhonePe</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Cash at Desk</span>
                <span className="text-[10px] text-slate-500">Physical receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                  paymentMethod === 'card'
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold">Card / NetBanking</span>
                <span className="text-[10px] text-slate-500">Instant gateway</span>
              </button>
            </div>
          </div>

          {/* Payment Method Sub-views */}
          {paymentMethod === 'upi' && (
            <div className="p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl border border-indigo-500/30 shadow-lg space-y-4">
              {/* Header with PhonePe and India Post info */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-xs shadow-xs">
                    पे
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>PhonePe UPI QR</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-semibold border border-emerald-500/30">Verified</span>
                    </div>
                    <div className="text-[10px] text-slate-300">India Post Payments Bank - 8482</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowFullQrModal(true)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-purple-200 hover:text-white bg-white/10 hover:bg-white/15 rounded-lg border border-white/10 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Enlarge QR</span>
                </button>
              </div>

              {/* QR and UPI Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                {/* QR Code Container */}
                <div className="sm:col-span-5 flex flex-col items-center">
                  <div
                    onClick={() => setShowFullQrModal(true)}
                    className="relative group p-2 bg-white rounded-2xl shadow-xl border-2 border-purple-400/50 cursor-pointer overflow-hidden transition-transform hover:scale-[1.02]"
                    title="Click to Enlarge QR Code"
                  >
                    <img
                      src="/assets/aistudio/phonepe_qr_code_square.png"
                      alt="PhonePe QR Code - 9905847357@ybl"
                      className="w-36 h-36 object-contain rounded-xl"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl backdrop-blur-xs">
                      <div className="px-2 py-1 bg-white/90 text-slate-900 rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-md">
                        <Eye className="w-3 h-3" />
                        <span>Enlarge</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-purple-200/90 font-medium mt-1.5 text-center flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-purple-400" />
                    <span>Scan with Any UPI App</span>
                  </span>
                </div>

                {/* UPI Details & Quick Actions */}
                <div className="sm:col-span-7 space-y-2.5">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-300 tracking-wider block mb-1">
                      Registered UPI ID
                    </span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 font-mono text-xs sm:text-sm font-extrabold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 truncate select-all">
                        {upiDetails.upiId}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyUpi}
                        className="px-2.5 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-300" />
                            <span className="text-[11px]">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-300 space-y-0.5">
                    <div>
                      Account Name: <span className="font-bold text-white">{upiDetails.accountName}</span>
                    </div>
                    <div>
                      Amount: <span className="font-bold text-amber-300">₹{amount}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="pt-1 flex flex-wrap gap-2">
                    <a
                      href={upiDeepLink}
                      className="flex-1 min-w-[140px] px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/30 flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Pay in UPI App</span>
                      <ExternalLink className="w-3 h-3 opacity-80" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setShowFullQrModal(true)}
                      className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Full QR</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* UTR Reference Input */}
              <div className="pt-2 border-t border-white/10">
                <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                  UPI UTR / Reference No. (Optional, payment ke baad yahan daalein)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 428901238910 ya transaction ID"
                  value={transactionRef}
                  onChange={e => setTransactionRef(e.target.value)}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-mono font-medium text-white placeholder-slate-400 focus:bg-white/15 focus:border-purple-400 outline-none"
                />
              </div>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-2 text-emerald-900">
              <div className="font-bold flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Cash Payment at Coaching Counter</span>
              </div>
              <p className="text-emerald-800/90 leading-relaxed text-[11px]">
                Hand in cash amount of <strong>₹{amount}</strong> at the faculty desk. Submitting below will automatically generate your official computer receipt and extend your attendance validity.
              </p>
            </div>
          )}

          {paymentMethod === 'card' && (
            <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200 text-xs space-y-2 text-indigo-900">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Instant Card & NetBanking Gateway</span>
              </div>
              <p className="text-indigo-800/90 leading-relaxed text-[11px]">
                Safe 256-bit encrypted checkout. Simulates direct gateway round-trip and generates instant digital receipt.
              </p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Remarks / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Paid in full for Maths & Science, received notebook"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="text-left">
              <span className="text-[11px] text-slate-500 block">Total Payable</span>
              <span className="text-lg font-mono font-extrabold text-blue-700">
                ₹{amount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Depositing Fee...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Deposit Fee & Get Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Full Resolution PhonePe QR Lightbox Modal */}
      {showFullQrModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-sm w-full bg-slate-900 border border-purple-500/30 rounded-3xl p-5 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white text-xs">
                  पे
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">PhonePe Official QR</h4>
                  <p className="text-[10px] text-purple-200">India Post Payments Bank - 8482</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFullQrModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-white rounded-2xl shadow-2xl border-4 border-purple-500/20 max-w-[280px]">
                <img
                  src="/assets/aistudio/phonepe_qr_code_square.png"
                  alt="PhonePe QR Code - 9905847357@ybl"
                  className="w-full h-auto object-contain rounded-xl"
                />
              </div>

              <div className="w-full bg-white/10 rounded-2xl p-3 border border-white/10 text-center space-y-1">
                <div className="text-[10px] uppercase font-bold text-purple-300">UPI ID</div>
                <div className="font-mono text-sm font-bold text-white select-all">
                  9905847357@ybl
                </div>
                <div className="text-[11px] text-slate-300">
                  Name: <span className="font-semibold text-white">AIHSAN ANSARI</span>
                </div>
              </div>

              <div className="w-full grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-colors cursor-pointer"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy UPI</span>
                    </>
                  )}
                </button>

                <a
                  href="/assets/aistudio/Screenshot_20261020-140414_PhonePe_fb2a79a3.png"
                  download="PhonePe_QR_9905847357@ybl.png"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-white/15 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Save QR</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
