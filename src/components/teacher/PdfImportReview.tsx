// src/components/teacher/PdfImportReview.tsx
// Review screen shown after PDF MCQ extraction — teacher must verify before saving
import React, { useState } from 'react';
import { ChemQuestion, ChemTopic, QuestionDifficulty } from '../../types/question';
import { ChemRenderer } from '../chemistry/ChemRenderer';
import { Button } from '../common/Button';
import {
  CheckCircle2, AlertTriangle, Trash2, Edit3, ChevronDown, ChevronUp,
  FileText,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ChemQuestionEditor } from './ChemQuestionEditor';

const TOPICS: ChemTopic[] = [
  'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
  'Electrochemistry', 'Thermodynamics', 'Chemical Bonding', 'Equilibrium',
  'Solutions', 'Atomic Structure', 'Coordination Chemistry', 'General Chemistry',
];
const DIFFICULTIES: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

interface PdfImportReviewProps {
  questions: ChemQuestion[];
  fileName: string;
  isScanned: boolean;
  onConfirm: (accepted: ChemQuestion[]) => void;
  onCancel: () => void;
}

export const PdfImportReview: React.FC<PdfImportReviewProps> = ({
  questions: initial,
  fileName,
  isScanned,
  onConfirm,
  onCancel,
}) => {
  const [list, setList] = useState<ChemQuestion[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const ready = list.filter((q) => !q.needsReview);
  const needsReview = list.filter((q) => q.needsReview);

  const removeQ = (id: string) => setList((prev) => prev.filter((q) => q.id !== id));

  const updateQ = (updated: ChemQuestion) => {
    setList((prev) => prev.map((q) => (q.id === updated.id ? { ...updated, needsReview: false } : q)));
    setEditingId(null);
  };

  const markReady = (id: string) =>
    setList((prev) => prev.map((q) => (q.id === id ? { ...q, needsReview: false } : q)));

  const editingQ = list.find((q) => q.id === editingId);

  return (
    <div className="space-y-5">
      {/* Scanned PDF warning */}
      {isScanned && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="text-amber-800 block">Scanned PDF Detected</strong>
            <span className="text-amber-700">
              This PDF appears to contain only images. Text extraction may be incomplete or unavailable.
              Please add questions manually or use a PDF with selectable text.
            </span>
          </div>
        </div>
      )}

      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-500" />
          <span className="font-mono text-slate-500 text-xs truncate max-w-[180px]">{fileName}</span>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="font-bold text-slate-900">{list.length}</span> Imported
          </span>
          <span className="flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-bold">{ready.length}</span> Ready
          </span>
          <span className="flex items-center gap-1.5 text-amber-700">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="font-bold">{needsReview.length}</span> Needs Review
          </span>
        </div>
      </div>

      {list.length === 0 && (
        <div className="text-center py-10 text-slate-400 text-sm">
          No questions extracted. The PDF may not follow the supported MCQ format.
        </div>
      )}

      {/* Question Cards */}
      <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
        {list.map((q, idx) => {
          const isExpanded = expandedId === q.id;
          return (
            <div
              key={q.id}
              className={`rounded-2xl border overflow-hidden transition-all ${
                q.needsReview
                  ? 'border-amber-300 bg-amber-50/40'
                  : 'border-slate-200 bg-white'
              }`}
            >
              {/* Card header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
                onClick={() => setExpandedId(isExpanded ? null : q.id)}
              >
                {/* Status badge */}
                {q.needsReview ? (
                  <span className="flex items-center gap-1 text-amber-600 text-[10px] font-black uppercase tracking-wider shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5" /> Review
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-black uppercase tracking-wider shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                  </span>
                )}

                <span className="text-xs font-bold text-slate-500 shrink-0">Q{idx + 1}</span>
                <span className="text-sm text-slate-800 flex-1 truncate">
                  <ChemRenderer text={q.questionText} />
                </span>

                <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {q.needsReview && (
                    <button
                      type="button"
                      onClick={() => markReady(q.id)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-700 hover:bg-emerald-100 transition"
                    >
                      Mark Ready
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
                  <button
                    type="button"
                    onClick={() => removeQ(q.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                  {q.needsReview && q.reviewReason && (
                    <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                      {q.reviewReason}
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <div
                        key={opt.label}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                          q.correctAnswer === opt.label
                            ? 'bg-emerald-50 border border-emerald-300 font-semibold text-emerald-900'
                            : 'bg-slate-50 border border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          q.correctAnswer === opt.label ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                        }`}>{opt.label}</span>
                        <ChemRenderer text={opt.text} />
                      </div>
                    ))}
                  </div>
                  {/* Metadata pickers */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    <select
                      value={q.topic}
                      onChange={(e) =>
                        setList((prev) =>
                          prev.map((x) =>
                            x.id === q.id ? { ...x, topic: e.target.value as ChemTopic } : x
                          )
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none"
                    >
                      {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select
                      value={q.difficulty}
                      onChange={(e) =>
                        setList((prev) =>
                          prev.map((x) =>
                            x.id === q.id ? { ...x, difficulty: e.target.value as QuestionDifficulty } : x
                          )
                        )
                      }
                      className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 focus:outline-none"
                    >
                      {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={q.marks}
                      onChange={(e) =>
                        setList((prev) =>
                          prev.map((x) =>
                            x.id === q.id ? { ...x, marks: parseInt(e.target.value) || 4 } : x
                          )
                        )
                      }
                      className="w-16 px-2 py-1 rounded-lg bg-white border border-slate-200 text-xs font-mono text-slate-700 focus:outline-none"
                      title="Marks"
                    />
                    <span className="text-xs text-slate-400 self-center">marks</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <Button variant="secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onConfirm(ready)}
            disabled={ready.length === 0}
          >
            Add {ready.length} Ready Questions
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfirm(list)}
            disabled={list.length === 0}
          >
            Add All {list.length} Questions
          </Button>
        </div>
      </div>

      {/* Edit Modal */}
      {editingQ && (
        <Modal isOpen={true} onClose={() => setEditingId(null)} title={`Edit Question Q${list.findIndex((q) => q.id === editingId) + 1}`} maxWidth="2xl">
          <ChemQuestionEditor
            onSave={updateQ}
            onCancel={() => setEditingId(null)}
            initial={{
              questionText: editingQ.questionText,
              optionA: editingQ.options[0]?.text || '',
              optionB: editingQ.options[1]?.text || '',
              optionC: editingQ.options[2]?.text || '',
              optionD: editingQ.options[3]?.text || '',
              correctAnswer: editingQ.correctAnswer as 'A' | 'B' | 'C' | 'D',
              topic: editingQ.topic,
              difficulty: editingQ.difficulty,
              marks: editingQ.marks,
              explanation: editingQ.explanation || '',
            }}
          />
        </Modal>
      )}
    </div>
  );
};
