export type UserRole = 'owner' | 'teacher' | 'student' | 'parent';

export type StudentStatus = 'active' | 'pending_payment' | 'expired' | 'suspended' | 'pending_approval';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  createdAt: string;
  loginAccessGranted?: boolean;
  teacherTitle?: string;
  assignedSubjects?: string[];
}

export interface StudentProfile {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  rollNumber: string;
  classId: string;
  batchId: string;
  guardianName: string;
  guardianPhone: string;
  guardianRelation: string;
  enrollmentDate: string;
  status: StudentStatus;
  avatarUrl?: string;
  customFee?: number;
  notes?: string;
  className?: string;
  batchName?: string;
  monthlyFee?: number;
  membership?: Membership | null;
  loginAccessGranted?: boolean;
  approvedByOwnerAt?: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  code: string;
  subjects: string[];
  monthlyFee: number;
  description?: string;
  batches?: Batch[];
  studentCount?: number;
  activeStudents?: number;
}

export interface Batch {
  id: string;
  classId: string;
  name: string;
  timing: string;
  days: string[];
  maxCapacity: number;
}

export interface HomeworkAttachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'image' | 'doc' | 'link';
  fileUrl: string;
  size?: string;
}

export interface Homework {
  id: string;
  classId: string;
  className?: string;
  batchIds: string[];
  subject: string;
  chapter: string;
  topic: string;
  teachingSummary: string; // "Aaj class mein kya padhaya gaya"
  instructions: string;
  publishDate: string;
  deadlineDate: string;
  maxMarks: number;
  priority: 'normal' | 'high' | 'urgent';
  attachments: HomeworkAttachment[];
  referenceLinks?: { title: string; url: string }[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  submissionsCount?: number;
  totalEnrolled?: number;
  completedCount?: number;
  needsCorrectionCount?: number;
  pendingReviewCount?: number;
  mySubmission?: HomeworkSubmission | null;
  isSubmitted?: boolean;
  submissionStatus?: 'pending' | 'submitted' | 'completed' | 'needs_correction' | 'incomplete';
}

export type SubmissionStatus = 'submitted' | 'completed' | 'needs_correction' | 'incomplete';

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  submissionDate: string;
  solutionText?: string;
  attachments: HomeworkAttachment[];
  status: SubmissionStatus;
  obtainedMarks?: number;
  teacherFeedback?: string;
  gradedAt?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  classId: string;
  batchId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
  recordedAt: string;
}

export interface Membership {
  id: string;
  studentId: string;
  startDate: string;
  expiryDate: string;
  status: 'active' | 'grace_period' | 'expired';
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  autoRenew: boolean;
  gracePeriodDays: number;
}

export interface PaymentReceipt {
  receiptNumber: string;
  paymentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  batchName: string;
  billingMonth: string;
  amount: number;
  paymentMethod: 'razorpay' | 'cash' | 'upi_direct' | 'bank_transfer';
  transactionId: string;
  paidAt: string;
  receiptDate: string;
  teacherNotes?: string;
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  classId: string;
  amount: number;
  periodStart: string;
  periodEnd: string;
  status: 'success' | 'pending' | 'failed';
  paymentMethod: 'razorpay' | 'cash' | 'upi_direct' | 'bank_transfer';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  receiptNumber: string;
  teacherNotes?: string;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  recipientId: string;
  title: string;
  message: string;
  type: 'homework' | 'fee_due' | 'payment_success' | 'attendance' | 'announcement';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface TeacherSettings {
  tuitionName: string;
  tagline: string;
  teacherName: string;
  teacherTitle: string;
  teacherBio: string;
  phone: string;
  email: string;
  address: string;
  subjectsTaught: string[];
  classLevelsSummary: string;
  gracePeriodDays: number;
  lateHomeworkPenalty: {
    enabled: boolean;
    penaltyPerDay: number;
    description: string;
  };
  upiDetails: {
    upiId: string;
    accountName: string;
    qrUrl?: string;
  };
  razorpayKeyId?: string;
  landingContent?: LandingContent;
}

export interface LandingContent {
  heroTitle: string;
  heroTagline: string;
  contactPhone: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  journeyTitle: string;
  journeySubtitle: string;
  journeyPoints: string[];
  hybridFeature1Title: string;
  hybridFeature1Desc: string;
  hybridFeature2Title: string;
  hybridFeature2Desc: string;
  hybridFeature3Title: string;
  hybridFeature3Desc: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}
