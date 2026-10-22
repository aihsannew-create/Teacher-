import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, ShieldCheck, MapPin } from 'lucide-react';

interface StudentProfileProps {
  onNavigate: (view: string) => void;
}

export const StudentProfilePage: React.FC<StudentProfileProps> = ({ onNavigate }) => {
  const { user, studentProfile, membership } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/60 via-slate-50 to-indigo-50/40 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Student Profile & Academic Enrollment
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Registered offline coaching identity, assigned batch, and guardian records
          </p>
        </div>

        {/* Profile Card in White Glass */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white/90 backdrop-blur-xl border border-blue-100 shadow-[0_10px_30px_rgba(37,99,235,0.04)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-blue-500/25">
                {studentProfile?.name?.charAt(0) || user?.name?.charAt(0) || 'S'}
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">{studentProfile?.name || user?.name}</h2>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">
                  Roll Number: <span className="font-mono text-blue-700 font-bold">{studentProfile?.rollNumber}</span>
                </div>
                <div className="text-xs text-emerald-700 font-bold mt-0.5">
                  Status: <span className="capitalize">{studentProfile?.status?.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-xl">
                {studentProfile?.className || 'Class'}
              </span>
              <div className="text-[11px] text-slate-500 mt-1 font-medium">{studentProfile?.batchName}</div>
            </div>
          </div>

          {/* Grid Details in Frosted Containers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Student Contact Info */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Student Contact Details</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Email Address:</span>
                <span className="font-semibold text-slate-800">{studentProfile?.email}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Mobile Phone:</span>
                <span className="font-mono font-semibold text-slate-800">{studentProfile?.phone}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Enrollment Date:</span>
                <span className="font-mono font-semibold text-slate-800">{studentProfile?.enrollmentDate}</span>
              </div>
            </div>

            {/* Guardian Contact Info */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Guardian / Parent Contact</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Guardian Name:</span>
                <span className="font-semibold text-slate-800">{studentProfile?.guardianName}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Relation:</span>
                <span className="font-semibold text-slate-800">{studentProfile?.guardianRelation}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Guardian Mobile:</span>
                <span className="font-mono font-semibold text-slate-800">{studentProfile?.guardianPhone}</span>
              </div>
            </div>
          </div>

          {/* Coaching Cabin Details */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2 text-xs">
            <div className="font-bold text-blue-900 flex items-center gap-1.5 pb-1 border-b border-blue-200">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>Offline Coaching Center Details</span>
            </div>
            <div className="text-slate-800">
              <strong className="text-slate-900">Prerna Tuition Academy</strong> · Teacher Cabin 304, Sharda Complex, MG Road, Pune, Maharashtra 411001
            </div>
            <div className="text-slate-600 font-medium">
              Faculty: Er. Rajesh V. Sharma (M.Tech) · Direct Helpdesk: +91 98765 43210
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
