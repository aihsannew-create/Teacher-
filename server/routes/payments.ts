import crypto from 'crypto';
import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, addOneCalendarMonth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { PaymentTransaction, PaymentReceipt, Membership, StudentProfile, AppNotification, AuditLog } from '../types.ts';

const router = Router();

// Helper to calculate extended expiry date
function getExtendedExpiryDate(currentExpiry: string | undefined): string {
  const base = currentExpiry && new Date(currentExpiry).getTime() > Date.now()
    ? new Date(currentExpiry)
    : new Date();
  base.setDate(base.getDate() + 30);
  return base.toISOString().split('T')[0];
}

// Helper to generate sequential receipt number
function generateReceiptNumber(): string {
  const receipts = db.get('receipts');
  const count = receipts.length + 1;
  const year = new Date().getFullYear();
  return `RCP-${year}-${String(count).padStart(4, '0')}`;
}

// 1. Create Payment Order
router.post('/create-order', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let student: StudentProfile | undefined;

  if (user.role === 'teacher' || user.role === 'owner') {
    const { studentId } = req.body;
    student = db.get('students').find(s => s.id === studentId);
  } else {
    student = user.studentProfile;
  }

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  const classes = db.get('classes');
  const studentClass = classes.find(c => c.id === student!.classId);
  const feeAmount = student.customFee || studentClass?.monthlyFee || 2500;

  const settings = db.get('settings');
  const orderId = `order_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

  // Billing month string e.g. "November 2026"
  const nextMonth = new Date();
  const monthName = nextMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return res.json({
    orderId,
    amount: feeAmount,
    currency: 'INR',
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    className: studentClass?.name || 'Class',
    billingMonth: monthName,
    keyId: settings.razorpayKeyId || 'rzp_test_PrernaTuition2026',
    notes: {
      tuitionName: settings.tuitionName,
      studentId: student.id,
      rollNumber: student.rollNumber
    }
  });
});

// 2. Backend Payment Verification & Membership Activation
router.post('/verify', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    studentId,
    idempotencyKey
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id) {
    return res.status(400).json({ error: 'Missing payment transaction reference identifiers.' });
  }

  // Target student check
  let student: StudentProfile | undefined;
  if ((user.role === 'teacher' || user.role === 'owner') && studentId) {
    student = db.get('students').find(s => s.id === studentId);
  } else {
    student = user.studentProfile;
  }

  if (!student) {
    return res.status(404).json({ error: 'Student record not found.' });
  }

  // Idempotency check: Never allow duplicate activation with same payment ID or idempotency key
  const payments = db.get('payments');
  const alreadyProcessed = payments.find(
    p => p.razorpayPaymentId === razorpay_payment_id || (idempotencyKey && p.idempotencyKey === idempotencyKey)
  );

  if (alreadyProcessed) {
    const receipts = db.get('receipts');
    const existingReceipt = receipts.find(r => r.paymentId === alreadyProcessed.id);
    return res.json({
      message: 'Payment was already verified and processed.',
      payment: alreadyProcessed,
      receipt: existingReceipt,
      isDuplicate: true
    });
  }

  // Verify signature
  const settings = db.get('settings');
  const secret = settings.razorpayKeySecret || 'test_secret_prerna9981';

  // If client provided a signature, verify against HMAC SHA256
  if (razorpay_signature) {
    const generated = crypto.createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    const matchesSignature = generated === razorpay_signature;
    if (!matchesSignature) {
      return res.status(400).json({
        error: 'invalid_signature',
        message: 'Payment signature verification failed. Membership cannot be activated.'
      });
    }
  }

  // Payment is successfully verified! Update membership automatically
  const classes = db.get('classes');
  const studentClass = classes.find(c => c.id === student!.classId);
  const feeAmount = student.customFee || studentClass?.monthlyFee || 2500;
  const receiptNumber = generateReceiptNumber();
  const paymentId = `pay_${Date.now()}`;
  const nowIso = new Date().toISOString();

  const memberships = db.get('memberships');
  const memIndex = memberships.findIndex(m => m.studentId === student!.id);
  const currentExpiry = memIndex !== -1 ? memberships[memIndex].expiryDate : undefined;
  const newExpiry = getExtendedExpiryDate(currentExpiry);

  if (memIndex !== -1) {
    memberships[memIndex] = {
      ...memberships[memIndex],
      status: 'active',
      expiryDate: newExpiry,
      lastPaymentDate: nowIso.split('T')[0],
      lastPaymentAmount: feeAmount
    };
  } else {
    memberships.push({
      id: `mem_${Date.now()}`,
      studentId: student.id,
      startDate: nowIso.split('T')[0],
      expiryDate: newExpiry,
      status: 'active',
      lastPaymentDate: nowIso.split('T')[0],
      lastPaymentAmount: feeAmount,
      autoRenew: false,
      gracePeriodDays: settings.gracePeriodDays || 3
    });
  }
  db.set('memberships', memberships);

  // Update student status to active
  const students = db.get('students');
  const sIdx = students.findIndex(s => s.id === student!.id);
  if (sIdx !== -1) {
    students[sIdx].status = 'active';
    db.set('students', students);
  }

  // Create Payment Record
  const newPayment: PaymentTransaction = {
    id: paymentId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    classId: student.classId,
    amount: feeAmount,
    periodStart: nowIso.split('T')[0],
    periodEnd: newExpiry,
    status: 'success',
    paymentMethod: 'razorpay',
    razorpayOrderId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    razorpaySignature: razorpay_signature,
    receiptNumber,
    teacherNotes: 'Online gateway verified transaction',
    createdAt: nowIso,
    idempotencyKey
  };
  db.set('payments', [newPayment, ...payments]);

  // Create Official Receipt
  const batches = db.get('batches');
  const studentBatch = batches.find(b => b.id === student!.batchId);
  const nextMonthName = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const newReceipt: PaymentReceipt = {
    receiptNumber,
    paymentId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    className: studentClass?.name || 'Class',
    batchName: studentBatch?.name || 'Batch',
    billingMonth: nextMonthName,
    amount: feeAmount,
    paymentMethod: 'razorpay',
    transactionId: razorpay_payment_id,
    paidAt: nowIso,
    receiptDate: nowIso.split('T')[0],
    teacherNotes: 'Automated digital payment via Razorpay'
  };
  db.set('receipts', [newReceipt, ...db.get('receipts')]);

  // Send in-app notification to student
  const notifs = db.get('notifications');
  db.set('notifications', [
    {
      id: `notif_${Date.now()}`,
      recipientId: student.id,
      title: 'Tuition Fee Payment Successful',
      message: `Payment of Rs ${feeAmount} verified. Membership activated until ${newExpiry}. Receipt: ${receiptNumber}.`,
      type: 'payment_success',
      read: false,
      createdAt: nowIso,
      actionUrl: `/receipt/${receiptNumber}`
    },
    ...notifs
  ]);

  return res.json({
    message: 'Payment verified successfully! Membership activated.',
    payment: newPayment,
    receipt: newReceipt,
    newExpiryDate: newExpiry
  });
});

// 3. Teacher Records Offline Cash / Bank Payment Manually
router.post('/record-offline', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only teacher or admin can record offline payments.' });
  }

  const {
    studentId,
    amount,
    paymentMethod,
    transactionRef,
    teacherNotes,
    billingMonth
  } = req.body;

  if (!studentId || !amount) {
    return res.status(400).json({ error: 'Student and amount are required.' });
  }

  const students = db.get('students');
  const student = students.find(s => s.id === studentId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const classes = db.get('classes');
  const batches = db.get('batches');
  const studentClass = classes.find(c => c.id === student.classId);
  const studentBatch = batches.find(b => b.id === student.batchId);

  const receiptNumber = generateReceiptNumber();
  const paymentId = `pay_off_${Date.now()}`;
  const now = new Date();
  const nowIso = now.toISOString();

  // Calculate 1 calendar month subscription
  const memberships = db.get('memberships');
  const memIndex = memberships.findIndex(m => m.studentId === student.id);
  const currentMem = memIndex !== -1 ? memberships[memIndex] : null;

  let baseDate = now;
  if (currentMem && currentMem.expiryDate) {
    const currentExpiryTime = new Date(currentMem.expiryDate).getTime();
    if (!isNaN(currentExpiryTime) && currentExpiryTime > Date.now()) {
      baseDate = new Date(currentExpiryTime);
    }
  }

  const newExpiry = addOneCalendarMonth(baseDate).toISOString();

  if (memIndex !== -1) {
    memberships[memIndex] = {
      ...memberships[memIndex],
      status: 'active',
      startDate: nowIso,
      expiryDate: newExpiry,
      lastPaymentDate: nowIso,
      lastPaymentAmount: Number(amount)
    };
  } else {
    memberships.push({
      id: `mem_${Date.now()}`,
      studentId: student.id,
      startDate: nowIso,
      expiryDate: newExpiry,
      status: 'active',
      lastPaymentDate: nowIso,
      lastPaymentAmount: Number(amount),
      autoRenew: false,
      gracePeriodDays: 3
    });
  }
  db.set('memberships', memberships);

  // Activate student status
  const sIdx = students.findIndex(s => s.id === student.id);
  if (sIdx !== -1) {
    students[sIdx].status = 'active';
    db.set('students', students);
  }

  // Record Transaction
  const newPayment: PaymentTransaction = {
    id: paymentId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    classId: student.classId,
    amount: Number(amount),
    periodStart: nowIso.split('T')[0],
    periodEnd: newExpiry,
    status: 'success',
    paymentMethod: paymentMethod || 'cash',
    receiptNumber,
    teacherNotes: teacherNotes || 'Manual payment recorded by teacher',
    createdAt: nowIso
  };
  db.set('payments', [newPayment, ...db.get('payments')]);

  // Record Receipt
  const newReceipt: PaymentReceipt = {
    receiptNumber,
    paymentId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    className: studentClass?.name || 'Class',
    batchName: studentBatch?.name || 'Batch',
    billingMonth: billingMonth || new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
    amount: Number(amount),
    paymentMethod: paymentMethod || 'cash',
    transactionId: transactionRef || `OFFLINE-${receiptNumber}`,
    paidAt: nowIso,
    receiptDate: nowIso.split('T')[0],
    teacherNotes: teacherNotes || 'Teacher verified offline payment'
  };
  db.set('receipts', [newReceipt, ...db.get('receipts')]);

  // Audit log
  const auditLogs = db.get('auditLogs');
  db.set('auditLogs', [
    {
      id: `audit_${Date.now()}`,
      userId: req.user!.userId,
      userName: req.user!.name,
      action: 'RECORD_OFFLINE_PAYMENT',
      details: `Recorded Rs ${amount} (${paymentMethod}) for ${student.name} (${student.rollNumber}). Receipt: ${receiptNumber}. Extended to ${newExpiry}.`,
      timestamp: nowIso
    },
    ...auditLogs
  ]);

  // Notification to student
  const notifs = db.get('notifications');
  db.set('notifications', [
    {
      id: `notif_${Date.now()}`,
      recipientId: student.id,
      title: 'Tuition Fee Receipt Generated',
      message: `Teacher recorded offline fee payment of Rs ${amount}. Receipt #${receiptNumber} generated. Validity: ${newExpiry}.`,
      type: 'payment_success',
      read: false,
      createdAt: nowIso
    },
    ...notifs
  ]);

  return res.status(201).json({
    message: 'Offline payment recorded and receipt generated successfully!',
    payment: newPayment,
    receipt: newReceipt,
    newExpiryDate: newExpiry
  });
});

