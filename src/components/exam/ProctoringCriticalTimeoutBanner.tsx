import React from 'react';
import { AlertTriangle, Maximize, RotateCcw } from 'lucide-react';
import { UnifiedProctoringState } from '../../types/proctoring';

interface ProctoringCriticalTimeoutBannerProps {
  proctoringState: UnifiedProctoringState;
  onEnterFullscreen?: () => void;
  onRetryHardware?: () => void;
}

export const ProctoringCriticalTimeoutBanner: React.FC<ProctoringCriticalTimeoutBannerProps> = ({
  proctoringState,
  onEnterFullscreen,
  onRetryHardware,
}) => {
  const { status, activeViolation, remainingSeconds } = proctoringState;

  if (status !== 'critical' || !activeViolation || remainingSeconds > 15) {
    return null;
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-50 p-3 sm:p-4 bg-gradient-to-r from-rose-600 via-rose-700 to-rose-600 text-white shadow-2xl animate-bounce-short">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Warning title & prompt */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur border border-white/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider bg-rose-900/60 px-2 py-0.5 rounded border border-rose-400/40">
                ⚠ PROCTORING WARNING
              </span>
              <span className="font-extrabold text-sm sm:text-base tracking-tight">
                {activeViolation.title}
              </span>
            </div>
            <p className="text-xs text-rose-100 mt-0.5 font-medium">
              {activeViolation.description}
            </p>
          </div>
        </div>

        {/* Right: Big Countdown Clock & Recovery Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-center px-4 py-1.5 rounded-xl bg-black/40 border border-white/20 backdrop-blur">
            <span className="text-[9px] uppercase tracking-wider block text-rose-200 font-bold">
              RESOLVE WITHIN
            </span>
            <div className="text-2xl font-black font-mono leading-none tracking-tight text-white flex items-baseline justify-center gap-1">
              <span>{remainingSeconds}</span>
              <span className="text-[10px] font-medium text-rose-200">sec</span>
            </div>
          </div>

          {activeViolation.type === 'fullscreen_exit' && onEnterFullscreen && (
            <button
              type="button"
              onClick={onEnterFullscreen}
              className="px-3.5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <Maximize className="w-4 h-4" />
              Return Full-Screen
            </button>
          )}

          {(activeViolation.type === 'camera_disconnected' || activeViolation.type === 'mic_disconnected') && onRetryHardware && (
            <button
              type="button"
              onClick={onRetryHardware}
              className="px-3.5 py-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-extrabold text-xs shadow-lg transition-transform active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              Retry Device
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
