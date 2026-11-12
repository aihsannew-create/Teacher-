import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, requireOwner, addOneCalendarMonth } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { User, StudentProfile, Membership, AllUiTexts, LandingContent } from '../types.ts';
import { defaultAllUiTexts } from '../uiTextDefaults.ts';

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

// 4. Owner Updates Teacher Data & Password / Credentials
router.put('/teachers/:id/credentials', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { password, name, email, phone, teacherTitle, assignedSubjects } = req.body;

  const users = db.get('users');
  const index = users.findIndex(u => u.id === id && u.role === 'teacher');
  if (index === -1) {
    return res.status(404).json({ error: 'Teacher not found.' });
  }

  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.id !== id && u.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'Another account with this email address already exists.' });
    }
    users[index].email = cleanEmail;
  }

  if (password) {
    users[index].passwordHash = password;
  }
  if (name && name.trim()) {
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
    message: `Teacher details and credentials for "${users[index].name}" updated successfully.`,
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

// 5b. Owner Permanently Deletes Teacher Account
router.delete('/teachers/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const users = db.get('users');
  const target = users.find(u => u.id === id && u.role === 'teacher');
  if (!target) {
    return res.status(404).json({ error: 'Teacher account not found.' });
  }

  const updatedUsers = users.filter(u => u.id !== id);
  db.set('users', updatedUsers);

  return res.json({
    message: `Teacher "${target.name}" (${target.email}) permanently deleted from system.`
  });
});

