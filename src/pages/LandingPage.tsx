import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, CheckCircle2, ArrowRight, Phone, MapPin, Users, Calendar, ShieldCheck, ChevronDown, ChevronUp, X, HelpCircle, MessageCircle } from 'lucide-react';

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Hindi'
];

const FAQ_ITEMS = [
  {
    q: "How does daily homework submission and checking work?",
    a: "After every physical lecture, the teacher publishes daily key concepts. Students solve the practice problems in their notebooks, upload photos or PDFs directly through their student login, and receive verified marks and corrections before the next day's lecture."
  },
  {
    q: "Which classes and subjects are covered?",
    a: "We provide comprehensive coaching for Mathematics, Science (Physics, Chemistry, Biology), English, and Hindi for Classes 8, 9, 10, 11, and 12 across CBSE, ICSE, and State Boards."
  },
  {
    q: "How can parents and students track fee payments and attendance?",
    a: "The portal automatically tracks attendance daily and provides computer-generated fee receipts, active membership validity dates, and advance renewal reminders with zero manual calculation errors."
  },
  {
    q: "How can I contact for admissions or offline classroom visits?",
    a: "You can reach out directly to AIHSAN ANSARI via phone or WhatsApp at +91 99058 47357 for trial class bookings, batch schedules, and fee details."
  },
  {
    q: "Who provides login credentials for students and teachers?",
    a: "All logins are generated and managed strictly by the Institute Owner through the administrative cabin to ensure authorized, secure access."
  }
];

interface RollingCounterProps {
  end: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}

const RollingCounter: React.FC<RollingCounterProps> = ({
  end,
  decimals = 0,
  suffix = '',
  duration = 1800,
}) => {
  const [count, setCount] = useState(0);
  const [key, setKey] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let animId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(ease * end);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [end, duration, key]);

  // Periodic rolling animation every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setKey((prev) => prev + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span
      className="inline-block transition-transform duration-300 hover:scale-105 cursor-pointer"
      onClick={() => setKey((k) => k + 1)}
      title="Click to roll"
    >
      <span>{decimals > 0 ? count.toFixed(decimals) : Math.round(count)}</span>
      <span>{suffix}</span>
    </span>
  );
};

interface LandingPageProps {
  onNavigate: (view: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [subjectIndex, setSubjectIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [enquirySubmitted, setEnquirySubmitted] = useState(false);
  const [whatsappEnquiryUrl, setWhatsappEnquiryUrl] = useState('');
  const [enquiryForm, setEnquiryForm] = useState({
    studentName: '',
    fatherName: '',
    phone: '',
    className: 'Class 10',
    age: ''
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setSubjectIndex((prev) => (prev + 1) % SUBJECTS.length);
        setIsAnimating(false);
      }, 300);
    }, 2200);

