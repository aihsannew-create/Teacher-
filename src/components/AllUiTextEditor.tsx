import React, { useState, useEffect } from 'react';
import { useUiText } from '../context/UiTextContext';
import { AllUiTexts, FaqItem } from '../types';
import { defaultAllUiTexts } from '../utils/uiTextDefaults';
import {
  Type,
  Search,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Phone,
  GraduationCap,
  BookOpen,
  DollarSign,
  UserCheck
} from 'lucide-react';

interface AllUiTextEditorProps {
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

type TextCategory =
  | 'all'
  | 'branding'
  | 'hero'
  | 'stats'
  | 'features'
  | 'journey'
  | 'faculty'
  | 'contact'
  | 'student'
  | 'teacher'
  | 'faqs';

interface FieldMeta {
  key: keyof AllUiTexts;
  category: TextCategory;
  labelEn: string;
  labelHi: string;
  description: string;
  isTextArea?: boolean;
  rows?: number;
  previewLocation: string;
}

const FIELD_DEFINITIONS: FieldMeta[] = [
  // 1. Branding & Navigation
  {
    key: 'brandName',
    category: 'branding',
    labelEn: 'Tuition / Academy Brand Name',
    labelHi: 'कोचिंग / अकादमी का नाम',
    description: 'Displays in top navbar header and page brand wordmarks.',
    previewLocation: 'Header Navbar & Brand Title'
  },
  {
    key: 'brandTagline',
    category: 'branding',
    labelEn: 'Brand Tagline / Subtitle',
    labelHi: 'टैगलाइन / उप-शीर्षक',
    description: 'Small badge text displayed next to brand name in header.',
    previewLocation: 'Header Navbar Subtitle'
  },
  {
    key: 'navHome',
    category: 'branding',
    labelEn: 'Navbar Home / Overview Link',
    labelHi: 'नेविगेशन होम लिंक',
    description: 'Menu link to the overview landing page.',
    previewLocation: 'Navbar Menu Link'
  },
  {
    key: 'navClasses',
    category: 'branding',
    labelEn: 'Navbar Classes & Fees Link',
    labelHi: 'नेविगेशन क्लासेस और फीस लिंक',
    description: 'Menu link to classes information and fee structure.',
    previewLocation: 'Navbar Menu Link'
  },
  {
    key: 'navFaculty',
    category: 'branding',
    labelEn: 'Navbar Faculty Link',
    labelHi: 'नेविगेशन फैकल्टी लिंक',
    description: 'Menu link to faculty and teacher profile.',
    previewLocation: 'Navbar Menu Link'
  },
  {
    key: 'navLogin',
    category: 'branding',
    labelEn: 'Login Button Text',
    labelHi: 'लॉगिन बटन टेक्स्ट',
    description: 'Action button in top-right navbar for unauthenticated users.',
    previewLocation: 'Top-Right Navbar Button'
  },

  // 2. Hero & Headlines
  {
    key: 'heroTitle',
    category: 'hero',
    labelEn: 'Main Hero Heading (Huge Display Title)',
    labelHi: 'मुख्य हेडर शीर्षक (बड़ा डिस्प्ले टेक्स्ट)',
    description: 'The primary headline at top of landing page (e.g., AIHSAN ANSARI).',
    previewLocation: 'Landing Page Hero Heading'
  },
  {
    key: 'heroTagline',
    category: 'hero',
    labelEn: 'Hero Subtitle / Mission Statement',
    labelHi: 'हेरो उपशीर्षक / विवरण',
    description: 'Introductory sentence below the main hero title.',
    isTextArea: true,
    rows: 2,
    previewLocation: 'Landing Page Hero Subtitle'
  },
  {
    key: 'heroSubjects',
    category: 'hero',
    labelEn: 'Animated Cycling Subjects (Comma-separated)',
    labelHi: 'साइकिल होने वाले विषय (कॉमा से अलग करें)',
    description: 'Subjects that rotate dynamically with smooth animation in hero.',
    previewLocation: 'Hero Animated Subject Badge'
  },
  {
    key: 'heroCtaStudentLogin',
    category: 'hero',
    labelEn: 'Hero Primary Action Button',
    labelHi: 'मुख्य एक्शन बटन टेक्स्ट',
    description: 'Primary button for students to enroll or jump into homework portal.',
    previewLocation: 'Hero Action Button 1'
  },
  {
    key: 'heroCtaExploreClasses',
    category: 'hero',
    labelEn: 'Hero Secondary Button',
    labelHi: 'द्वितीयक बटन टेक्स्ट',
    description: 'Secondary button to explore batch schedules and fees.',
    previewLocation: 'Hero Action Button 2'
  },

  // 3. Statistics & Counters
  {
    key: 'stat1Value',
    category: 'stats',
    labelEn: 'Stat 1 Value (Number / Suffix)',
    labelHi: 'आंकड़ा 1 मान (उदा. 10+)',
    description: 'First counter displayed in the trust marker bar.',
    previewLocation: 'Hero Stats Counter 1'
  },
  {
    key: 'stat1Label',
    category: 'stats',
    labelEn: 'Stat 1 Label',
    labelHi: 'आंकड़ा 1 लेबल',
    description: 'Label below counter 1 (e.g. Years Board Coaching).',
    previewLocation: 'Hero Stats Label 1'
  },
  {
    key: 'stat2Value',
    category: 'stats',
    labelEn: 'Stat 2 Value (Number / Suffix)',
    labelHi: 'आंकड़ा 2 मान (उदा. 98.4%)',
    description: 'Second counter displayed in the trust marker bar.',
    previewLocation: 'Hero Stats Counter 2'
  },
  {
    key: 'stat2Label',
    category: 'stats',
    labelEn: 'Stat 2 Label',
    labelHi: 'आंकड़ा 2 लेबल',
    description: 'Label below counter 2 (e.g. Board Pass Excellence).',
    previewLocation: 'Hero Stats Label 2'
  },
  {
    key: 'stat3Value',
    category: 'stats',
    labelEn: 'Stat 3 Value (Number / Suffix)',
    labelHi: 'आंकड़ा 3 मान (उदा. 25 Max)',
    description: 'Third counter displayed in the trust marker bar.',
    previewLocation: 'Hero Stats Counter 3'
  },
  {
    key: 'stat3Label',
    category: 'stats',
    labelEn: 'Stat 3 Label',
    labelHi: 'आंकड़ा 3 लेबल',
    description: 'Label below counter 3 (e.g. Students Per Batch).',
    previewLocation: 'Hero Stats Label 3'
  },
  {
    key: 'stat4Value',
    category: 'stats',
    labelEn: 'Stat 4 Value',
    labelHi: 'आंकड़ा 4 मान',
    description: 'Fourth counter displayed in platform overview.',
    previewLocation: 'Platform Overview Counter 4'
  },
  {
    key: 'stat4Label',
    category: 'stats',
    labelEn: 'Stat 4 Label',
    labelHi: 'आंकड़ा 4 लेबल',
    description: 'Label below counter 4 (e.g. Daily Homework Verified).',
    previewLocation: 'Platform Overview Label 4'
  },

  // 4. Hybrid Daily Homework Features
  {
    key: 'featuresSectionTitle',
    category: 'features',
    labelEn: 'Features Section Main Title',
    labelHi: 'फीचर्स सेक्शन मुख्य शीर्षक',
    description: 'Title for the offline coaching + daily digital accountability section.',
    previewLocation: 'Landing Page Features Header'
  },
  {
    key: 'featuresSectionSubtitle',
    category: 'features',
    labelEn: 'Features Section Subtitle',
    labelHi: 'फीचर्स सेक्शन उप-विवरण',
    description: 'Subheading explaining the offline-digital hybrid model.',
    isTextArea: true,
    rows: 2,
    previewLocation: 'Landing Page Features Subtitle'
  },
  {
    key: 'feature1Title',
    category: 'features',
    labelEn: 'Feature 1 Card Title',
    labelHi: 'फीचर 1 कार्ड शीर्षक',
    description: 'Title for daily concept summary card ("Aaj Class Mein Kya Padhaya Gaya").',
    previewLocation: 'Feature Card 1 Header'
  },
  {
    key: 'feature1Desc',
    category: 'features',
    labelEn: 'Feature 1 Description',
    labelHi: 'फीचर 1 विस्तृत विवरण',
    description: 'Detailed explanation for feature card 1.',
    isTextArea: true,
    rows: 3,
    previewLocation: 'Feature Card 1 Body'
  },
  {
    key: 'feature2Title',
    category: 'features',
    labelEn: 'Feature 2 Card Title',
    labelHi: 'फीचर 2 कार्ड शीर्षक',
    description: 'Title for daily photo/pdf notebook upload card.',
    previewLocation: 'Feature Card 2 Header'
  },
  {
    key: 'feature2Desc',
    category: 'features',
    labelEn: 'Feature 2 Description',
    labelHi: 'फीचर 2 विस्तृत विवरण',
    description: 'Detailed explanation for feature card 2.',
    isTextArea: true,
    rows: 3,
    previewLocation: 'Feature Card 2 Body'
  },
  {
    key: 'feature3Title',
    category: 'features',
    labelEn: 'Feature 3 Card Title',
    labelHi: 'फीचर 3 कार्ड शीर्षक',
    description: 'Title for transparent fee receipts and validity dates card.',
    previewLocation: 'Feature Card 3 Header'
  },
  {
    key: 'feature3Desc',
    category: 'features',
    labelEn: 'Feature 3 Description',
    labelHi: 'फीचर 3 विस्तृत विवरण',
    description: 'Detailed explanation for feature card 3.',
    isTextArea: true,
    rows: 3,
    previewLocation: 'Feature Card 3 Body'
  },
  {
    key: 'feature4Title',
    category: 'features',
    labelEn: 'Feature 4 Card Title',
    labelHi: 'फीचर 4 कार्ड शीर्षक',
    description: 'Title for daily attendance and alert tracking.',
    previewLocation: 'Feature Card 4 Header'
  },
  {
    key: 'feature4Desc',
    category: 'features',
    labelEn: 'Feature 4 Description',
    labelHi: 'फीचर 4 विस्तृत विवरण',
    description: 'Detailed explanation for feature card 4.',
    isTextArea: true,
    rows: 3,
    previewLocation: 'Feature Card 4 Body'
  },

  // 5. Learning Journey & WhatsApp Admission
  {
    key: 'journeyTitle',
    category: 'journey',
    labelEn: 'Learning Journey Title',
    labelHi: 'लर्निंग जर्नी शीर्षक',
    description: 'Title for the student learning roadmap section.',
    previewLocation: 'Roadmap Section Header'
  },
  {
    key: 'journeySubtitle',
    category: 'journey',
    labelEn: 'Learning Journey Subtitle',
    labelHi: 'लर्निंग जर्नी उपशीर्षक',
    description: 'Subtitle for the student learning roadmap section.',
    isTextArea: true,
    rows: 2,
    previewLocation: 'Roadmap Section Subtitle'
  },
  {
    key: 'enquiryCardTitle',
    category: 'journey',
    labelEn: 'WhatsApp Admission Card Title',
    labelHi: 'व्हाट्सएप एडमिशन कार्ड शीर्षक',
    description: 'Heading on the right-hand frosted glass admission enquiry box.',
    previewLocation: 'WhatsApp Admission Card Header'
  },
  {
    key: 'enquiryCardSubtitle',
    category: 'journey',
    labelEn: 'WhatsApp Admission Card Subtitle',
    labelHi: 'व्हाट्सएप एडमिशन कार्ड उपशीर्षक',
    description: 'Subheading on the admission enquiry box.',
    previewLocation: 'WhatsApp Admission Card Subtitle'
  },
  {
    key: 'enquiryButtonText',
    category: 'journey',
    labelEn: 'WhatsApp Form Submit Button',
    labelHi: 'व्हाट्सएप सबमिट बटन टेक्स्ट',
    description: 'Green button text to send enquiry details directly to WhatsApp.',
    previewLocation: 'WhatsApp Send Button'
  },

  // 6. Faculty Profile
  {
    key: 'teacherName',
    category: 'faculty',
    labelEn: 'Faculty / Director Full Name & Degrees',
    labelHi: 'फैकल्टी / डायरेक्टर का पूरा नाम व डिग्री',
    description: 'Teacher / Director name shown across the portal and faculty bio.',
    previewLocation: 'Faculty Section Name'
  },
  {
    key: 'teacherTitle',
    category: 'faculty',
    labelEn: 'Faculty Designation / Subject Title',
    labelHi: 'फैकल्टी पद / विषय विशेषज्ञता',
    description: 'e.g., Senior Mathematics & Physics Faculty.',
    previewLocation: 'Faculty Section Title'
  },
  {
    key: 'teacherExperience',
    category: 'faculty',
    labelEn: 'Faculty Experience Badge',
    labelHi: 'अनुभव बैज टेक्स्ट',
    description: 'e.g., 14+ Years Offline Coaching Experience.',
    previewLocation: 'Faculty Badge'
  },
  {
    key: 'teacherBio',
    category: 'faculty',
    labelEn: 'Faculty Biography & Philosophy',
    labelHi: 'फैकल्टी का परिचय और शिक्षण दृष्टिकोण',
    description: 'Detailed description of teaching methodology and achievements.',
    isTextArea: true,
    rows: 4,
    previewLocation: 'Faculty Section Bio Body'
  },
  {
    key: 'classLevelsSummary',
    category: 'faculty',
    labelEn: 'Classes Taught Summary',
    labelHi: 'पढ़ाई जाने वाली कक्षाओं का सारांश',
    description: 'Summary of standards and boards covered.',
    previewLocation: 'Classes & Boards Summary'
  },

  // 7. Contact & Footer
  {
    key: 'contactPhone',
    category: 'contact',
    labelEn: 'Primary Contact / WhatsApp Phone Number',
    labelHi: 'मुख्य संपर्क / व्हाट्सएप फोन नंबर',
    description: 'The 10-digit mobile number linked to WhatsApp enquiries and calls (e.g. 9905847357).',
    previewLocation: 'WhatsApp Links & Contact Bar'
  },
  {
    key: 'contactEmail',
    category: 'contact',
    labelEn: 'Contact Email Address',
    labelHi: 'संपर्क ईमेल आईडी',
    description: 'Official institute email for inquiries and parent communication.',
    previewLocation: 'Contact Section & Footer'
  },
  {
    key: 'contactAddress',
    category: 'contact',
    labelEn: 'Classroom & Cabin Physical Address',
    labelHi: 'ऑफलाइन क्लासरूम और केबिन का पता',
    description: 'Full offline coaching address displayed for parent visits.',
    isTextArea: true,
    rows: 2,
    previewLocation: 'Footer & Contact Address'
  },
  {
    key: 'footerCopyright',
    category: 'contact',
    labelEn: 'Footer Copyright Notice',
    labelHi: 'फुटर कॉपीराइट सूचना',
    description: 'Legal copyright statement at very bottom of every page.',
    previewLocation: 'Bottom Footer Copyright'
  },
  {
    key: 'footerNotice',
    category: 'contact',
    labelEn: 'Footer Mission / Disclaimer Note',
    labelHi: 'फुटर मिशन / डिस्क्लेमर नोट',
    description: 'Small tagline or statement in bottom footer.',
    previewLocation: 'Bottom Footer Note'
  },

  // 8. Student Portal & Notices
  {
    key: 'studentWelcomeTitle',
    category: 'student',
    labelEn: 'Student Portal Main Title',
    labelHi: 'स्टूडेंट पोर्टल मुख्य शीर्षक',
    description: 'Greeting displayed when a student logs into their study desk.',
    previewLocation: 'Student Dashboard Welcome'
  },
  {
    key: 'studentWelcomeSubtitle',
    category: 'student',
    labelEn: 'Student Portal Subtitle',
    labelHi: 'स्टूडेंट पोर्टल उपशीर्षक',
    description: 'Instructional text on student dashboard.',
    previewLocation: 'Student Dashboard Subtitle'
  },
  {
    key: 'homeworkGuidance',
    category: 'student',
    labelEn: 'Homework Submission Guidance Note',
    labelHi: 'होमवर्क सबमिशन निर्देश',
    description: 'Instructions given to student before uploading notebook photos.',
    isTextArea: true,
    rows: 2,
    previewLocation: 'Student Homework Upload Modal'
  },
  {
    key: 'feeExpiredWarning',
    category: 'student',
    labelEn: 'Membership Expired Warning Alert',
    labelHi: 'फीस एक्सपायर होने की चेतावनी सूचना',
    description: 'Amber alert banner shown when a student membership expires.',
    isTextArea: true,
    rows: 2,
    previewLocation: 'Student Expired Banner'
  },
  {
    key: 'gracePeriodNote',
    category: 'student',
    labelEn: 'Grace Period Explanation Text',
    labelHi: 'ग्रेस पीरियड स्पष्टीकरण टेक्स्ट',
    description: 'Notice explaining 3 days grace period allowed before homework locking.',
    previewLocation: 'Fee Due Notice'
  },

  // 9. Teacher Cabin
  {
    key: 'teacherCabinTitle',
    category: 'teacher',
    labelEn: 'Teacher Academic Cabin Title',
    labelHi: 'टीचर एकेडमिक केबिन शीर्षक',
    description: 'Heading inside teacher dashboard.',
    previewLocation: 'Teacher Dashboard Title'
  },
  {
    key: 'teacherCabinSubtitle',
    category: 'teacher',
    labelEn: 'Teacher Cabin Subtitle',
    labelHi: 'टीचर केबिन उपशीर्षक',
    description: 'Description of faculty management responsibilities.',
    previewLocation: 'Teacher Dashboard Subtitle'
  },
  {
    key: 'publishHomeworkPrompt',
    category: 'teacher',
    labelEn: 'Daily Concept Summary Prompt',
    labelHi: 'दैनिक कॉन्सेप्ट सारांश प्रॉम्प्ट',
    description: 'The heading prompt on teacher homework publish screen.',
    previewLocation: 'Publish Homework Form'
  }
];

export const AllUiTextEditor: React.FC<AllUiTextEditorProps> = ({ onSuccess, onError }) => {
  const { uiTexts, updateUiTexts, resetUiTexts } = useUiText();
  const [formData, setFormData] = useState<AllUiTexts>(uiTexts);
  const [selectedCategory, setSelectedCategory] = useState<TextCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [localSuccessMsg, setLocalSuccessMsg] = useState<string | null>(null);

  // Sync formData when external uiTexts changes
  useEffect(() => {
    setFormData(uiTexts);
    setHasUnsavedChanges(false);
  }, [uiTexts]);

  const handleChange = (key: keyof AllUiTexts, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateUiTexts(formData);
      setHasUnsavedChanges(false);
      const msg = '🎉 All UI texts updated successfully! The entire platform now reflects your changes live.';
      setLocalSuccessMsg(msg);
      if (onSuccess) onSuccess(msg);
      setTimeout(() => setLocalSuccessMsg(null), 5000);
    } catch (err: any) {
      if (onError) onError(err.message || 'Failed to save UI texts.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = async () => {
    setResetting(true);
    try {
      await resetUiTexts();
      setFormData(defaultAllUiTexts);
      setHasUnsavedChanges(false);
      setShowResetModal(false);
      const msg = 'All UI texts restored to factory default settings.';
      setLocalSuccessMsg(msg);
      if (onSuccess) onSuccess(msg);
      setTimeout(() => setLocalSuccessMsg(null), 4000);
    } catch (err: any) {
      if (onError) onError(err.message || 'Failed to reset UI texts.');
    } finally {
      setResetting(false);
    }
  };

  // FAQ Handlers
  const handleFaqChange = (index: number, field: 'q' | 'a', value: string) => {
    const currentFaqs = [...(formData.faqs || defaultAllUiTexts.faqs)];
    currentFaqs[index] = {
      ...currentFaqs[index],
      [field]: value
    };
    handleChange('faqs', currentFaqs);
  };

  const handleAddFaq = () => {
    const currentFaqs = [...(formData.faqs || defaultAllUiTexts.faqs)];
    currentFaqs.push({
      q: 'New Question: How do I get started?',
      a: 'Enter clear explanation for students and parents here.'
    });
    handleChange('faqs', currentFaqs);
  };

  const handleRemoveFaq = (index: number) => {
    const currentFaqs = [...(formData.faqs || defaultAllUiTexts.faqs)];
    currentFaqs.splice(index, 1);
    handleChange('faqs', currentFaqs);
  };

  // Filter fields
  const filteredFields = FIELD_DEFINITIONS.filter(field => {
    const matchesCategory = selectedCategory === 'all' || field.category === selectedCategory;
    if (!matchesCategory) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const val = String(formData[field.key] || '').toLowerCase();
    const label = field.labelEn.toLowerCase();
    const labelHi = field.labelHi.toLowerCase();
    const loc = field.previewLocation.toLowerCase();

    return (
      label.includes(q) ||
      labelHi.includes(q) ||
      val.includes(q) ||
      loc.includes(q) ||
      field.key.toLowerCase().includes(q)
    );
  });

  const categoriesList: { id: TextCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All Texts (A to Z)', count: FIELD_DEFINITIONS.length + 1 },
    { id: 'branding', label: '1. Brand & Navbar', count: FIELD_DEFINITIONS.filter(f => f.category === 'branding').length },
    { id: 'hero', label: '2. Hero & Headlines', count: FIELD_DEFINITIONS.filter(f => f.category === 'hero').length },
    { id: 'stats', label: '3. Stats & Counters', count: FIELD_DEFINITIONS.filter(f => f.category === 'stats').length },
    { id: 'features', label: '4. Features (4 Cards)', count: FIELD_DEFINITIONS.filter(f => f.category === 'features').length },
    { id: 'journey', label: '5. Journey & WhatsApp', count: FIELD_DEFINITIONS.filter(f => f.category === 'journey').length },
    { id: 'faculty', label: '6. Faculty Profile', count: FIELD_DEFINITIONS.filter(f => f.category === 'faculty').length },
    { id: 'contact', label: '7. Contact & Footer', count: FIELD_DEFINITIONS.filter(f => f.category === 'contact').length },
    { id: 'student', label: '8. Student Portal', count: FIELD_DEFINITIONS.filter(f => f.category === 'student').length },
    { id: 'teacher', label: '9. Teacher Cabin', count: FIELD_DEFINITIONS.filter(f => f.category === 'teacher').length },
    { id: 'faqs', label: '10. FAQs (Q&A)', count: formData.faqs?.length || 5 }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-blue-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Type className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
              All UI Text Editor (A to Z) • संपूर्ण यूआई टेक्स्ट एडिटर
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            You have absolute supreme control to customize every piece of text across the entire platform — Hero headlines, brand names, statistics, feature explanations, WhatsApp admission prompts, faculty bio, contact details, student notices, and FAQs.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={saving || resetting}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Texts...' : 'Save All UI Texts'}</span>
          </button>
        </div>
      </div>

      {/* Local Notification */}
      {localSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{localSuccessMsg}</span>
          </div>
          <button onClick={() => setLocalSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* Search Bar & Category Navigation */}
      <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl border border-blue-100 shadow-xs space-y-3.5">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Search any text to edit (e.g., 'AIHSAN', 'WhatsApp', '99058', 'Homework', 'Fees', 'Faculty')..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50/80 border border-slate-200 text-slate-900 text-xs placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all shadow-2xs"
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {categoriesList.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/20'
                  : 'bg-slate-100/80 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  selectedCategory === cat.id ? 'bg-blue-700 text-white' : 'bg-white text-slate-500 border border-slate-200'
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid of Configurable Fields */}
      {selectedCategory !== 'faqs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredFields.map(field => {
            const currentValue = formData[field.key];
            const defaultValue = defaultAllUiTexts[field.key];
            const isModified = JSON.stringify(currentValue) !== JSON.stringify(defaultValue);

            return (
              <div
                key={field.key}
                className="bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-blue-100 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {field.key}
                    </span>
                    <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      📍 {field.previewLocation}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    {field.labelEn}
                  </h3>
                  <div className="text-[11px] text-blue-700 font-medium">
                    {field.labelHi}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                    {field.description}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {field.isTextArea ? (
                    <textarea
                      rows={field.rows || 3}
                      value={String(currentValue || '')}
                      onChange={e => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium leading-relaxed"
                    />
                  ) : (
                    <input
                      type="text"
                      value={String(currentValue || '')}
                      onChange={e => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50/80 border border-slate-200 text-slate-900 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                    />
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                    <span className="truncate max-w-[280px]">
                      Default: <span className="font-mono text-slate-500">{String(defaultValue || '')}</span>
                    </span>
                    {isModified && (
                      <span className="text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                        Customized
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAQ Editor Section */}
      {(selectedCategory === 'all' || selectedCategory === 'faqs') && (
        <div className="bg-white/95 backdrop-blur-xl p-6 rounded-3xl border border-blue-100 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                  10. Frequently Asked Questions (FAQ Manager) • प्रश्न और उत्तर
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Customize, add, or remove questions and answers shown in the FAQ accordion on the public landing page.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddFaq}
              className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto transition-all shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New FAQ Question</span>
            </button>
          </div>

          <div className="space-y-4">
            {(formData.faqs || defaultAllUiTexts.faqs).map((faq, index) => (
              <div
                key={index}
                className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-3 relative group hover:border-blue-200 transition-all"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-500">
                    Question #{index + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFaq(index)}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete this FAQ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Question (प्रश्न)
                  </label>
                  <input
                    type="text"
                    value={faq.q}
                    onChange={e => handleFaqChange(index, 'q', e.target.value)}
                    placeholder="Enter question text..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Answer (उत्तर)
                  </label>
                  <textarea
                    rows={2}
                    value={faq.a}
                    onChange={e => handleFaqChange(index, 'a', e.target.value)}
                    placeholder="Enter detailed explanation..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 leading-relaxed"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Sticky Save Bar */}
      <div className="sticky bottom-4 z-30 bg-slate-900/90 backdrop-blur-xl text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <span>Owner A to Z Text Manager</span>
              {hasUnsavedChanges ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 animate-pulse">
                  Unsaved Edits
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Synchronized
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block">
              Click save to broadcast text changes instantly to all users and dashboards.
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            disabled={saving || resetting}
            className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-semibold transition-all"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save All UI Texts'}</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-blue-100 shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Reset All UI Texts to Factory Defaults?
                </h3>
                <p className="text-xs text-slate-500">
                  क्या आप सभी टेक्स्ट को डिफॉल्ट पर रीसेट करना चाहते हैं?
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/70 p-3.5 rounded-xl border border-amber-200">
              This will overwrite any custom headings, phone numbers, bio texts, and custom FAQs with the initial factory default strings. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                disabled={resetting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-500/25"
              >
                {resetting ? 'Resetting...' : 'Yes, Reset All Texts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
