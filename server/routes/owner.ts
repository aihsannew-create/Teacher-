import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireOwner, AuthenticatedRequest } from '../auth';
import { User, StudentProfile, Membership } from '../types';

const router = Router();

// Apply Owner-only guard on all owner endpoints
router.use(requireAuth);
router.use(requireOwner);

// 1. Get Owner Summary Overview
router.get('/summary', (_req: AuthenticatedRequest, res: Response) => {
  const users = db.get('users');
  const students = db.get('students');
  
  const teachers = users.filter(u => u.role === 'teacher');
  const activeTeachers = teachers.filter(t => t.loginAccessGranted !== false);

  const pendingStudents = students.filter(s => s.loginAccessGranted === false);
  const approvedStudents = students.filter(s => s.loginAccessGranted !== false);

  return res.json({
    totalTeachers: teachers.length,
    activeTeachers: activeTeachers.length,
    totalStudents: students.length,
    pendingStudentsCount: pendingStudents.length,
    approvedStudentsCount: approvedStudents.length
  });
});

// 2. List All Teachers (Created credentials, status, assigned subjects)
router.get('/teachers', (_req: AuthenticatedRequest, res: Response) => {
  const users = db.get('users');
  const teachers = users
    .filter(u => u.role === 'teacher')
    .map(t => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      teacherTitle: t.teacherTitle || 'Faculty Member',
      assignedSubjects: t.assignedSubjects || ['Physics', 'Mathematics'],
      loginAccessGranted: t.loginAccessGranted !== false,
      passwordPreview: t.passwordHash, // Permitted strictly for Owner dashboard
      createdAt: t.createdAt
    }));

  return res.json({ teachers });
});

// 3. Owner Creates New Teacher ID & Password
router.post('/teachers', (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password, phone, teacherTitle, assignedSubjects } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Teacher name, email ID, and password are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = db.get('users');
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const newTeacherId = `usr_teacher_${Date.now()}`;
  const newTeacher: User = {
    id: newTeacherId,
    email: cleanEmail,
    name: name.trim(),
    phone: phone?.trim() || '',
    role: 'teacher',
    passwordHash: password,
    loginAccessGranted: true,
    teacherTitle: teacherTitle?.trim() || 'Senior Faculty',
    assignedSubjects: Array.isArray(assignedSubjects) && assignedSubjects.length > 0 
      ? assignedSubjects 
      : ['General Subjects'],
    createdAt: new Date().toISOString()
  };

  db.set('users', [...users, newTeacher]);

  return res.status(201).json({
    message: `Teacher ID & Password created successfully for ${name}.`,
    teacher: {
      id: newTeacher.id,
      name: newTeacher.name,
      email: newTeacher.email,
      phone: newTeacher.phone,
      teacherTitle: newTeacher.teacherTitle,
      assignedSubjects: newTeacher.assignedSubjects,
      loginAccessGranted: newTeacher.loginAccessGranted,
      passwordPreview: newTeacher.passwordHash,
      createdAt: newTeacher.createdAt
    }
  });
});

// 4. Owner Updates Teacher Password or Credentials
router.put('/teachers/:id/credentials', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { password, name, phone, teacherTitle, assignedSubjects } = req.body;

  const users = db.get('users');
  const index = users.findIndex(u => u.id === id && u.role === 'teacher');
  if (index === -1) {
    return res.status(404).json({ error: 'Teacher not found.' });
  }

  if (password) {
    users[index].passwordHash = password;
  }
  if (name) {
    users[index].name = name.trim();
  }
  if (phone !== undefined) {
    users[index].phone = phone.trim();
  }
  if (teacherTitle !== undefined) {
    users[index].teacherTitle = teacherTitle.trim();
  }
  if (Array.isArray(assignedSubjects)) {
    users[index].assignedSubjects = assignedSubjects;
  }

  db.set('users', users);

  return res.json({
    message: 'Teacher credentials updated successfully by Owner.',
    teacher: {
      id: users[index].id,
      name: users[index].name,
      email: users[index].email,
      phone: users[index].phone,
      teacherTitle: users[index].teacherTitle,
      assignedSubjects: users[index].assignedSubjects,
      loginAccessGranted: users[index].loginAccessGranted !== false,
      passwordPreview: users[index].passwordHash
    }
  });
});

