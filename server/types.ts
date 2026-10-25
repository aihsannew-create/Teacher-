export type UserRole = 'owner' | 'teacher' | 'student' | 'parent';

export type StudentStatus = 'active' | 'pending_payment' | 'expired' | 'suspended' | 'pending_approval';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
  loginAccessGranted?: boolean; // Controlled exclusively by Institute Owner
  teacherTitle?: string;
  assignedSubjects?: string[];
  createdByOwner?: boolean;
}

export type InquiryStatus = 'new' | 'contacted' | 'demo_booked' | 'enrolled';

export interface AdmissionInquiry {
  id: string;
  studentName: string;
  phone: string;
  classInterested: string;
  subjects: string;
  message?: string;
  status: InquiryStatus;
  createdAt: string;
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
  customFee?: number; // optional fee override
  notes?: string;
  loginAccessGranted?: boolean; // Controlled exclusively by Institute Owner
  approvedByOwnerAt?: string;
}

export interface ClassLevel {
  id: string;
  name: string; // e.g. "Class 10", "Class 9", "Class 11 - PCM"
  code: string;
  subjects: string[]; // e.g. ["Mathematics", "Physics", "Chemistry"]
  monthlyFee: number; // default monthly tuition fee
  description?: string;
}

export interface Batch {
  id: string;
  classId: string;
  name: string; // e.g. "Morning Alpha (7:00 AM - 8:30 AM)"
  timing: string;
  days: string[]; // e.g. ["Mon", "Wed", "Fri"] or ["Daily"]
  maxCapacity: number;
}

export interface HomeworkAttachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'image' | 'doc' | 'link';
  fileUrl: string; // base64 data URL or external secure URL
  size?: string;
}

export interface Homework {
  id: string;
  classId: string;
  batchIds: string[]; // e.g. ['all'] or specific batch IDs
  subject: string;
  chapter: string;
  topic: string;
  teachingSummary: string; // "Aaj class mein kya padhaya gaya"
  instructions: string;
  publishDate: string; // ISO string
  deadlineDate: string; // ISO string
  maxMarks: number;
  priority: 'normal' | 'high' | 'urgent';
  attachments: HomeworkAttachment[];
  referenceLinks?: { title: string; url: string }[];
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
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
  date: string; // YYYY-MM-DD
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
  startDate: string; // ISO string
  expiryDate: string; // ISO string with timestamp e.g. 2026-11-24T16:25:00.000Z
  status: 'active' | 'grace_period' | 'expired';
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  autoRenew: boolean;
  gracePeriodDays: number;
  accessDurationDays?: number; // e.g. 30
}

export interface PaymentReceipt {
  receiptNumber: string; // e.g. "RCP-2026-0089"
  paymentId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  className: string;
  batchName: string;
  billingMonth: string; // e.g. "November 2026"
  amount: number;
  paymentMethod: 'razorpay' | 'cash' | 'upi_direct' | 'bank_transfer' | 'phonepe' | 'gpay' | 'paytm' | 'qr_code';
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
  status: 'success' | 'pending' | 'failed' | 'rejected';
  paymentMethod: 'razorpay' | 'cash' | 'upi_direct' | 'bank_transfer' | 'phonepe' | 'gpay' | 'paytm' | 'qr_code';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  receiptNumber?: string;
  teacherNotes?: string;
  createdAt: string;
  idempotencyKey?: string;
  // Verification & Approval fields
  utrNumber?: string;
  screenshotUrl?: string;
  approvedBy?: string;
  approvedAt?: string;
  accessGrantedDays?: number;
  adminRemarks?: string;
}

export interface AppNotification {
  id: string;
  recipientId: string; // studentId or 'all' or 'class:<id>' or 'teacher' or 'owner' or 'admin'
  title: string;
  message: string;
  type: 'homework' | 'fee_due' | 'payment_success' | 'attendance' | 'announcement' | 'payment_submitted';
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
  gracePeriodDays: number; // e.g. 3 or 7 days
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
  razorpayKeySecret?: string;
  landingContent?: LandingContent;
  uiTexts?: AllUiTexts;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface AllUiTexts {
  // A: Branding & Navigation
  brandName: string;
  brandTagline: string;
  navHome: string;
  navClasses: string;
  navFaculty: string;
  navLogin: string;
  navStudentPortal: string;
  navTeacherCabin: string;
  navOwnerCabin: string;

  // B: Hero Section
  heroTitle: string;
  heroTagline: string;
  heroSubjects: string;
  heroCtaStudentLogin: string;
  heroCtaExploreClasses: string;
  heroCtaTeacherCabin: string;

  // C: Statistics / Metric Counters
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;

  // D: Hybrid Daily Homework Features (4 cards)
  featuresSectionTitle: string;
  featuresSectionSubtitle: string;
  feature1Title: string;
  feature1Desc: string;
  feature2Title: string;
  feature2Desc: string;
  feature3Title: string;
  feature3Desc: string;
  feature4Title: string;
  feature4Desc: string;

  // E: Learning Journey & WhatsApp Enquiry
  journeyTitle: string;
  journeySubtitle: string;
  journeyPoints: string[];
  enquiryCardTitle: string;
  enquiryCardSubtitle: string;
  enquiryButtonText: string;

  // F: Faculty / Teacher Profile
  teacherName: string;
  teacherTitle: string;
  teacherBio: string;
  teacherExperience: string;
  classLevelsSummary: string;

  // G: Contact & Footer
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  footerCopyright: string;
  footerNotice: string;

  // H: Student Portal & Notices
  studentWelcomeTitle: string;
  studentWelcomeSubtitle: string;
  homeworkGuidance: string;
  feeExpiredWarning: string;
  gracePeriodNote: string;

  // I: Teacher Academic Cabin
  teacherCabinTitle: string;
  teacherCabinSubtitle: string;
  publishHomeworkPrompt: string;

  // J: Frequently Asked Questions (FAQs)
  faqs: FaqItem[];
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
