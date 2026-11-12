import seedData from '../data/tuition_store.json';
import { defaultAllUiTexts } from './utils/uiTextDefaults';

const STORAGE_KEY = 'prerna_tuition_full_store_v2';

function getStore(): any {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.students)) {
        return parsed;
      }
    }
  } catch {
    // fallback to seedData
  }
  const initial = JSON.parse(JSON.stringify(seedData));
  saveStore(initial);
  return initial;
}

function saveStore(store: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function addOneCalendarMonth(fromDate: Date): Date {
  const d = new Date(fromDate.getTime());
  const targetMonth = d.getMonth() + 1;
  d.setMonth(targetMonth);
  if (d.getMonth() !== targetMonth % 12) {
    d.setDate(0);
  }
  return d;
}

function createClientToken(payload: { userId: string; role: string }): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.local_sig`;
}

function parseClientToken(authHeader?: string | null): { userId: string; role: string } | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function syncStudentSession(store: any, user: any) {
  if (!user || user.role !== 'student') {
    return { studentProfile: undefined, membership: undefined };
  }
  const students = store.students || [];
  const student = students.find((s: any) => s.userId === user.id);
  if (!student) return { studentProfile: undefined, membership: undefined };

  const classes = store.classes || [];
  const cls = classes.find((c: any) => c.id === student.classId);
  if (cls) {
    student.className = cls.name;
    student.batchName = cls.batchName || 'Regular Batch';
    student.monthlyFee = cls.monthlyFee;
  }

  const memberships = store.memberships || [];
  const membership = memberships.find((m: any) => m.studentId === student.id);
  const now = Date.now();
  let isActive = false;
  let daysRemaining = 0;

  if (membership && membership.expiryDate) {
    const expTime = new Date(membership.expiryDate).getTime();
    if (expTime > now && membership.status === 'active') {
      isActive = true;
      daysRemaining = Math.max(0, Math.ceil((expTime - now) / (1000 * 60 * 60 * 24)));
    } else if (expTime <= now && membership.status === 'active') {
      membership.status = 'expired';
      if (student.status === 'active') {
        student.status = 'expired';
      }
      saveStore(store);
    }
  }

  const enrichedMembership = membership
    ? { ...membership, isActive, daysRemaining }
    : undefined;

  return { studentProfile: student, membership: enrichedMembership };
}

function makeHttpError(status: number, data: any) {
  const errorMsg = data?.error || data?.message || `HTTP ${status}`;
  const err: any = new Error(errorMsg);
  err.status = status;
  err.data = data;
  if (data?.code) err.code = data.code;
  if (data?.studentName) err.studentName = data.studentName;
  if (data?.rollNumber) err.rollNumber = data.rollNumber;
  return err;
}

export async function handleLocalApiFallback(endpoint: string, options: RequestInit = {}): Promise<any> {
  const store = getStore();
  const method = (options.method || 'GET').toUpperCase();
  const urlObj = new URL(endpoint.startsWith('http') ? endpoint : `http://localhost${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
  const pathname = urlObj.pathname;
  const searchParams = urlObj.searchParams;

  const headers = new Headers(options.headers || {});
  const authHeader = headers.get('Authorization');
  const tokenPayload = parseClientToken(authHeader);
  const currentUser = tokenPayload ? (store.users || []).find((u: any) => u.id === tokenPayload.userId) : null;

  let body: any = {};
  if (typeof options.body === 'string' && options.body.trim()) {
    try {
      body = JSON.parse(options.body);
    } catch {
      body = {};
    }
  }

  // Enrich currentUser if student
  if (currentUser && currentUser.role === 'student') {
    const { studentProfile, membership } = syncStudentSession(store, currentUser);
    currentUser.studentProfile = studentProfile;
    currentUser.membership = membership;
  }

  // ==================== AUTH ROUTES ====================
  if (pathname === '/api/auth/lockout-status' && method === 'GET') {
    return { isLocked: false, remainingSeconds: 0, failedAttempts: 0 };
  }

  if (pathname === '/api/auth/login' && method === 'POST') {
    const rawIdentifier = (body.emailOrPhone || body.username || body.studentId || body.rollNumber || '').toString();
    const password = (body.password || '').toString();
    if (!rawIdentifier.trim() || !password) {
      throw makeHttpError(400, { error: 'Please provide Student ID/email/phone and password.' });
    }

    const clean = rawIdentifier.trim().toLowerCase();
    const ownerAliases = ['aihsan', 'aihsan ansari', 'admin', 'owner', 'owner@xolara.com', 'admin@xolara.com', 'admin@prerna.edu', 'hasmuddinstl1981@gmail.com', '9905847357'];
    const teacherAliases = ['teacher', 'teacher@prerna.edu', 'er. rajesh sharma', 'rajesh', '9876543210'];

    const users = store.users || [];
    let user = users.find(
      (u: any) =>
        u.email?.toLowerCase() === clean ||
        u.phone?.trim() === clean ||
        (u.name && u.name.toLowerCase() === clean) ||
        (ownerAliases.includes(clean) && u.role === 'owner') ||
        (teacherAliases.includes(clean) && u.role === 'teacher')
    );

    if (!user) {
      const matchedStudent = (store.students || []).find(
        (s: any) => s.rollNumber && s.rollNumber.trim().toLowerCase() === clean
      );
      if (matchedStudent) {
        user = users.find((u: any) => u.id === matchedStudent.userId);
      }
    }

    if (!user && ownerAliases.includes(clean)) {
      user = users.find((u: any) => u.role === 'owner');
    }

    if (!user && teacherAliases.includes(clean)) {
      user = users.find((u: any) => u.role === 'teacher');
    }

    const isOwnerAuth =
      (user?.role === 'owner' || ownerAliases.includes(clean)) &&
      ['990584', 'admin123', 'owner123', 'admin', user?.passwordHash].includes(password);
    const isTeacherAuth =
      user?.role === 'teacher' &&
      ['admin123', 'teacher123', '990584', user?.passwordHash].includes(password);

    if (!user || (!isOwnerAuth && !isTeacherAuth && user.passwordHash !== password)) {
      throw makeHttpError(401, {
        error: 'Invalid credentials. Please verify your username/Student ID and password.',
        code: 'INVALID_CREDENTIALS',
        attemptsLeft: 4
      });
    }

    if (user.role === 'teacher' && user.loginAccessGranted === false) {
      throw makeHttpError(403, {
        error: 'Teacher account access is suspended by the Institute Owner.'
      });
    }

    if (user.role === 'student') {
      const profile = (store.students || []).find((s: any) => s.userId === user.id);
      if (profile && (profile.loginAccessGranted === false || user.loginAccessGranted === false)) {
        throw makeHttpError(403, {
          error: 'Login access has not been granted by the Institute Owner yet.',
          code: 'owner_approval_required',
          studentName: profile.name,
          rollNumber: profile.rollNumber
        });
      }
    }

    const { studentProfile, membership } = syncStudentSession(store, user);
    const token = createClientToken({ userId: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      studentProfile,
      membership
    };
  }

  if (pathname === '/api/auth/demo-login' && method === 'POST') {
    const { role, studentKey, bypassOwnerCheck } = body;
    const users = store.users || [];
    let targetUser: any;
    if (role === 'owner') targetUser = users.find((u: any) => u.role === 'owner');
    else if (role === 'teacher') targetUser = users.find((u: any) => u.role === 'teacher');
    else if (studentKey === 'aarav') targetUser = users.find((u: any) => u.email === 'aarav@student.com');
    else if (studentKey === 'priya') targetUser = users.find((u: any) => u.email === 'priya@student.com');
    else if (studentKey === 'rohan') targetUser = users.find((u: any) => u.email === 'rohan@student.com');
    else if (studentKey === 'ananya') targetUser = users.find((u: any) => u.email === 'ananya@student.com');
    else targetUser = users.find((u: any) => u.role === 'student');

    if (!targetUser) throw makeHttpError(404, { error: 'Demo user not found' });

    if (targetUser.role === 'student') {
      const profile = (store.students || []).find((s: any) => s.userId === targetUser.id);
      if (profile && (profile.loginAccessGranted === false || targetUser.loginAccessGranted === false) && !bypassOwnerCheck) {
        throw makeHttpError(403, {
          error: 'Login access has not been granted by the Institute Owner yet.',
          code: 'owner_approval_required',
          studentName: profile.name,
          rollNumber: profile.rollNumber
        });
      }
    }

    const { studentProfile, membership } = syncStudentSession(store, targetUser);
    const token = createClientToken({ userId: targetUser.id, role: targetUser.role });
    return {
      token,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        phone: targetUser.phone,
        role: targetUser.role
      },
      studentProfile,
      membership
    };
  }

  if (pathname === '/api/auth/me' && method === 'GET') {
    if (!currentUser) return { user: null, studentProfile: null, membership: null };
    const { studentProfile, membership } = syncStudentSession(store, currentUser);
    return {
      user: {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        phone: currentUser.phone,
        role: currentUser.role
      },
      studentProfile,
      membership
    };
  }

  if (pathname === '/api/auth/register' && method === 'POST') {
    const { name, email, phone, password, classId, batchId, guardianName, guardianPhone, guardianRelation } = body;
    const userId = `usr_${Date.now()}`;
    const studentId = `stu_${Date.now()}`;
    const rollNumber = `PTA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id: userId,
      email: (email || '').trim().toLowerCase(),
      name: (name || '').trim(),
      phone: phone?.trim() || '',
      role: 'student',
      passwordHash: password,
      loginAccessGranted: false,
      createdAt: new Date().toISOString()
    };
    const newProfile = {
      id: studentId,
      userId,
      name: (name || '').trim(),
      email: (email || '').trim().toLowerCase(),
      phone: phone?.trim() || '',
      rollNumber,
      classId: classId || 'cls_10',
      batchId: batchId || 'all',
      guardianName: guardianName || 'Parent',
      guardianPhone: guardianPhone || '',
      guardianRelation: guardianRelation || 'Parent',
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
      loginAccessGranted: false
    };
    const newMembership = {
      id: `mem_${Date.now()}`,
      studentId,
      startDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date().toISOString().split('T')[0],
      status: 'expired',
      autoRenew: false,
      gracePeriodDays: 3
    };
    store.users.push(newUser);
    store.students.push(newProfile);
    store.memberships.push(newMembership);
    saveStore(store);
    const token = createClientToken({ userId: newUser.id, role: newUser.role });
    return {
      message: 'Registration successful!',
      token,
      user: newUser,
      studentProfile: newProfile,
      membership: newMembership
    };
  }

  if (pathname === '/api/auth/reset-password' && method === 'POST') {
    const { email, phone, newPassword } = body;
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/\D/g, '');
    const uIdx = (store.users || []).findIndex(
      (u: any) =>
        u.email?.toLowerCase() === cleanEmail &&
        (u.phone || '').replace(/\D/g, '').endsWith(cleanPhone.slice(-10))
    );
    if (uIdx === -1) {
      throw makeHttpError(404, { error: 'No matching account found with that email and phone.' });
    }
    store.users[uIdx].passwordHash = newPassword;
    saveStore(store);
    return { message: 'Password reset successful! You can now log in.' };
  }

  // ==================== SETTINGS & PUBLIC CONTENT ====================
  if (pathname === '/api/settings/public-content' && method === 'GET') {
    return {
      landingContent: store.settings?.landingContent || {},
      allUiTexts: { ...defaultAllUiTexts, ...(store.settings?.allUiTexts || {}) },
      classes: store.classes || [],
      batches: store.batches || []
    };
  }

  if (pathname === '/api/settings/ui-texts' && method === 'GET') {
    return {
      uiTexts: { ...defaultAllUiTexts, ...(store.settings?.allUiTexts || {}) }
    };
  }

  if (pathname === '/api/settings/notifications' && method === 'GET') {
    const role = currentUser?.role || 'student';
    const studentId = currentUser?.studentProfile?.id;
    const list = (store.notifications || []).filter(
      (n: any) =>
        n.recipientId === 'all' ||
        (role === 'owner' && (n.recipientId === 'owner' || n.recipientId === 'teacher')) ||
        (role === 'teacher' && (n.recipientId === 'teacher' || n.recipientId === 'owner')) ||
        (studentId && n.recipientId === studentId)
    );
    return { notifications: list };
  }

  if (pathname.startsWith('/api/settings/notifications/') && pathname.endsWith('/read') && method === 'PUT') {
    const notifId = pathname.split('/')[4];
    store.notifications = (store.notifications || []).map((n: any) =>
      n.id === notifId ? { ...n, read: true } : n
    );
    saveStore(store);
    return { success: true };
  }

  if (pathname === '/api/settings' && method === 'GET') {
    return { settings: store.settings };
  }

  if (pathname === '/api/settings' && method === 'PUT') {
    store.settings = { ...store.settings, ...body };
    saveStore(store);
    return { message: 'Settings updated', settings: store.settings };
  }

  if (pathname === '/api/settings/audit-logs' && method === 'GET') {
    return { logs: store.auditLogs || [] };
  }

  // ==================== CLASSES ====================
  if (pathname === '/api/classes' && method === 'GET') {
    const classes = (store.classes || []).map((c: any) => ({
      ...c,
      batches: (store.batches || []).filter((b: any) => b.classId === c.id),
      studentCount: (store.students || []).filter((s: any) => s.classId === c.id).length
    }));
    return { classes, batches: store.batches || [] };
  }

  if (pathname === '/api/classes' && method === 'POST') {
    const newCls = {
      id: `cls_${Date.now()}`,
      name: body.name,
      code: body.code || 'CLS',
      subjects: body.subjects || ['Mathematics'],
      monthlyFee: Number(body.monthlyFee) || 2500,
      description: body.description || ''
    };
    store.classes.push(newCls);
    saveStore(store);
    return { classLevel: newCls };
  }

  if (pathname === '/api/classes/batch' && method === 'POST') {
    const newBatch = {
      id: `bat_${Date.now()}`,
      classId: body.classId,
      name: body.name,
      timing: body.timing || '4:00 PM - 5:30 PM',
      days: body.days || ['Daily'],
      maxCapacity: Number(body.maxCapacity) || 25
    };
    store.batches.push(newBatch);
    saveStore(store);
    return { batch: newBatch };
  }

  // ==================== OWNER ROUTES ====================
  if (pathname === '/api/owner/summary' && method === 'GET') {
    const teachers = (store.users || []).filter((u: any) => u.role === 'teacher');
    const students = store.students || [];
    return {
      totalTeachers: teachers.length,
      activeTeachers: teachers.filter((t: any) => t.loginAccessGranted !== false).length,
      totalStudents: students.length,
      pendingStudentsCount: students.filter((s: any) => s.loginAccessGranted === false).length,
      approvedStudentsCount: students.filter((s: any) => s.loginAccessGranted !== false).length
    };
  }

  if (pathname === '/api/owner/teachers' && method === 'GET') {
    const teachers = (store.users || [])
      .filter((u: any) => u.role === 'teacher')
      .map((t: any) => ({
        id: t.id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        teacherTitle: t.teacherTitle || 'Faculty Member',
        assignedSubjects: t.assignedSubjects || ['Mathematics', 'Science'],
        loginAccessGranted: t.loginAccessGranted !== false,
        passwordPreview: t.passwordHash,
        createdAt: t.createdAt
      }));
    return { teachers };
  }

  if (pathname === '/api/owner/teachers' && method === 'POST') {
    const newTeacher = {
      id: `usr_teacher_${Date.now()}`,
      name: body.name,
      email: body.email,
      phone: body.phone || '',
      role: 'teacher',
      passwordHash: body.password || 'teacher123',
      teacherTitle: body.teacherTitle || 'Faculty Member',
      assignedSubjects: body.assignedSubjects || ['Mathematics'],
      loginAccessGranted: true,
      createdAt: new Date().toISOString()
    };
    store.users.push(newTeacher);
    saveStore(store);
    return { message: 'Teacher created successfully!', teacher: newTeacher };
  }

  if (pathname.startsWith('/api/owner/teachers/') && pathname.endsWith('/toggle-access') && method === 'PUT') {
    const teacherId = pathname.split('/')[4];
    const idx = store.users.findIndex((u: any) => u.id === teacherId);
    if (idx !== -1) {
      store.users[idx].loginAccessGranted = !(store.users[idx].loginAccessGranted !== false);
      saveStore(store);
    }
    return { message: 'Teacher login access updated.' };
  }

  if (pathname.startsWith('/api/owner/teachers/') && pathname.endsWith('/credentials') && method === 'PUT') {
    const teacherId = pathname.split('/')[4];
    const idx = store.users.findIndex((u: any) => u.id === teacherId);
    if (idx !== -1) {
      store.users[idx] = {
        ...store.users[idx],
        name: body.name ?? store.users[idx].name,
        email: body.email ?? store.users[idx].email,
        phone: body.phone ?? store.users[idx].phone,
        teacherTitle: body.teacherTitle ?? store.users[idx].teacherTitle,
        passwordHash: body.password ?? store.users[idx].passwordHash,
        assignedSubjects: body.assignedSubjects ?? store.users[idx].assignedSubjects
      };
      saveStore(store);
    }
    return { message: 'Teacher credentials updated.' };
  }

  if (pathname.startsWith('/api/owner/teachers/') && method === 'DELETE') {
    const teacherId = pathname.split('/')[4];
    store.users = store.users.filter((u: any) => u.id !== teacherId);
    saveStore(store);
    return { message: 'Teacher deleted.' };
  }

  if (pathname === '/api/owner/students' && method === 'GET') {
    const now = Date.now();
    const list = (store.students || []).map((s: any) => {
      const user = (store.users || []).find((u: any) => u.id === s.userId);
      const cls = (store.classes || []).find((c: any) => c.id === s.classId);
      const batch = (store.batches || []).find((b: any) => b.id === s.batchId);
      const mem = (store.memberships || []).find((m: any) => m.studentId === s.id);
      const isSubActive = Boolean(mem && mem.status === 'active' && new Date(mem.expiryDate).getTime() > now);
      return {
        id: s.id,
        name: s.name,
        email: s.email,
        phone: s.phone,
        rollNumber: s.rollNumber,
        classId: s.classId,
        className: cls?.name || 'Class 10',
        batchName: batch?.name || 'Regular Batch',
        userEmail: user?.email || s.email,
        passwordPreview: user?.passwordHash || 'student123',
        loginAccessGranted: s.loginAccessGranted !== false && user?.loginAccessGranted !== false,
        membershipStatus: isSubActive ? 'active' : 'expired',
        subscriptionStatus: isSubActive ? 'active' : 'expired',
        membershipStartDate: mem?.startDate || null,
        membershipExpiryDate: mem?.expiryDate || null,
        approvedByOwnerAt: s.approvedByOwnerAt
      };
    });
    return { students: list };
  }

  if (pathname === '/api/owner/students' && method === 'POST') {
    const now = new Date();
    const nowIso = now.toISOString();
    const userId = `usr_stu_${Date.now()}`;
    const studentId = `stu_${Date.now()}`;
    const rollNumber = body.rollNumber?.trim() || `PTA-${Math.floor(1000 + Math.random() * 9000)}`;
    const isSubActive = body.initialSubscriptionStatus === 'active';
    const expiryDate = isSubActive ? addOneCalendarMonth(now).toISOString() : nowIso;

    const newUser = {
      id: userId,
      email: (body.email || '').trim().toLowerCase(),
      name: (body.name || '').trim(),
      phone: body.phone || '',
      role: 'student',
      passwordHash: body.password || 'student123',
      loginAccessGranted: true,
      createdAt: nowIso
    };
    const newStudent = {
      id: studentId,
      userId,
      name: (body.name || '').trim(),
      email: (body.email || '').trim().toLowerCase(),
      phone: body.phone || '',
      rollNumber,
      classId: body.classId || 'cls_10',
      batchId: 'all',
      guardianName: body.guardianName || 'Parent',
      guardianPhone: body.guardianPhone || '',
      guardianRelation: 'Parent',
      enrollmentDate: nowIso.split('T')[0],
      status: isSubActive ? 'active' : 'expired',
      loginAccessGranted: true,
      approvedByOwnerAt: nowIso
    };
    const newMembership = {
      id: `mem_${Date.now()}`,
      studentId,
      startDate: nowIso,
      expiryDate,
      status: isSubActive ? 'active' : 'expired',
      autoRenew: false,
      gracePeriodDays: 3
    };
    store.users.push(newUser);
    store.students.push(newStudent);
    store.memberships.push(newMembership);
    saveStore(store);
    return { message: 'Student account created & authorized!', student: newStudent };
  }

  if (pathname === '/api/owner/students/grant-all-pending' && method === 'POST') {
    store.students = store.students.map((s: any) => ({ ...s, loginAccessGranted: true }));
    store.users = store.users.map((u: any) => (u.role === 'student' ? { ...u, loginAccessGranted: true } : u));
    saveStore(store);
    return { message: 'Granted access to all pending students.' };
  }

  if (pathname.startsWith('/api/owner/students/') && pathname.endsWith('/toggle-access') && method === 'PUT') {
    const studentId = pathname.split('/')[4];
    const sIdx = store.students.findIndex((s: any) => s.id === studentId);
    if (sIdx !== -1) {
      const nextVal = !(store.students[sIdx].loginAccessGranted !== false);
      store.students[sIdx].loginAccessGranted = nextVal;
      const uIdx = store.users.findIndex((u: any) => u.id === store.students[sIdx].userId);
      if (uIdx !== -1) store.users[uIdx].loginAccessGranted = nextVal;
      saveStore(store);
    }
    return { message: 'Student login access updated.' };
  }

  if (pathname.startsWith('/api/owner/students/') && pathname.endsWith('/credentials') && method === 'PUT') {
    const studentId = pathname.split('/')[4];
    const sIdx = store.students.findIndex((s: any) => s.id === studentId);
    if (sIdx !== -1) {
      const st = store.students[sIdx];
      store.students[sIdx] = {
        ...st,
        name: body.name ?? st.name,
        email: body.email ?? st.email,
        phone: body.phone ?? st.phone,
        rollNumber: body.rollNumber ?? st.rollNumber,
        classId: body.classId ?? st.classId
      };
      const uIdx = store.users.findIndex((u: any) => u.id === st.userId);
      if (uIdx !== -1) {
        store.users[uIdx] = {
          ...store.users[uIdx],
          name: body.name ?? store.users[uIdx].name,
          email: body.email ?? store.users[uIdx].email,
          phone: body.phone ?? store.users[uIdx].phone,
          passwordHash: body.password ?? store.users[uIdx].passwordHash
        };
      }
      saveStore(store);
    }
    return { message: 'Student credentials updated.' };
  }

  if (pathname.startsWith('/api/owner/students/') && method === 'DELETE') {
    const studentId = pathname.split('/')[4];
    const target = store.students.find((s: any) => s.id === studentId);
    if (target) {
      store.students = store.students.filter((s: any) => s.id !== studentId);
      store.users = store.users.filter((u: any) => u.id !== target.userId);
      saveStore(store);
    }
    return { message: 'Student account deleted.' };
  }

  if (pathname === '/api/owner/classes' && method === 'GET') {
    return { classes: store.classes || [] };
  }

  if (pathname === '/api/owner/classes' && method === 'POST') {
    const newCls = {
      id: `cls_${Date.now()}`,
      name: body.name,
      code: body.code || 'CLS',
      monthlyFee: Number(body.monthlyFee) || 2500,
      description: body.description || '',
      subjects: body.subjects || ['Mathematics']
    };
    store.classes.push(newCls);
    saveStore(store);
    return { message: 'Class created.', classes: store.classes };
  }

  if (pathname.startsWith('/api/owner/classes/') && method === 'PUT') {
    const clsId = pathname.split('/')[4];
    store.classes = store.classes.map((c: any) => (c.id === clsId ? { ...c, ...body } : c));
    saveStore(store);
    return { message: 'Class updated.', classes: store.classes };
  }

  if (pathname.startsWith('/api/owner/classes/') && method === 'DELETE') {
    const clsId = pathname.split('/')[4];
    store.classes = store.classes.filter((c: any) => c.id !== clsId);
    saveStore(store);
    return { message: 'Class deleted.', classes: store.classes };
  }

  if (pathname === '/api/owner/content' && method === 'GET') {
    return {
      landingContent: store.settings?.landingContent || {},
      allUiTexts: { ...defaultAllUiTexts, ...(store.settings?.allUiTexts || {}) }
    };
  }

  if (pathname === '/api/owner/content' && method === 'PUT') {
    store.settings = {
      ...store.settings,
      landingContent: { ...(store.settings?.landingContent || {}), ...(body.landingContent || body) }
    };
    saveStore(store);
    return {
      message: 'Website content updated successfully!',
      landingContent: store.settings.landingContent
    };
  }

  if (pathname === '/api/owner/all-ui-texts' && method === 'PUT') {
    store.settings = {
      ...store.settings,
      allUiTexts: { ...(store.settings?.allUiTexts || {}), ...(body.uiTexts || body) }
    };
    saveStore(store);
    return { message: 'UI Texts saved!', uiTexts: store.settings.allUiTexts };
  }

  if (pathname === '/api/owner/all-ui-texts/reset' && method === 'POST') {
    store.settings = { ...store.settings, allUiTexts: { ...defaultAllUiTexts } };
    saveStore(store);
    return { message: 'UI Texts reset to defaults!', uiTexts: defaultAllUiTexts };
  }

  // ==================== PAYMENTS & MONTHLY FEE APPROVAL ====================
  if (pathname === '/api/payments/quick-info' && method === 'GET') {
    return {
      classes: store.classes || [],
      students: (store.students || []).map((s: any) => {
        const cls = (store.classes || []).find((c: any) => c.id === s.classId);
        return {
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          classId: s.classId,
          className: cls?.name || 'Class 10',
          monthlyFee: s.customFee || cls?.monthlyFee || 2500,
          phone: s.phone
        };
      }),
      upiDetails: store.settings?.upiDetails || {
        upiId: '9905847357@ybl',
        accountName: 'AIHSAN ANSARI'
      },
      upiId: '9905847357@ybl',
      merchantName: 'AIHSAN ANSARI'
    };
  }

  if (pathname === '/api/payments/my-status' && method === 'GET') {
    const student = currentUser?.studentProfile;
    if (!student) return { isExpired: true, pendingRequest: null };
    const mem = (store.memberships || []).find((m: any) => m.studentId === student.id);
    const now = Date.now();
    const expTime = mem?.expiryDate ? new Date(mem.expiryDate).getTime() : 0;
    const isExpired = !mem || mem.status !== 'active' || expTime <= now;
    const pendingRequest = (store.payments || []).find(
      (p: any) => p.studentId === student.id && p.status === 'pending'
    );
    const latestRejectedRequest = (store.payments || []).find(
      (p: any) => p.studentId === student.id && (p.status === 'rejected' || p.status === 'failed')
    );
    return {
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      status: isExpired ? 'expired' : 'active',
      isExpired,
      timeRemainingMs: isExpired ? 0 : Math.max(0, expTime - now),
      startDate: mem?.startDate || null,
      expiryDate: mem?.expiryDate || null,
      membership: mem || null,
      pendingRequest: pendingRequest || null,
      latestRejectedRequest: latestRejectedRequest || null
    };
  }

  if (pathname === '/api/payments/create-order' && method === 'POST') {
    const student =
      currentUser?.studentProfile ||
      (store.students || []).find((s: any) => s.id === body.studentId) ||
      (store.students || [])[0];
    const cls = (store.classes || []).find((c: any) => c.id === student?.classId);
    const feeAmount = student?.customFee || cls?.monthlyFee || 2500;
    return {
      orderId: `order_${Date.now()}`,
      amount: feeAmount,
      currency: 'INR',
      studentId: student?.id,
      studentName: student?.name,
      rollNumber: student?.rollNumber,
      className: cls?.name || 'Class 10',
      billingMonth: new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      keyId: 'rzp_test_PrernaTuition2026'
    };
  }

  if (pathname === '/api/payments/verify' && method === 'POST') {
    const student =
      currentUser?.studentProfile ||
      (store.students || []).find((s: any) => s.id === body.studentId) ||
      (store.students || [])[0];
    const approvalTime = new Date();
    const startIso = approvalTime.toISOString();
    const expiryIso = addOneCalendarMonth(approvalTime).toISOString();
    const receiptNumber = `RCP-${approvalTime.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const cls = (store.classes || []).find((c: any) => c.id === student?.classId);
    const feeAmount = student?.customFee || cls?.monthlyFee || 2500;

    const newPayment = {
      id: `pay_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      classId: student.classId,
      amount: feeAmount,
      periodStart: startIso,
      periodEnd: expiryIso,
      status: 'success',
      paymentMethod: 'razorpay',
      receiptNumber,
      createdAt: startIso
    };
    store.payments = [newPayment, ...(store.payments || [])];

    const mIdx = (store.memberships || []).findIndex((m: any) => m.studentId === student.id);
    if (mIdx !== -1) {
      store.memberships[mIdx] = {
        ...store.memberships[mIdx],
        startDate: startIso,
        expiryDate: expiryIso,
        status: 'active',
        lastPaymentDate: startIso.split('T')[0],
        lastPaymentAmount: feeAmount
      };
    }

    const newReceipt = {
      receiptNumber,
      paymentId: newPayment.id,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      className: cls?.name || 'Class 10',
      batchName: 'Regular Batch',
      billingMonth: approvalTime.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      amount: feeAmount,
      paymentMethod: 'razorpay',
      transactionId: body.razorpay_payment_id || newPayment.id,
      paidAt: startIso,
      receiptDate: startIso.split('T')[0]
    };
    store.receipts = [newReceipt, ...(store.receipts || [])];
    saveStore(store);

    return {
      message: 'Payment verified successfully! Membership activated.',
      payment: newPayment,
      receipt: newReceipt,
      newExpiryDate: expiryIso
    };
  }

  if (pathname === '/api/payments/record-offline' && method === 'POST') {
    const student = (store.students || []).find((s: any) => s.id === body.studentId);
    if (!student) throw makeHttpError(404, { error: 'Student not found.' });
    const now = new Date();
    const startIso = now.toISOString();
    const expiryIso = addOneCalendarMonth(now).toISOString();
    const receiptNumber = `RCP-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const feeAmount = Number(body.amount) || 2500;
    const cls = (store.classes || []).find((c: any) => c.id === student.classId);

    const newPayment = {
      id: `pay_off_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      classId: student.classId,
      amount: feeAmount,
      periodStart: startIso,
      periodEnd: expiryIso,
      status: 'success',
      paymentMethod: body.paymentMethod || 'cash',
      receiptNumber,
      teacherNotes: body.teacherNotes || 'Manual offline payment',
      createdAt: startIso
    };
    store.payments = [newPayment, ...(store.payments || [])];

    const mIdx = (store.memberships || []).findIndex((m: any) => m.studentId === student.id);
    if (mIdx !== -1) {
      store.memberships[mIdx] = {
        ...store.memberships[mIdx],
        startDate: startIso,
        expiryDate: expiryIso,
        status: 'active',
        lastPaymentDate: startIso,
        lastPaymentAmount: feeAmount
      };
    }

    const newReceipt = {
      receiptNumber,
      paymentId: newPayment.id,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      className: cls?.name || 'Class 10',
      batchName: 'Regular Batch',
      billingMonth: body.billingMonth || now.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      amount: feeAmount,
      paymentMethod: body.paymentMethod || 'cash',
      transactionId: body.transactionRef || `OFFLINE-${receiptNumber}`,
      paidAt: startIso,
      receiptDate: startIso.split('T')[0],
      teacherNotes: body.teacherNotes || 'Offline payment recorded'
    };
    store.receipts = [newReceipt, ...(store.receipts || [])];
    saveStore(store);

    return {
      message: 'Offline payment recorded and receipt generated successfully!',
      payment: newPayment,
      receipt: newReceipt,
      newExpiryDate: expiryIso
    };
  }

  if ((pathname.startsWith('/api/payments/receipt/') || pathname.startsWith('/api/payments/public-receipt/')) && method === 'GET') {
    const receiptNumber = decodeURIComponent(pathname.split('/')[4] || '');
    const receipt = (store.receipts || []).find(
      (r: any) => r.receiptNumber?.toUpperCase() === receiptNumber.toUpperCase()
    );
    if (!receipt) throw makeHttpError(404, { error: 'Receipt not found.' });
    return { receipt, settings: store.settings };
  }

  if ((pathname === '/api/payments/submit-proof' || pathname === '/api/payments/public-deposit') && method === 'POST') {
    const rawTxn = (body.transactionId || body.utrNumber || body.transactionRef || '').toString().trim();
    if (!rawTxn) {
      throw makeHttpError(400, { error: 'UPI Transaction ID / UTR number is required.' });
    }
    const student =
      currentUser?.studentProfile ||
      (store.students || []).find(
        (s: any) =>
          s.id === body.studentId ||
          (body.rollNumber && s.rollNumber.toLowerCase() === String(body.rollNumber).trim().toLowerCase()) ||
          (body.phone && s.phone.replace(/\D/g, '') === String(body.phone).replace(/\D/g, ''))
      );
    if (!student) {
      throw makeHttpError(404, { error: 'Student account not found.' });
    }
    const cls = (store.classes || []).find((c: any) => c.id === student.classId);
    const feeAmount = Number(body.amount) || student.customFee || cls?.monthlyFee || 2500;
    const nowIso = new Date().toISOString();
    const newPayment = {
      id: `pay_proof_${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      classId: student.classId,
      amount: feeAmount,
      periodStart: nowIso,
      periodEnd: '',
      status: 'pending',
      paymentMethod: body.paymentMethod || 'upi',
      utrNumber: rawTxn,
      screenshotUrl: body.screenshotUrl || '',
      teacherNotes: body.notes || body.remarks || `Submitted UTR: ${rawTxn}`,
      createdAt: nowIso
    };
    store.payments = [newPayment, ...(store.payments || [])];
    saveStore(store);
    return {
      success: true,
      pendingApproval: true,
      message: `Payment ID "${rawTxn}" with screenshot has been submitted to Admin. Your 1-calendar-month access will activate once the Admin approves.`,
      payment: newPayment
    };
  }

  if (pathname === '/api/payments/pending-requests' && method === 'GET') {
    const enrich = (p: any) => {
      const st = (store.students || []).find((s: any) => s.id === p.studentId);
      const cls = (store.classes || []).find((c: any) => c.id === (p.classId || st?.classId));
      const mem = (store.memberships || []).find((m: any) => m.studentId === p.studentId);
      return {
        ...p,
        studentName: st?.name || p.studentName,
        rollNumber: st?.rollNumber || p.rollNumber,
        studentEmail: st?.email || '',
        studentPhone: st?.phone || '',
        classId: p.classId || st?.classId || 'cls_10',
        className: cls?.name || 'Class 10',
        currentExpiryDate: mem?.expiryDate || null,
        currentStartDate: mem?.startDate || null,
        currentMembershipStatus: mem?.status || 'expired',
        membershipStatus: mem?.status || 'expired'
      };
    };
    const allRequests = (store.payments || []).map(enrich);
    const pendingRequests = allRequests.filter((p: any) => p.status === 'pending');
    return {
      totalPending: pendingRequests.length,
      pendingRequests,
      allRequests
    };
  }

  if (pathname.startsWith('/api/payments/approve-request/') && method === 'POST') {
    const paymentId = pathname.split('/')[4];
    const pIdx = (store.payments || []).findIndex((p: any) => p.id === paymentId);
    if (pIdx === -1) throw makeHttpError(404, { error: 'Payment request not found.' });
    const payment = store.payments[pIdx];
    const approvalTime = new Date();
    const startIso = approvalTime.toISOString();
    const expiryIso = addOneCalendarMonth(approvalTime).toISOString();
    const receiptNumber = `RCP-${approvalTime.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    store.payments[pIdx] = {
      ...payment,
      status: 'success',
      periodStart: startIso,
      periodEnd: expiryIso,
      receiptNumber,
      approvedAt: startIso
    };

    const mIdx = (store.memberships || []).findIndex((m: any) => m.studentId === payment.studentId);
    if (mIdx !== -1) {
      store.memberships[mIdx] = {
        ...store.memberships[mIdx],
        startDate: startIso,
        expiryDate: expiryIso,
        status: 'active',
        lastPaymentDate: startIso.split('T')[0],
        lastPaymentAmount: payment.amount
      };
    } else {
      store.memberships.push({
        id: `mem_${Date.now()}`,
        studentId: payment.studentId,
        startDate: startIso,
        expiryDate: expiryIso,
        status: 'active',
        lastPaymentDate: startIso.split('T')[0],
        lastPaymentAmount: payment.amount,
        autoRenew: false,
        gracePeriodDays: 3
      });
    }

    const sIdx = (store.students || []).findIndex((s: any) => s.id === payment.studentId);
    if (sIdx !== -1) {
      store.students[sIdx].status = 'active';
      store.students[sIdx].loginAccessGranted = true;
    }

    const cls = (store.classes || []).find((c: any) => c.id === payment.classId);
    const newReceipt = {
      id: `rcp_${Date.now()}`,
      receiptNumber,
      paymentId: payment.id,
      studentId: payment.studentId,
      studentName: payment.studentName,
      rollNumber: payment.rollNumber,
      className: cls?.name || 'Class 10',
      batchName: 'Regular Batch',
      billingMonth: approvalTime.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'upi',
      transactionId: payment.utrNumber || payment.id,
      paidAt: startIso,
      receiptDate: startIso.split('T')[0],
      teacherNotes: `Verified & Approved by Admin. Active for 1 calendar month.`
    };
    store.receipts = [newReceipt, ...(store.receipts || [])];
    saveStore(store);

    return {
      success: true,
      message: `Approved! ${payment.studentName}'s subscription is now active for 1 calendar month.`,
      startDate: startIso,
      expiryDate: expiryIso,
      newExpiryDate: expiryIso,
      payment: store.payments[pIdx],
      receipt: newReceipt
    };
  }

  if (pathname.startsWith('/api/payments/reject-request/') && method === 'POST') {
    const paymentId = pathname.split('/')[4];
    const pIdx = (store.payments || []).findIndex((p: any) => p.id === paymentId);
    if (pIdx === -1) throw makeHttpError(404, { error: 'Payment request not found.' });
    const reason = (body.reason || '').toString().trim() || 'Payment verification failed.';
    store.payments[pIdx] = {
      ...store.payments[pIdx],
      status: 'rejected',
      adminRemarks: reason,
      rejectedAt: new Date().toISOString()
    };
    saveStore(store);
    return {
      success: true,
      message: 'Payment verification request has been rejected.',
      payment: store.payments[pIdx]
    };
  }

  if (pathname === '/api/payments/history' && method === 'GET') {
    if (currentUser?.role === 'student') {
      const sid = currentUser?.studentProfile?.id;
      return {
        payments: (store.payments || []).filter((p: any) => p.studentId === sid),
        receipts: (store.receipts || []).filter((r: any) => r.studentId === sid)
      };
    }
    return { payments: store.payments || [], receipts: store.receipts || [] };
  }

  // ==================== HOMEWORK (CLASS-WISE) ====================
  if (pathname === '/api/homework' && method === 'GET') {
    const reqClassId = searchParams.get('classId');
    let list = [...(store.homework || [])];

    if (currentUser?.role === 'student') {
      const student = currentUser.studentProfile;
      const mem = currentUser.membership;
      if (!student || !mem || !mem.isActive) {
        const pendingReq = (store.payments || []).find(
          (p: any) => p.studentId === student?.id && p.status === 'pending'
        );
        throw makeHttpError(403, {
          error: 'membership_expired',
          locked: true,
          message: 'Your monthly subscription has expired. Please submit your monthly fee UTR and screenshot for Admin approval.',
          pendingRequest: pendingReq || null
        });
      }
      if (reqClassId && reqClassId !== 'all' && reqClassId !== student.classId) {
        throw makeHttpError(403, {
          error: 'class_access_denied',
          message: 'Access denied. You can only view homework for your assigned class.'
        });
      }
      list = list.filter((h: any) => !h.isDraft && h.classId === student.classId);
    } else if (reqClassId && reqClassId !== 'all') {
      list = list.filter((h: any) => h.classId === reqClassId);
    }

    const enriched = list.map((h: any) => {
      const cls = (store.classes || []).find((c: any) => c.id === h.classId);
      const subs = (store.submissions || []).filter((s: any) => s.homeworkId === h.id);
      const mySub =
        currentUser?.role === 'student'
          ? subs.find((s: any) => s.studentId === currentUser?.studentProfile?.id) || null
          : null;
      return {
        ...h,
        className: cls?.name || h.className || 'Class 10',
        submissionsCount: subs.length,
        completedCount: subs.filter((s: any) => s.status === 'completed').length,
        pendingReviewCount: subs.filter((s: any) => s.status === 'submitted').length,
        mySubmission: mySub,
        isSubmitted: Boolean(mySub)
      };
    });

    return { homework: enriched };
  }

  if (pathname.startsWith('/api/homework/') && pathname.split('/').length === 4 && method === 'GET') {
    const hwId = decodeURIComponent(pathname.split('/')[3]);
    const hw = (store.homework || []).find((h: any) => h.id === hwId);
    if (!hw) throw makeHttpError(404, { error: 'Homework not found.' });
    const subs = (store.submissions || []).filter((s: any) => s.homeworkId === hw.id);
    const studentsInClass = (store.students || []).filter((s: any) => s.classId === hw.classId);
    return {
      homework: hw,
      submissions: subs,
      studentsInClass
    };
  }

  if (pathname === '/api/homework' && method === 'POST') {
    const nowIso = new Date().toISOString();
    const cls = (store.classes || []).find((c: any) => c.id === body.classId);
    const newHw = {
      id: `hw_${Date.now()}`,
      classId: body.classId || 'cls_10',
      className: cls?.name || body.className || 'Class 10',
      batchIds: body.batchIds || ['all'],
      subject: body.subject || 'Mathematics',
      chapter: body.title || body.chapter || 'Homework Assignment',
      topic: body.topic || body.title || body.chapter || 'Daily Practice',
      teachingSummary: body.teachingSummary || body.description || body.instructions || 'Lecture summary and daily homework.',
      instructions: body.description || body.instructions || 'Complete the assigned questions in your fair notebook.',
      publishDate: body.publishDate || nowIso,
      deadlineDate: body.deadline || body.deadlineDate || new Date(Date.now() + 86400000).toISOString(),
      maxMarks: Number(body.maxMarks) || 20,
      priority: body.priority || 'normal',
      attachments: body.attachments || [],
      referenceLinks: body.referenceLinks || [],
      isDraft: Boolean(body.isDraft),
      createdAt: nowIso,
      updatedAt: nowIso
    };
    store.homework = [newHw, ...(store.homework || [])];
    saveStore(store);
    return { message: 'Homework published!', homework: newHw };
  }

  if (pathname.startsWith('/api/homework/') && pathname.endsWith('/duplicate') && method === 'POST') {
    const hwId = decodeURIComponent(pathname.split('/')[3]);
    const orig = (store.homework || []).find((h: any) => h.id === hwId);
    if (!orig) throw makeHttpError(404, { error: 'Homework not found.' });
    const nowIso = new Date().toISOString();
    const copy = {
      ...orig,
      id: `hw_${Date.now()}`,
      topic: `${orig.topic} (Copy)`,
      createdAt: nowIso,
      updatedAt: nowIso
    };
    store.homework = [copy, ...(store.homework || [])];
    saveStore(store);
    return { message: 'Homework duplicated!', homework: copy };
  }

  if (pathname.startsWith('/api/homework/submissions/') && pathname.endsWith('/grade') && method === 'PUT') {
    const subId = decodeURIComponent(pathname.split('/')[4]);
    const idx = (store.submissions || []).findIndex((s: any) => s.id === subId);
    if (idx !== -1) {
      store.submissions[idx] = {
        ...store.submissions[idx],
        status: body.status || 'completed',
        marksAwarded: body.marksAwarded,
        teacherFeedback: body.teacherFeedback
      };
      saveStore(store);
    }
    return { message: 'Submission graded!', submission: store.submissions[idx] };
  }

  if (pathname.startsWith('/api/homework/') && !pathname.endsWith('/submit') && method === 'PUT') {
    const hwId = decodeURIComponent(pathname.split('/')[3]);
    const idx = (store.homework || []).findIndex((h: any) => h.id === hwId);
    if (idx === -1) throw makeHttpError(404, { error: 'Homework not found.' });
    const existing = store.homework[idx];
    store.homework[idx] = {
      ...existing,
      ...body,
      chapter: body.title || body.chapter || existing.chapter,
      instructions: body.description || body.instructions || existing.instructions,
      deadlineDate: body.deadline || body.deadlineDate || existing.deadlineDate,
      updatedAt: new Date().toISOString()
    };
    saveStore(store);
    return { message: 'Homework updated!', homework: store.homework[idx] };
  }

  if (pathname.startsWith('/api/homework/') && method === 'DELETE') {
    const hwId = decodeURIComponent(pathname.split('/')[3]);
    store.homework = (store.homework || []).filter((h: any) => h.id !== hwId);
    saveStore(store);
    return { message: 'Homework deleted!' };
  }

  if (pathname.startsWith('/api/homework/') && pathname.endsWith('/submit') && method === 'POST') {
    const hwId = decodeURIComponent(pathname.split('/')[3]);
    const student = currentUser?.studentProfile;
    if (!student) throw makeHttpError(403, { error: 'Student profile required.' });
    const newSub = {
      id: `sub_${Date.now()}`,
      homeworkId: hwId,
      studentId: student.id,
      studentName: student.name,
      rollNumber: student.rollNumber,
      submissionDate: new Date().toISOString(),
      solutionText: body.solutionText || '',
      attachments: body.attachments || [],
      status: 'submitted'
    };
    store.submissions = [
      newSub,
      ...(store.submissions || []).filter((s: any) => !(s.homeworkId === hwId && s.studentId === student.id))
    ];
    saveStore(store);
    return { message: 'Homework solution submitted!', submission: newSub };
  }

  // ==================== STUDENTS, ATTENDANCE, REPORTS, INQUIRIES ====================
  if (pathname === '/api/students' && method === 'GET') {
    const list = (store.students || []).map((s: any) => {
      const cls = (store.classes || []).find((c: any) => c.id === s.classId);
      const batch = (store.batches || []).find((b: any) => b.id === s.batchId);
      const mem = (store.memberships || []).find((m: any) => m.studentId === s.id);
      return {
        ...s,
        className: cls?.name || 'Class 10',
        batchName: batch?.name || 'Regular Batch',
        membership: mem || null
      };
    });
    return { students: list };
  }

  if (pathname === '/api/students' && method === 'POST') {
    const nowIso = new Date().toISOString();
    const userId = `usr_${Date.now()}`;
    const studentId = `stu_${Date.now()}`;
    const rollNumber = body.rollNumber || `PTA-${Math.floor(1000 + Math.random() * 9000)}`;
    const newUser = {
      id: userId,
      email: (body.email || '').trim().toLowerCase(),
      name: (body.name || '').trim(),
      phone: body.phone || '',
      role: 'student',
      passwordHash: body.password || 'student123',
      loginAccessGranted: true,
      createdAt: nowIso
    };
    const newStudent = {
      id: studentId,
      userId,
      name: (body.name || '').trim(),
      email: (body.email || '').trim().toLowerCase(),
      phone: body.phone || '',
      rollNumber,
      classId: body.classId || 'cls_10',
      batchId: body.batchId || 'all',
      guardianName: body.guardianName || 'Parent',
      guardianPhone: body.guardianPhone || '',
      guardianRelation: body.guardianRelation || 'Parent',
      enrollmentDate: nowIso.split('T')[0],
      status: 'active',
      loginAccessGranted: true,
      customFee: body.customFee ? Number(body.customFee) : undefined
    };
    const newMem = {
      id: `mem_${Date.now()}`,
      studentId,
      startDate: nowIso,
      expiryDate: addOneCalendarMonth(new Date()).toISOString(),
      status: 'active',
      autoRenew: false,
      gracePeriodDays: 3
    };
    store.users.push(newUser);
    store.students.push(newStudent);
    store.memberships.push(newMem);
    saveStore(store);
    return { message: 'Student enrolled!', student: newStudent };
  }

  if (pathname.startsWith('/api/students/') && pathname.endsWith('/history') && method === 'GET') {
    const sid = pathname.split('/')[3];
    const student = (store.students || []).find((s: any) => s.id === sid);
    const payments = (store.payments || []).filter((p: any) => p.studentId === sid);
    const receipts = (store.receipts || []).filter((r: any) => r.studentId === sid);
    const attendance = (store.attendance || []).filter((a: any) => a.studentId === sid);
    const submissions = (store.submissions || []).filter((s: any) => s.studentId === sid);
    return { student, payments, receipts, attendance, submissions };
  }

  if (pathname.startsWith('/api/students/') && pathname.endsWith('/status') && method === 'PUT') {
    const sid = pathname.split('/')[3];
    const sIdx = (store.students || []).findIndex((s: any) => s.id === sid);
    if (sIdx !== -1) {
      store.students[sIdx].status = body.status || store.students[sIdx].status;
      saveStore(store);
    }
    return { message: 'Status updated!' };
  }

  if (pathname.startsWith('/api/students/') && method === 'PUT') {
    const sid = pathname.split('/')[3];
    const sIdx = (store.students || []).findIndex((s: any) => s.id === sid);
    if (sIdx !== -1) {
      store.students[sIdx] = { ...store.students[sIdx], ...body };
      saveStore(store);
    }
    return { message: 'Student updated!', student: store.students[sIdx] };
  }

  if (pathname.startsWith('/api/students/') && method === 'DELETE') {
    const sid = pathname.split('/')[3];
    store.students = (store.students || []).filter((s: any) => s.id !== sid);
    saveStore(store);
    return { message: 'Student removed!' };
  }

  if (pathname === '/api/attendance' && method === 'GET') {
    const records = store.attendance || [];
    return {
      attendance: records,
      records,
      summary: { totalClasses: 24, totalDays: 24, present: 22, presentDays: 22, absent: 2, absentDays: 2, late: 0, lateDays: 0, percentage: 92 }
    };
  }

  if (pathname === '/api/attendance/batch-record' && method === 'POST') {
    const { date, classId, batchId, entries = [] } = body;
    const nowIso = new Date().toISOString();
    const newRecords = entries.map((e: any) => ({
      id: `att_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      date,
      classId,
      batchId: batchId || 'all',
      studentId: e.studentId,
      status: e.status,
      remarks: e.remarks || '',
      recordedAt: nowIso
    }));
    store.attendance = [...(store.attendance || []), ...newRecords];
    saveStore(store);
    return { message: `Attendance recorded for ${newRecords.length} students.`, records: newRecords };
  }

  if (pathname === '/api/attendance/compliance' && method === 'GET') {
    const complianceList = (store.students || []).map((s: any) => ({
      studentId: s.id,
      name: s.name,
      rollNumber: s.rollNumber,
      phone: s.phone,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      classId: s.classId,
      batchId: s.batchId,
      totalAssignedHw: 5,
      submittedHwCount: 4,
      missingHwCount: 1,
      missingHwList: [],
      attendancePercentage: 92,
      absentDays: 1,
      lateDays: 0
    }));
    return { complianceList };
  }

  if (pathname === '/api/reports/dashboard' && method === 'GET') {
    const students = store.students || [];
    const payments = store.payments || [];
    const activeCount = students.filter((s: any) => s.status === 'active').length;
    return {
      metrics: {
        totalStudents: students.length,
        activeMemberships: activeCount,
        expiredMemberships: students.length - activeCount,
        monthlyRevenue: payments
          .filter((p: any) => p.status === 'success')
          .reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0),
        pendingHomeworkReviews: (store.submissions || []).filter((s: any) => s.status === 'submitted').length,
        avgAttendance: 92
      },
      recentPayments: payments.slice(0, 6),
      batchStats: (store.classes || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        enrolled: students.filter((s: any) => s.classId === c.id).length,
        capacity: 25
      }))
    };
  }

  if (pathname === '/api/inquiries' && method === 'GET') {
    return { inquiries: store.inquiries || [] };
  }

  if (pathname === '/api/inquiries' && method === 'POST') {
    const newInq = {
      id: `inq_${Date.now()}`,
      studentName: body.studentName,
      phone: body.phone,
      classInterested: body.classInterested,
      subjects: body.subjects,
      message: body.message,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    store.inquiries = [newInq, ...(store.inquiries || [])];
    saveStore(store);
    return { message: 'Inquiry submitted!', inquiry: newInq };
  }

  if (pathname.startsWith('/api/inquiries/') && pathname.endsWith('/status') && method === 'PUT') {
    const inqId = pathname.split('/')[3];
    store.inquiries = (store.inquiries || []).map((i: any) =>
      i.id === inqId ? { ...i, status: body.status } : i
    );
    saveStore(store);
    return { message: 'Inquiry status updated!' };
  }

  if (pathname.startsWith('/api/inquiries/') && method === 'DELETE') {
    const inqId = pathname.split('/')[3];
    store.inquiries = (store.inquiries || []).filter((i: any) => i.id !== inqId);
    saveStore(store);
    return { message: 'Inquiry deleted!' };
  }

  return {};
}