// 5. Owner Toggles Teacher Login Access (Suspend or Activate)
router.put('/teachers/:id/toggle-access', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const users = db.get('users');
  const index = users.findIndex(u => u.id === id && u.role === 'teacher');
  if (index === -1) {
    return res.status(404).json({ error: 'Teacher not found.' });
  }

  const currentAccess = users[index].loginAccessGranted !== false;
  const newAccess = !currentAccess;
  users[index].loginAccessGranted = newAccess;

  db.set('users', users);

  return res.json({
    message: `Teacher login access ${newAccess ? 'ACTIVATED' : 'REVOKED'} by Owner.`,
    loginAccessGranted: newAccess
  });
});

// 6. List Students With Owner Approval & Login Status
router.get('/students', (_req: AuthenticatedRequest, res: Response) => {
  const students = db.get('students');
  const users = db.get('users');
  const classes = db.get('classes');
  const batches = db.get('batches');
  const memberships = db.get('memberships');

  const enriched = students.map(student => {
    const user = users.find(u => u.id === student.userId);
    const cls = classes.find(c => c.id === student.classId);
    const bth = batches.find(b => b.id === student.batchId);
    const mem = memberships.find(m => m.studentId === student.id);

    const loginAccessGranted = student.loginAccessGranted !== false && user?.loginAccessGranted !== false;

    return {
      ...student,
      className: cls ? cls.name : 'Unknown Class',
      batchName: bth ? bth.name : 'Unassigned',
      userEmail: user ? user.email : student.email,
      userPhone: user ? user.phone : student.phone,
      passwordPreview: user ? user.passwordHash : 'student123',
      loginAccessGranted,
      membershipStatus: mem ? mem.status : 'expired'
    };
  });

  return res.json({ students: enriched });
});