// 4. Get Payment History (Role-guarded)
router.get('/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const payments = db.get('payments');
  const receipts = db.get('receipts');

  if (user.role === 'teacher' || user.role === 'owner') {
    const { studentId, search } = req.query;
    let list = payments;
    if (studentId && typeof studentId === 'string' && studentId !== 'all') {
      list = list.filter(p => p.studentId === studentId);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        p => p.studentName.toLowerCase().includes(q) ||
             p.rollNumber.toLowerCase().includes(q) ||
             (p.receiptNumber && p.receiptNumber.toLowerCase().includes(q))
      );
    }
    return res.json({ payments: list, receipts });
  }

  // Student: only own payments
  const student = user.studentProfile;
  if (!student) {
    return res.status(403).json({ error: 'No student profile.' });
  }

  const myPayments = payments.filter(p => p.studentId === student.id);
  const myReceipts = receipts.filter(r => r.studentId === student.id);

  return res.json({ payments: myPayments, receipts: myReceipts });
});

// 5. Get Single Receipt by Receipt Number
router.get('/receipt/:receiptNumber', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { receiptNumber } = req.params;
  const user = req.user!;
  const receipts = db.get('receipts');
  const receipt = receipts.find(r => r.receiptNumber.toUpperCase() === receiptNumber.toUpperCase());

  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found.' });
  }

  // Authorization check: if student, can only view own receipt
  if (user.role === 'student' && user.studentProfile?.id !== receipt.studentId) {
    return res.status(403).json({ error: 'Access denied to this payment receipt.' });
  }

  const settings = db.get('settings');
  return res.json({ receipt, settings });
});

