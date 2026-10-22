import fs from 'fs';
import path from 'path';
import {
  User,
  StudentProfile,
  ClassLevel,
  Batch,
  Homework,
  HomeworkSubmission,
  AttendanceRecord,
  Membership,
  PaymentTransaction,
  PaymentReceipt,
  AppNotification,
  TeacherSettings,
  AuditLog
} from './types';

export interface DatabaseSchema {
  users: User[];
  students: StudentProfile[];
  classes: ClassLevel[];
  batches: Batch[];
  homework: Homework[];
  submissions: HomeworkSubmission[];
  attendance: AttendanceRecord[];
  memberships: Membership[];
  payments: PaymentTransaction[];
  receipts: PaymentReceipt[];
  notifications: AppNotification[];
  settings: TeacherSettings;
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'tuition_store.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial default settings
const defaultSettings: TeacherSettings = {
  tuitionName: 'Prerna Tuition Academy',
  tagline: 'Excellence in Offline Coaching with Modern Digital Homework Tracking',
  teacherName: 'Er. Rajesh V. Sharma (M.Tech, 14+ Yrs Exp)',
  teacherTitle: 'Senior Mathematics & Physics Faculty',
  teacherBio: 'Dedicated to building strong foundational concepts in Science and Mathematics for board exam toppers and competitive aspirants since 2012.',
  phone: '+91 98765 43210',
  email: 'teacher@prerna.edu',
  address: 'Cabin 304, Sharda Complex, Near City Library, MG Road, Pune, Maharashtra 411001',
  subjectsTaught: ['Mathematics', 'Physics', 'Chemistry', 'Applied Science'],
  classLevelsSummary: 'Class 8 to Class 12 (CBSE / ICSE / State Board)',
  gracePeriodDays: 3,
  lateHomeworkPenalty: {
    enabled: true,
    penaltyPerDay: 20,
    description: 'Late submissions attract Rs 20/day discipline fine to encourage consistency.'
  },
  upiDetails: {
    upiId: 'prerna.academy@icici',
    accountName: 'Prerna Tuition Academy / R V Sharma'
  },
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_PrernaTuition2026',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_prerna9981',
  landingContent: {
    heroTitle: 'AIHSAN ANSARI',
    heroTagline: 'A simple tool for teachers to manage assignments and for students to stay on top of their work.',
    contactPhone: '9905847357',
    stat1Value: '10+',
    stat1Label: 'Years Board Coaching',
    stat2Value: '98.4%',
    stat2Label: 'Board Pass Excellence',
    stat3Value: '25 Max',
    stat3Label: 'Students Per Batch',
    journeyTitle: 'Your Learning Journey Starts Here.',
    journeySubtitle: 'Everything you need to learn, practice, and stay ahead — all in one place.',
    journeyPoints: [
      'Homework & Assignments',
      'Study Materials & Notes',
      'Progress Tracking',
      'Secure Student Access'
    ],
    hybridFeature1Title: '"Aaj Class Mein Kya Padhaya Gaya"',
    hybridFeature1Desc: 'After every offline lecture, the teacher publishes the exact concept summary and key formulas taught that day. Absent or revising students are never left behind.',
    hybridFeature2Title: 'Daily Photo/PDF Solution Uploads',
    hybridFeature2Desc: 'Students solve problems in fair notebooks and submit clear pictures before the next morning\'s deadline. Teacher reviews and assigns verified marks with corrections.',
    hybridFeature3Title: 'Transparent Fee Receipts & Validity',
    hybridFeature3Desc: 'No disputes over unrecorded cash or pending dates. Pay online or in person; receive official computer-verified receipts with exact membership validity and next due dates.'
  }
};

// Seed initial database
function getInitialSeed(): DatabaseSchema {
  const ownerUser: User = {
    id: 'usr_owner_01',
    email: 'aihsan',
    name: 'AIHSAN ANSARI',
    phone: '9905847357',
    role: 'owner',
    passwordHash: '990584',
    createdAt: '2025-06-01T00:00:00.000Z',
    loginAccessGranted: true
  };

  const teacherUser: User = {
    id: 'usr_teacher_01',
    email: 'teacher@prerna.edu',
    name: 'Er. Rajesh Sharma',
    phone: '9876543210',
    role: 'teacher',
    passwordHash: 'admin123', // Demo plain for straightforward testing or hash check
    createdAt: '2026-01-01T00:00:00.000Z',
    loginAccessGranted: true,
    teacherTitle: 'Senior Mathematics & Physics Faculty',
    assignedSubjects: ['Mathematics', 'Science (Physics & Chem)'],
    createdByOwner: true
  };

  const studentUser1: User = {
    id: 'usr_student_aarav',
    email: 'aarav@student.com',
    name: 'Aarav Patel',
    phone: '9822011223',
    role: 'student',
    passwordHash: 'student123',
    createdAt: '2026-09-01T00:00:00.000Z',
    loginAccessGranted: true
  };

  const studentUser2: User = {
    id: 'usr_student_priya',
    email: 'priya@student.com',
    name: 'Priya Deshmukh',
    phone: '9822099887',
    role: 'student',
    passwordHash: 'student123',
    createdAt: '2026-09-10T00:00:00.000Z',
    loginAccessGranted: true
  };

  const studentUser3: User = {
    id: 'usr_student_rohan',
    email: 'rohan@student.com',
    name: 'Rohan Verma',
    phone: '9822055443',
    role: 'student',
    passwordHash: 'student123',
    createdAt: '2026-10-15T00:00:00.000Z',
    loginAccessGranted: false // Pending Owner Approval Demo
  };

  const studentUser4: User = {
    id: 'usr_student_ananya',
    email: 'ananya@student.com',
    name: 'Ananya Kulkarni',
    phone: '9822044332',
    role: 'student',
    passwordHash: 'student123',
    createdAt: '2026-09-05T00:00:00.000Z',
    loginAccessGranted: true
  };

  const classes: ClassLevel[] = [
    {
      id: 'cls_10',
      name: 'Class 10 (Board Excellence)',
      code: 'CLS-10',
      subjects: ['Mathematics', 'Science (Physics & Chem)'],
      monthlyFee: 2500,
      description: 'Comprehensive Board exam preparation with weekly tests and daily numerical drills.'
    },
    {
      id: 'cls_09',
      name: 'Class 9 (Foundation Batch)',
      code: 'CLS-09',
      subjects: ['Mathematics', 'Science'],
      monthlyFee: 2200,
      description: 'Concept building batch focusing on NCERT mastery and Olympiad problem solving.'
    },
    {
      id: 'cls_12_pcm',
      name: 'Class 12 (PCM - Boards & Entrance)',
      code: 'CLS-12-PCM',
      subjects: ['Physics', 'Mathematics'],
      monthlyFee: 3500,
      description: 'Rigorous derivation drills, calculus mastery, and entrance numerical practice.'
    }
  ];

  const batches: Batch[] = [
    {
      id: 'batch_10_morning',
      classId: 'cls_10',
      name: 'Batch 10-A (Morning 7:00 AM - 8:30 AM)',
      timing: '07:00 AM - 08:30 AM',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      maxCapacity: 25
    },
    {
      id: 'batch_10_evening',
      classId: 'cls_10',
      name: 'Batch 10-B (Evening 5:30 PM - 7:00 PM)',
      timing: '05:30 PM - 07:00 PM',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      maxCapacity: 25
    },
    {
      id: 'batch_09_evening',
      classId: 'cls_09',
      name: 'Batch 9-Foundation (Evening 4:00 PM - 5:15 PM)',
      timing: '04:00 PM - 05:15 PM',
      days: ['Mon', 'Wed', 'Fri', 'Sat'],
      maxCapacity: 20
    },
    {
      id: 'batch_12_morning',
      classId: 'cls_12_pcm',
      name: 'Batch 12-PCM Alpha (6:00 AM - 7:30 AM)',
      timing: '06:00 AM - 07:30 AM',
      days: ['Daily'],
      maxCapacity: 20
    }
  ];

  const students: StudentProfile[] = [
    {
      id: 'stu_aarav',
      userId: 'usr_student_aarav',
      name: 'Aarav Patel',
      email: 'aarav@student.com',
      phone: '9822011223',
      rollNumber: 'PTA-10-01',
      classId: 'cls_10',
      batchId: 'batch_10_morning',
      guardianName: 'Sanjay Patel',
      guardianPhone: '9822011200',
      guardianRelation: 'Father',
      enrollmentDate: '2026-09-01',
      status: 'active',
      loginAccessGranted: true,
      approvedByOwnerAt: '2026-09-01T10:00:00.000Z',
      notes: 'Very attentive in coordinate geometry. Always submits homework on time.'
    },
    {
      id: 'stu_priya',
      userId: 'usr_student_priya',
      name: 'Priya Deshmukh',
      email: 'priya@student.com',
      phone: '9822099887',
      rollNumber: 'PTA-10-02',
      classId: 'cls_10',
      batchId: 'batch_10_evening',
      guardianName: 'Sunita Deshmukh',
      guardianPhone: '9822099800',
      guardianRelation: 'Mother',
      enrollmentDate: '2026-09-10',
      status: 'expired', // Expired membership to demonstrate access restriction & paywall
      loginAccessGranted: true,
      approvedByOwnerAt: '2026-09-10T11:00:00.000Z',
      notes: 'Fee reminder sent to mother on 18th Oct. Cash promised this weekend.'
    },
    {
      id: 'stu_ananya',
      userId: 'usr_student_ananya',
      name: 'Ananya Kulkarni',
      email: 'ananya@student.com',
      phone: '9822044332',
      rollNumber: 'PTA-09-01',
      classId: 'cls_09',
      batchId: 'batch_09_evening',
      guardianName: 'Mahesh Kulkarni',
      guardianPhone: '9822044300',
      guardianRelation: 'Father',
      enrollmentDate: '2026-09-05',
      status: 'active',
      loginAccessGranted: true,
      approvedByOwnerAt: '2026-09-05T09:30:00.000Z',
      notes: 'Top scorer in Chapter 2 Polynomials test.'
    },
    {
      id: 'stu_rohan',
      userId: 'usr_student_rohan',
      name: 'Rohan Verma',
      email: 'rohan@student.com',
      phone: '9822055443',
      rollNumber: 'PTA-10-03',
      classId: 'cls_10',
      batchId: 'batch_10_morning',
      guardianName: 'Amit Verma',
      guardianPhone: '9822055400',
      guardianRelation: 'Father',
      enrollmentDate: '2026-10-15',
      status: 'pending_approval', // Pending Owner approval demo
      loginAccessGranted: false, // Owner has not yet granted login access
      notes: 'New admission enquiry. Waiting for Institute Owner login approval.'
    }
  ];

  // Memberships: Aarav is active until next month, Priya expired 5 days ago, Ananya active
  const memberships: Membership[] = [
    {
      id: 'mem_aarav',
      studentId: 'stu_aarav',
      startDate: '2026-10-01',
      expiryDate: '2026-11-01', // Active
      status: 'active',
      lastPaymentDate: '2026-10-01',
      lastPaymentAmount: 2500,
      autoRenew: false,
      gracePeriodDays: 3
    },
    {
      id: 'mem_priya',
      studentId: 'stu_priya',
      startDate: '2026-09-10',
      expiryDate: '2026-10-10', // Expired (> 3 days grace passed!)
      status: 'expired',
      lastPaymentDate: '2026-09-10',
      lastPaymentAmount: 2500,
      autoRenew: false,
      gracePeriodDays: 3
    },
    {
      id: 'mem_ananya',
      studentId: 'stu_ananya',
      startDate: '2026-10-05',
      expiryDate: '2026-11-05', // Active
      status: 'active',
      lastPaymentDate: '2026-10-05',
      lastPaymentAmount: 2200,
      autoRenew: false,
      gracePeriodDays: 3
    }
  ];

  const receipts: PaymentReceipt[] = [
    {
      receiptNumber: 'RCP-2026-0012',
      paymentId: 'pay_aarav_oct',
      studentId: 'stu_aarav',
      studentName: 'Aarav Patel',
      rollNumber: 'PTA-10-01',
      className: 'Class 10 (Board Excellence)',
      batchName: 'Batch 10-A (Morning)',
      billingMonth: 'October 2026',
      amount: 2500,
      paymentMethod: 'razorpay',
      transactionId: 'pay_rzp_oct_aarav998',
      paidAt: '2026-10-01T10:15:00.000Z',
      receiptDate: '2026-10-01',
      teacherNotes: 'Online payment verified via Razorpay PG'
    },
    {
      receiptNumber: 'RCP-2026-0008',
      paymentId: 'pay_priya_sep',
      studentId: 'stu_priya',
      studentName: 'Priya Deshmukh',
      rollNumber: 'PTA-10-02',
      className: 'Class 10 (Board Excellence)',
      batchName: 'Batch 10-B (Evening)',
      billingMonth: 'September 2026',
      amount: 2500,
      paymentMethod: 'cash',
      transactionId: 'CASH-REC-008',
      paidAt: '2026-09-10T17:30:00.000Z',
      receiptDate: '2026-09-10',
      teacherNotes: 'Received in cash at classroom desk'
    },
    {
      receiptNumber: 'RCP-2026-0015',
      paymentId: 'pay_ananya_oct',
      studentId: 'stu_ananya',
      studentName: 'Ananya Kulkarni',
      rollNumber: 'PTA-09-01',
      className: 'Class 9 (Foundation Batch)',
      batchName: 'Batch 9-Foundation',
      billingMonth: 'October 2026',
      amount: 2200,
      paymentMethod: 'upi_direct',
      transactionId: 'UPI-98220443-OCT',
      paidAt: '2026-10-05T12:00:00.000Z',
      receiptDate: '2026-10-05',
      teacherNotes: 'Direct GPay to tuition UPI ID'
    }
  ];

  const payments: PaymentTransaction[] = [
    {
      id: 'pay_aarav_oct',
      studentId: 'stu_aarav',
      studentName: 'Aarav Patel',
      rollNumber: 'PTA-10-01',
      classId: 'cls_10',
      amount: 2500,
      periodStart: '2026-10-01',
      periodEnd: '2026-11-01',
      status: 'success',
      paymentMethod: 'razorpay',
      razorpayPaymentId: 'pay_rzp_oct_aarav998',
      receiptNumber: 'RCP-2026-0012',
      teacherNotes: 'Verified online payment',
      createdAt: '2026-10-01T10:15:00.000Z'
    },
    {
      id: 'pay_priya_sep',
      studentId: 'stu_priya',
      studentName: 'Priya Deshmukh',
      rollNumber: 'PTA-10-02',
      classId: 'cls_10',
      amount: 2500,
      periodStart: '2026-09-10',
      periodEnd: '2026-10-10',
      status: 'success',
      paymentMethod: 'cash',
      receiptNumber: 'RCP-2026-0008',
      teacherNotes: 'Received cash at classroom',
      createdAt: '2026-09-10T17:30:00.000Z'
    },
    {
      id: 'pay_ananya_oct',
      studentId: 'stu_ananya',
      studentName: 'Ananya Kulkarni',
      rollNumber: 'PTA-09-01',
      classId: 'cls_09',
      amount: 2200,
      periodStart: '2026-10-05',
      periodEnd: '2026-11-05',
      status: 'success',
      paymentMethod: 'upi_direct',
      receiptNumber: 'RCP-2026-0015',
      teacherNotes: 'Direct UPI confirmed',
      createdAt: '2026-10-05T12:00:00.000Z'
    }
  ];

  // Daily Homework - The core feature
  const homework: Homework[] = [
    {
      id: 'hw_cls10_quad_01',
      classId: 'cls_10',
      batchIds: ['all'],
      subject: 'Mathematics',
      chapter: 'Chapter 4: Quadratic Equations',
      topic: 'Nature of Roots & Discriminant Analysis (b² - 4ac)',
      teachingSummary: 'Aaj class mein humne Quadratic Equations ka standard form ax² + bx + c = 0 revise kiya aur Discriminant D = b² - 4ac calculate karna seekha. Real & distinct roots (D > 0), Equal roots (D = 0), aur No real roots (D < 0) ke concepts with 5 board exam questions solve kiye.',
      instructions: '1. Solve Exercise 4.3 Questions 1 to 6 in your fair homework notebook.\n2. Clearly show calculation of Discriminant D for every question.\n3. Attempt the HOTS question attached in the worksheet.\n4. Take clear, well-lit photos and upload before the tomorrow morning deadline.',
      publishDate: '2026-10-22T08:00:00.000Z',
      deadlineDate: '2026-10-23T07:00:00.000Z',
      maxMarks: 20,
      priority: 'high',
      attachments: [
        {
          id: 'att_ws_01',
          name: 'Class10_Quadratic_HOTS_Worksheet.pdf',
          fileType: 'pdf',
          fileUrl: 'https://example.com/notes/Quadratic_HOTS_2026.pdf',
          size: '1.4 MB'
        },
        {
          id: 'att_formula_01',
          name: 'Formula_Sheet_Discriminant_Rules.png',
          fileType: 'image',
          fileUrl: 'https://example.com/notes/Formula_Discriminant.png',
          size: '420 KB'
        }
      ],
      referenceLinks: [
        {
          title: 'NCERT Class 10 Exemplar Q4.3 Solutions',
          url: 'https://ncert.nic.in/exemplar-problems.php'
        }
      ],
      isDraft: false,
      createdAt: '2026-10-22T07:45:00.000Z',
      updatedAt: '2026-10-22T07:45:00.000Z'
    },
    {
      id: 'hw_cls10_light_01',
      classId: 'cls_10',
      batchIds: ['all'],
      subject: 'Science (Physics)',
      chapter: 'Chapter 10: Light - Reflection and Refraction',
      topic: 'Mirror Formula & Magnification Numericals',
      teachingSummary: 'Aaj class mein concave mirror and convex mirror ke sign conventions (New Cartesian Sign Convention) cover kiye. Mirror formula 1/f = 1/v + 1/u aur magnification formula m = -v/u = h\'/h derive kiye and 3 board exam numericals solve kiye.',
      instructions: 'Solve the 4 numericals given in page 171 of NCERT. Remember to write proper given data, formula, and units in answers.',
      publishDate: '2026-10-21T08:00:00.000Z',
      deadlineDate: '2026-10-22T06:30:00.000Z',
      maxMarks: 15,
      priority: 'normal',
      attachments: [
        {
          id: 'att_mirror_notes',
          name: 'Ray_Diagrams_and_Sign_Convention_Handout.pdf',
          fileType: 'pdf',
          fileUrl: 'https://example.com/notes/Ray_Diagrams_Class10.pdf',
          size: '2.1 MB'
        }
      ],
      isDraft: false,
      createdAt: '2026-10-21T07:30:00.000Z',
      updatedAt: '2026-10-21T07:30:00.000Z'
    },
    {
      id: 'hw_cls09_poly_01',
      classId: 'cls_09',
      batchIds: ['all'],
      subject: 'Mathematics',
      chapter: 'Chapter 2: Polynomials',
      topic: 'Factor Theorem and Remainder Theorem',
      teachingSummary: 'Aaj class mein Remainder Theorem aur Factor Theorem ka practical difference explain kiya gaya. Cubic polynomials ko middle term splitting and factor theorem se factorize karna sikhaya.',
      instructions: 'Complete Exercise 2.4 Q3, Q4, and Q5 all sub-parts. Write step-by-step factorization.',
      publishDate: '2026-10-22T09:00:00.000Z',
      deadlineDate: '2026-10-23T16:00:00.000Z',
      maxMarks: 15,
      priority: 'normal',
      attachments: [
        {
          id: 'att_poly_worksheet',
          name: 'Class9_Polynomials_Practice_Set.pdf',
          fileType: 'pdf',
          fileUrl: 'https://example.com/notes/Polynomials_Ex2.4.pdf',
          size: '850 KB'
        }
      ],
      isDraft: false,
      createdAt: '2026-10-22T08:30:00.000Z',
      updatedAt: '2026-10-22T08:30:00.000Z'
    }
  ];

  // Submissions: Aarav submitted yesterday's Light HW and got graded, has pending today's HW
  const submissions: HomeworkSubmission[] = [
    {
      id: 'sub_aarav_light',
      homeworkId: 'hw_cls10_light_01',
      studentId: 'stu_aarav',
      studentName: 'Aarav Patel',
      rollNumber: 'PTA-10-01',
      submissionDate: '2026-10-21T20:30:00.000Z',
      solutionText: 'Sir, I have solved all 4 numericals on pages 171-172. Sign convention applied carefully. Attached 2 photos of my notebook solution.',
      attachments: [
        {
          id: 'att_sol_01',
          name: 'Aarav_HW_Light_Page1.jpg',
          fileType: 'image',
          fileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600',
          size: '1.2 MB'
        }
      ],
      status: 'completed',
      obtainedMarks: 14,
      teacherFeedback: 'Excellent work Aarav! Calculation for focal length in Q3 is neat. Just remember to mention the nature of the image (virtual/erect) in final answer line.',
      gradedAt: '2026-10-22T07:15:00.000Z'
    }
  ];

  // Attendance Records
  const attendance: AttendanceRecord[] = [
    {
      id: 'att_rec_01',
      date: '2026-10-22',
      classId: 'cls_10',
      batchId: 'batch_10_morning',
      studentId: 'stu_aarav',
      status: 'present',
      recordedAt: '2026-10-22T07:05:00.000Z'
    },
    {
      id: 'att_rec_02',
      date: '2026-10-22',
      classId: 'cls_10',
      batchId: 'batch_10_evening',
      studentId: 'stu_priya',
      status: 'present',
      recordedAt: '2026-10-22T17:35:00.000Z'
    },
    {
      id: 'att_rec_03',
      date: '2026-10-21',
      classId: 'cls_10',
      batchId: 'batch_10_morning',
      studentId: 'stu_aarav',
      status: 'present',
      recordedAt: '2026-10-21T07:03:00.000Z'
    },
    {
      id: 'att_rec_04',
      date: '2026-10-21',
      classId: 'cls_10',
      batchId: 'batch_10_evening',
      studentId: 'stu_priya',
      status: 'late',
      remarks: 'Arrived 15 mins late due to bus traffic',
      recordedAt: '2026-10-21T17:48:00.000Z'
    },
    {
      id: 'att_rec_05',
      date: '2026-10-22',
      classId: 'cls_09',
      batchId: 'batch_09_evening',
      studentId: 'stu_ananya',
      status: 'present',
      recordedAt: '2026-10-22T16:02:00.000Z'
    }
  ];

  const notifications: AppNotification[] = [
    {
      id: 'notif_01',
      recipientId: 'all',
      title: 'New Homework Published: Mathematics (Quadratic Equations)',
      message: 'Er. Rajesh Sharma has published today\'s homework for Class 10. Submission deadline is tomorrow morning 7:00 AM.',
      type: 'homework',
      read: false,
      createdAt: '2026-10-22T08:05:00.000Z'
    },
    {
      id: 'notif_02',
      recipientId: 'stu_priya',
      title: 'Tuition Membership Due Notice',
      message: 'Your tuition membership expired on 10 Oct 2026. Please complete the monthly fee of Rs 2,500 to restore full homework access.',
      type: 'fee_due',
      read: false,
      createdAt: '2026-10-18T10:00:00.000Z'
    },
    {
      id: 'notif_03',
      recipientId: 'stu_aarav',
      title: 'Homework Graded: Light - Reflection and Refraction',
      message: 'Teacher has graded your submission: 14/15 Marks. Feedback: "Excellent work Aarav!"',
      type: 'homework',
      read: false,
      createdAt: '2026-10-22T07:20:00.000Z'
    }
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'audit_01',
      userId: 'usr_teacher_01',
      userName: 'Er. Rajesh Sharma',
      action: 'SYSTEM_INITIALIZED',
      details: 'Tuition system initialized with classes 9, 10, 12 and academic batches.',
      timestamp: '2026-09-01T00:00:00.000Z'
    },
    {
      id: 'audit_02',
      userId: 'usr_teacher_01',
      userName: 'Er. Rajesh Sharma',
      action: 'PUBLISH_HOMEWORK',
      details: 'Published Homework for Class 10: Quadratic Equations (Nature of Roots)',
      timestamp: '2026-10-22T08:00:00.000Z'
    }
  ];