// 7. Owner Directly Generates Student ID & Password
router.post('/students', (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    email,
    password,
    phone,
    classId,
    batchId,
    guardianName,
    guardianPhone,
    guardianRelation,
    customFee
  } = req.body;

  if (!name || !email || !password || !classId) {
    return res.status(400).json({ error: 'Student name, email, password, and class are required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const users = db.get('users');
  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'An account with this email address already exists.' });
  }

  const userId = `usr_stu_${Date.now()}`;
  const studentId = `stu_${Date.now()}`;
  const rollNumber = `PTA-${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser: User = {
    id: userId,
    email: cleanEmail,
    name: name.trim(),
    phone: phone?.trim() || '',
    role: 'student',
    passwordHash: password,
    loginAccessGranted: true, // Directly approved by Owner
    createdAt: new Date().toISOString()
  };

  const newStudent: StudentProfile = {
    id: studentId,
    userId,
    name: name.trim(),
    email: cleanEmail,
    phone: phone?.trim() || '',
    rollNumber,
    classId,
    batchId: batchId || 'all',
    guardianName: guardianName?.trim() || 'Parent',
    guardianPhone: guardianPhone?.trim() || '',
    guardianRelation: guardianRelation?.trim() || 'Parent',
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: 'active',
    loginAccessGranted: true,
    approvedByOwnerAt: new Date().toISOString(),
    customFee: customFee ? Number(customFee) : undefined
  };

  const nextMonth = new Date();
  nextMonth.setDate(nextMonth.getDate() + 30);

  const newMembership: Membership = {
    id: `mem_${Date.now()}`,
    studentId,
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: nextMonth.toISOString().split('T')[0],
    status: 'active',
    autoRenew: false,
    gracePeriodDays: 3
  };

  db.set('users', [...users, newUser]);
  db.set('students', [...db.get('students'), newStudent]);
  db.set('memberships', [...db.get('memberships'), newMembership]);

  return res.status(201).json({
    message: `Student account created and login access granted for ${name}.`,
    student: newStudent,
    credentials: {
      email: cleanEmail,
      password,
      rollNumber
    }
  });
});

// 8. Owner Toggles Student Login Access (Grant or Revoke)
router.put('/students/:id/toggle-access', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const students = db.get('students');
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const currentAccess = students[index].loginAccessGranted !== false;
  const newAccess = !currentAccess;

  students[index].loginAccessGranted = newAccess;
  if (newAccess) {
    students[index].approvedByOwnerAt = new Date().toISOString();
    if (students[index].status === 'pending_approval') {
      students[index].status = 'active';
    }
  }

  // Also update User account
  const users = db.get('users');
  const userIndex = users.findIndex(u => u.id === students[index].userId);
  if (userIndex !== -1) {
    users[userIndex].loginAccessGranted = newAccess;
    db.set('users', users);
  }

  db.set('students', students);

  return res.json({
    message: `Student login access ${newAccess ? 'APPROVED & GRANTED' : 'REVOKED'} by Owner.`,
    loginAccessGranted: newAccess,
    student: students[index]
  });
});

// 9. Owner Bulk Approves All Pending Student Logins
router.post('/students/grant-all-pending', (_req: AuthenticatedRequest, res: Response) => {
  const students = db.get('students');
  const users = db.get('users');
  let count = 0;

  const updatedStudents = students.map(s => {
    if (s.loginAccessGranted === false) {
      count++;
      return {
        ...s,
        loginAccessGranted: true,
        approvedByOwnerAt: new Date().toISOString(),
        status: s.status === 'pending_approval' ? 'active' : s.status
      };
    }
    return s;
  });

  const studentUserIds = new Set(
    students.filter(s => s.loginAccessGranted === false).map(s => s.userId)
  );

  const updatedUsers = users.map(u => {
    if (studentUserIds.has(u.id)) {
      return { ...u, loginAccessGranted: true };
    }
    return u;
  });

  db.set('students', updatedStudents);
  db.set('users', updatedUsers);

  return res.json({
    message: `Successfully granted login access to ${count} pending student(s).`,
    approvedCount: count
  });
});

// 12. Get Landing Page Content for Owner Editor
router.get('/content', (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.get('settings');
  return res.json({ landingContent: settings.landingContent });
});

// 13. Update Landing Page Content (Hero text, stats, tagline, learning journey, etc.)
router.put('/content', (req: AuthenticatedRequest, res: Response) => {
  const settings = db.get('settings');
  const updatedContent = {
    ...settings.landingContent,
    ...req.body
  };
  const updatedSettings = {
    ...settings,
    landingContent: updatedContent
  };
  db.set('settings', updatedSettings);
  return res.json({ message: 'Landing page content updated successfully.', landingContent: updatedContent });
});

// 14. Get Classes & Fee Structure for Owner
router.get('/classes', (_req: AuthenticatedRequest, res: Response) => {
  const classes = db.get('classes');
  return res.json({ classes });
});

// 15. Update Class Fee Structure & Details
router.put('/classes/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, code, monthlyFee, description, subjects } = req.body;
  const classes = db.get('classes');
  const index = classes.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Class not found' });
  }

  classes[index] = {
    ...classes[index],
    name: name !== undefined ? name.trim() : classes[index].name,
    code: code !== undefined ? code.trim() : classes[index].code,
    monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : classes[index].monthlyFee,
    description: description !== undefined ? description.trim() : classes[index].description,
    subjects: Array.isArray(subjects) ? subjects : classes[index].subjects
  };

  db.set('classes', classes);
  return res.json({ message: 'Class fee & details updated successfully', class: classes[index] });
});

// 16. Create New Class with Fee
router.post('/classes', (req: AuthenticatedRequest, res: Response) => {
  const { name, code, monthlyFee, description, subjects } = req.body;
  if (!name || monthlyFee === undefined) {
    return res.status(400).json({ error: 'Class name and monthly fee are required.' });
  }

  const classes = db.get('classes');
  const newClass = {
    id: `cls_${Date.now()}`,
    name: name.trim(),
    code: code?.trim() || name.toUpperCase(),
    monthlyFee: Number(monthlyFee),
    description: description?.trim() || '',
    subjects: Array.isArray(subjects) ? subjects : ['General']
  };

  db.set('classes', [...classes, newClass]);
  return res.status(201).json({ message: 'New class fee program added successfully', class: newClass });
});

// 17. Delete Class
router.delete('/classes/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const classes = db.get('classes');
  const filtered = classes.filter(c => c.id !== id);
  db.set('classes', filtered);
  return res.json({ message: 'Class program removed successfully' });
});

export default router;
