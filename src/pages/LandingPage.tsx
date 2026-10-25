import React, { useState } from 'react';
import { motion, useScroll, AnimatePresence } from 'motion/react';
import { useUiText } from '../context/UiTextContext';
import { apiFetch } from '../api';
import { 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  Phone, 
  MapPin, 
  Users, 
  BookOpen, 
  ShieldCheck, 
  X, 
  MessageCircle, 
  Clock, 
  Sparkles, 
  Send, 
  User, 
  HelpCircle, 
  ChevronDown, 
  Mail, 
  Navigation,
  ExternalLink
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string, extra?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { uiTexts } = useUiText();
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  const phoneRaw = uiTexts.contactPhone || '9905847357';
  const cleanPhone = phoneRaw.replace(/\D/g, '');
  const teacherTitle = uiTexts.heroTitle || 'AIHSAN ANSARI';
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(teacherTitle)},%20I%20want%20information%20about%20offline%20tuition%20classes.`;

  // Inquiry Form State
  const [inqName, setInqName] = useState('');
  const [inqPhone, setInqPhone] = useState('');
  const [inqClass, setInqClass] = useState('Class 10');
  const [inqSubjects, setInqSubjects] = useState('Mathematics & Science');
  const [inqMessage, setInqMessage] = useState('');
  const [submittingInq, setSubmittingInq] = useState(false);
  const [inqSuccessMsg, setInqSuccessMsg] = useState<string | null>(null);
  const [inqErrorMsg, setInqErrorMsg] = useState<string | null>(null);

  // FAQ Accordion State for Landing Page Section
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const landingFaqs = [
    {
      q: 'Which classes and subjects are taught in offline batches?',
      a: 'We teach Classes 8, 9, 10 (Foundation & Boards) and Classes 11, 12 (Science / PCM & PCB). Special emphasis is on Mathematics, Physics, Chemistry, Biology, and foundational grammar drills aligned with NCERT, CBSE, and State Board curriculum.'
    },
    {
      q: 'How does the daily homework checking and class diary work?',
      a: 'After every offline class, Sir Aihsan Ansari publishes the "Aaj Class Mein Kya Padhaya Gaya" daily concept summary and assigned questions into the portal. Students solve the problems in their fair notebooks, submit clear photos, and receive verified marks and corrections before the next day\'s lecture.'
    },
    {
      q: 'Can prospective students attend a trial demo class?',
      a: 'Yes, we offer 2 complimentary trial lectures so that students and parents can evaluate our teaching style, conceptual clarity, and classroom discipline before taking formal admission.'
    },
    {
      q: 'What are the batch timings and maximum student capacity?',
      a: 'We offer both Morning sessions (6:30 AM – 9:30 AM) and Evening sessions (3:30 PM – 8:00 PM). Each batch is strictly capped at 20–25 students to guarantee individual attention.'
    },
    {
      q: 'How do students get access to homework if they are absent?',
      a: 'Every student receives a portal login. Absent students can immediately log in to see the exact lecture summary and homework questions assigned that day, preventing any academic backlog.'
    }
  ];

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inqName.trim() || !inqPhone.trim()) {
      setInqErrorMsg('Kripya apna naam aur phone number darj karein.');
      return;
    }

    setSubmittingInq(true);
    setInqErrorMsg(null);
    setInqSuccessMsg(null);

    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          studentName: inqName.trim(),
          phone: inqPhone.trim(),
          classInterested: inqClass,
          subjects: inqSubjects,
          message: inqMessage.trim()
        })
      });

      setInqSuccessMsg('Dhanyawad! Aapki inquiry darj kar li gayi hai. Teacher jald hi aapse sampark karenge.');
      setInqName('');
      setInqPhone('');
      setInqMessage('');
    } catch (err: any) {
      setInqErrorMsg(err.message || 'Inquiry submit karne me asuvidha hui. Kripya punah prayas karein.');
    } finally {
      setSubmittingInq(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white relative">
      {/* Scroll Progress Bar at the top */}
      <motion.div
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 z-50 origin-left pointer-events-none"
      />

      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:py-20 border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Heading + Subtitle + Action Buttons */}
            <div className="lg:col-span-7 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Offline Coaching & Daily Homework Platform</span>
              </motion.div>

              {/* Main Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.35 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight"
              >
                {teacherTitle}
              </motion.h1>

              {/* Crisp Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
              >
                {uiTexts.heroTagline || 'Quality offline tuition for Classes 6 to 12 with daily homework checking and verified student progress.'}
              </motion.p>

              {/* Action Buttons: Explore Classes + FAQ + Contact Us + WhatsApp */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.35, delay: 0.1 }}
                className="flex flex-wrap items-center gap-3 pt-2"
              >
                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => onNavigate('classes-info')}
                  className="px-6 py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-white" />
                  <span>Explore Batches & Classes</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => onNavigate('faq')}
                  className="px-5 py-3.5 text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Frequently Asked Questions</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => onNavigate('contact')}
                  className="px-5 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-blue-700 hover:border-blue-300 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4 text-slate-600" />
                  <span>Contact & Center</span>
                </motion.button>

                <motion.a
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 text-sm font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </motion.a>
              </motion.div>
            </div>

            {/* Right Column: Admission Inquiry Desk */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.35, delay: 0.08 }}
              className="lg:col-span-5"
            >
              <div className="p-6 rounded-3xl bg-white border-2 border-blue-200/80 shadow-xl shadow-blue-500/5 space-y-4 relative overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-950">Admission Inquiry Desk</h3>
                      <p className="text-[11px] text-slate-500">Pravesh Puchtach & Batch Booking</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                    ● Admissions Open
                  </span>
                </div>

                {/* Success Banner */}
                {inqSuccessMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold">Inquiry Successfully Registered!</div>
                      <div className="text-[11px] text-emerald-700 mt-0.5">{inqSuccessMsg}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInqSuccessMsg(null)}
                      className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                )}

                {/* Error Banner */}
                {inqErrorMsg && (
                  <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <X className="w-4 h-4 shrink-0" />
                    <span>{inqErrorMsg}</span>
                  </div>
                )}

                {/* Quick Inquiry Form */}
                <form onSubmit={handleInquirySubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Student / Parent Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={inqName}
                        onChange={e => setInqName(e.target.value)}
                        placeholder="e.g. Rahul Sharma / S.K. Sharma"
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Phone / WhatsApp *
                      </label>
                      <div className="relative">
                        <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={inqPhone}
                          onChange={e => setInqPhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Target Class *
                      </label>
                      <select
                        value={inqClass}
                        onChange={e => setInqClass(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        <option value="Class 10">Class 10 (Board Batch)</option>
                        <option value="Class 9">Class 9 (Foundation)</option>
                        <option value="Class 8">Class 8 (Pre-Foundation)</option>
                        <option value="Class 11">Class 11 (Science / PCM)</option>
                        <option value="Class 12">Class 12 (Board & Entrance)</option>
                        <option value="Class 6-7">Class 6 & 7 (Junior)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Preferred Subject / Inquiry Message
                    </label>
                    <input
                      type="text"
                      value={inqMessage}
                      onChange={e => setInqMessage(e.target.value)}
                      placeholder="e.g. Mathematics, batch timings & trial class"
                      className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="pt-1 flex flex-col sm:flex-row items-center gap-2">
                    <button
                      type="submit"
                      disabled={submittingInq}
                      className="w-full sm:flex-1 py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submittingInq ? 'Submitting...' : 'Submit Inquiry'}</span>
                    </button>

                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto py-2.5 px-3.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      title="Chat directly on WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </form>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Free demo class on enrollment</span>
                  </span>
                  <button
                    onClick={() => onNavigate('contact')}
                    className="font-semibold text-blue-600 hover:underline cursor-pointer"
                  >
                    View All Details →
                  </button>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS */}
      <section className="py-16 border-b border-slate-200/80 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-xl mx-auto mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How It Works
            </h2>
            <p className="text-sm text-slate-600 mt-2">
              A disciplined daily routine designed for conceptual clarity and high board scores.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Classroom Lecture',
                desc: 'Every topic and formula is explained step-by-step on the board with regular doubt clearing.'
              },
              {
                step: '02',
                title: 'Daily Homework',
                desc: 'Students practice questions daily in fair notebooks and get verified checking with marks.'
              },
              {
                step: '03',
                title: 'Progress Tracking',
                desc: 'Regular tests, attendance monitoring, and clear student progress reports with zero confusion.'
              }
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.3, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center border border-blue-200">
                  {item.step}
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* 3. CURRICULUM & ACADEMIC BATCHES (Replaces old Fee Section) */}
      <section className="py-16 border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
          >
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full mb-1 border border-blue-100">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Academic Batches & Syllabus</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Structured Classes & Batches
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Small batch sizes, daily concept summaries, and disciplined board exam preparation.
              </p>
            </div>
            <button
              onClick={() => onNavigate('classes-info')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View full schedule & syllabus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Class 10 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-blue-50/60 border border-blue-200 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold text-blue-700 uppercase bg-blue-100 px-2 py-0.5 rounded">
                  Class 10 Board Batch
                </span>
                <h3 className="text-lg font-bold text-slate-900">Foundation & Boards</h3>
                <p className="text-xs text-slate-600">
                  Mathematics and Science with NCERT drills, daily homework correction, and full-length mock tests.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily Homework with Teacher Remarks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Weekly chapter tests & previous papers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Morning & Evening slots available</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Batch Capacity</span>
                  <div className="text-xs font-bold text-slate-800">
                    Max 25 Students
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer"
                >
                  Inquire Now
                </button>
              </div>
            </motion.div>

            {/* Card 2: Class 8 & 9 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.3, delay: 0.06 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  Class 8 & 9
                </span>
                <h3 className="text-lg font-bold text-slate-900">Junior Foundation</h3>
                <p className="text-xs text-slate-600">
                  Strong fundamentals in Mathematics, Science, and English grammar for secondary school excellence.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>4 to 5 days weekly offline lectures</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Personal doubt solving sessions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Step-by-step NCERT exercise practice</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Batch Capacity</span>
                  <div className="text-xs font-bold text-slate-800">
                    Max 20 Students
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Inquire Now
                </button>
              </div>
            </motion.div>

            {/* Card 3: Class 11-12 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 0.3, delay: 0.12 }}
              whileHover={{ y: -4 }}
              className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="text-[11px] font-mono font-bold text-slate-600 uppercase bg-slate-100 px-2 py-0.5 rounded">
                  Class 11 & 12
                </span>
                <h3 className="text-lg font-bold text-slate-900">Senior Science / PCM</h3>
                <p className="text-xs text-slate-600">
                  Physics, Chemistry, and Advanced Mathematics focusing on rigorous board scoring and entrance fundamentals.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Targeted numerical problem sets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Previous 10-year question bank analysis</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Exam-timed speed drills</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Batch Capacity</span>
                  <div className="text-xs font-bold text-slate-800">
                    Max 20 Students
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Inquire Now
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 4. INTERACTIVE FAQ SECTION (NEW) */}
      <section id="faq" className="py-16 border-b border-slate-200/80 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-xl mx-auto mb-10 space-y-2"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Got Questions? We Have Answers</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-slate-600">
              Common questions answered about offline batches, daily homework submissions, trial classes, and faculty mentorship.
            </p>
          </motion.div>

          <div className="space-y-3">
            {landingFaqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isOpen
                      ? 'bg-white border-blue-300 shadow-md shadow-blue-500/5 ring-1 ring-blue-100'
                      : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span className={`text-sm sm:text-base font-bold transition-colors ${
                      isOpen ? 'text-blue-700' : 'text-slate-900'
                    }`}>
                      {faq.q}
                    </span>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
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
                        transition={{ duration: 0.2 }}
                        className="px-4 sm:px-5 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('faq')}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <span>View All Questions on FAQ Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </section>

      {/* 5. FACULTY / ABOUT TEACHER */}
      <section className="py-16 border-b border-slate-200/80 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35 }}
            className="text-center max-w-xl mx-auto mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Meet the Faculty
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Direct mentorship and offline classroom teaching.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35 }}
            className="p-6 sm:p-8 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-6"
          >
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden shadow-lg ring-4 ring-blue-500/20 border-2 border-white shrink-0 bg-slate-900 group">
              <img
                src="/assets/teacher_photo.png"
                alt={teacherTitle}
                className="w-full h-full object-cover object-[center_18%] group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/Screenshot_20260828-105016_Instagram_b94f6325.png';
                }}
              />
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <h3 className="text-xl font-bold text-slate-900">{teacherTitle}</h3>
              <p className="text-xs font-semibold text-blue-700">
                {uiTexts.teacherTitle || 'Senior Mathematics & Science Faculty'}
              </p>
              <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                {uiTexts.teacherBio || 'Dedicated to building strong foundational concepts in Science and Mathematics for board exam toppers and competitive aspirants.'}
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-700">
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>+91 {phoneRaw}</span>
                </a>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Offline Classroom Batch</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>Morning & Evening Sessions</span>
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 6. CONTACT & COACHING CENTER SECTION (NEW DEDICATED SECTION) */}
      <section id="contact" className="py-16 bg-slate-50 border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              <span>Admissions & Center Desk</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Contact & Classroom Details
            </h2>
            <p className="text-sm text-slate-600">
              Reach out directly to Sir Aihsan Ansari for batch schedules, seat availability, or classroom visits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Phone & WhatsApp Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Call & WhatsApp</h3>
              <p className="text-xs text-slate-500">
                Direct contact line for student admissions and parent queries.
              </p>
              <div className="pt-2 space-y-2">
                <a
                  href={`tel:${cleanPhone}`}
                  className="block text-sm font-bold text-blue-600 hover:text-blue-800"
                >
                  +91 {phoneRaw}
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Classroom Address Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Coaching Center</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {uiTexts.contactAddress || 'Cabin 304, Sharda Complex, Near City Library, MG Road, Pune, Maharashtra 411001'}
              </p>
              <div className="pt-2">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(uiTexts.contactAddress || 'Prerna Tuition Academy')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline"
                >
                  <span>Google Maps Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Operating Hours Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Class & Office Hours</h3>
              <p className="text-xs text-slate-500">
                Morning: 6:30 AM – 9:30 AM<br />
                Evening: 3:30 PM – 8:30 PM
              </p>
              <div className="pt-2 text-xs font-semibold text-emerald-700">
                Sunday: Special Doubt Sessions & Mock Tests
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => onNavigate('contact')}
              className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <span>Open Dedicated Contact & Inquiry Desk</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </section>

      {/* 7. CLEAN FOOTER */}
      <footer className="py-8 bg-slate-50 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {teacherTitle}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('classes-info')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Batches & Classes
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigate('faq')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              FAQ
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigate('contact')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Contact Us
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigate('homework-gate')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Homework
            </button>
            <span>·</span>
            <button
              onClick={() => onNavigate('login')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Portal Login
            </button>
            <span>·</span>
            <button
              onClick={() => setIsPrivacyModalOpen(true)}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Action Button Dock: WhatsApp Quick Button */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50">
        <motion.a
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          className="flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-600/30 font-bold text-xs cursor-pointer border border-white/20"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp (+91 {phoneRaw})</span>
        </motion.a>
      </div>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Privacy Policy</h4>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              We respect your privacy. Contact details provided for admission inquiries are used solely to communicate batch schedules and homework tracking for offline coaching. No data is shared with third parties.
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
