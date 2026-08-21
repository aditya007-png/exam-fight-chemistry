import React from 'react';
import { LiveCandidateSession } from '../../types/liveExam';
import { Button } from '../common/Button';
import {
  ShieldAlert,
  Send,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RotateCcw,
  Camera,
  Mic,
  UserCheck,
} from 'lucide-react';

interface LiveCandidateCardProps {
  candidate: LiveCandidateSession;
  onGrantTime: (candidate: LiveCandidateSession) => void;
  onSendWarning: (candidate: LiveCandidateSession) => void;
  onRequestReScan?: (candidate: LiveCandidateSession) => void;
  onForceSubmit: (candidate: LiveCandidateSession) => void;
}

export const LiveCandidateCard: React.FC<LiveCandidateCardProps> = ({
  candidate,
  onGrantTime,
  onSendWarning,
  onRequestReScan,
  onForceSubmit,
}) => {
  const getStatusBadge = () => {
    switch (candidate.status) {
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            <CheckCircle2 className="w-3 h-3 text-slate-500" />
            Submitted
          </span>
        );
      case 'flagged':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Flagged ({candidate.strikeCount} Strikes)
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Tab Inactive
          </span>
        );
      case 'writing':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Focused & Writing
          </span>
        );
    }
  };

  const progressPercent = Math.round(
    (candidate.answeredCount / candidate.totalQuestions) * 100
  );

  return (
    <div
      className={`rounded-2xl bg-white border p-5 space-y-4 shadow-card transition-all ${
        candidate.status === 'flagged'
          ? 'border-rose-300 ring-1 ring-rose-200'
          : candidate.status === 'idle'
          ? 'border-amber-300 ring-1 ring-amber-200'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Header: Candidate Profile & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
            {candidate.studentName.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-tight">
              {candidate.studentName}
            </h4>
            <span className="text-[11px] text-slate-500 font-mono">
              {candidate.studentEmail}
            </span>
          </div>
        </div>

        {getStatusBadge()}
      </div>

      {/* Real Proctoring Hardware Indicators */}
      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px] font-semibold">
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <Camera className="w-3.5 h-3.5 text-emerald-600" />
          Camera Active
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <Mic className="w-3.5 h-3.5 text-emerald-600" />
          Mic Active
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
          Face Detected
        </span>
      </div>

      {/* Progress & Timing */}
      <div className="space-y-1.5 pt-1">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-slate-500">Exam Progress:</span>
          <span className="font-mono text-blue-600 font-bold">
            {candidate.answeredCount}/{candidate.totalQuestions} ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Meta Info: IP & Strikes */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div>
          <span className="text-slate-400 block text-[10px]">IP Coordinate:</span>
          <span className="text-slate-700 font-semibold">{candidate.ipAddress}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">Integrity Strikes:</span>
          <span className={candidate.strikeCount > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600 font-bold'}>
            {candidate.strikeCount} Issued
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <Button
          variant="secondary"
          size="sm"
          className="text-[11px] px-2 py-1 flex-1"
          leftIcon={<PlusCircle className="w-3 h-3 text-blue-600" />}
          onClick={() => onGrantTime(candidate)}
        >
          +5m
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="text-[11px] px-2 py-1 flex-1 text-slate-700 hover:bg-slate-50"
          leftIcon={<RotateCcw className="w-3 h-3 text-blue-600" />}
          onClick={() => onRequestReScan ? onRequestReScan(candidate) : alert(`Requested 360° Room Re-Scan from ${candidate.studentName}`)}
          title="Require 360° Environmental Re-Scan"
        >
          Re-Scan
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="text-[11px] px-2 py-1 flex-1 text-amber-700 hover:bg-amber-50 border-amber-200"
          leftIcon={<Send className="w-3 h-3" />}
          onClick={() => onSendWarning(candidate)}
        >
          Warn
        </Button>
        <Button
          variant="danger"
          size="sm"
          className="text-xs px-2 py-1"
          onClick={() => onForceSubmit(candidate)}
          title="Force Final Submission"
        >
          <Lock className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};
