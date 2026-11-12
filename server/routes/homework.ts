import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireAuth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { Homework, HomeworkSubmission, AppNotification } from '../types.ts';

const router = Router();

// Helper to check student membership status against current date and exact timestamp
function isMembershipActive(studentId: string): {
  active: boolean;
  isGracePeriod: boolean;
  expiryDate: string;
  daysRemaining: number;
  timeRemainingMs: number;
} {
  const memberships = db.get('memberships');
  const mem = memberships.find(m => m.studentId === studentId);

  if (!mem || !mem.expiryDate) {
    return { active: false, isGracePeriod: false, expiryDate: '', daysRemaining: -999, timeRemainingMs: 0 };
  }

  const now = Date.now();
  const expiryTime = new Date(mem.expiryDate).getTime();

  // If 30-day validity time has passed: Automatic Access Lockout immediately!
  if (isNaN(expiryTime) || now >= expiryTime) {
    if (mem.status !== 'expired') {
      mem.status = 'expired';
      db.set('memberships', memberships);

      // Keep student profile in sync
      const students = db.get('students');
      const sIdx = students.findIndex(s => s.id === studentId);
      if (sIdx !== -1 && students[sIdx].status !== 'expired') {
        students[sIdx].status = 'expired';
        db.set('students', students);
      }
    }
    return {
      active: false,
      isGracePeriod: false,
      expiryDate: mem.expiryDate,
      daysRemaining: 0,
      timeRemainingMs: 0
    };
  }

  const timeRemainingMs = expiryTime - now;
  const daysRemaining = Math.ceil(timeRemainingMs / (1000 * 60 * 60 * 24));

  return {
    active: true,
    isGracePeriod: false,
    expiryDate: mem.expiryDate,
    daysRemaining,
    timeRemainingMs
  };
}

// GET all homework with role-based filtering and server-side membership protection
router.get('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const allHw = db.get('homework');
  const submissions = db.get('submissions');
  const classes = db.get('classes');
  const batches = db.get('batches');

  if (user.role === 'teacher' || user.role === 'owner') {
    const { classId, batchId, status } = req.query;
    let list = [...allHw];

    if (classId && typeof classId === 'string' && classId !== 'all') {
      list = list.filter(h => h.classId === classId);
    }
    if (batchId && typeof batchId === 'string' && batchId !== 'all') {
      list = list.filter(h => h.batchIds.includes('all') || h.batchIds.includes(batchId));
    }
    if (status === 'draft') {
      list = list.filter(h => h.isDraft);
    } else if (status === 'published') {
      list = list.filter(h => !h.isDraft);
    }

    // Attach submission statistics for teacher / owner
    const enriched = list.map(hw => {
      const cls = classes.find(c => c.id === hw.classId);
      const hwSubs = submissions.filter(s => s.homeworkId === hw.id);
      const totalEnrolled = db.get('students').filter(s => s.classId === hw.classId && s.status !== 'suspended').length;
      return {
        ...hw,
        className: cls?.name || 'Class',
        submissionsCount: hwSubs.length,
        totalEnrolled,
        completedCount: hwSubs.filter(s => s.status === 'completed').length,
        needsCorrectionCount: hwSubs.filter(s => s.status === 'needs_correction').length,
        pendingReviewCount: hwSubs.filter(s => s.status === 'submitted').length
      };
    });

    return res.json({ homework: enriched });
  }

  // Student portal: Class-Wise Homework & Membership Check
  const student = user.studentProfile;
  if (!student) {
    return res.status(403).json({ error: 'No student profile linked to this account.' });
  }

  // 1. Check membership server-side
  const memberStatus = isMembershipActive(student.id);
  const studentClass = classes.find(c => c.id === student.classId);

  // If student membership is expired or inactive, SERVER BLOCKS full homework details
  if (!memberStatus.active) {
    const payments = db.get('payments');
    const pendingRequest = payments.find(p => p.studentId === student.id && p.status === 'pending');
    const latestRejectedRequest = payments
      .filter(p => p.studentId === student.id && p.status === 'rejected')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

    return res.status(403).json({
      error: 'membership_expired',
      locked: true,
      message: 'Aapki monthly tuition subscription samapt ho chuki hai. Homework aur study materials sirf active subscription wale bacho ke liye uplabdh hain.',
      membership: {
        status: 'expired',
        expiryDate: memberStatus.expiryDate,
        monthlyFee: student.customFee || studentClass?.monthlyFee || 2500,
        daysOverdue: Math.abs(memberStatus.daysRemaining)
      },
      pendingRequest: pendingRequest || null,
      latestRejectedRequest
    });
  }

  // 2. Strict Class Isolation: Student can ONLY view homework for their assigned class
  const targetClassId = typeof req.query.classId === 'string' ? req.query.classId : student.classId;
  if (targetClassId !== 'all' && targetClassId !== student.classId) {
    return res.status(403).json({
      error: 'Access denied. You can only view homework for your assigned class.'
    });
  }

  // Filter strictly to non-draft homework belonging to student's assigned class
  const eligibleHomework = allHw.filter(h => !h.isDraft && h.classId === student.classId);

  // Attach student's submission status
  const enriched = eligibleHomework.map(hw => {
    const studentSub = submissions.find(s => s.homeworkId === hw.id && s.studentId === student.id);
    const cls = classes.find(c => c.id === hw.classId);
    return {
      ...hw,
      className: cls?.name || studentClass?.name || 'My Class',
      mySubmission: studentSub || null,
      isSubmitted: !!studentSub,
      submissionStatus: studentSub?.status || 'pending'
    };
  });

  return res.json({
    homework: enriched,
    accessValidity: {
      active: true,
      expiryDate: memberStatus.expiryDate,
      timeRemainingMs: memberStatus.timeRemainingMs,
      daysRemaining: memberStatus.daysRemaining
    }
  });
});

