import React, { useState } from 'react';
import { motion, useScroll } from 'motion/react';
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
  Check,
  PhoneCall,
  Plus,
  HelpCircle,
  Calendar,
  User
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

      {/* 1. HERO SECTION: Clean 1 Heading + 1 Subheading + 2 Clear Actions */}
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

              {/* 1 Main Clean Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.35 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight"
              >
                {teacherTitle}
              </motion.h1>

              {/* 1 Crisp Sub-heading (Description) */}
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false }}
                transition={{ duration: 0.35, delay: 0.05 }}
                className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal"
              >
                {uiTexts.heroTagline || 'Quality offline tuition for Classes 6 to 12 with daily homework checking and verified student progress.'}
              </motion.p>

              {/* Action Buttons: Blue button + Secondary WhatsApp button */}
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
                  <span>{uiTexts.heroCtaExploreClasses || 'Explore Classes & Fees'}</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </motion.button>

                <motion.a
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3.5 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:text-emerald-700 hover:border-emerald-300 shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>Chat on WhatsApp</span>
                </motion.a>
              </motion.div>
            </div>

            {/* Right Column: Admission Inquiry Desk (In place of Coaching Overview) */}
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
                      className="text-emerald-700 hover:text-emerald-900"
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
                      placeholder="e.g. Mathematics, batch timings & fee details"
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
                  <span className="font-semibold text-slate-600">
                    Offline Classroom Batch
                  </span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* 2. HOW IT WORKS: 1 Clean Heading + 1 Subheading + 3 Simple Cards */}
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
                desc: 'Regular tests, attendance monitoring, and clear automated fee records with zero confusion.'
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

      {/* 3. CLASSES & FEES: 1 Clean Heading + 1 Subheading + 3 Simple Cards */}
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
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Classes & Fee Structure
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Transparent monthly fees with daily homework checking and tests.
              </p>
            </div>
            <button
              onClick={() => onNavigate('classes-info')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>View full syllabus</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Class 8-10 */}
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
                  Mathematics and Science with NCERT drills and full-length mock tests.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily Homework with Teacher Remarks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Weekly chapter tests</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Monthly Fee:</span>
                  <div className="font-mono text-xl font-extrabold text-blue-700">
                    ₹2,500<span className="text-xs text-slate-500 font-normal"> / mo</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('classes-info')}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl transition-colors cursor-pointer"
                >
                  Enroll Now
                </button>
              </div>
            </motion.div>

            {/* Card 2: Class 9 */}
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
                  Strong fundamentals in Mathematics, Science, and English grammar.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>4 days weekly classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Individual doubt solving</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Monthly Fee:</span>
                  <div className="font-mono text-xl font-extrabold text-slate-900">
                    ₹2,200<span className="text-xs text-slate-500 font-normal"> / mo</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('classes-info')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Enroll Now
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
                <h3 className="text-lg font-bold text-slate-900">Senior PCM Batch</h3>
                <p className="text-xs text-slate-600">
                  Physics, Chemistry, and Advanced Mathematics for boards & entrances.
                </p>
                <div className="space-y-1.5 pt-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Targeted numerical problem sets</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Previous 10-year question banks</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-medium">Monthly Fee:</span>
                  <div className="font-mono text-xl font-extrabold text-slate-900">
                    ₹3,500<span className="text-xs text-slate-500 font-normal"> / mo</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('classes-info')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Enroll Now
                </button>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 4. FACULTY / ABOUT: 1 Clean Heading + 1 Subheading + Simple Info */}
      <section className="py-16 border-b border-slate-200/80 bg-slate-50">
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
            className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-6"
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
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>+91 {phoneRaw}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  <span>Offline Classroom Batch</span>
                </span>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* 5. DIRECT CONTACT & WHATSAPP: 1 Clean Heading + 1 Subheading */}
      <section className="py-16 bg-white border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35 }}
            className="space-y-2"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Have Questions? Contact Directly
            </h2>
            <p className="text-sm text-slate-600">
              Call or message on WhatsApp for trial classes, batch schedules, and fee details.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="flex flex-wrap items-center justify-center gap-4 pt-2"
          >
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat on WhatsApp (+91 {phoneRaw})</span>
            </a>

            <a
              href={`tel:${cleanPhone}`}
              className="px-6 py-3.5 text-sm font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <Phone className="w-4 h-4 text-slate-600" />
              <span>Call Directly</span>
            </a>
          </motion.div>
        </div>
      </section>

      {/* 6. CLEAN FOOTER */}
      <footer className="py-8 bg-slate-50 text-slate-500 text-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 {teacherTitle}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('classes-info')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Classes & Fees
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

      {/* Floating WhatsApp Quick Button */}
      <motion.a
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-600/30 font-bold text-xs cursor-pointer"
      >
        <MessageCircle className="w-4 h-4" />
        <span>WhatsApp</span>
      </motion.a>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm">Privacy Policy</h4>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
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