// 6. Public Quick Info for Floating Fee Modal (Students, Classes, UPI details)
router.get('/quick-info', (_req, res: Response) => {
  const students = db.get('students');
  const classes = db.get('classes');
  const memberships = db.get('memberships');
  const settings = db.get('settings');

  const studentList = students.map(s => {
    const cls = classes.find(c => c.id === s.classId);
    const mem = memberships.find(m => m.studentId === s.id);
    return {
      id: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      phone: s.phone,
      classId: s.classId,
      className: cls?.name || 'Class',
      monthlyFee: s.customFee || cls?.monthlyFee || 2500,
      status: s.status,
      expiryDate: mem?.expiryDate
    };
  });

  return res.json({
    students: studentList,
    classes: classes.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      monthlyFee: c.monthlyFee,
      subjects: c.subjects
    })),
    upiDetails: settings.upiDetails || {
      upiId: '9905847357@ybl',
      accountName: 'AIHSAN ANSARI'
    },
    tuitionName: settings.tuitionName,
    teacherName: settings.teacherName,
    phone: settings.phone
  });
});

// 7. Public Fee Deposit from Floating Fee Button (Quick fee submission)
router.post('/public-deposit', (req, res: Response) => {
  const {
    studentId,
    studentName,
    rollNumber,
    phone,
    classId,
    className,
    amount,
    billingMonth,
    paymentMethod,
    transactionRef,
    notes
  } = req.body;

  const feeAmount = Number(amount);
  if (!studentName || !feeAmount || feeAmount <= 0) {
    return res.status(400).json({ error: 'Valid student name and fee amount are required.' });
  }

  const students = db.get('students');
  const classes = db.get('classes');
  const settings = db.get('settings');
  const now = new Date();
  const nowIso = now.toISOString();

  // Find existing student by studentId, rollNumber, or phone
  let student = studentId ? students.find(s => s.id === studentId) : undefined;
  if (!student && rollNumber) {
    student = students.find(s => s.rollNumber.toLowerCase() === String(rollNumber).trim().toLowerCase());
  }
  if (!student && phone) {
    student = students.find(s => s.phone.replace(/[^0-9]/g, '') === String(phone).replace(/[^0-9]/g, ''));
  }
  if (!student && studentName) {
    student = students.find(s => s.name.trim().toLowerCase() === String(studentName).trim().toLowerCase());
  }

  if (!student) {
    return res.status(404).json({
      error: 'Student account not found. Please provide a valid enrolled Student ID (Roll No) or phone number. New admissions must first be registered by the Institute Admin.'
    });
  }

  const selectedClass = classes.find(c => c.id === student!.classId) || classes[0];
  const effectiveMonth = billingMonth || now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const effectiveMethod = paymentMethod || 'upi';
  const effectiveTxnRef = String(transactionRef || '').trim();

  if (!effectiveTxnRef) {
    return res.status(400).json({ error: 'UPI Transaction ID / UTR number is required for fee verification.' });
  }

  // Check if already submitted
  const payments = db.get('payments');
  const alreadyApproved = payments.find(p => p.utrNumber === effectiveTxnRef && p.status === 'success');
  if (alreadyApproved) {
    return res.status(400).json({ error: 'This UTR / Transaction ID has already been verified and credited previously.' });
  }

  const paymentId = `pay_proof_${Date.now()}`;

  // Create pending verification payment record (NEVER auto-activate membership)
  const newPayment: PaymentTransaction = {
    id: paymentId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    classId: student.classId,
    amount: feeAmount,
    periodStart: nowIso,
    periodEnd: '', // set upon admin approval
    status: 'pending',
    paymentMethod: effectiveMethod,
    utrNumber: effectiveTxnRef,
    screenshotUrl: req.body.screenshotUrl || '',
    teacherNotes: notes || `Direct fee submission with UTR ${effectiveTxnRef}. Awaiting Admin Approval.`,
    createdAt: nowIso
  };

  db.set('payments', [newPayment, ...payments]);

  // Dispatch real-time in-app notification to Teacher and Owner
  const notifs = db.get('notifications');
  const notifAdmin: AppNotification = {
    id: `notif_${Date.now()}_req`,
    recipientId: 'owner',
    title: `🔔 Fee Verification Request: ${student.name}`,
    message: `${student.name} (${student.rollNumber}) ne Rs ${feeAmount} ka UPI UTR (${effectiveTxnRef}) submit kiya hai. Kripya verify karke 1 Calendar Month access approve karein.`,
    type: 'payment_submitted',
    read: false,
    createdAt: nowIso,
    actionUrl: '/owner-access'
  };
  db.set('notifications', [notifAdmin, ...notifs]);

  return res.status(201).json({
    success: true,
    pendingApproval: true,
    message: `Payment proof with UTR "${effectiveTxnRef}" has been submitted for Admin verification. Your 1-calendar-month subscription will be activated upon Admin approval.`,
    payment: newPayment
  });
});