// GET single homework by ID
router.get('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const allHw = db.get('homework');
  const hw = allHw.find(h => h.id === id);

  if (!hw) {
    return res.status(404).json({ error: 'Homework not found.' });
  }

  const submissions = db.get('submissions');
  const classes = db.get('classes');
  const batches = db.get('batches');
  const cls = classes.find(c => c.id === hw.classId);

  if (user.role === 'teacher' || user.role === 'owner') {
    const hwSubs = submissions.filter(s => s.homeworkId === hw.id);
    return res.json({
      homework: hw,
      className: cls?.name,
      submissions: hwSubs
    });
  }

  // Student check
  const student = user.studentProfile;
  if (!student) {
    return res.status(403).json({ error: 'No student profile.' });
  }

  // Class isolation check
  if (hw.classId !== student.classId) {
    return res.status(403).json({ error: 'Access denied. You cannot view homework for another class.' });
  }

  // Membership server check
  const memberStatus = isMembershipActive(student.id);
  if (!memberStatus.active) {
    return res.status(403).json({
      error: 'membership_expired',
      message: 'Tuition membership expired. Complete payment to access this assignment.'
    });
  }

  const mySub = submissions.find(s => s.homeworkId === hw.id && s.studentId === student.id);
  return res.json({
    homework: hw,
    className: cls?.name,
    mySubmission: mySub || null
  });
});

