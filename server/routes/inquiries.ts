import { Router, Request, Response } from 'express';
import { db } from '../db';
import { requireAuth, requireTeacher, AuthenticatedRequest } from '../auth';
import { AdmissionInquiry, AppNotification, InquiryStatus } from '../types';

const router = Router();

// GET all admission inquiries
// Public users get masked phone numbers; logged-in teachers/owners get full details
router.get('/', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const isTeacherOrOwner = (req as AuthenticatedRequest).user?.role === 'teacher' || (req as AuthenticatedRequest).user?.role === 'owner';

  const rawInquiries = db.get('inquiries') || [];

  // Sort descending by date
  const sorted = [...rawInquiries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (isTeacherOrOwner) {
    return res.json({ inquiries: sorted });
  }

  // Mask phone for public view
  const sanitized = sorted.map(inq => {
    const rawPhone = inq.phone.replace(/\D/g, '');
    const masked = rawPhone.length >= 6
      ? `${rawPhone.substring(0, 4)}****${rawPhone.substring(rawPhone.length - 2)}`
      : '****';

    return {
      ...inq,
      phone: masked
    };
  });

  return res.json({ inquiries: sanitized });
});

// POST submit a new inquiry (Public endpoint)
router.post('/', (req: Request, res: Response) => {
  const { studentName, phone, classInterested, subjects, message } = req.body;

  if (!studentName?.trim() || !phone?.trim() || !classInterested?.trim()) {
    return res.status(400).json({ error: 'Student name, phone number, and class are required.' });
  }

  const cleanPhone = phone.trim().replace(/\s+/g, '');
  const cleanName = studentName.trim();
  const cleanClass = classInterested.trim();
  const cleanSubjects = (subjects || 'All Subjects').trim();
  const cleanMsg = (message || '').trim();

  const allInquiries = db.get('inquiries') || [];

  const newInquiry: AdmissionInquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    studentName: cleanName,
    phone: cleanPhone,
    classInterested: cleanClass,
    subjects: cleanSubjects,
    message: cleanMsg,
    status: 'new',
    createdAt: new Date().toISOString()
  };

  db.set('inquiries', [newInquiry, ...allInquiries]);

  // Notify teacher / owner
  const notifs = db.get('notifications') || [];
  const notif: AppNotification = {
    id: `notif_${Date.now()}`,
    recipientId: 'teacher',
    title: `New Admission Inquiry: ${cleanName}`,
    message: `${cleanName} inquired for ${cleanClass} (${cleanSubjects}). Phone: ${cleanPhone}. Message: "${cleanMsg || 'Interested in tuition batch.'}"`,
    type: 'announcement',
    read: false,
    createdAt: new Date().toISOString()
  };
  db.set('notifications', [notif, ...notifs]);

  return res.status(201).json({
    message: 'Inquiry submitted successfully! The tuition faculty will contact you shortly.',
    inquiry: newInquiry
  });
});

// PATCH update inquiry status (Teacher / Owner only)
router.patch('/:id/status', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: InquiryStatus };

  const validStatuses: InquiryStatus[] = ['new', 'contacted', 'demo_booked', 'enrolled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid inquiry status value.' });
  }

  const allInquiries = db.get('inquiries') || [];
  const index = allInquiries.findIndex(i => i.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Inquiry record not found.' });
  }

  allInquiries[index].status = status;
  db.set('inquiries', allInquiries);

  return res.json({ message: 'Inquiry status updated successfully', inquiry: allInquiries[index] });
});

// DELETE remove inquiry (Teacher / Owner only)
router.delete('/:id', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const allInquiries = db.get('inquiries') || [];
  const filtered = allInquiries.filter(i => i.id !== id);

  if (filtered.length === allInquiries.length) {
    return res.status(404).json({ error: 'Inquiry not found.' });
  }

  db.set('inquiries', filtered);
  return res.json({ success: true, message: 'Inquiry removed successfully.' });
});

export default router;