// 6. List Students With Owner Approval & Login Status
router.get('/students', (_req: AuthenticatedRequest, res: Response) => {
  const students = db.get('students');
  const users = db.get('users');
  const classes = db.get('classes');
  const batches = db.get('batches');
  const memberships = db.get('memberships');

  const now = Date.now();

  const enriched = students.map(student => {
    const user = users.find(u => u.id === student.userId);
    const cls = classes.find(c => c.id === student.classId);
    const bth = batches.find(b => b.id === student.batchId);
    const mem = memberships.find(m => m.studentId === student.id);

    const loginAccessGranted = student.loginAccessGranted !== false && user?.loginAccessGranted !== false;
    const isSubscriptionActive = !!(mem && mem.status === 'active' && mem.expiryDate && new Date(mem.expiryDate).getTime() > now);

    return {
      ...student,
      className: cls ? cls.name : 'Unknown Class',
      batchName: bth ? bth.name : 'Unassigned',
      userEmail: user ? user.email : student.email,
      userPhone: user ? user.phone : student.phone,
      passwordPreview: user ? user.passwordHash : 'student123',
      loginAccessGranted,
      membershipStatus: isSubscriptionActive ? 'active' : 'expired',
      subscriptionStatus: isSubscriptionActive ? 'active' : 'expired',
      membershipStartDate: mem ? mem.startDate : '',
      membershipExpiryDate: mem ? mem.expiryDate : ''
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
    rollNumber,
    classId,
    batchId,
    guardianName,
    guardianPhone,
    guardianRelation,
    customFee,
    initialSubscriptionStatus = 'expired'
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

  const studentsList = db.get('students');
  const cleanRoll = (rollNumber || `PTA-${Math.floor(1000 + Math.random() * 9000)}`).trim();
  const existingRoll = studentsList.find(s => s.rollNumber.toLowerCase() === cleanRoll.toLowerCase());
  if (existingRoll) {
    return res.status(409).json({ error: `Student ID / Roll Number "${cleanRoll}" is already assigned to another student.` });
  }

  const userId = `usr_stu_${Date.now()}`;
  const studentId = `stu_${Date.now()}`;
  const now = new Date();
  const nowIso = now.toISOString();

  const isInitiallyActive = initialSubscriptionStatus === 'active';
  const subStartDate = nowIso;
  const subExpiryDate = isInitiallyActive ? addOneCalendarMonth(now).toISOString() : nowIso;

  const newUser: User = {
    id: userId,
    email: cleanEmail,
    name: name.trim(),
    phone: phone?.trim() || '',
    role: 'student',
    passwordHash: password,
    loginAccessGranted: true, // Directly approved by Owner
    createdAt: nowIso
  };

  const newStudent: StudentProfile = {
    id: studentId,
    userId,
    name: name.trim(),
    email: cleanEmail,
    phone: phone?.trim() || '',
    rollNumber: cleanRoll,
    classId,
    batchId: batchId || 'all',
    guardianName: guardianName?.trim() || 'Parent',
    guardianPhone: guardianPhone?.trim() || '',
    guardianRelation: guardianRelation?.trim() || 'Parent',
    enrollmentDate: nowIso.split('T')[0],
    status: isInitiallyActive ? 'active' : 'pending_payment',
    loginAccessGranted: true,
    approvedByOwnerAt: nowIso,
    customFee: customFee ? Number(customFee) : undefined
  };

  const newMembership: Membership = {
    id: `mem_${Date.now()}`,
    studentId,
    startDate: subStartDate,
    expiryDate: subExpiryDate,
    status: isInitiallyActive ? 'active' : 'expired',
    autoRenew: false,
    gracePeriodDays: 3
  };

  db.set('users', [...users, newUser]);
  db.set('students', [...studentsList, newStudent]);
  db.set('memberships', [...db.get('memberships'), newMembership]);

  return res.status(201).json({
    message: `Student account created for ${name} with Student ID ${cleanRoll}.`,
    student: newStudent,
    credentials: {
      email: cleanEmail,
      password,
      rollNumber: cleanRoll
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

// 10. Owner Updates Student Data & Password Preview
router.put('/students/:id/credentials', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, password, rollNumber, classId } = req.body;

  const students = db.get('students');
  const index = students.findIndex(s => s.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const users = db.get('users');
  const userIndex = users.findIndex(u => u.id === students[index].userId || u.email.toLowerCase() === students[index].email.toLowerCase());

  // Check email conflict if email changed
  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    const existing = users.find(u => u.email.toLowerCase() === cleanEmail && u.id !== students[index].userId);
    if (existing) {
      return res.status(409).json({ error: 'Another account already uses this email ID.' });
    }
    students[index].email = cleanEmail;
    if (userIndex !== -1) {
      users[userIndex].email = cleanEmail;
    }
  }

  if (name && name.trim()) {
    students[index].name = name.trim();
    if (userIndex !== -1) {
      users[userIndex].name = name.trim();
    }
  }

  if (phone !== undefined) {
    students[index].phone = phone.trim();
    if (userIndex !== -1) {
      users[userIndex].phone = phone.trim();
    }
  }

  if (rollNumber && rollNumber.trim()) {
    students[index].rollNumber = rollNumber.trim();
  }

  if (classId) {
    students[index].classId = classId;
  }

  if (password && password.trim()) {
    if (userIndex !== -1) {
      users[userIndex].passwordHash = password.trim();
    } else {
      // Create user if didn't exist
      const newUserId = `usr_stu_${Date.now()}`;
      users.push({
        id: newUserId,
        email: students[index].email,
        name: students[index].name,
        phone: students[index].phone,
        role: 'student',
        passwordHash: password.trim(),
        loginAccessGranted: true,
        createdAt: new Date().toISOString()
      });
      students[index].userId = newUserId;
    }
  }

  db.set('students', students);
  db.set('users', users);

  return res.json({
    message: `Student details & password for "${students[index].name}" updated successfully.`,
    student: students[index]
  });
});

// 11. Owner Permanently Deletes Student Account & ID/Password
router.delete('/students/:id', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const students = db.get('students');
  const targetStudent = students.find(s => s.id === id);

  if (!targetStudent) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const users = db.get('users');
  const targetUser = users.find(u => u.id === targetStudent.userId || u.email.toLowerCase() === targetStudent.email.toLowerCase());

  // Filter out student and user
  const updatedStudents = students.filter(s => s.id !== id);
  const updatedUsers = users.filter(u => u.id !== targetStudent.userId && u.email.toLowerCase() !== targetStudent.email.toLowerCase());

  // Also remove memberships, submissions, attendance, receipts linked to this student
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
    message: `Student "${targetStudent.name}" (${targetStudent.rollNumber}) and all login credentials permanently deleted.`
  });
});

// 11b. Owner Clears / Deletes Login Credentials (ID & Password) Only
router.delete('/students/:id/credentials', (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const students = db.get('students');
  const targetStudent = students.find(s => s.id === id);

  if (!targetStudent) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const users = db.get('users');
  const updatedUsers = users.filter(u => u.id !== targetStudent.userId && u.email.toLowerCase() !== targetStudent.email.toLowerCase());

  targetStudent.loginAccessGranted = false;
  targetStudent.status = 'pending_approval';

  db.set('students', students);
  db.set('users', updatedUsers);

  return res.json({
    message: `Login ID & password credentials for "${targetStudent.name}" have been removed.`
  });
});

// 12. Get Landing Page Content for Owner Editor
router.get('/content', (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.get('settings');
  return res.json({ landingContent: settings.landingContent });
});

// 12a. Get All UI Texts (A to Z) for Owner Editor
router.get('/all-ui-texts', (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.get('settings');
  const uiTexts = {
    ...defaultAllUiTexts,
    ...(settings.uiTexts || {})
  };
  return res.json({ uiTexts });
});

// 12b. Update All UI Texts (A to Z)
router.put('/all-ui-texts', (req: AuthenticatedRequest, res: Response) => {
  const settings = db.get('settings');
  const existing = settings.uiTexts || defaultAllUiTexts;
  const updatedTexts: AllUiTexts = {
    ...existing,
    ...req.body
  };

  // Keep landingContent and settings in sync
  const updatedLandingContent: LandingContent = {
    heroTitle: updatedTexts.heroTitle || defaultAllUiTexts.heroTitle,
    heroTagline: updatedTexts.heroTagline || defaultAllUiTexts.heroTagline,
    contactPhone: updatedTexts.contactPhone || defaultAllUiTexts.contactPhone,
    stat1Value: updatedTexts.stat1Value || defaultAllUiTexts.stat1Value,
    stat1Label: updatedTexts.stat1Label || defaultAllUiTexts.stat1Label,
    stat2Value: updatedTexts.stat2Value || defaultAllUiTexts.stat2Value,
    stat2Label: updatedTexts.stat2Label || defaultAllUiTexts.stat2Label,
    stat3Value: updatedTexts.stat3Value || defaultAllUiTexts.stat3Value,
    stat3Label: updatedTexts.stat3Label || defaultAllUiTexts.stat3Label,
    journeyTitle: updatedTexts.journeyTitle || defaultAllUiTexts.journeyTitle,
    journeySubtitle: updatedTexts.journeySubtitle || defaultAllUiTexts.journeySubtitle,
    journeyPoints: updatedTexts.journeyPoints || defaultAllUiTexts.journeyPoints,
    hybridFeature1Title: updatedTexts.feature1Title || defaultAllUiTexts.feature1Title,
    hybridFeature1Desc: updatedTexts.feature1Desc || defaultAllUiTexts.feature1Desc,
    hybridFeature2Title: updatedTexts.feature2Title || defaultAllUiTexts.feature2Title,
    hybridFeature2Desc: updatedTexts.feature2Desc || defaultAllUiTexts.feature2Desc,
    hybridFeature3Title: updatedTexts.feature3Title || defaultAllUiTexts.feature3Title,
    hybridFeature3Desc: updatedTexts.feature3Desc || defaultAllUiTexts.feature3Desc
  };

  const updatedSettings = {
    ...settings,
    tuitionName: updatedTexts.brandName || settings.tuitionName,
    tagline: updatedTexts.brandTagline || settings.tagline,
    teacherName: updatedTexts.teacherName || settings.teacherName,
    teacherTitle: updatedTexts.teacherTitle || settings.teacherTitle,
    teacherBio: updatedTexts.teacherBio || settings.teacherBio,
    phone: updatedTexts.contactPhone || settings.phone,
    email: updatedTexts.contactEmail || settings.email,
    address: updatedTexts.contactAddress || settings.address,
    uiTexts: updatedTexts,
    landingContent: updatedLandingContent
  };

  db.set('settings', updatedSettings);
  return res.json({
    message: 'All UI texts updated successfully across the entire platform.',
    uiTexts: updatedTexts
  });
});

// 12c. Reset All UI Texts to Default
router.post('/all-ui-texts/reset', (_req: AuthenticatedRequest, res: Response) => {
  const settings = db.get('settings');
  const resetLandingContent: LandingContent = {
    heroTitle: defaultAllUiTexts.heroTitle,
    heroTagline: defaultAllUiTexts.heroTagline,
    contactPhone: defaultAllUiTexts.contactPhone,
    stat1Value: defaultAllUiTexts.stat1Value,
    stat1Label: defaultAllUiTexts.stat1Label,
    stat2Value: defaultAllUiTexts.stat2Value,
    stat2Label: defaultAllUiTexts.stat2Label,
    stat3Value: defaultAllUiTexts.stat3Value,
    stat3Label: defaultAllUiTexts.stat3Label,
    journeyTitle: defaultAllUiTexts.journeyTitle,
    journeySubtitle: defaultAllUiTexts.journeySubtitle,
    journeyPoints: defaultAllUiTexts.journeyPoints,
    hybridFeature1Title: defaultAllUiTexts.feature1Title,
    hybridFeature1Desc: defaultAllUiTexts.feature1Desc,
    hybridFeature2Title: defaultAllUiTexts.feature2Title,
    hybridFeature2Desc: defaultAllUiTexts.feature2Desc,
    hybridFeature3Title: defaultAllUiTexts.feature3Title,
    hybridFeature3Desc: defaultAllUiTexts.feature3Desc
  };
  const updatedSettings = {
    ...settings,
    tuitionName: defaultAllUiTexts.brandName,
    tagline: defaultAllUiTexts.brandTagline,
    teacherName: defaultAllUiTexts.teacherName,
    teacherTitle: defaultAllUiTexts.teacherTitle,
    teacherBio: defaultAllUiTexts.teacherBio,
    phone: defaultAllUiTexts.contactPhone,
    email: defaultAllUiTexts.contactEmail,
    address: defaultAllUiTexts.contactAddress,
    uiTexts: defaultAllUiTexts,
    landingContent: resetLandingContent
  };
  db.set('settings', updatedSettings);
  return res.json({
    message: 'All UI texts have been reset to factory defaults.',
    uiTexts: defaultAllUiTexts
  });
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
