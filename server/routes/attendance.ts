import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, requireTeacher } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { AttendanceRecord } from '../types.ts';

const router = Router();

// 1. Get attendance records for a specific date and class/batch
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { date, classId, batchId } = req.query;
  const user = req.user!;
  let records = db.get('attendance');

  if (user.role === 'teacher' || user.role === 'owner') {
    if (date && typeof date === 'string') {
      records = records.filter(r => r.date === date);
    }
    if (classId && typeof classId === 'string' && classId !== 'all') {
      records = records.filter(r => r.classId === classId);
    }
    if (batchId && typeof batchId === 'string' && batchId !== 'all') {
      records = records.filter(r => r.batchId === batchId);
    }
    return res.json({ attendance: records });
  }

  // Student: returns only own attendance records
  const student = user.studentProfile;
  if (!student) {
    return res.status(403).json({ error: 'No student profile.' });
  }

  const myRecords = records.filter(r => r.studentId === student.id);
  const presentCount = myRecords.filter(r => r.status === 'present').length;
  const lateCount = myRecords.filter(r => r.status === 'late').length;
  const absentCount = myRecords.filter(r => r.status === 'absent').length;
  const total = myRecords.length;
  const percentage = total > 0 ? Math.round(((presentCount + lateCount * 0.8) / total) * 100) : 100;

  return res.json({
    attendance: myRecords,
    summary: {
      totalClasses: total,
      present: presentCount,
      late: lateCount,
      absent: absentCount,
      percentage
    }
  });
});

// 2. Teacher records batch attendance for a specific date
router.post('/batch-record', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { date, classId, batchId, entries } = req.body;
  // entries: Array<{ studentId: string; status: 'present' | 'absent' | 'late'; remarks?: string }>

  if (!date || !classId || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'Date, class ID, and student attendance entries are required.' });
  }

  const attendance = db.get('attendance');
  const nowIso = new Date().toISOString();

  // Filter out existing records for this date and students to overwrite cleanly
  const studentIds = entries.map(e => e.studentId);
  const preserved = attendance.filter(r => !(r.date === date && studentIds.includes(r.studentId)));

  const newRecords: AttendanceRecord[] = entries.map(entry => ({
    id: `att_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`,
    date,
    classId,
    batchId: batchId || 'all',
    studentId: entry.studentId,
    status: entry.status,
    remarks: entry.remarks || '',
    recordedAt: nowIso
  }));

  db.set('attendance', [...preserved, ...newRecords]);

  return res.json({
    message: `Attendance recorded for ${newRecords.length} students on ${date}.`,
    records: newRecords
  });
});

// 3. Compliance overview: students with missing homework, absent streaks, late records
router.get('/compliance', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { classId } = req.query;
  let students = db.get('students').filter(s => s.status !== 'suspended');
  if (classId && typeof classId === 'string' && classId !== 'all') {
    students = students.filter(s => s.classId === classId);
  }

  const homework = db.get('homework').filter(h => !h.isDraft);
  const submissions = db.get('submissions');
  const attendance = db.get('attendance');

  const complianceList = students.map(student => {
    // Homework for this student's class
    const studentHw = homework.filter(h => h.classId === student.classId);
    const studentSubs = submissions.filter(s => s.studentId === student.id);
    const unsubmittedHw = studentHw.filter(h => !studentSubs.some(s => s.homeworkId === h.id));

    // Attendance stats
    const studentAtt = attendance.filter(a => a.studentId === student.id);
    const totalDays = studentAtt.length;
    const presentDays = studentAtt.filter(a => a.status === 'present').length;
    const lateDays = studentAtt.filter(a => a.status === 'late').length;
    const absentDays = studentAtt.filter(a => a.status === 'absent').length;
    const attPercentage = totalDays > 0 ? Math.round(((presentDays + lateDays * 0.8) / totalDays) * 100) : 100;

    return {
      studentId: student.id,
      name: student.name,
      rollNumber: student.rollNumber,
      phone: student.phone,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      classId: student.classId,
      batchId: student.batchId,
      totalAssignedHw: studentHw.length,
      submittedHwCount: studentSubs.length,
      missingHwCount: unsubmittedHw.length,
      missingHwList: unsubmittedHw.map(h => ({ id: h.id, subject: h.subject, topic: h.topic, chapter: h.chapter, deadline: h.deadlineDate })),
      attendancePercentage: attPercentage,
      absentDays,
      lateDays
    };
  });

  return res.json({ complianceList });
});

export default router;
