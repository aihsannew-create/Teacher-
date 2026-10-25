import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Phone, 
  MapPin, 
  Mail, 
  Clock, 
  MessageCircle, 
  Send, 
  CheckCircle2, 
  X, 
  User, 
  GraduationCap, 
  ShieldCheck, 
  ExternalLink,
  Navigation,
  Sparkles
} from 'lucide-react';
import { useUiText } from '../context/UiTextContext';
import { apiFetch } from '../api';

interface ContactPageProps {
  onNavigate: (view: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { uiTexts } = useUiText();

  const phoneRaw = uiTexts.contactPhone || '9905847357';
  const cleanPhone = phoneRaw.replace(/\D/g, '');
  const teacherTitle = uiTexts.heroTitle || 'AIHSAN ANSARI';
  const whatsappUrl = `https://wa.me/91${cleanPhone}?text=Hello%20${encodeURIComponent(teacherTitle)},%20I%20want%20to%20enquire%20about%20offline%20tuition%20classes.`;

  // Contact Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    targetClass: 'Class 10',
    subjects: 'Mathematics & Science',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      setErrorMsg('Kripya apna poora naam aur phone number darj karein.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          studentName: formData.name.trim(),
          phone: formData.phone.trim(),
          classInterested: formData.targetClass,
          subjects: formData.subjects,
          message: formData.message.trim()
        })
      });

      setSuccessMsg('Dhanyawad! Aapki inquiry darj kar li gayi hai. Sir Aihsan Ansari jald hi aapse sampark karenge.');
      setFormData({
        name: '',
        phone: '',
        targetClass: 'Class 10',
        subjects: 'Mathematics & Science',
        message: ''
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Inquiry submit karne me asuvidha hui. Kripya WhatsApp ya phone par seedha sampark karein.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header Banner */}
      <section className="bg-white border-b border-slate-200/80 pt-12 pb-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
            <Phone className="w-3.5 h-3.5 text-blue-600" />
            <span>Direct Faculty Contact & Admissions</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
            Get in Touch with {teacherTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            Reach out directly for trial lectures, batch seat availability, or visit our offline classroom center.
          </p>
        </div>
      </section>

      {/* Main Grid: Contact Details & Interactive Inquiry Form */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Contact Cards & Center Info (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Faculty Quick Card */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md ring-2 ring-blue-500/20 shrink-0 bg-slate-900">
                  <img
                    src="/assets/teacher_photo.png"
                    alt={teacherTitle}
                    className="w-full h-full object-cover object-[center_18%]"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/Screenshot_20260828-105016_Instagram_b94f6325.png';
                    }}
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{teacherTitle}</h3>
                  <p className="text-xs font-semibold text-blue-600">Senior Faculty & Founder</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Classes 8 to 12 (Maths & Science)</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={`tel:${cleanPhone}`}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-blue-200/80 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  <span>Call Directly</span>
                </a>

                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200/80 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Contact Details List */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Contact Channels
              </h4>

              <div className="space-y-3.5">
                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">Primary Phone / WhatsApp</div>
                    <a
                      href={`tel:${cleanPhone}`}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      +91 {phoneRaw}
                    </a>
                    <div className="text-[11px] text-slate-500">Available 7:00 AM – 9:00 PM</div>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">Official Email</div>
                    <a
                      href={`mailto:${uiTexts.contactEmail || 'contact@prerna.edu'}`}
                      className="text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {uiTexts.contactEmail || 'contact@prerna.edu'}
                    </a>
                    <div className="text-[11px] text-slate-500">For academic & administrative queries</div>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">Classroom Location</div>
                    <div className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
                      {uiTexts.contactAddress || 'Cabin 304, Sharda Complex, Near City Library, MG Road, Pune, Maharashtra 411001'}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium mt-1">
                      Near public transport & landmark parking
                    </div>
                  </div>
                </div>

                {/* Operating Timings */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 border border-slate-200">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-slate-400">Classroom & Office Hours</div>
                    <div className="text-xs font-semibold text-slate-800">
                      Monday to Saturday: 6:30 AM – 8:30 PM
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Sunday: Special Doubt Clearing & Test Sessions
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Directions Card */}
            <div className="p-6 rounded-3xl bg-blue-50/70 border border-blue-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-blue-600" />
                  <span>Offline Center Directions</span>
                </span>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  Walk-ins Welcome
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Parents and students are welcome to visit during open office hours (11:30 AM – 2:30 PM or after 7:30 PM) for in-person consultation and classroom viewing.
              </p>
              <div className="pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(uiTexts.contactAddress || 'Prerna Tuition Academy')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  <span>Open in Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Admission & Inquiry Desk (7 cols) */}
          <div className="lg:col-span-7">
            <div className="p-7 sm:p-8 rounded-3xl bg-white border-2 border-blue-200/80 shadow-xl shadow-blue-500/5 space-y-6">
              
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    <span>Admissions Open for New Session</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900">
                    Send Direct Admission Inquiry
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fill the form below and Sir Aihsan Ansari will personally respond with batch timings and demo class schedule.
                  </p>
                </div>
              </div>

              {/* Success Notification */}
              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-bold text-sm">Inquiry Received Successfully!</div>
                    <div className="text-xs text-emerald-700 mt-1 leading-relaxed">{successMsg}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSuccessMsg(null)}
                    className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {/* Error Notification */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Student / Parent Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Rahul Sharma / S.K. Sharma"
                      className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Phone / WhatsApp Number *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Class Level *
                    </label>
                    <div className="relative">
                      <select
                        value={formData.targetClass}
                        onChange={e => setFormData({ ...formData, targetClass: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 font-semibold"
                      >
                        <option value="Class 10">Class 10 (Board Exam Batch)</option>
                        <option value="Class 9">Class 9 (Foundation)</option>
                        <option value="Class 8">Class 8 (Pre-Foundation)</option>
                        <option value="Class 11">Class 11 (Science / PCM)</option>
                        <option value="Class 12">Class 12 (Board & Entrances)</option>
                        <option value="Class 6-7">Class 6 & 7 (Junior Batch)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Subjects of Interest
                  </label>
                  <input
                    type="text"
                    value={formData.subjects}
                    onChange={e => setFormData({ ...formData, subjects: e.target.value })}
                    placeholder="e.g. Mathematics, Science, Physics, Chemistry"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Any Specific Message or Preferred Batch Timing
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    placeholder="e.g. Looking for morning batch, need trial class for mathematics..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 transition-all font-medium resize-none"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:flex-1 py-3 px-6 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting Inquiry...' : 'Submit Inquiry'}</span>
                  </button>

                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-3 px-5 text-xs sm:text-sm font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>
              </form>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <span>2 Free Trial / Demo Classes included</span>
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('faq')}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Have questions? Read FAQ →
                </button>
              </div>

            </div>
          </div>

        </div>
      </section>
    </div>
  );
};
