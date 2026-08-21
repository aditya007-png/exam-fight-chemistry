import React, { useState } from 'react';
import { StudentIntegrityReport, EventSeverity } from '../../types/proctoring';
import { ShieldAlert, ShieldCheck, Clock } from 'lucide-react';

interface ProctoringTimelineProps {
  report: StudentIntegrityReport;
}

export const ProctoringTimeline: React.FC<ProctoringTimelineProps> = ({ report }) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | EventSeverity>('all');

  const filteredEvents = report.events.filter(
    (e) => filterSeverity === 'all' || e.severity === filterSeverity
  );

  const getSeverityStyle = (sev: EventSeverity) => {
    switch (sev) {
      case 'critical':
        return {
          dot: 'bg-rose-500 ring-rose-500/30',
          badge: 'bg-rose-950/40 text-rose-300 border-rose-800/60',
          border: 'border-rose-900/40',
        };
      case 'warning':
        return {
          dot: 'bg-amber-400 ring-amber-400/30',
          badge: 'bg-amber-950/40 text-amber-300 border-amber-800/60',
          border: 'border-amber-900/40',
        };
      case 'info':
      default:
        return {
          dot: 'bg-chem-400 ring-chem-400/30',
          badge: 'bg-chem-950/40 text-chem-300 border-chem-800/60',
          border: 'border-slate-800',
        };
    }
  };

  return (
    <div className="rounded-2xl bg-surface-100 border border-slate-700/80 p-6 space-y-6 shadow-xl">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white">{report.studentName}</span>
            <span className="text-xs font-mono text-slate-400">({report.studentEmail})</span>
          </div>
          <p className="text-xs text-slate-400">Assessment: {report.examTitle}</p>
        </div>

        {/* Risk Score Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Integrity Index
            </span>
            <span className="text-xl font-extrabold font-mono text-white">
              {report.integrityScore}/100
            </span>
          </div>

          <div
            className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 ${
              report.riskLevel === 'HIGH'
                ? 'bg-rose-950/40 border-rose-600 text-rose-300'
                : report.riskLevel === 'MEDIUM'
                ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                : 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
            }`}
          >
            {report.riskLevel === 'HIGH' ? (
              <ShieldAlert className="w-4 h-4 text-rose-400" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>{report.riskLevel} RISK ({report.totalStrikes} Strikes)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-chem-400" />
          Proctoring Audit Event Trail
        </span>

        <div className="flex rounded-lg bg-surface-200 p-0.5 border border-slate-800 text-xs">
          {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                filterSeverity === sev
                  ? 'bg-slate-800 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {filteredEvents.map((evt) => {
          const style = getSeverityStyle(evt.severity);
          return (
            <div key={evt.id} className="relative group">
              {/* Timeline Indicator Dot */}
              <div
                className={`absolute -left-6 top-1 w-3 h-3 rounded-full ring-4 ${style.dot}`}
              />

              {/* Event Card */}
              <div
                className={`p-4 rounded-xl bg-surface-200/80 border ${style.border} space-y-1.5 shadow-sm transition-all hover:bg-surface-200`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${style.badge}`}>
                    {evt.eventType.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-slate-400">{evt.relativeTimeFormatted}</span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">{evt.description}</p>
                {evt.durationSeconds && (
                  <span className="text-[10px] font-mono text-amber-400 block pt-0.5">
                    Duration away: {evt.durationSeconds} seconds
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
