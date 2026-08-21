// src/components/teacher/AiReviewScreen.tsx
// Review screen for AI-generated chemistry questions
import React, { useState } from 'react';
import { ChemQuestion } from '../../types/question';
import { ChemRenderer } from '../chemistry/ChemRenderer';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { ChemQuestionEditor } from './ChemQuestionEditor';
import {
  CheckCircle2, X, Edit3, AlertTriangle, Sparkles,
  ChevronDown, ChevronUp,
} from 'lucide-react';

interface AiReviewScreenProps {
  questions: ChemQuestion[];
  onConfirm: (accepted: ChemQuestion[]) => void;
  onCancel: () => void;
}

type ReviewStatus = 'pending' | 'accepted' | 'rejected';

interface ReviewEntry {
  q: ChemQuestion;
  status: ReviewStatus;
}

// ── Validation helpers ────────────────────────────────────────────────────────

function validateAiQuestion(q: ChemQuestion): string[] {
  const issues: string[] = [];
  if (!q.questionText.trim()) issues.push('Missing question text');
  if (!q.correctAnswer) issues.push('Missing correct answer');
  const opts = q.options.map((o) => o.text.trim().toLowerCase());
  const unique = new Set(opts);
  if (unique.size < opts.length) issues.push('Duplicate options detected');
  if (q.options.length < 4) issues.push('Fewer than 4 options');
  return issues;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AiReviewScreen: React.FC<AiReviewScreenProps> = ({
  questions: initial,
  onConfirm,
  onCancel,
}) => {
  const [entries, setEntries] = useState<ReviewEntry[]>(
    initial.map((q) => ({ q, status: 'pending' }))
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(initial[0]?.id ?? null);

  const accepted = entries.filter((e) => e.status === 'accepted').map((e) => e.q);
  const pending = entries.filter((e) => e.status === 'pending').length;
  const rejected = entries.filter((e) => e.status === 'rejected').length;

  const setStatus = (id: string, status: ReviewStatus) =>
    setEntries((prev) => prev.map((e) => (e.q.id === id ? { ...e, status } : e)));

  const updateQ = (updated: ChemQuestion) => {
    setEntries((prev) =>
      prev.map((e) =>
        e.q.id === updated.id ? { ...e, q: { ...updated, needsReview: false }, status: 'accepted' } : e
      )
    );
    setEditingId(null);
  };

  const acceptAll = () =>
    setEntries((prev) => prev.map((e) => ({ ...e, status: 'accepted' })));

  const editingEntry = entries.find((e) => e.q.id === editingId);

  return (
    <div className="space-y-5">
      {/* Header banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl bg-violet-50 border border-violet-200">
        <Sparkles className="w-5 h-5 text-violet-600 shrink-0" />
        <div className="flex-1">
          <strong className="text-violet-900 text-sm block">AI Generated Questions — Review Required</strong>
          <span className="text-violet-700 text-xs">
            AI questions are drafts. Review, edit, accept, or reject before adding to the exam.
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4 text-sm px-1">
        <span className="text-slate-600">{entries.length} generated</span>
        <span className="text-emerald-700 font-semibold">{accepted.length} accepted</span>
        <span className="text-amber-600 font-semibold">{pending} pending</span>
        <span className="text-rose-600 font-semibold">{rejected} rejected</span>
        <Button variant="secondary" size="sm" className="ml-auto" onClick={acceptAll}>
          Accept All
        </Button>
      </div>

      {/* Question cards */}
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {entries.map((entry, idx) => {
          const { q, status } = entry;
          const issues = validateAiQuestion(q);
          const isExpanded = expandedId === q.id;

          const borderColor =
            status === 'accepted'
              ? 'border-emerald-300 bg-emerald-50/30'
              : status === 'rejected'
              ? 'border-rose-300 bg-rose-50/20 opacity-60'
              : 'border-violet-200 bg-white';

          return (
            <div key={q.id} className={`rounded-2xl border overflow-hidden transition-all ${borderColor}`}>
              {/* Card header */}
              <div
                className="flex items-center gap-2 px-4 py-3 cursor-pointer hover:bg-slate-50/50"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
              >
                <span className="text-xs font-bold text-slate-500 shrink-0">Q{idx + 1}</span>

                {/* Status badge */}
                {status === 'accepted' && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-700 uppercase shrink-0">
                    <CheckCircle2 className="w-3 h-3" /> Accepted
                  </span>
                )}
                {status === 'rejected' && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-rose-700 uppercase shrink-0">
                    <X className="w-3 h-3" /> Rejected
                  </span>
                )}
                {status === 'pending' && issues.length > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-amber-600 uppercase shrink-0">
                    <AlertTriangle className="w-3 h-3" /> Review
                  </span>
                )}

                <span className="text-sm text-slate-800 flex-1 truncate">
                  <ChemRenderer text={q.questionText} />
                </span>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {status !== 'accepted' && (
                    <button
                      type="button"
                      onClick={() => setStatus(q.id, 'accepted')}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition"
                      title="Accept"
                    >
                      ✓ Accept
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingId(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Edit"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {status !== 'rejected' && (
                    <button
                      type="button"
                      onClick={() => setStatus(q.id, 'rejected')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Reject"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded body */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                  {issues.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {issues.map((issue) => (
                        <span
                          key={issue}
                          className="flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5"
                        >
                          <AlertTriangle className="w-3 h-3" /> {issue}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                          q.correctAnswer === opt.label
                            ? 'bg-emerald-50 border border-emerald-300 font-semibold'
                            : 'bg-slate-50 border border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          q.correctAnswer === opt.label ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>{opt.label}</span>
                        <ChemRenderer text={opt.text} />
                        {q.correctAnswer === opt.label && (
                          <span className="ml-auto text-[10px] text-emerald-600 font-bold">✓ Correct</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs text-blue-800">
                      <strong>Explanation:</strong> {q.explanation}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">{q.topic}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">{q.difficulty}</span>
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200">{q.marks} marks</span>
                    <span className="px-2 py-0.5 rounded-lg bg-violet-100 border border-violet-200 text-violet-700 font-bold">AI Generated</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary"
          size="sm"
          disabled={accepted.length === 0}
          onClick={() => onConfirm(accepted)}
        >
          Add {accepted.length} Accepted Questions
        </Button>
      </div>

      {/* Edit modal */}
      {editingEntry && (
        <Modal
          isOpen={true}
          onClose={() => setEditingId(null)}
          title="Edit AI Question"
          maxWidth="2xl"
        >
          <ChemQuestionEditor
            onSave={updateQ}
            onCancel={() => setEditingId(null)}
            initial={{
              questionText: editingEntry.q.questionText,
              optionA: editingEntry.q.options[0]?.text || '',
              optionB: editingEntry.q.options[1]?.text || '',
              optionC: editingEntry.q.options[2]?.text || '',
              optionD: editingEntry.q.options[3]?.text || '',
              correctAnswer: editingEntry.q.correctAnswer as 'A' | 'B' | 'C' | 'D',
              topic: editingEntry.q.topic,
              difficulty: editingEntry.q.difficulty,
              marks: editingEntry.q.marks,
              explanation: editingEntry.q.explanation || '',
            }}
          />
        </Modal>
      )}
    </div>
  );
};
