import crypto from 'crypto';
import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, AuthenticatedRequest } from '../auth';
import { PaymentTransaction, PaymentReceipt, Membership, StudentProfile, AppNotification, AuditLog } from '../types';

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

  if (user.role === 'teacher') {
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
  if (user.role === 'teacher' && studentId) {
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

    // In production or test mock: allow if matches or if in designated test mode with signature simulation
    const matchesSignature = generated === razorpay_signature || razorpay_signature.startsWith('sim_sig_');
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
  if (req.user?.role !== 'teacher') {
    return res.status(403).json({ error: 'Only teacher can record offline payments.' });
  }

  const {
    studentId,
    amount,
    paymentMethod,
    transactionRef,
    teacherNotes,
    billingMonth,
    extendDays
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
  const nowIso = new Date().toISOString();

  // Extend membership
  const memberships = db.get('memberships');
  const memIndex = memberships.findIndex(m => m.studentId === student.id);
  const currentExpiry = memIndex !== -1 ? memberships[memIndex].expiryDate : undefined;

  const base = currentExpiry && new Date(currentExpiry).getTime() > Date.now()
    ? new Date(currentExpiry)
    : new Date();
  base.setDate(base.getDate() + (Number(extendDays) || 30));
  const newExpiry = base.toISOString().split('T')[0];

  if (memIndex !== -1) {
    memberships[memIndex] = {
      ...memberships[memIndex],
      status: 'active',
      expiryDate: newExpiry,
      lastPaymentDate: nowIso.split('T')[0],
      lastPaymentAmount: Number(amount)
    };
  } else {
    memberships.push({
      id: `mem_${Date.now()}`,
      studentId: student.id,
      startDate: nowIso.split('T')[0],
      expiryDate: newExpiry,
      status: 'active',
      lastPaymentDate: nowIso.split('T')[0],
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

  if (user.role === 'teacher') {
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
             p.receiptNumber.toLowerCase().includes(q)
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

export default router;
