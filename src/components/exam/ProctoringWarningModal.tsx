import React from 'react';
import { Button } from '../common/Button';
import { ShieldAlert, AlertTriangle, Lock } from 'lucide-react';

interface ProctoringWarningModalProps {
  isOpen: boolean;
  strikeCount: number;
  maxStrikes: number;
  message: string;
  onAcknowledge: () => void;
}

export const ProctoringWarningModal: React.FC<ProctoringWarningModalProps> = ({
  isOpen,
  strikeCount,
  maxStrikes,
  message,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  const isFinalStrike = strikeCount >= maxStrikes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-lg w-full rounded-2xl bg-surface-100 border border-rose-600/70 p-6 sm:p-8 shadow-2xl shadow-rose-950/50 space-y-5 text-center">
        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-400 flex items-center justify-center mx-auto animate-bounce">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Title & Strike Meter */}
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-400">
            Integrity Violation Detected
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Security Warning Strike #{strikeCount} of {maxStrikes}
          </h2>
        </div>

        {/* Strike Meter Progress Bar */}
        <div className="space-y-1.5 max-w-xs mx-auto">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Warning Level</span>
            <span className={isFinalStrike ? 'text-rose-400 font-bold' : 'text-amber-400'}>
              {strikeCount} / {maxStrikes} Strikes
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-300 ${
                isFinalStrike
                  ? 'bg-rose-500 w-full'
                  : strikeCount === 2
                  ? 'bg-amber-500 w-2/3'
                  : 'bg-yellow-400 w-1/3'
              }`}
            />
          </div>
        </div>

        {/* Violation Message */}
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-xs text-rose-200 leading-relaxed text-left space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Reason for flag:</span>
          </div>
          <p className="font-mono text-[11px]">{message}</p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="glow"
            size="lg"
            className="w-full bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500"
            leftIcon={<Lock className="w-4 h-4" />}
            onClick={onAcknowledge}
          >
            {isFinalStrike ? 'Submit Exam & Log Violations' : 'I Understand - Re-lock Fullscreen Examination'}
          </Button>
          <p className="text-[10px] text-slate-400 mt-2">
            All focus anomalies and timestamps are permanently appended to the course evidence log.
          </p>
        </div>
      </div>
    </div>
  );
};
