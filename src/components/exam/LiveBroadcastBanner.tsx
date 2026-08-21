import React, { useState } from 'react';
import { BroadcastAnnouncement } from '../../types/liveExam';
import { Bell, X } from 'lucide-react';

interface LiveBroadcastBannerProps {
  announcement: BroadcastAnnouncement | null;
}

export const LiveBroadcastBanner: React.FC<LiveBroadcastBannerProps> = ({ announcement }) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!announcement || isDismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-900/90 via-surface-100 to-indigo-900/90 border-b border-indigo-500/40 px-4 py-2.5 shadow-lg animate-in slide-in-from-top duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 animate-pulse">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-white uppercase tracking-wider text-[10px] mr-2 text-indigo-400">
              Instructor Announcement ({announcement.instructorName}):
            </span>
            <span className="text-slate-200 font-medium">{announcement.message}</span>
          </div>
        </div>

        <button
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          title="Dismiss Announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
