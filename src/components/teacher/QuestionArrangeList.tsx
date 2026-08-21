// src/components/teacher/QuestionArrangeList.tsx
// Step 3 of ExamBuilder — arrange, preview, edit, or delete accepted questions
import React, { useState } from 'react';
import { ChemQuestion } from '../../types/question';
import { ChemRenderer } from '../chemistry/ChemRenderer';
import { Modal } from '../common/Modal';
import { ChemQuestionEditor } from './ChemQuestionEditor';
import {
  ArrowUp, ArrowDown, Trash2, Edit3, Eye, CheckCircle2,
  GripVertical, Sparkles, FileText, PenLine,
} from 'lucide-react';

interface QuestionArrangeListProps {
  questions: ChemQuestion[];
  onChange: (questions: ChemQuestion[]) => void;
}

const SOURCE_ICON: Record<string, React.ReactNode> = {
  teacher: <PenLine className="w-3 h-3 text-blue-500" />,
  pdf: <FileText className="w-3 h-3 text-amber-500" />,
  ai: <Sparkles className="w-3 h-3 text-violet-500" />,
};

const SOURCE_LABEL: Record<string, string> = {
  teacher: 'Manual',
  pdf: 'PDF',
  ai: 'AI',
};

export const QuestionArrangeList: React.FC<QuestionArrangeListProps> = ({
  questions,
  onChange,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...questions];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const remove = (id: string) => onChange(questions.filter((q) => q.id !== id));

  const update = (updated: ChemQuestion) => {
    onChange(questions.map((q) => (q.id === updated.id ? updated : q)));
    setEditingId(null);
  };

  const editingQ = questions.find((q) => q.id === editingId);
  const previewQ = questions.find((q) => q.id === previewId);

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  if (questions.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        No questions added yet. Go back to Step 2 to add questions.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm">
        <span className="font-semibold text-slate-700">
          {questions.length} Questions
        </span>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span>Manual: {questions.filter((q) => q.source === 'teacher').length}</span>
          <span>PDF: {questions.filter((q) => q.source === 'pdf').length}</span>
          <span>AI: {questions.filter((q) => q.source === 'ai').length}</span>
          <span className="font-bold text-slate-800 text-sm ml-2">Total: {totalMarks} marks</span>
        </div>
      </div>

      {/* Question rows */}
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition group"
          >
            {/* Drag handle visual */}
            <GripVertical className="w-4 h-4 text-slate-300 shrink-0" />

            {/* Number */}
            <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center justify-center shrink-0">
              {idx + 1}
            </span>

            {/* Source badge */}
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 shrink-0">
              {SOURCE_ICON[q.source]}
              {SOURCE_LABEL[q.source]}
            </span>

            {/* Question text */}
            <span className="flex-1 text-sm text-slate-800 truncate">
              <ChemRenderer text={q.questionText} />
            </span>

            {/* Meta */}
            <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
              <span className="px-1.5 py-0.5 rounded bg-slate-100">{q.topic.split(' ')[0]}</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-100">{q.difficulty}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">{q.marks}m</span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                disabled={idx === 0}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
                title="Move up"
              >
                <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                disabled={idx === questions.length - 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 transition"
                title="Move down"
              >
                <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewId(q.id)}
                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                title="Preview"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingId(q.id)}
                className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                title="Edit"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => remove(q.id)}
                className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editingQ && (
        <Modal
          isOpen={true}
          onClose={() => setEditingId(null)}
          title={`Edit Q${questions.findIndex((q) => q.id === editingId) + 1}`}
          maxWidth="2xl"
        >
          <ChemQuestionEditor
            onSave={update}
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

      {/* Preview modal */}
      {previewQ && (
        <Modal
          isOpen={true}
          onClose={() => setPreviewId(null)}
          title="Student View Preview"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-bold">{previewQ.topic}</span>
              <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200">{previewQ.difficulty}</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold">+{previewQ.marks} marks</span>
            </div>

            <div className="text-base font-semibold text-slate-900 leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-200">
              <ChemRenderer text={previewQ.questionText} />
            </div>

            <div className="space-y-2">
              {previewQ.options.map((opt) => (
                <div
                  key={opt.label}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                    previewQ.correctAnswer === opt.label
                      ? 'bg-emerald-50 border-emerald-300 font-semibold text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    previewQ.correctAnswer === opt.label ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>{opt.label}</span>
                  <ChemRenderer text={opt.text} />
                  {previewQ.correctAnswer === opt.label && (
                    <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Correct Answer
                    </span>
                  )}
                </div>
              ))}
            </div>

            {previewQ.explanation && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-sm text-blue-800">
                <strong className="block mb-1">Explanation:</strong>
                {previewQ.explanation}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
