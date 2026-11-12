import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, requireTeacher } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { StudentProfile, User, Membership } from '../types.ts';

const router = Router();

// List all students with membership details (Teacher only)
router.get('/', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { classId, batchId, status, search } = req.query;
  let students = db.get('students');
  const memberships = db.get('memberships');
  const classes = db.get('classes');
  const batches = db.get('batches');

  if (classId && typeof classId === 'string' && classId !== 'all') {
    students = students.filter(s => s.classId === classId);
  }
  if (batchId && typeof batchId === 'string' && batchId !== 'all') {
    students = students.filter(s => s.batchId === batchId);
  }
  if (status && typeof status === 'string' && status !== 'all') {
    students = students.filter(s => s.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    students = students.filter(
      s => s.name.toLowerCase().includes(q) ||
           s.rollNumber.toLowerCase().includes(q) ||
           s.phone.includes(q) ||
           s.email.toLowerCase().includes(q)
    );
  }

  const users = db.get('users');
  const enriched = students.map(student => {
    const mem = memberships.find(m => m.studentId === student.id);
    const cls = classes.find(c => c.id === student.classId);
    const bth = batches.find(b => b.id === student.batchId);
    const user = users.find(u => u.id === student.userId || u.email.toLowerCase() === student.email.toLowerCase());
    return {
      ...student,
      className: cls ? cls.name : 'Unknown Class',
      batchName: bth ? bth.name : 'Unassigned',
      monthlyFee: student.customFee || (cls ? cls.monthlyFee : 2500),
      membership: mem || null,
      userEmail: user ? user.email : student.email,
      passwordPreview: user ? user.passwordHash : 'student123',
      loginAccessGranted: student.loginAccessGranted !== false && user?.loginAccessGranted !== false
    };
  });

  return res.json({ students: enriched });
});

// Teacher manually adds a student
router.post('/', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    email,
    phone,
    classId,
    batchId,
    rollNumber,
    guardianName,
    guardianPhone,
    guardianRelation,
    customFee,
    notes,
    initialStatus,
    password
  } = req.body;

  if (!name || !email || !classId) {
    return res.status(400).json({ error: 'Name, email and class are required.' });
  }

  const users = db.get('users');
  const existing = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const userId = `usr_${Date.now()}`;
  const studentId = `stu_${Date.now()}`;
  const generatedRoll = rollNumber?.trim() || `PTA-${Math.floor(1000 + Math.random() * 9000)}`;

  const isApproved = initialStatus !== 'pending_approval';

  const newUser: User = {
    id: userId,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    phone: phone?.trim() || '',
    role: 'student',
    passwordHash: password?.trim() || 'student123', // Initial password
    loginAccessGranted: isApproved,
    createdAt: new Date().toISOString()
  };

  const newStudent: StudentProfile = {
    id: studentId,
    userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim() || '',
    rollNumber: generatedRoll,
    classId,
    batchId: batchId || 'all',
    guardianName: guardianName?.trim() || 'Parent',
    guardianPhone: guardianPhone?.trim() || '',
    guardianRelation: guardianRelation?.trim() || 'Parent',
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: initialStatus || 'active',
    loginAccessGranted: isApproved,
    customFee: customFee ? Number(customFee) : undefined,
    notes: notes?.trim() || ''
  };

  // Add initial membership
  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  const newMembership: Membership = {
    id: `mem_${Date.now()}`,
    studentId,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: initialStatus === 'expired' ? new Date().toISOString().split('T')[0] : nextMonth.toISOString().split('T')[0],
    status: initialStatus === 'expired' ? 'expired' : 'active',
    autoRenew: false,
    gracePeriodDays: 3
  };

  db.set('users', [...users, newUser]);
  db.set('students', [...db.get('students'), newStudent]);
  db.set('memberships', [...db.get('memberships'), newMembership]);

  return res.status(201).json({ message: 'Student added successfully', student: newStudent });
});

