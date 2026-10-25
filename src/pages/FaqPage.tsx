import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, 
  Search, 
  ChevronDown, 
  MessageCircle, 
  Phone, 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useUiText } from '../context/UiTextContext';

interface FaqPageProps {
  onNavigate: (view: string) => void;
}

interface FaqItem {
  id: string;
  category: 'admissions' | 'academics' | 'homework' | 'portal' | 'general';
  categoryLabel: string;
  question: string;
  answer: string;
  highlight?: string;
}

export const FaqPage: React.FC<FaqPageProps> = ({ onNavigate }) => {
  const { uiTexts } = useUiText();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('faq_1');

  const phoneRaw = uiTexts.contactPhone || '9905847357';
  const cleanPhone = phoneRaw.replace(/\D/g, '');
  const teacherTitle = uiTexts.heroTitle || 'AIHSAN ANSARI';
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(teacherTitle)},%20I%20have%20a%20question%20regarding%20coaching%20classes.`;

  const faqList: FaqItem[] = [
    {
      id: 'faq_1',
      category: 'academics',
      categoryLabel: 'Classes & Batches',
      question: 'Which classes and subjects are covered in offline batches?',
      answer: 'We provide specialized offline classroom coaching for Classes 8, 9, 10 (Foundation & Boards) and Classes 11, 12 (Science / PCM & PCB). Core subjects include Mathematics, Physics, Chemistry, and Biology, along with foundational English and Hindi grammar drills. All teaching follows NCERT and respective State / CBSE board patterns.',
      highlight: 'Classes 8th to 12th (NCERT / CBSE / State Boards)'
    },
    {
      id: 'faq_2',
      category: 'homework',
      categoryLabel: 'Daily Homework',
      question: 'How does daily homework checking and "Aaj Class Mein Kya Padhaya Gaya" work?',
      answer: 'Immediately after every classroom lecture, the teacher publishes the "Aaj Class Mein Kya Padhaya Gaya" concept summary and assigned practice problems into the portal. Students solve questions in their fair notebooks and upload clear photos before the next morning. Sir Aihsan Ansari personally reviews submissions, assigns marks, and provides corrective remarks.',
      highlight: 'Every assignment is personally checked before the next lecture'
    },
    {
      id: 'faq_3',
      category: 'admissions',
      categoryLabel: 'Admissions & Demo',
      question: 'Can a new student attend a free demo or trial class before joining?',
      answer: 'Yes, absolutely! We encourage prospective students to attend 2 complimentary offline trial lectures. This helps the student experience the interactive teaching style, pace, and classroom discipline before taking formal admission.',
      highlight: '2 Free Trial / Demo Classes Available'
    },
    {
      id: 'faq_4',
      category: 'academics',
      categoryLabel: 'Batch Timings',
      question: 'What are the daily class timings and batch sizes?',
      answer: 'We operate both Morning batches (6:30 AM to 9:30 AM) and Evening batches (3:30 PM to 8:00 PM). Each batch is strictly capped at 20–25 students to ensure that every individual student receives direct personal guidance and prompt doubt resolution.',
      highlight: 'Max 25 students per batch for personal focus'
    },
    {
      id: 'faq_5',
      category: 'portal',
      categoryLabel: 'Student Portal',
      question: 'How do students and teachers receive their login credentials?',
      answer: 'All student and teacher login accounts are centrally generated and authorized by the Institute Administration. When a student completes batch registration, they are issued a secure unique Student ID and Password to submit homework and track attendance.',
      highlight: 'Admin-issued secure student credentials'
    },
    {
      id: 'faq_6',
      category: 'general',
      categoryLabel: 'Attendance & Alerts',
      question: 'How is attendance recorded and communicated to parents?',
      answer: 'Classroom attendance is logged digitally at the beginning of every offline session. Students and parents can log into the student portal anytime to view daily presence logs, leave records, and attendance percentages with complete transparency.',
      highlight: 'Real-time attendance tracking'
    },
    {
      id: 'faq_7',
      category: 'academics',
      categoryLabel: 'Tests & Progress',
      question: 'How often are tests conducted to prepare for board exams?',
      answer: 'We conduct weekly chapter-end objective & subjective quizzes, alongside comprehensive monthly syllabus mock exams modeled directly on official board papers. Detailed answer sheets with mark breakdowns are returned to students to identify weak spots.',
      highlight: 'Weekly chapter tests & monthly full-length mocks'
    },
    {
      id: 'faq_8',
      category: 'general',
      categoryLabel: 'Missed Classes',
      question: 'What happens if a student misses a lecture due to illness or emergency?',
      answer: 'Because daily concept summaries, formulas, and homework questions are digitally published in the portal, absent students can immediately review what was taught in class and clear their doubts during the special 15-minute pre-class doubt window the following day.',
      highlight: 'Digital class diary prevents backlog'
    },
    {
      id: 'faq_9',
      category: 'admissions',
      categoryLabel: 'Direct Contact',
      question: 'How can parents schedule a direct meeting with Sir Aihsan Ansari?',
      answer: 'Parents are warmly welcome to visit the coaching center during office hours (Monday to Saturday between 11:30 AM – 2:30 PM or after 7:30 PM). You can also call or message on WhatsApp at +91 9905847357 to book a convenient time slot.',
      highlight: 'Direct open parent-teacher communication'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'admissions', label: 'Admissions & Demo' },
    { id: 'academics', label: 'Batches & Timings' },
    { id: 'homework', label: 'Daily Homework' },
    { id: 'portal', label: 'Student Portal' },
    { id: 'general', label: 'Attendance & Support' }
  ];

  const filteredFaqs = useMemo(() => {
    return faqList.filter(item => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.question.toLowerCase().includes(q) || 
        item.answer.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200/80 pt-12 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>Help Desk & Student Guide</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h1>
          
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Everything you need to know about offline classroom batches, daily homework submissions, trial lectures, and student portal access.
          </p>

          {/* Search Bar */}
          <div className="pt-4 max-w-xl mx-auto">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by topic, e.g. 'homework', 'timings', 'demo'..."
                className="w-full pl-11 pr-4 py-3 text-sm rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-full w-5 h-5 flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion List */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No matching questions found</h3>
            <p className="text-xs text-slate-500">
              Try searching with different keywords, or reach out to us directly on WhatsApp.
            </p>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ask on WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFaqs.map((item, idx) => {
              const isOpen = expandedId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: idx * 0.03 }}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen 
                      ? 'bg-white border-blue-300 shadow-md shadow-blue-500/5 ring-1 ring-blue-100' 
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                          {item.categoryLabel}
                        </span>
                        {item.highlight && (
                          <span className="text-[11px] font-semibold text-emerald-700 hidden sm:inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-emerald-500" />
                            {item.highlight}
                          </span>
                        )}
                      </div>
                      <h3 className={`text-sm sm:text-base font-bold transition-colors ${
                        isOpen ? 'text-blue-700' : 'text-slate-900'
                      }`}>
                        {item.question}
                      </h3>
                    </div>

                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-500'
                    }`}>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 space-y-3"
                      >
                        <p>{item.answer}</p>
                        {item.highlight && (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{item.highlight}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick Contact Box at the bottom */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h3 className="text-lg font-black tracking-tight">Still have questions?</h3>
            <p className="text-xs sm:text-sm text-blue-100 max-w-md">
              Speak directly with faculty {teacherTitle} regarding trial classes, batch availability, or student progress.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-white text-blue-900 hover:bg-blue-50 text-xs font-extrabold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Us</span>
            </a>

            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-3 rounded-xl bg-blue-600/80 hover:bg-blue-600 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>View Contact Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