  return {
    users: [ownerUser, teacherUser, studentUser1, studentUser2, studentUser3, studentUser4],
    students,
    classes,
    batches,
    homework,
    submissions,
    attendance,
    memberships,
    payments,
    receipts,
    notifications,
    settings: defaultSettings,
    auditLogs
  };
}

class Store {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed: DatabaseSchema = JSON.parse(raw);
        let updated = false;

        // Ensure owner exists and has username AIHSAN / password 990584
        const ownerIndex = parsed.users.findIndex(u => u.role === 'owner');
        if (ownerIndex === -1) {
          const ownerUser: User = {
            id: 'usr_owner_01',
            email: 'aihsan',
            name: 'AIHSAN ANSARI',
            phone: '9905847357',
            role: 'owner',
            passwordHash: '990584',
            createdAt: '2025-06-01T00:00:00.000Z',
            loginAccessGranted: true
          };
          parsed.users.unshift(ownerUser);
          updated = true;
        } else {
          parsed.users[ownerIndex].email = 'aihsan';
          parsed.users[ownerIndex].name = 'AIHSAN ANSARI';
          parsed.users[ownerIndex].phone = '9905847357';
          parsed.users[ownerIndex].passwordHash = '990584';
          parsed.users[ownerIndex].loginAccessGranted = true;
          updated = true;
        }