    return () => clearInterval(timer);
  }, []);

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const message = `*New Admission Enquiry - Prerna Tuition*\n\n` +
      `👤 *Student Name:* ${enquiryForm.studentName}\n` +
      `👨‍👦 *Father Name:* ${enquiryForm.fatherName}\n` +
      `📱 *Phone Number:* ${enquiryForm.phone}\n` +
      `📚 *Class:* ${enquiryForm.className}\n` +
      `🎂 *Age:* ${enquiryForm.age} Years\n\n` +
      `_Sent via Online Admission Portal_`;

    const waUrl = `https://wa.me/919905847357?text=${encodeURIComponent(message)}`;
    setWhatsappEnquiryUrl(waUrl);
    setEnquirySubmitted(true);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/70 via-slate-50 to-white text-slate-800 selection:bg-blue-600 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-blue-100/80">
        {/* Soft atmospheric blue glows in background */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-20 left-10 w-80 h-80 bg-indigo-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-slate-900 leading-tight">
                  AIHSAN ANSARI
                </h1>
                <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl font-normal">
                  A simple tool for teachers to manage assignments and for students to stay on top of their work.
                </p>
              </div>

              {/* Animated cycling subjects */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/95 border border-blue-200/80 shadow-xs backdrop-blur-md">
                  <span className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Subjects:
                  </span>
                  <span className="min-w-[150px] sm:min-w-[190px] h-7 sm:h-8 flex items-center">
                    <span
                      className={`text-lg sm:text-2xl font-black bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent transform transition-all duration-300 ease-out inline-block ${
                        isAnimating
                          ? 'opacity-0 -translate-y-2 scale-95'
                          : 'opacity-100 translate-y-0 scale-100'
                      }`}
                    >
                      {SUBJECTS[subjectIndex]}
                    </span>
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigate('contact')}
                  className="px-5 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
                >
                  <span>Enroll for Offline Coaching</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('login')}
                  className="px-5 py-3 text-sm font-semibold text-slate-700 bg-white/90 border border-slate-200/90 rounded-xl hover:bg-white hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                >
                  Login
                </button>
              </div>

              {/* Trust markers */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-blue-100/90 text-xs">
                <div className="p-3 rounded-xl bg-white/80 border border-blue-100/80 shadow-xs hover:border-blue-200 transition-all">
                  <div className="font-mono text-xl font-extrabold text-blue-700 tabular-nums">
                    <RollingCounter end={10} suffix="+" />
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 font-medium">Years Board Coaching</div>
                </div>
                <div className="p-3 rounded-xl bg-white/80 border border-blue-100/80 shadow-xs hover:border-blue-200 transition-all">
                  <div className="font-mono text-xl font-extrabold text-blue-700 tabular-nums">
                    <RollingCounter end={98.4} decimals={1} suffix="%" />
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 font-medium">Board Pass Excellence</div>
                </div>
                <div className="p-3 rounded-xl bg-white/80 border border-blue-100/80 shadow-xs hover:border-blue-200 transition-all">
                  <div className="font-mono text-xl font-extrabold text-blue-700 tabular-nums">
                    <RollingCounter end={25} suffix=" Max" />
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5 font-medium">Students Per Batch</div>
                </div>
              </div>
            </div>

            {/* Right Card: Quick Admission Enquiry in Frosted Glass */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-xl border border-blue-100 shadow-[0_15px_40px_-5px_rgba(37,99,235,0.08)] relative">
                <div className="flex items-center justify-between pb-4 border-b border-blue-100/80">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Admission Enquiry</h3>
                    <p className="text-xs text-slate-500">Direct admission enquiry via WhatsApp</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.541 1.879.82 2.796.82 3.183 0 5.769-2.587 5.77-5.767 0-3.181-2.587-5.767-5.77-5.767zm7.647 5.766c-.001 4.225-3.438 7.662-7.663 7.662-1.309 0-2.522-.333-3.585-.915l-4.43 1.162 1.183-4.321c-.692-1.124-1.066-2.42-1.067-3.754 0-4.225 3.438-7.662 7.663-7.662 4.226.001 7.663 3.438 7.663 7.662zm-3.526 2.378c-.198-.1-.1.171-1.162-.486-.234-.117-.404-.175-.575.087-.171.263-.666.837-.816 1.01-.15.176-.3.198-.498.1-.198-.1-.837-.308-1.595-.984-.59-.526-.988-1.176-1.104-1.374-.117-.198-.012-.305.086-.403.088-.088.198-.234.297-.35.099-.117.132-.198.198-.332.066-.134.033-.25-.017-.35-.05-.1-.448-1.077-.614-1.476-.162-.388-.326-.335-.448-.341l-.382-.007c-.132 0-.348.05-.53.25-.183.2-.698.682-.698 1.664s.714 1.93 1.014 2.33c.3.4 1.405 2.146 3.404 3.008.476.206.848.329 1.138.421.478.152.913.131 1.258.079.385-.057 1.183-.483 1.349-.95.166-.466.166-.866.116-.95-.05-.084-.182-.134-.38-.233z" />
                    </svg>
                  </div>
                </div>

                {enquirySubmitted ? (
                  <div className="py-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-900">Enquiry Sent to WhatsApp!</h4>
                    <p className="text-xs text-slate-600">
                      Aapki enquiry <strong>AIHSAN ANSARI (+91 99058 47357)</strong> ke WhatsApp par bhej di gayi hai.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1">
                      <div><span className="text-slate-500 font-medium">Student:</span> <strong className="text-slate-900">{enquiryForm.studentName}</strong></div>
                      <div><span className="text-slate-500 font-medium">Father:</span> <strong className="text-slate-900">{enquiryForm.fatherName}</strong></div>
                      <div><span className="text-slate-500 font-medium">Phone:</span> <strong className="text-slate-900">{enquiryForm.phone}</strong></div>
                      <div><span className="text-slate-500 font-medium">Class:</span> <strong className="text-slate-900">{enquiryForm.className}</strong> (Age: {enquiryForm.age} yrs)</div>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                      <a
                        href={whatsappEnquiryUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-4 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.541 1.879.82 2.796.82 3.183 0 5.769-2.587 5.77-5.767 0-3.181-2.587-5.767-5.77-5.767zm7.647 5.766c-.001 4.225-3.438 7.662-7.663 7.662-1.309 0-2.522-.333-3.585-.915l-4.43 1.162 1.183-4.321c-.692-1.124-1.066-2.42-1.067-3.754 0-4.225 3.438-7.662 7.663-7.662 4.226.001 7.663 3.438 7.663 7.662zm-3.526 2.378c-.198-.1-.1.171-1.162-.486-.234-.117-.404-.175-.575.087-.171.263-.666.837-.816 1.01-.15.176-.3.198-.498.1-.198-.1-.837-.308-1.595-.984-.59-.526-.988-1.176-1.104-1.374-.117-.198-.012-.305.086-.403.088-.088.198-.234.297-.35.099-.117.132-.198.198-.332.066-.134.033-.25-.017-.35-.05-.1-.448-1.077-.614-1.476-.162-.388-.326-.335-.448-.341l-.382-.007c-.132 0-.348.05-.53.25-.183.2-.698.682-.698 1.664s.714 1.93 1.014 2.33c.3.4 1.405 2.146 3.404 3.008.476.206.848.329 1.138.421.478.152.913.131 1.258.079.385-.057 1.183-.483 1.349-.95.166-.466.166-.866.116-.95-.05-.084-.182-.134-.38-.233z" />
                        </svg>
                        <span>Open in WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setEnquirySubmitted(false);
                          setEnquiryForm({
                            studentName: '',
                            fatherName: '',
                            phone: '',
                            className: 'Class 10',
                            age: ''
                          });
                        }}
                        className="text-xs text-blue-600 underline font-semibold cursor-pointer"
                      >
                        Submit another enquiry
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="mt-4 space-y-3.5">
                    {/* Student Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Student Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.studentName}
                        onChange={e => setEnquiryForm({ ...enquiryForm, studentName: e.target.value })}
                        placeholder="e.g. Aarav Patel"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      />
                    </div>

                    {/* Father Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Father's Name
                      </label>
                      <input
                        type="text"
                        required
                        value={enquiryForm.fatherName}
                        onChange={e => setEnquiryForm({ ...enquiryForm, fatherName: e.target.value })}
                        placeholder="e.g. Ramesh Patel"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      />
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={enquiryForm.phone}
                        onChange={e => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                        placeholder="e.g. 99058 47357"
                        className="w-full px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                      />
                    </div>

                    {/* Class & Age */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Class
                        </label>
                        <select
                          value={enquiryForm.className}
                          onChange={e => setEnquiryForm({ ...enquiryForm, className: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                        >
                          <option value="Class 6">Class 6</option>
                          <option value="Class 7">Class 7</option>
                          <option value="Class 8">Class 8</option>
                          <option value="Class 9">Class 9</option>
                          <option value="Class 10">Class 10</option>
                          <option value="Class 11">Class 11</option>
                          <option value="Class 12">Class 12</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Age (Years)
                        </label>
                        <input
                          type="number"
                          required
                          min="5"
                          max="25"
                          value={enquiryForm.age}
                          onChange={e => setEnquiryForm({ ...enquiryForm, age: e.target.value })}
                          placeholder="e.g. 15"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 text-xs font-bold text-white bg-[#25D366] hover:bg-[#20bd5a] rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.541 1.879.82 2.796.82 3.183 0 5.769-2.587 5.77-5.767 0-3.181-2.587-5.767-5.77-5.767zm7.647 5.766c-.001 4.225-3.438 7.662-7.663 7.662-1.309 0-2.522-.333-3.585-.915l-4.43 1.162 1.183-4.321c-.692-1.124-1.066-2.42-1.067-3.754 0-4.225 3.438-7.662 7.663-7.662 4.226.001 7.663 3.438 7.663 7.662zm-3.526 2.378c-.198-.1-.1.171-1.162-.486-.234-.117-.404-.175-.575.087-.171.263-.666.837-.816 1.01-.15.176-.3.198-.498.1-.198-.1-.837-.308-1.595-.984-.59-.526-.988-1.176-1.104-1.374-.117-.198-.012-.305.086-.403.088-.088.198-.234.297-.35.099-.117.132-.198.198-.332.066-.134.033-.25-.017-.35-.05-.1-.448-1.077-.614-1.476-.162-.388-.326-.335-.448-.341l-.382-.007c-.132 0-.348.05-.53.25-.183.2-.698.682-.698 1.664s.714 1.93 1.014 2.33c.3.4 1.405 2.146 3.404 3.008.476.206.848.329 1.138.421.478.152.913.131 1.258.079.385-.057 1.183-.483 1.349-.95.166-.466.166-.866.116-.95-.05-.084-.182-.134-.38-.233z" />
                      </svg>
                      <span>Send Enquiry on WhatsApp</span>
                    </button>

                    <p className="text-[11px] text-slate-500 text-center flex items-center justify-center gap-1.5 flex-wrap">
                      <span>WhatsApp Number:</span>
                      <a href="https://wa.me/919905847357" target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-600 hover:underline">
                        +91 99058 47357
                      </a>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why This Platform is Different: Offline + Digital Tracking */}
      <section className="py-16 bg-white/60 backdrop-blur-md border-b border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Your Learning Journey Starts Here.
            </h2>
            <p className="text-sm sm:text-base text-slate-600 font-medium max-w-2xl mx-auto">
              Everything you need to learn, practice, and stay ahead — all in one place.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {[
                'Homework & Assignments',
                'Study Materials & Notes',
                'Progress Tracking',
                'Secure Student Access'
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-white/90 border border-blue-100 shadow-2xs text-xs font-semibold text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-100 shadow-xs shadow-blue-500/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-extrabold text-sm shadow-xs">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900">"Aaj Class Mein Kya Padhaya Gaya"</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                After every offline lecture, the teacher publishes the exact concept summary and key formulas taught that day. Absent or revising students are never left behind.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-100 shadow-xs shadow-blue-500/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-extrabold text-sm shadow-xs">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900">Daily Photo/PDF Solution Uploads</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Students solve problems in fair notebooks and submit clear pictures before the next morning's deadline. Teacher reviews and assigns verified marks with corrections.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-md border border-blue-100 shadow-xs shadow-blue-500/5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-extrabold text-sm shadow-xs">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900">Transparent Fee Receipts & Validity</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                No disputes over unrecorded cash or pending dates. Pay online or in person; receive official computer-verified receipts with exact membership validity and next due dates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Classes & Fee Structure Overview */}
      <section className="py-16 border-b border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-extrabold tracking-wider text-blue-600 uppercase">
                Academic Programs
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
                Batches & Transparent Fee Structure
              </h2>
            </div>
            <button
              onClick={() => onNavigate('classes-info')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View full syllabus & timings</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class 10 */}
            <div className="p-6 rounded-3xl bg-gradient-to-b from-blue-50/90 to-white/90 backdrop-blur-xl border border-blue-200/90 shadow-[0_10px_30px_rgba(37,99,235,0.06)] relative flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-blue-600 uppercase">Class 10</div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Board Excellence Batch</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Daily numerical problem-solving, NCERT Exemplar mastery, and 10+ full-length board mock papers.
                </p>

                <div className="mt-4 pt-4 border-t border-blue-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mathematics & Science (Physics & Chem)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Morning & Evening Batches (Max 25)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Daily Homework with Teacher Corrections</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-blue-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Monthly Tuition Fee:</span>
                  <div className="font-mono text-xl font-extrabold text-blue-700 tabular-nums">
                    ₹2,500<span className="text-xs text-slate-500 font-normal"> / mo</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-500 transition-colors shadow-sm shadow-blue-500/20"
                >
                  Enroll Now
                </button>
              </div>
            </div>

            {/* Class 9 */}
            <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-500 uppercase">Class 9</div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">Foundation Batch</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Building deep mathematical intuition and physical reasoning for future Olympiads and board readiness.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Mathematics & General Science</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>4 Days Weekly + Saturday Doubt Session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Weekly chapter tests & digital notes</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Monthly Tuition Fee:</span>
                  <div className="font-mono text-xl font-extrabold text-slate-900 tabular-nums">
                    ₹2,200<span className="text-xs text-slate-500 font-normal"> / mo</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Enroll Now
                </button>
              </div>
            </div>

            {/* Class 12 */}
            <div className="p-6 rounded-3xl bg-white/90 backdrop-blur-xl border border-slate-200/90 shadow-[0_10px_30px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono font-bold text-slate-500 uppercase">Class 12</div>
                <h3 className="text-lg font-bold text-slate-900 mt-1">PCM Boards & Entrance</h3>
                <p className="text-xs text-slate-600 mt-2">
                  Rigorous calculus, electrodynamics, optics, and wave mechanics with targeted speed-drills.
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Senior Physics & Advanced Mathematics</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Early Morning 6:00 AM Alpha Batch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Previous 10 Years Question Bank Drills</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium">Monthly Tuition Fee:</span>
                  <div className="font-mono text-xl font-extrabold text-slate-900 tabular-nums">
                    ₹3,500<span className="text-xs text-slate-500 font-normal"> / mo</span>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 border border-slate-200 rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Enroll Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Teacher Section */}
      <section className="py-16 bg-white/70 backdrop-blur-md border-b border-blue-100/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
            <div className="md:col-span-4 flex justify-center">
              <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-1.5 shadow-xl shadow-blue-500/20">
                <div className="w-full h-full rounded-[22px] bg-white flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-300 flex items-center justify-center text-blue-700 mb-3 font-extrabold text-2xl shadow-xs">
                    RS
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-base">Er. Rajesh V. Sharma</h4>
                  <p className="text-xs text-blue-600 font-semibold">M.Tech (Applied Physics)</p>
                  <p className="text-[11px] text-slate-500 mt-1">14+ Years Offline Coaching</p>
                </div>
              </div>
            </div>

            <div className="md:col-span-8 space-y-4">
              <span className="text-xs font-extrabold tracking-wider text-blue-600 uppercase">
                Faculty Profile
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                "Direct Student Mentorship Cannot Be Replaced by Video Playlists."
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                With over a decade of teaching offline batches in Pune, Er. Rajesh Sharma has guided hundreds of students to scoring 95+ in CBSE/State board examinations and securing admissions in top engineering and scientific colleges.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                "In my cabin and classroom, no student is a passive spectator. Every single theorem is derived step-by-step on the board, and every student's homework is checked daily to catch misconceptions before exam time."
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 text-xs">
                <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-xs">
                  <div className="text-slate-500 font-medium">Classroom Location</div>
                  <div className="font-bold text-slate-900 mt-0.5">MG Road, Pune</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-xs">
                  <div className="text-slate-500 font-medium">Batch Size</div>
                  <div className="font-bold text-slate-900 mt-0.5">Strictly 20-25 Max</div>
                </div>
                <div className="p-3.5 rounded-xl bg-white border border-blue-100 shadow-xs">
                  <div className="text-slate-500 font-medium">Doubt Support</div>
                  <div className="font-bold text-slate-900 mt-0.5">1-on-1 Daily Cabin Hour</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50/80 border-b border-blue-100/80 scroll-mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-extrabold tracking-wider text-blue-600 uppercase flex items-center justify-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Questions & Answers</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">
              Frequently Asked Questions (FAQ)
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              Everything you need to know about our classes, assignments, and digital tracking.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden transition-all duration-200 hover:border-blue-200"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    <span>{item.q}</span>
                    <span className="p-1 rounded-lg bg-slate-100 text-slate-600 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-xs font-bold text-slate-900">Have a question not listed here?</p>
              <p className="text-[11px] text-slate-500">Contact AIHSAN ANSARI directly on WhatsApp or Call.</p>
            </div>
            <a
              href="https://wa.me/919905847357?text=Hello%20AIHSAN%20ANSARI,%20I%20have%20a%20question%20regarding%20coaching."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.541 1.879.82 2.796.82 3.183 0 5.769-2.587 5.77-5.767 0-3.181-2.587-5.767-5.77-5.767zm7.647 5.766c-.001 4.225-3.438 7.662-7.663 7.662-1.309 0-2.522-.333-3.585-.915l-4.43 1.162 1.183-4.321c-.692-1.124-1.066-2.42-1.067-3.754 0-4.225 3.438-7.662 7.663-7.662 4.226.001 7.663 3.438 7.663 7.662zm-3.526 2.378c-.198-.1-.1.171-1.162-.486-.234-.117-.404-.175-.575.087-.171.263-.666.837-.816 1.01-.15.176-.3.198-.498.1-.198-.1-.837-.308-1.595-.984-.59-.526-.988-1.176-1.104-1.374-.117-.198-.012-.305.086-.403.088-.088.198-.234.297-.35.099-.117.132-.198.198-.332.066-.134.033-.25-.017-.35-.05-.1-.448-1.077-.614-1.476-.162-.388-.326-.335-.448-.341l-.382-.007c-.132 0-.348.05-.53.25-.183.2-.698.682-.698 1.664s.714 1.93 1.014 2.33c.3.4 1.405 2.146 3.404 3.008.476.206.848.329 1.138.421.478.152.913.131 1.258.079.385-.057 1.183-.483 1.349-.95.166-.466.166-.866.116-.95-.05-.084-.182-.134-.38-.233z" />
              </svg>
              <span>WhatsApp: +91 99058 47357</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-200 text-slate-600 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-slate-100">
            {/* Brand Col */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>AIHSAN ANSARI</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
                A simple tool for teachers to manage assignments and for students to stay on top of their work.
              </p>
            </div>

            {/* Direct Contact Col with 9905847357 */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Direct Contact</h4>
              <div className="space-y-2">
                <a
                  href="tel:9905847357"
                  className="flex items-center gap-2 text-slate-700 hover:text-blue-600 transition-colors font-medium"
                >
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>Call: +91 99058 47357</span>
                </a>
                <a
                  href="https://wa.me/919905847357?text=Hello%20AIHSAN%20ANSARI,%20I%20have%20an%20enquiry%20regarding%20classes%20and%20assignments."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors font-bold text-xs"
                >
                  <svg className="w-4 h-4 fill-emerald-600" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.541 1.879.82 2.796.82 3.183 0 5.769-2.587 5.77-5.767 0-3.181-2.587-5.767-5.77-5.767zm7.647 5.766c-.001 4.225-3.438 7.662-7.663 7.662-1.309 0-2.522-.333-3.585-.915l-4.43 1.162 1.183-4.321c-.692-1.124-1.066-2.42-1.067-3.754 0-4.225 3.438-7.662 7.663-7.662 4.226.001 7.663 3.438 7.663 7.662zm-3.526 2.378c-.198-.1-.1.171-1.162-.486-.234-.117-.404-.175-.575.087-.171.263-.666.837-.816 1.01-.15.176-.3.198-.498.1-.198-.1-.837-.308-1.595-.984-.59-.526-.988-1.176-1.104-1.374-.117-.198-.012-.305.086-.403.088-.088.198-.234.297-.35.099-.117.132-.198.198-.332.066-.134.033-.25-.017-.35-.05-.1-.448-1.077-.614-1.476-.162-.388-.326-.335-.448-.341l-.382-.007c-.132 0-.348.05-.53.25-.183.2-.698.682-.698 1.664s.714 1.93 1.014 2.33c.3.4 1.405 2.146 3.404 3.008.476.206.848.329 1.138.421.478.152.913.131 1.258.079.385-.057 1.183-.483 1.349-.95.166-.466.166-.866.116-.95-.05-.084-.182-.134-.38-.233z" />
                  </svg>
                  <span>WhatsApp: 9905847357</span>
                </a>
              </div>
            </div>

            {/* Quick Links & Legal */}
            <div className="space-y-2.5">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Help & Policy</h4>
              <div className="flex flex-col gap-2">
                <a href="#faq" className="hover:text-blue-600 transition-colors">
                  Frequently Asked Questions (FAQ)
                </a>
                <button
                  type="button"
                  onClick={() => setIsPrivacyModalOpen(true)}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('login')}
                  className="text-left hover:text-blue-600 transition-colors"
                >
                  Portal Login
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
            <p>© 2026 AIHSAN ANSARI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(true)}
                className="hover:underline"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <a href="#faq" className="hover:underline">
                FAQ
              </a>
              <span>·</span>
              <a href="tel:9905847357" className="hover:underline font-semibold text-slate-700">
                +91 99058 47357
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Message Icon on Bottom-Right */}
      <a
        href="https://wa.me/919905847357?text=Hello%20AIHSAN%20ANSARI,%20I%20have%20an%20enquiry%20regarding%20classes%20and%20assignments."
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp with AIHSAN ANSARI"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full shadow-xl shadow-emerald-500/30 transition-all transform hover:scale-105 active:scale-95 group font-bold text-xs sm:text-sm"
      >
        <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.699c.983.541 1.879.82 2.796.82 3.183 0 5.769-2.587 5.77-5.767 0-3.181-2.587-5.767-5.77-5.767zm7.647 5.766c-.001 4.225-3.438 7.662-7.663 7.662-1.309 0-2.522-.333-3.585-.915l-4.43 1.162 1.183-4.321c-.692-1.124-1.066-2.42-1.067-3.754 0-4.225 3.438-7.662 7.663-7.662 4.226.001 7.663 3.438 7.663 7.662zm-3.526 2.378c-.198-.1-.1.171-1.162-.486-.234-.117-.404-.175-.575.087-.171.263-.666.837-.816 1.01-.15.176-.3.198-.498.1-.198-.1-.837-.308-1.595-.984-.59-.526-.988-1.176-1.104-1.374-.117-.198-.012-.305.086-.403.088-.088.198-.234.297-.35.099-.117.132-.198.198-.332.066-.134.033-.25-.017-.35-.05-.1-.448-1.077-.614-1.476-.162-.388-.326-.335-.448-.341l-.382-.007c-.132 0-.348.05-.53.25-.183.2-.698.682-.698 1.664s.714 1.93 1.014 2.33c.3.4 1.405 2.146 3.404 3.008.476.206.848.329 1.138.421.478.152.913.131 1.258.079.385-.057 1.183-.483 1.349-.95.166-.466.166-.866.116-.95-.05-.084-.182-.134-.38-.233z" />
        </svg>
        <span>WhatsApp</span>
      </a>

      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-extrabold text-lg">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <span>Privacy Policy</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 mb-1">1. Information Collection & Usage</h4>
                <p>
                  We only collect essential student and parent information (such as student name, target class, and contact phone number) strictly for managing tuition classes, sending homework reminders, and verifying assignments.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">2. Homework & Academic Submissions</h4>
                <p>
                  Any photos, PDFs, or handwritten notes uploaded for daily homework assignments are accessed solely by assigned coaching teachers for grading, correction remarks, and student progress records.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">3. Strict Data Confidentiality & No Third-Party Ads</h4>
                <p>
                  We do not sell, rent, or share student phone numbers or personal records with third-party advertising networks. Your data is kept secure and private.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">4. Secure Access Control</h4>
                <p>
                  All login accounts are provisioned directly by the institute administrator. Students, teachers, and owners have role-isolated credentials to protect unauthorized access.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">5. Contact Regarding Privacy</h4>
                <p>
                  For any privacy inquiries or to update your contact information, please contact AIHSAN ANSARI directly via Phone or WhatsApp at{' '}
                  <a href="tel:9905847357" className="font-bold text-blue-600 hover:underline">
                    +91 99058 47357
                  </a>.
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Understood & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
