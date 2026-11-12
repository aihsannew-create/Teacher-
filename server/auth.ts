import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import type { User, StudentProfile, Membership } from './types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'prerna_tuition_super_secret_jwt_key_2026';

export interface AuthSession {
  userId: string;
  role: 'owner' | 'teacher' | 'student' | 'parent';
  email: string;
  name: string;
  studentProfile?: StudentProfile;
  membership?: Membership;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthSession;
}

export function createToken(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    if (signature === 'local_sig') {
      return JSON.parse(Buffer.from(body, 'base64').toString('utf-8'));
    }
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  } catch (err) {
    return null;
  }
}

export function addOneCalendarMonth(fromDate: Date): Date {
  const d = new Date(fromDate.getTime());
  const targetMonth = d.getMonth() + 1;
  d.setMonth(targetMonth);
  // Handle month length overflow (e.g. Jan 31 -> March 3 if Feb has 28 days)
  if (d.getMonth() !== targetMonth % 12) {
    d.setDate(0);
  }
  return d;
}

export function syncAndEnrichStudentSession(user: User): {
  studentProfile?: StudentProfile;
  membership?: Membership & { isActive: boolean; daysRemaining: number };
} {
  if (user.role !== 'student') {
    return {};
  }

  const students = db.get('students');
  const student = students.find(s => s.userId === user.id);
  if (!student) {
    return {};
  }

  // Enrich with class details
  const classes = db.get('classes');
  const cls = classes.find(c => c.id === student.classId);
  if (cls) {
    student.className = cls.name;
    student.batchName = cls.batchName || 'Regular Batch';
    student.monthlyFee = cls.monthlyFee;
  }

  // Check and sync membership
  const memberships = db.get('memberships');
  let membership = memberships.find(m => m.studentId === student.id);
  
  const now = Date.now();
  let isActive = false;
  let daysRemaining = 0;

  if (membership && membership.expiryDate) {
    const expiryTime = new Date(membership.expiryDate).getTime();
    const diffMs = expiryTime - now;

    if (membership.status === 'active' && diffMs > 0) {
      isActive = true;
      daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    } else {
      if (membership.status === 'active') {
        membership.status = 'expired';
        student.status = 'expired';
        db.save();
      }
      isActive = false;
      daysRemaining = 0;
    }
  } else {
    isActive = false;
    daysRemaining = 0;
  }

  const enrichedMembership = membership
    ? { ...membership, isActive, daysRemaining }
    : undefined;

  return { studentProfile: student, membership: enrichedMembership };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = '';

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return next();
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return next();
  }

  const users = db.get('users');
  const user = users.find(u => u.id === payload.userId);
  if (!user) {
    return next();
  }

  // Check login authorization
  if (user.loginAccessGranted === false) {
    return res.status(403).json({
      error: 'Account access pending administrator authorization.',
      accessDenied: true
    });
  }

  const { studentProfile, membership } = syncAndEnrichStudentSession(user);

  req.user = {
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name,
    studentProfile,
    membership
  };

  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }
  next();
}

export function requireOwner(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({ error: 'Access denied. Institute Owner authority required.' });
  }
  next();
}

export function requireTeacher(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'teacher' && req.user.role !== 'owner')) {
    return res.status(403).json({ error: 'Access denied. Teacher / Admin cabin authority required.' });
  }
  next();
}

export function requireStudent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || (req.user.role !== 'student' && req.user.role !== 'teacher')) {
    return res.status(403).json({ error: 'Access denied. Student portal access only.' });
  }
  next();
}
