import React from 'react';
import { ExamQuestion, StudentAnswerState } from '../../types/exam';

interface QuestionPaletteProps {
  questions: ExamQuestion[];
  currentIndex: number;
  answers: Record<string, StudentAnswerState>;
  onSelectQuestion: (index: number) => void;
}

export const QuestionPalette: React.FC<QuestionPaletteProps> = ({
  questions,
  currentIndex,
  answers,
  onSelectQuestion,
}) => {
  let answeredCount = 0;
  let markedCount = 0;
  let notAnsweredCount = 0;
  let notVisitedCount = 0;

  questions.forEach((q) => {
    const ans = answers[q.id];
    if (!ans || !ans.isVisited) {
      notVisitedCount++;
      return;
    }

    const hasAnswer =
      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      (ans.numericalAnswer && ans.numericalAnswer.trim() !== '') ||
      (ans.mechanismText && ans.mechanismText.trim() !== '');

    if (hasAnswer) {
      answeredCount++;
    } else {
      notAnsweredCount++;
    }

    if (ans.isMarkedForReview) {
      markedCount++;
    }
  });

  const getStatusColor = (q: ExamQuestion, idx: number) => {
    const isCurrent = currentIndex === idx;
    const ans = answers[q.id];

    if (!ans || !ans.isVisited) {
      return isCurrent
        ? 'bg-blue-600 text-white font-bold ring-2 ring-blue-300'
        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100';
    }

    const hasAnswer =
      (ans.selectedOptionIds && ans.selectedOptionIds.length > 0) ||
      (ans.numericalAnswer && ans.numericalAnswer.trim() !== '') ||
      (ans.mechanismText && ans.mechanismText.trim() !== '');

    if (ans.isMarkedForReview && hasAnswer) {
      return `bg-indigo-600 text-white font-bold ${isCurrent ? 'ring-2 ring-indigo-300' : ''}`;
    }

    if (ans.isMarkedForReview) {
      return `bg-amber-500 text-white font-bold ${isCurrent ? 'ring-2 ring-amber-300' : ''}`;
    }

    if (hasAnswer) {
      return `bg-emerald-600 text-white font-bold ${isCurrent ? 'ring-2 ring-emerald-300' : ''}`;
    }

    // Visited but no answer
    return `bg-rose-50 text-rose-700 border border-rose-200 ${
      isCurrent ? 'ring-2 ring-rose-400 font-bold' : ''
    }`;
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-card space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h3 className="text-sm font-bold text-slate-900">
          Question Palette
        </h3>
        <span className="text-[11px] text-slate-500">Jump directly to any section</span>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-600 shrink-0" />
          <span>Answered ({answeredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
          <span>Review ({markedCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-rose-200 border border-rose-400 shrink-0" />
          <span>Unanswered ({notAnsweredCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-slate-100 border border-slate-300 shrink-0" />
          <span>Not Visited ({notVisitedCount})</span>
        </div>
      </div>

      {/* Number Grid */}
      <div className="pt-2 border-t border-slate-100">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={`h-9 rounded-xl font-mono text-xs transition-all flex items-center justify-center ${getStatusColor(
                q,
                idx
              )}`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
