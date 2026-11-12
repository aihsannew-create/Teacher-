import { Router } from 'express';
import type { Response } from 'express';
import { db } from '../db.ts';
import { requireAuth, requireTeacher } from '../auth.ts';
import type { AuthenticatedRequest } from '../auth.ts';
import type { ClassLevel, Batch } from '../types.ts';

const router = Router();

// Get all classes with batches and student counts
router.get('/', (req, res: Response) => {
  const classes = db.get('classes');
  const batches = db.get('batches');
  const students = db.get('students');

  const classesWithMeta = classes.map(cls => {
    const classBatches = batches.filter(b => b.classId === cls.id);
    const classStudents = students.filter(s => s.classId === cls.id);
    return {
      ...cls,
      batches: classBatches,
      studentCount: classStudents.length,
      activeStudents: classStudents.filter(s => s.status === 'active').length
    };
  });

  return res.json({ classes: classesWithMeta, batches });
});

// Teacher creates new class
router.post('/', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { name, code, subjects, monthlyFee, description } = req.body;
  if (!name || !monthlyFee) {
    return res.status(400).json({ error: 'Class name and monthly fee are required.' });
  }

  const classes = db.get('classes');
  const newClass: ClassLevel = {
    id: `cls_${Date.now()}`,
    name: name.trim(),
    code: code?.trim() || name.replace(/[^A-Za-z0-9]/g, '-').toUpperCase(),
    subjects: Array.isArray(subjects) ? subjects : ['General'],
    monthlyFee: Number(monthlyFee),
    description: description?.trim() || ''
  };

  db.set('classes', [...classes, newClass]);
  return res.status(201).json({ message: 'Class created successfully', class: newClass });
});

// Teacher updates class
router.put('/:id', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, code, subjects, monthlyFee, description } = req.body;

  const classes = db.get('classes');
  const index = classes.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Class not found' });
  }

  classes[index] = {
    ...classes[index],
    name: name !== undefined ? name.trim() : classes[index].name,
    code: code !== undefined ? code.trim() : classes[index].code,
    subjects: Array.isArray(subjects) ? subjects : classes[index].subjects,
    monthlyFee: monthlyFee !== undefined ? Number(monthlyFee) : classes[index].monthlyFee,
    description: description !== undefined ? description.trim() : classes[index].description
  };

  db.set('classes', classes);
  return res.json({ message: 'Class updated', class: classes[index] });
});

// Teacher adds batch
router.post('/batch', requireAuth, requireTeacher, (req: AuthenticatedRequest, res: Response) => {
  const { classId, name, timing, days, maxCapacity } = req.body;
  if (!classId || !name || !timing) {
    return res.status(400).json({ error: 'Class ID, batch name and timing are required.' });
  }

  const batches = db.get('batches');
  const newBatch: Batch = {
    id: `batch_${Date.now()}`,
    classId,
    name: name.trim(),
    timing: timing.trim(),
    days: Array.isArray(days) ? days : ['Daily'],
    maxCapacity: Number(maxCapacity) || 25
  };

  db.set('batches', [...batches, newBatch]);
  return res.status(201).json({ message: 'Batch added successfully', batch: newBatch });
});

export default router;