// 8. Public Single Receipt lookup
router.get('/public-receipt/:receiptNumber', (req, res: Response) => {
  const { receiptNumber } = req.params;
  const receipts = db.get('receipts');
  const receipt = receipts.find(r => r.receiptNumber.toUpperCase() === receiptNumber.toUpperCase());

  if (!receipt) {
    return res.status(404).json({ error: 'Receipt not found.' });
  }

  const settings = db.get('settings');
  return res.json({ receipt, settings });
});

// 9. Student Submits Payment ID / UTR Proof for Admin Verification
router.post('/submit-proof', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const student = user.role === 'student' ? user.studentProfile : db.get('students').find(s => s.id === req.body.studentId);

  if (!student) {
    return res.status(403).json({ error: 'Student record not found.' });
  }

  const { amount, paymentMethod, screenshotUrl, notes } = req.body;
  const rawTxn = (req.body.transactionId || req.body.utrNumber || req.body.transactionRef || '').toString();

  if (!rawTxn.trim()) {
    return res.status(400).json({ error: 'UPI Transaction ID / UTR number is required.' });
  }

  if (!screenshotUrl || !String(screenshotUrl).trim()) {
    return res.status(400).json({ error: 'Payment screenshot is required for fee verification.' });
  }

  const cleanTxnId = String(rawTxn).trim();
  const classes = db.get('classes');
  const studentClass = classes.find(c => c.id === student.classId);
  const feeAmount = Number(amount) || student.customFee || studentClass?.monthlyFee || 2500;

  const nowIso = new Date().toISOString();
  const paymentId = `pay_proof_${Date.now()}`;

  const payments = db.get('payments');

  // Check if this exact payment ID / UTR was already approved
  const existingApproved = payments.find(
    p => (p.utrNumber === cleanTxnId || p.razorpayPaymentId === cleanTxnId || p.razorpayOrderId === cleanTxnId || p.id === cleanTxnId) && p.status === 'success'
  );
  if (existingApproved) {
    return res.status(400).json({
      error: 'This Payment ID / UTR has already been approved and credited previously.'
    });
  }

  // Create pending verification payment record (Never activates membership on submission)
  const newPayment: PaymentTransaction = {
    id: paymentId,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    classId: student.classId,
    amount: feeAmount,
    periodStart: nowIso,
    periodEnd: '', // set upon admin approval
    status: 'pending',
    paymentMethod: paymentMethod || 'upi',
    utrNumber: cleanTxnId,
    screenshotUrl: String(screenshotUrl).trim(),
    teacherNotes: notes || `Student submitted Payment ID / UTR: ${cleanTxnId}`,
    createdAt: nowIso
  };

  db.set('payments', [newPayment, ...payments]);

  // Dispatch real-time in-app notification to Admin (Owner) and Teacher Cabin
  const notifs = db.get('notifications');
  const notifTeacher: AppNotification = {
    id: `notif_${Date.now()}_t`,
    recipientId: 'teacher',
    title: `🔔 Fee Verification Request: ${student.name}`,
    message: `${student.name} (${student.rollNumber}) ne Rs ${feeAmount} ka UPI UTR (${cleanTxnId}) screenshot ke sath submit kiya hai. Kripya verify karein.`,
    type: 'payment_submitted',
    read: false,
    createdAt: nowIso,
    actionUrl: '/teacher-payments'
  };

  const notifOwner: AppNotification = {
    id: `notif_${Date.now()}_o`,
    recipientId: 'owner',
    title: `🔔 Fee Verification Request: ${student.name}`,
    message: `${student.name} (${student.rollNumber}) ne Rs ${feeAmount} ka UPI UTR (${cleanTxnId}) screenshot ke sath submit kiya hai. Kripya verify karein.`,
    type: 'payment_submitted',
    read: false,
    createdAt: nowIso,
    actionUrl: '/owner-access'
  };

  db.set('notifications', [notifTeacher, notifOwner, ...notifs]);

  // Audit log
  const auditLogs = db.get('auditLogs');
  db.set('auditLogs', [
    {
      id: `audit_${Date.now()}`,
      userId: student.id,
      userName: student.name,
      action: 'PAYMENT_PROOF_SUBMITTED',
      details: `Student ${student.name} (${student.rollNumber}) submitted payment proof UTR: ${cleanTxnId} for Rs ${feeAmount}. Pending admin approval.`,
      timestamp: nowIso
    },
    ...auditLogs
  ]);

  return res.status(201).json({
    success: true,
    message: `Payment ID "${cleanTxnId}" with screenshot has been submitted to Admin. Your 1-calendar-month access will activate once the Admin approves.`,
    payment: newPayment
  });
});

