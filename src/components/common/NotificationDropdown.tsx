import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_NOTIFICATIONS } from '../../lib/notificationData';
import { NotificationItem } from '../../types/notification';
import {
  Bell,
  Radio,
  ShieldCheck,
  Award,
  BookOpen,
  X,
  ExternalLink,
} from 'lucide-react';

export const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'grade':
        return <Award className="w-4 h-4 text-amber-600" />;
      case 'broadcast':
        return <Radio className="w-4 h-4 text-blue-600" />;
      case 'security':
        return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      case 'exam':
      default:
        return <BookOpen className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors focus:outline-none"
        title="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-dropdown z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {unreadCount} New
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-slate-500 hover:text-blue-600 transition-colors font-medium"
              >
                Mark all read
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3.5 space-y-1 transition-colors ${
                    notif.read ? 'bg-white opacity-70' : 'bg-blue-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 shrink-0">
                        {getCategoryIcon(notif.category)}
                      </div>
                      <span className="text-xs font-bold text-slate-900 leading-tight">
                        {notif.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {notif.timestamp}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 pl-8 leading-relaxed">
                    {notif.message}
                  </p>

                  {notif.linkUrl && (
                    <div className="pl-8 pt-1">
                      <Link
                        to={notif.linkUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        <span>{notif.actionLabel || 'View Details'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
