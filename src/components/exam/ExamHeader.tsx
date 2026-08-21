import React, { useState } from 'react';
import { Button } from '../common/Button';
import {
  Clock,
  Calculator,
  ShieldAlert,
  Send,
  Atom,
  AlertTriangle,
  Camera,
  Mic,
  ShieldCheck,
} from 'lucide-react';

interface ExamHeaderProps {
  examTitle: string;
  courseCode: string;
  remainingSeconds: number;
  totalQuestions: number;
  answeredCount: number;
  markedCount: number;
  strikeCount: number;
  maxStrikes: number;
  cameraActive?: boolean;
  micActive?: boolean;
  onOpenCalculator: () => void;
  onSubmitExam: () => void;
}

export const ExamHeader: React.FC<ExamHeaderProps> = ({
  examTitle,
  courseCode,
  remainingSeconds,
  totalQuestions,
  answeredCount,
  strikeCount,
  maxStrikes,
  cameraActive = true,
  micActive = true,
  onOpenCalculator,
  onSubmitExam,
}) => {
  const [isSubmitConfirmOpen, setIsSubmitConfirmOpen] = useState(false);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const isLowTime = remainingSeconds < 300;
  const isMediumTime = remainingSeconds < 600;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Exam Info & Progress */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Atom className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {courseCode}
              </span>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[280px] sm:max-w-md">
                {examTitle}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>
                Progress: <strong className="text-slate-900">{answeredCount}/{totalQuestions}</strong> ({progressPercent}%)
              </span>
              {strikeCount > 0 && (
                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-semibold text-[11px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  Strikes: {strikeCount}/{maxStrikes}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: Persistent Real Proctoring Status Indicators */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-[11px] font-semibold">
          <span className={`inline-flex items-center gap-1 ${cameraActive ? 'text-emerald-700' : 'text-rose-600 font-bold'}`}>
            <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{cameraActive ? 'Camera Active' : 'Camera Lost'}</span>
          </span>

          <span className="text-slate-300">•</span>

          <span className={`inline-flex items-center gap-1 ${micActive ? 'text-emerald-700' : 'text-rose-600 font-bold'}`}>
            <span className={`w-2 h-2 rounded-full ${micActive ? 'bg-emerald-500' : 'bg-rose-500 animate-ping'}`} />
            <Mic className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{micActive ? 'Microphone Active' : 'Mic Lost'}</span>
          </span>

          <span className="text-slate-300">•</span>

          <span className="text-slate-600 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Proctoring Enabled</span>
          </span>
        </div>

        {/* Right: Only Calculator + Timer + Submit */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Calculator className="w-3.5 h-3.5 text-blue-600" />}
            onClick={onOpenCalculator}
          >
            <span>Calculator</span>
          </Button>

          {/* Countdown Timer */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-xs sm:text-sm font-bold shadow-xs ${
              isLowTime
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : isMediumTime
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-current" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-3.5 h-3.5" />}
            onClick={() => setIsSubmitConfirmOpen(true)}
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {/* SUBMISSION CONFIRMATION MODAL */}
      {isSubmitConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="max-w-md w-full rounded-2xl bg-white border border-slate-200 p-6 shadow-dropdown space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">Confirm Final Submission</h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You have answered <strong className="text-blue-600 font-bold">{answeredCount}</strong> out of <strong className="text-slate-900">{totalQuestions}</strong> questions. Once submitted, your examination is completed and camera/microphone access will be automatically ended.
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between text-slate-500">
                <span>Unanswered Questions:</span>
                <span className="font-mono font-bold text-amber-600">{totalQuestions - answeredCount}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Remaining Time:</span>
                <span className="font-mono text-slate-800">{formatTime(remainingSeconds)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsSubmitConfirmOpen(false)}
              >
                Return to Exam
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Send className="w-4 h-4" />}
                onClick={() => {
                  setIsSubmitConfirmOpen(false);
                  onSubmitExam();
                }}
              >
                Confirm & Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