// Update student status (Approve, Suspend, Activate, Expire)
router.put('/:id/status', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  const students = db.get('students');
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  students[index].status = status;
  if (notes) {
    students[index].notes = notes;
  }
  db.set('students', students);

  // If approved and previously had expired or no active membership, update membership status
  const memberships = db.get('memberships');
  const memIndex = memberships.findIndex(m => m.studentId === id);
  if (memIndex !== -1) {
    if (status === 'active') {
      memberships[memIndex].status = 'active';
      const d = new Date();
      d.setDate(d.getDate() + 30);
      memberships[memIndex].expiryDate = d.toISOString().split('T')[0];
    } else if (status === 'expired') {
      memberships[memIndex].status = 'expired';
    }
    db.set('memberships', memberships);
  }

  return res.json({ message: 'Student status updated', student: students[index] });
});

// Update full student details
router.put('/:id', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, phone, classId, batchId, guardianName, guardianPhone, guardianRelation, customFee, notes } = req.body;

  const students = db.get('students');
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  students[index] = {
    ...students[index],
    name: name !== undefined ? name.trim() : students[index].name,
    phone: phone !== undefined ? phone.trim() : students[index].phone,
    classId: classId !== undefined ? classId : students[index].classId,
    batchId: batchId !== undefined ? batchId : students[index].batchId,
    guardianName: guardianName !== undefined ? guardianName.trim() : students[index].guardianName,
    guardianPhone: guardianPhone !== undefined ? guardianPhone.trim() : students[index].guardianPhone,
    guardianRelation: guardianRelation !== undefined ? guardianRelation.trim() : students[index].guardianRelation,
    customFee: customFee !== undefined ? (customFee ? Number(customFee) : undefined) : students[index].customFee,
    notes: notes !== undefined ? notes.trim() : students[index].notes
  };

  db.set('students', students);
  return res.json({ message: 'Student profile updated successfully', student: students[index] });
});

// Get individual student complete 360-degree history
router.get('/:id/history', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const students = db.get('students');
  const student = students.find(s => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const memberships = db.get('memberships').filter(m => m.studentId === id);
  const submissions = db.get('submissions').filter(s => s.studentId === id);
  const attendance = db.get('attendance').filter(a => a.studentId === id);
  const receipts = db.get('receipts').filter(r => r.studentId === id);
  const classes = db.get('classes');
  const batches = db.get('batches');

  const studentClass = classes.find(c => c.id === student.classId);
  const studentBatch = batches.find(b => b.id === student.batchId);

  return res.json({
    student,
    className: studentClass?.name,
    batchName: studentBatch?.name,
    memberships,
    submissions,
    attendance,
    receipts
  });
});

// Delete student account permanently (Teacher / Owner)
router.delete('/:id', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const students = db.get('students');
  const targetStudent = students.find(s => s.id === id);

  if (!targetStudent) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const users = db.get('users');
  const updatedStudents = students.filter(s => s.id !== id);
  const updatedUsers = users.filter(u => u.id !== targetStudent.userId && u.email.toLowerCase() !== targetStudent.email.toLowerCase());

  const updatedMemberships = db.get('memberships').filter(m => m.studentId !== id);
  const updatedSubmissions = db.get('submissions').filter(s => s.studentId !== id);
  const updatedAttendance = db.get('attendance').filter(a => a.studentId !== id);
  const updatedReceipts = db.get('receipts').filter(r => r.studentId !== id);

  db.set('students', updatedStudents);
  db.set('users', updatedUsers);
  db.set('memberships', updatedMemberships);
  db.set('submissions', updatedSubmissions);
  db.set('attendance', updatedAttendance);
  db.set('receipts', updatedReceipts);

  return res.json({
    message: `Student "${targetStudent.name}" (${targetStudent.rollNumber}) deleted successfully.`
  });
});

export default router;