        // Ensure landingContent is present
        if (!parsed.settings.landingContent) {
          parsed.settings.landingContent = defaultSettings.landingContent;
          updated = true;
        }

        // Ensure teacher has loginAccessGranted
        parsed.users.forEach(u => {
          if (u.role === 'teacher' && u.loginAccessGranted === undefined) {
            u.loginAccessGranted = true;
            u.teacherTitle = u.teacherTitle || 'Senior Mathematics & Physics Faculty';
            u.assignedSubjects = u.assignedSubjects || ['Mathematics', 'Science (Physics & Chem)'];
            updated = true;
          }
          if (u.role === 'student' && u.loginAccessGranted === undefined) {
            u.loginAccessGranted = u.email !== 'rohan@student.com';
            updated = true;
          }
        });

        // Ensure students have loginAccessGranted
        parsed.students.forEach(s => {
          if (s.loginAccessGranted === undefined) {
            s.loginAccessGranted = s.id !== 'stu_rohan';
            updated = true;
          }
        });

        if (updated) {
          this.save(parsed);
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load database from file, initializing seed:', err);
    }
    const initial = getInitialSeed();
    this.save(initial);
    return initial;
  }

  public save(newData?: DatabaseSchema): void {
    if (newData) {
      this.data = newData;
    }
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public get<K extends keyof DatabaseSchema>(key: K): DatabaseSchema[K] {
    return this.data[key];
  }

  public set<K extends keyof DatabaseSchema>(key: K, value: DatabaseSchema[K]): void {
    this.data[key] = value;
    this.save();
  }

  public raw(): DatabaseSchema {
    return this.data;
  }

  public resetSeed(): void {
    const initial = getInitialSeed();
    this.save(initial);
  }
}

export const db = new Store();
