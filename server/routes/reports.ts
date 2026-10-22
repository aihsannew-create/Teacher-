import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireTeacher, AuthenticatedRequest } from '../auth';

const router = Router();

// 1. Teacher Overview Dashboard Metrics
router.get('/dashboard', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const students = db.get('students');
  const memberships = db.get('memberships');
  const payments = db.get('payments');
  const homework = db.get('homework').filter(h => !h.isDraft);
  const submissions = db.get('submissions');
  const attendance = db.get('attendance');
  const classes = db.get('classes');
  const batches = db.get('batches');

  const totalStudents = students.length;
  const activeStudents = students.filter(s => s.status === 'active').length;
  const overdueMemberships = memberships.filter(m => {
    const isPast = new Date(m.expiryDate).getTime() < Date.now();
    return isPast || m.status === 'expired';
  }).length;
  const pendingApprovals = students.filter(s => s.status === 'pending_approval').length;

  // Fee calculation (Real DB records)
  const totalRevenue = payments
    .filter(p => p.status === 'success')
    .reduce((sum, p) => sum + p.amount, 0);

  const thisMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
  const thisMonthRevenue = payments
    .filter(p => p.status === 'success' && p.createdAt.startsWith(thisMonthStr))
    .reduce((sum, p) => sum + p.amount, 0);

  // Outstanding fee estimate
  const unpaidStudents = students.filter(s => s.status === 'expired' || s.status === 'pending_payment');
  const outstandingFees = unpaidStudents.reduce((sum, s) => {
    const cls = classes.find(c => c.id === s.classId);
    return sum + (s.customFee || cls?.monthlyFee || 2500);
  }, 0);

  // Homework submission rate
  const totalSubmissions = submissions.length;
  const pendingReviewSubmissions = submissions.filter(s => s.status === 'submitted').length;
  const completedSubmissions = submissions.filter(s => s.status === 'completed').length;

  // Today's classes count
  const todayClassesCount = batches.length;

  // Recent payments
  const recentPayments = payments.slice(0, 5);

  // Batch breakdown
  const batchStats = batches.map(b => {
    const batchStudents = students.filter(s => s.batchId === b.id);
    const cls = classes.find(c => c.id === b.classId);
    return {
      batchId: b.id,
      batchName: b.name,
      className: cls?.name || 'Class',
      timing: b.timing,
      enrolled: batchStudents.length,
      capacity: b.maxCapacity
    };
  });

  return res.json({
    metrics: {
      totalStudents,
      activeStudents,
      overdueMemberships,
      pendingApprovals,
      totalRevenue,
      thisMonthRevenue,
      outstandingFees,
      homeworkPublished: homework.length,
      totalSubmissions,
      pendingReviewSubmissions,
      completedSubmissions,
      todayClassesCount
    },
    recentPayments,
    batchStats
  });
});

// 2. Downloadable CSV Reports
router.get('/export-csv', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { type } = req.query; // 'payments' | 'students' | 'compliance' | 'attendance'

  if (type === 'payments') {
    const payments = db.get('payments');
    let csv = 'Receipt No,Transaction ID,Student Name,Roll No,Amount,Method,Status,Date,Period End,Notes\n';
    payments.forEach(p => {
      csv += `"${p.receiptNumber}","${p.id}","${p.studentName}","${p.rollNumber}",${p.amount},"${p.paymentMethod}","${p.status}","${p.createdAt.split('T')[0]}","${p.periodEnd}","${(p.teacherNotes || '').replace(/"/g, '""')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Prerna_Tuition_Payments_Report.csv"');
    return res.send(csv);
  }

  if (type === 'students') {
    const students = db.get('students');
    const classes = db.get('classes');
    const batches = db.get('batches');
    const memberships = db.get('memberships');

    let csv = 'Roll No,Name,Email,Phone,Class,Batch,Guardian Name,Guardian Phone,Status,Membership Expiry,Monthly Fee\n';
    students.forEach(s => {
      const cls = classes.find(c => c.id === s.classId);
      const bth = batches.find(b => b.id === s.batchId);
      const mem = memberships.find(m => m.studentId === s.id);
      const fee = s.customFee || cls?.monthlyFee || 2500;
      csv += `"${s.rollNumber}","${s.name}","${s.email}","${s.phone}","${cls?.name || ''}","${bth?.name || ''}","${s.guardianName}","${s.guardianPhone}","${s.status}","${mem?.expiryDate || 'N/A'}",${fee}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="Prerna_Tuition_Students_Report.csv"');
    return res.send(csv);
  }

  return res.status(400).json({ error: 'Valid export type parameter required (payments, students).' });
});

export default router;