// 10. Admin / Teacher Retrieves All Pending and Historical Payment Verification Requests
router.get('/pending-requests', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'teacher' && user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. Only Admin or Teacher can view payment requests.' });
  }

  const payments = db.get('payments');
  const students = db.get('students');
  const users = db.get('users');
  const classes = db.get('classes');
  const batches = db.get('batches');
  const memberships = db.get('memberships');

  const allRequests = payments.map(p => {
    const stu = students.find(s => s.id === p.studentId);
    const userAcc = stu ? users.find(u => u.id === stu.userId) : undefined;
    const cls = classes.find(c => c.id === (p.classId || stu?.classId));
    const bth = batches.find(b => b.id === stu?.batchId);
    const mem = memberships.find(m => m.studentId === p.studentId);

    const isCurrentExpired = !mem || new Date(mem.expiryDate).getTime() <= Date.now();

    return {
      ...p,
      studentName: stu?.name || p.studentName,
      rollNumber: stu?.rollNumber || p.rollNumber || 'N/A',
      studentEmail: userAcc?.email || stu?.email || '',
      studentPhone: stu?.phone || userAcc?.phone || '',
      guardianPhone: stu?.guardianPhone || '',
      guardianName: stu?.guardianName || '',
      className: cls?.name || 'Class',
      classId: cls?.id || stu?.classId || p.classId,
      batchName: bth?.name || 'Batch',
      currentMembershipStatus: mem?.status || 'expired',
      currentExpiryDate: mem?.expiryDate || '',
      currentStartDate: mem?.startDate || '',
      isCurrentExpired
    };
  });

  const pendingRequests = allRequests.filter(p => p.status === 'pending');

  return res.json({
    pendingRequests,
    allRequests,
    totalPending: pendingRequests.length
  });
});