// Teacher/Owner creates new daily homework
router.post('/', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only teacher or owner can publish homework.' });
  }

  const {
    classId,
    batchIds,
    subject,
    chapter,
    title,
    topic,
    teachingSummary,
    instructions,
    description,
    publishDate,
    deadlineDate,
    deadline,
    maxMarks,
    priority,
    attachments,
    referenceLinks,
    isDraft
  } = req.body;

  const effectiveChapter = (chapter || title || topic || 'Daily Homework').trim();
  const effectiveSubject = (subject || 'General Study').trim();
  const effectiveInstructions = (instructions || description || req.body.homeworkText || 'Complete assigned work.').trim();
  const effectiveSummary = (teachingSummary || description || `Summary & lecture notes for ${effectiveChapter}`).trim();
  const effectiveDeadline = deadlineDate || deadline || new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  if (!classId) {
    return res.status(400).json({ error: 'Class is required to assign homework.' });
  }

  const allHw = db.get('homework');
  const newHw: Homework = {
    id: `hw_${Date.now()}`,
    classId,
    batchIds: Array.isArray(batchIds) && batchIds.length > 0 ? batchIds : ['all'],
    subject: effectiveSubject,
    chapter: effectiveChapter,
    topic: topic?.trim() || effectiveChapter,
    teachingSummary: effectiveSummary,
    instructions: effectiveInstructions,
    publishDate: publishDate || new Date().toISOString(),
    deadlineDate: effectiveDeadline,
    maxMarks: Number(maxMarks) || 20,
    priority: priority || 'normal',
    attachments: Array.isArray(attachments) ? attachments : [],
    referenceLinks: Array.isArray(referenceLinks) ? referenceLinks : [],
    isDraft: !!isDraft,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.set('homework', [newHw, ...allHw]);

  // If not draft, broadcast notification to all students in that class
  if (!isDraft) {
    const notifs = db.get('notifications');
    const classes = db.get('classes');
    const clsName = classes.find(c => c.id === classId)?.name || 'Your Class';
    const newNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      recipientId: `class:${classId}`,
      title: `New Homework: ${newHw.subject} (${newHw.chapter})`,
      message: `Daily homework posted for ${clsName}. Topic: ${newHw.chapter}. Deadline: ${new Date(newHw.deadlineDate).toLocaleDateString('en-IN')}`,
      type: 'homework',
      read: false,
      createdAt: new Date().toISOString()
    };
    db.set('notifications', [newNotif, ...notifs]);
  }

  return res.status(201).json({ message: 'Homework published successfully', homework: newHw });
});

// Teacher/Owner updates homework
router.put('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only teacher or owner can edit homework.' });
  }

  const { id } = req.params;
  const allHw = db.get('homework');
  const index = allHw.findIndex(h => h.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Homework not found.' });
  }

  const payload = { ...req.body };
  if (payload.title && !payload.chapter) payload.chapter = payload.title;
  if (payload.description && !payload.instructions) payload.instructions = payload.description;
  if (payload.deadline && !payload.deadlineDate) payload.deadlineDate = payload.deadline;

  const updated: Homework = {
    ...allHw[index],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  allHw[index] = updated;
  db.set('homework', allHw);

  return res.json({ message: 'Homework updated', homework: updated });
});

// Teacher/Owner deletes homework
router.delete('/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only teacher or owner can delete homework.' });
  }

  const { id } = req.params;
  const decodedId = decodeURIComponent(id).trim();
  const allHw = db.get('homework');
  const target = allHw.find(h => h.id === id || h.id === decodedId);
  if (!target) {
    return res.status(404).json({ error: 'Homework record not found.' });
  }

  const filtered = allHw.filter(h => h.id !== id && h.id !== decodedId);
  db.set('homework', filtered);

  // Clean up submissions for this homework
  const submissions = db.get('submissions');
  const filteredSubmissions = submissions.filter(s => s.homeworkId !== id && s.homeworkId !== decodedId);
  db.set('submissions', filteredSubmissions);

  return res.json({ success: true, message: 'Homework record deleted successfully.', id: target.id });
});

// Teacher/Owner duplicates homework to another class/batch
router.post('/:id/duplicate', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only teacher or owner can duplicate homework.' });
  }

  const { id } = req.params;
  const { targetClassId, targetBatchIds } = req.body;
  const allHw = db.get('homework');
  const source = allHw.find(h => h.id === id);
  if (!source) {
    return res.status(404).json({ error: 'Source homework not found.' });
  }

  const dup: Homework = {
    ...source,
    id: `hw_${Date.now()}`,
    classId: targetClassId || source.classId,
    batchIds: targetBatchIds || source.batchIds,
    publishDate: new Date().toISOString(),
    deadlineDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    isDraft: true, // safe default
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.set('homework', [dup, ...allHw]);
  return res.status(201).json({ message: 'Homework duplicated as draft', homework: dup });
});

