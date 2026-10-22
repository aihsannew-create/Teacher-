import { Router, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireTeacher, AuthenticatedRequest } from '../auth';
import { AppNotification } from '../types';

const router = Router();

// Public Landing Page Content & Live Classes
router.get('/public-content', (_req, res: Response) => {
  const settings = db.get('settings');
  const classes = db.get('classes');
  return res.json({
    landingContent: settings.landingContent,
    classes
  });
});

// Public / Authenticated settings
router.get('/', (req, res: Response) => {
  const settings = db.get('settings');
  // Don't expose secret key to frontend
  const sanitized = {
    ...settings,
    razorpayKeySecret: settings.razorpayKeySecret ? '••••••••' : undefined
  };
  return res.json({ settings: sanitized });
});

// Teacher updates settings
router.put('/', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const settings = db.get('settings');
  const updated = {
    ...settings,
    ...req.body
  };

  db.set('settings', updated);
  return res.json({ message: 'Tuition platform settings updated successfully', settings: updated });
});

// Notifications for current user
router.get('/notifications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const notifs = db.get('notifications');

  let userNotifs = [];
  if (user.role === 'teacher') {
    userNotifs = notifs.filter(n => n.recipientId === 'teacher' || n.recipientId === 'all');
  } else {
    const student = user.studentProfile;
    userNotifs = notifs.filter(
      n => n.recipientId === 'all' ||
           (student && (n.recipientId === student.id || n.recipientId === `class:${student.classId}`))
    );
  }

  return res.json({ notifications: userNotifs });
});

// Mark notification as read
router.put('/notifications/:id/read', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const notifs = db.get('notifications');
  const index = notifs.findIndex(n => n.id === id);
  if (index !== -1) {
    notifs[index].read = true;
    db.set('notifications', notifs);
  }
  return res.json({ success: true });
});

// Teacher broadcasts notification
router.post('/notifications/broadcast', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { title, message, target } = req.body; // target: 'all' | 'class:<id>'
  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required.' });
  }

  const notifs = db.get('notifications');
  const newNotif: AppNotification = {
    id: `notif_${Date.now()}`,
    recipientId: target || 'all',
    title: title.trim(),
    message: message.trim(),
    type: 'announcement',
    read: false,
    createdAt: new Date().toISOString()
  };

  db.set('notifications', [newNotif, ...notifs]);
  return res.status(201).json({ message: 'Announcement sent successfully', notification: newNotif });
});

// Audit Logs (Teacher only)
router.get('/audit-logs', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const auditLogs = db.get('auditLogs');
  return res.json({ auditLogs });
});

export default router;