// 11. Admin / Teacher Approves Payment & Activates Subscription for Exactly One Calendar Month
router.post('/approve-request/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'teacher' && user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. Only Admin or Teacher can approve payments.' });
  }

  const { id } = req.params;
  const { adminRemarks } = req.body;

  const payments = db.get('payments');
  const pIndex = payments.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return res.status(404).json({ error: 'Payment request not found.' });
  }

  const payment = payments[pIndex];
  if (payment.status === 'success') {
    return res.status(400).json({ error: 'This payment request has already been approved.' });
  }

  const students = db.get('students');
  const student = students.find(s => s.id === payment.studentId);

  if (!student) {
    return res.status(404).json({ error: 'Student profile associated with this payment was not found.' });
  }

  // Exact 1 calendar month calculation from approval time
  const approvalTime = new Date();
  const startDate = approvalTime.toISOString();
  const expiryDate = addOneCalendarMonth(approvalTime).toISOString();

  const receiptNumber = generateReceiptNumber();

  // 1. Update Payment Transaction
  payments[pIndex] = {
    ...payment,
    status: 'success',
    receiptNumber,
    periodStart: startDate,
    periodEnd: expiryDate,
    approvedBy: user.name || (user.role === 'owner' ? 'Institute Owner (AIHSAN ANSARI)' : 'Teacher Admin'),
    approvedAt: startDate,
    accessGrantedDays: 30,
    adminRemarks: adminRemarks || `Approved by ${user.name || user.role}. Exactly 1 calendar month active subscription granted until ${new Date(expiryDate).toLocaleDateString('en-IN')}.`
  };
  db.set('payments', payments);

  // 2. Update Student Membership (Save exact startDate and expiryDate)
  const memberships = db.get('memberships');
  const memIndex = memberships.findIndex(m => m.studentId === student.id);

  if (memIndex !== -1) {
    memberships[memIndex] = {
      ...memberships[memIndex],
      status: 'active',
      startDate: startDate,
      expiryDate: expiryDate,
      lastPaymentDate: startDate,
      lastPaymentAmount: payment.amount,
      accessDurationDays: 30
    };
  } else {
    memberships.push({
      id: `mem_${Date.now()}`,
      studentId: student.id,
      startDate: startDate,
      expiryDate: expiryDate,
      status: 'active',
      lastPaymentDate: startDate,
      lastPaymentAmount: payment.amount,
      autoRenew: false,
      gracePeriodDays: 3,
      accessDurationDays: 30
    });
  }
  db.set('memberships', memberships);

  // 3. Update Student Status to Active
  const sIndex = students.findIndex(s => s.id === student.id);
  if (sIndex !== -1) {
    students[sIndex].status = 'active';
    students[sIndex].loginAccessGranted = true;
    db.set('students', students);
  }

  // Also enable user account if it was pending
  const users = db.get('users');
  const uIndex = users.findIndex(u => u.id === student.userId);
  if (uIndex !== -1) {
    users[uIndex].loginAccessGranted = true;
    db.set('users', users);
  }

  // 4. Generate Official Receipt
  const classes = db.get('classes');
  const batches = db.get('batches');
  const studentClass = classes.find(c => c.id === student.classId);
  const studentBatch = batches.find(b => b.id === student.batchId);
  const monthName = approvalTime.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const newReceipt: PaymentReceipt = {
    receiptNumber,
    paymentId: payment.id,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    className: studentClass?.name || 'Class',
    batchName: studentBatch?.name || 'Batch',
    billingMonth: monthName,
    amount: payment.amount,
    paymentMethod: payment.paymentMethod,
    transactionId: payment.utrNumber || payment.id,
    paidAt: startDate,
    receiptDate: startDate.split('T')[0],
    teacherNotes: `Verified & Approved by Admin. Active for 1 calendar month until ${new Date(expiryDate).toLocaleDateString('en-IN')}`
  };
  db.set('receipts', [newReceipt, ...db.get('receipts')]);

  // 5. Notify Student in-app
  const notifs = db.get('notifications');
  const expiryFormatted = new Date(expiryDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const studentNotif: AppNotification = {
    id: `notif_${Date.now()}_st`,
    recipientId: student.id,
    title: `🎉 Monthly Fee Approved - Subscription Active!`,
    message: `Your payment (UTR: ${payment.utrNumber || payment.id}) has been approved by the Admin. Your subscription is activated for 1 calendar month until ${expiryFormatted}. Receipt #${receiptNumber}.`,
    type: 'payment_success',
    read: false,
    createdAt: startDate,
    actionUrl: `/receipt/${receiptNumber}`
  };
  db.set('notifications', [studentNotif, ...notifs]);

  // 6. Audit Log
  const auditLogs = db.get('auditLogs');
  db.set('auditLogs', [
    {
      id: `audit_${Date.now()}`,
      userId: user.userId,
      userName: user.name,
      action: 'APPROVE_PAYMENT_GRANT_ACCESS',
      details: `Approved Payment ID ${payment.utrNumber || payment.id} for ${student.name} (${student.rollNumber}). Activated 1 calendar month until ${expiryDate}. Receipt #${receiptNumber}.`,
      timestamp: startDate
    },
    ...auditLogs
  ]);

  return res.json({
    success: true,
    message: `Payment verified and approved! Student ${student.name} subscription activated for exactly 1 calendar month until ${expiryFormatted}.`,
    receipt: newReceipt,
    startDate,
    expiryDate,
    newExpiryDate: expiryDate
  });
});

