import React, { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { AppNotification } from '../types';
import { X, Bell, Check, Clock, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (view: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/settings/notifications');
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const markAsRead = async (id: string) => {
    try {
      await apiFetch(`/api/settings/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl h-full shadow-2xl border-l border-blue-100/90 flex flex-col text-slate-800">
        {/* Drawer Header */}
        <div className="p-4 border-b border-blue-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Notifications & Announcements
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400">
              No new notifications. All caught up!
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border text-xs transition-colors ${
                  n.read
                    ? 'border-slate-100 bg-slate-50/70 text-slate-600'
                    : 'border-blue-200/90 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 text-slate-900 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    {n.type === 'homework' && <BookOpen className="w-3.5 h-3.5 text-blue-600" />}
                    {n.type === 'fee_due' && <AlertCircle className="w-3.5 h-3.5 text-amber-600" />}
                    {n.type === 'payment_success' && <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{n.title}</span>
                  </div>
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-0.5 shrink-0"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>

                <p className="mt-1 text-slate-600 leading-relaxed text-[11px]">
                  {n.message}
                </p>

                <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
