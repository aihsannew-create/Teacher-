import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { TeacherSettings, AuditLog } from '../types';
import { Settings, Save, ShieldCheck, CheckCircle2, History } from 'lucide-react';

export const TeacherSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<TeacherSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [setRes, logsRes] = await Promise.all([
          apiFetch('/api/settings'),
          apiFetch('/api/settings/audit-logs')
        ]);
        setSettings(setRes.settings);
        setAuditLogs(logsRes.auditLogs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSuccess(false);
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div className="p-12 text-center text-xs text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/70 via-slate-50 to-indigo-50/50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Teacher Cabin · Policies & Configuration</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Tuition Platform Settings & Policies
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure tuition branding, payment gateway keys, membership grace period, and discipline penalties
          </p>
        </div>

        {success && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">Platform settings successfully saved and applied to all classes!</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Tuition & Faculty Info */}
          <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 space-y-4 shadow-xl shadow-blue-500/5">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-blue-100">
              Coaching Academy & Faculty Profile
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tuition Academy Name</label>
                <input
                  type="text"
                  value={settings.tuitionName}
                  onChange={e => setSettings({ ...settings, tuitionName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Teacher Full Name & Degrees</label>
                <input
                  type="text"
                  value={settings.teacherName}
                  onChange={e => setSettings({ ...settings, teacherName: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Offline Coaching Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={e => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Membership Access & Grace Period Policies */}
          <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 space-y-4 shadow-xl shadow-blue-500/5">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-blue-100">
              Membership Grace Period & Access Control Policy
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Membership Grace Period (Days) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={settings.gracePeriodDays}
                  onChange={e => setSettings({ ...settings, gracePeriodDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Days student can view homework after monthly expiry before paywall locks. (e.g. 0, 3, or 7 days)
                </p>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Late Homework Discipline Fine (₹ / day)
                </label>
                <div className="flex items-center gap-3 mt-1">
                  <input
                    type="checkbox"
                    id="penaltyEnabled"
                    checked={settings.lateHomeworkPenalty.enabled}
                    onChange={e => setSettings({
                      ...settings,
                      lateHomeworkPenalty: { ...settings.lateHomeworkPenalty, enabled: e.target.checked }
                    })}
                    className="rounded border-blue-200 text-blue-600 focus:ring-blue-200"
                  />
                  <label htmlFor="penaltyEnabled" className="text-xs text-slate-700 font-medium">
                    Enable Late Penalty
                  </label>
                </div>
                {settings.lateHomeworkPenalty.enabled && (
                  <input
                    type="number"
                    min="0"
                    value={settings.lateHomeworkPenalty.penaltyPerDay}
                    onChange={e => setSettings({
                      ...settings,
                      lateHomeworkPenalty: { ...settings.lateHomeworkPenalty, penaltyPerDay: Number(e.target.value) }
                    })}
                    className="mt-2 w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-white border border-blue-200 text-slate-800"
                  />
                )}
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Late Homework Penalty Notice Policy</label>
              <textarea
                rows={2}
                value={settings.lateHomeworkPenalty.description}
                onChange={e => setSettings({
                  ...settings,
                  lateHomeworkPenalty: { ...settings.lateHomeworkPenalty, description: e.target.value }
                })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Payment Gateway & Direct UPI */}
          <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 space-y-4 shadow-xl shadow-blue-500/5">
            <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-blue-100">
              Payment Gateway & Direct UPI Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Tuition UPI ID (for QR code payments)</label>
                <input
                  type="text"
                  value={settings.upiDetails.upiId}
                  onChange={e => setSettings({
                    ...settings,
                    upiDetails: { ...settings.upiDetails, upiId: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Beneficiary Name</label>
                <input
                  type="text"
                  value={settings.upiDetails.accountName}
                  onChange={e => setSettings({
                    ...settings,
                    upiDetails: { ...settings.upiDetails, accountName: e.target.value }
                  })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-slate-700 font-semibold mb-1">Razorpay Key ID</label>
              <input
                type="text"
                value={settings.razorpayKeyId || ''}
                onChange={e => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-blue-200 text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Provided via environment secrets or test key. Secret keys remain strictly secured on server.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Settings...' : 'Save All Settings'}</span>
            </button>
          </div>
        </form>

        {/* Audit Log Trail */}
        <div className="p-6 rounded-2xl bg-white/90 backdrop-blur-xl border border-blue-100 space-y-4 shadow-xl shadow-blue-500/5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Security & Administrative Audit Logs</h3>
          </div>

          <div className="p-3 rounded-xl bg-blue-50/40 border border-blue-100 max-h-48 overflow-y-auto space-y-2 text-xs">
            {auditLogs.length === 0 ? (
              <div className="text-slate-500">No audit entries yet.</div>
            ) : (
              auditLogs.map(log => (
                <div key={log.id} className="p-2.5 rounded-xl bg-white text-[11px] border border-blue-100 shadow-xs">
                  <div className="flex justify-between items-center text-slate-500">
                    <span className="font-mono text-blue-600 font-semibold">{log.action}</span>
                    <span className="font-mono text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-800 font-medium mt-0.5">{log.details}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">By: {log.userName}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