// 12. Admin / Teacher Rejects Payment Request with Optional Reason
router.post('/reject-request/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'teacher' && user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. Only Admin or Teacher can reject payments.' });
  }

  const { id } = req.params;
  const { reason = '' } = req.body;
  const cleanReason = String(reason || '').trim();

  const payments = db.get('payments');
  const pIndex = payments.findIndex(p => p.id === id);

  if (pIndex === -1) {
    return res.status(404).json({ error: 'Payment request not found.' });
  }

  const payment = payments[pIndex];
  const nowIso = new Date().toISOString();

  payments[pIndex] = {
    ...payment,
    status: 'rejected',
    approvedBy: user.name || (user.role === 'owner' ? 'Institute Owner' : 'Teacher'),
    approvedAt: nowIso,
    adminRemarks: cleanReason || 'Payment transaction could not be verified in tuition bank account.'
  };
  db.set('payments', payments);

  // Notify student
  const notifs = db.get('notifications');
  const studentNotif: AppNotification = {
    id: `notif_${Date.now()}_rej`,
    recipientId: payment.studentId,
    title: `⚠️ Payment Verification Rejected`,
    message: `Your payment request (UTR: ${payment.utrNumber || payment.id}) was rejected by Admin.${cleanReason ? ` Reason: ${cleanReason}.` : ''} Please verify your transaction ID/screenshot and submit a renewal request.`,
    type: 'fee_due',
    read: false,
    createdAt: nowIso
  };
  db.set('notifications', [studentNotif, ...notifs]);

  return res.json({
    success: true,
    message: 'Payment verification request has been rejected.',
    payment: payments[pIndex]
  });
});