// Student submits homework
router.post('/:id/submit', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const student = user.studentProfile;
  if (!student) {
    return res.status(403).json({ error: 'Only enrolled students can submit homework.' });
  }

  // Server membership check
  const memberStatus = isMembershipActive(student.id);
  if (!memberStatus.active) {
    return res.status(403).json({
      error: 'membership_expired',
      message: 'Cannot submit homework: your tuition membership is overdue. Please renew first.'
    });
  }

  const { id } = req.params;
  const allHw = db.get('homework');
  const hw = allHw.find(h => h.id === id);
  if (!hw) {
    return res.status(404).json({ error: 'Homework not found.' });
  }

  // Class isolation check
  if (hw.classId !== student.classId) {
    return res.status(403).json({ error: 'Cannot submit homework for another class.' });
  }

  const { solutionText, attachments } = req.body;
  const submissions = db.get('submissions');
  const existingIndex = submissions.findIndex(s => s.homeworkId === id && s.studentId === student.id);

  const subObj: HomeworkSubmission = {
    id: existingIndex !== -1 ? submissions[existingIndex].id : `sub_${Date.now()}`,
    homeworkId: id,
    studentId: student.id,
    studentName: student.name,
    rollNumber: student.rollNumber,
    submissionDate: new Date().toISOString(),
    solutionText: solutionText?.trim() || '',
    attachments: Array.isArray(attachments) ? attachments : [],
    status: 'submitted',
    obtainedMarks: existingIndex !== -1 ? submissions[existingIndex].obtainedMarks : undefined,
    teacherFeedback: existingIndex !== -1 ? submissions[existingIndex].teacherFeedback : undefined
  };

  if (existingIndex !== -1) {
    submissions[existingIndex] = subObj;
  } else {
    submissions.push(subObj);
  }

  db.set('submissions', submissions);

  // Notify teacher
  const notifs = db.get('notifications');
  db.set('notifications', [
    {
      id: `notif_${Date.now()}`,
      recipientId: 'teacher',
      title: 'Homework Submitted',
      message: `${student.name} (${student.rollNumber}) submitted homework for ${hw.subject}: ${hw.chapter}.`,
      type: 'homework',
      read: false,
      createdAt: new Date().toISOString()
    },
    ...notifs
  ]);

  return res.json({ message: 'Homework submitted successfully!', submission: subObj });
});

// Teacher/Owner grades and reviews submission
router.post('/submissions/:subId/grade', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only teacher or owner can grade submissions.' });
  }

  const { subId } = req.params;
  const { status, marks, feedback } = req.body;

  const submissions = db.get('submissions');
  const index = submissions.findIndex(s => s.id === subId);
  if (index === -1) {
    return res.status(404).json({ error: 'Submission not found.' });
  }

  submissions[index].status = status || 'completed';
  if (marks !== undefined) {
    submissions[index].obtainedMarks = Number(marks);
  }
  if (feedback !== undefined) {
    submissions[index].teacherFeedback = feedback.trim();
  }
  submissions[index].gradedAt = new Date().toISOString();

  db.set('submissions', submissions);

  // Send notification to the student
  const studentSub = submissions[index];
  const notifs = db.get('notifications');
  db.set('notifications', [
    {
      id: `notif_${Date.now()}`,
      recipientId: studentSub.studentId,
      title: `Homework Graded: ${status === 'completed' ? 'Passed' : status === 'needs_correction' ? 'Correction Required' : 'Reviewed'}`,
      message: `Teacher gave ${marks !== undefined ? marks + ' marks' : 'feedback'}: "${feedback || 'Checked and reviewed'}"`,
      type: 'homework',
      read: false,
      createdAt: new Date().toISOString()
    },
    ...notifs
  ]);

  return res.json({ message: 'Submission graded successfully', submission: submissions[index] });
});


// Teacher/Owner removes image from homework
router.delete('/:id/image', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  if (req.user?.role !== 'teacher' && req.user?.role !== 'owner') {
    return res.status(403).json({ error: 'Only teacher or owner can modify homework images.' });
  }

  const { id } = req.params;
  const allHw = db.get('homework');
  const index = allHw.findIndex(h => h.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Homework not found.' });
  }

  // Remove image attachments
  allHw[index].attachments = (allHw[index].attachments || []).filter(
    a => a.fileType !== 'image' && !a.fileUrl?.startsWith('data:image') && !a.name?.match(/\.(jpeg|jpg|png|webp)$/i)
  );
  allHw[index].updatedAt = new Date().toISOString();

  db.set('homework', allHw);

  return res.json({ success: true, message: 'Homework image removed successfully.', homework: allHw[index] });
});

export default router;
