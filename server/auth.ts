import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { User, StudentProfile, Membership } from './types';

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
    const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    if (signature !== expectedSig) return null;
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
  } catch (err) {
    return null;
  }
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

  let studentProfile: StudentProfile | undefined;
  let membership: Membership | undefined;

  if (user.role === 'student') {
    const students = db.get('students');
    studentProfile = students.find(s => s.userId === user.id);
    if (studentProfile) {
      const memberships = db.get('memberships');
      membership = memberships.find(m => m.studentId === studentProfile!.id);
    }
  }

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