// 13. Student Checks Real-Time 1-Month Access & Countdown Status
router.get('/my-status', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const student = user.studentProfile;

  if (!student) {
    return res.status(403).json({ error: 'No student profile.' });
  }

  const memberships = db.get('memberships');
  const mem = memberships.find(m => m.studentId === student.id);
  const payments = db.get('payments');
  const receipts = db.get('receipts');

  const now = Date.now();
  const expiryTime = mem?.expiryDate ? new Date(mem.expiryDate).getTime() : 0;
  const isExpired = !mem || isNaN(expiryTime) || now >= expiryTime || mem.status !== 'active';
  const timeRemainingMs = isExpired ? 0 : Math.max(0, expiryTime - now);

  const pendingRequest = payments.find(p => p.studentId === student.id && p.status === 'pending');
  const latestReceipt = receipts.find(r => r.studentId === student.id);

  // Check latest rejected request so student can view rejection reason and renew
  const latestRejectedRequest = payments
    .filter(p => p.studentId === student.id && p.status === 'rejected')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

  const classes = db.get('classes');
  const studentClass = classes.find(c => c.id === student.classId);

  return res.json({
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    className: studentClass?.name || 'Class',
    monthlyFee: student.customFee || studentClass?.monthlyFee || 2500,
    membership: mem || null,
    isExpired,
    timeRemainingMs,
    expiryDate: mem?.expiryDate || null,
    startDate: mem?.startDate || null,
    pendingRequest: pendingRequest || null,
    latestRejectedRequest,
    latestReceipt: latestReceipt || null
  });
});

export default router;

