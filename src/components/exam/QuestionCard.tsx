import React from 'react';
import { ExamQuestion, StudentAnswerState } from '../../types/exam';
import { Button } from '../common/Button';
import { ChemCanvasModal } from '../chemistry/ChemCanvasModal';
import { ChemRenderer } from '../chemistry/ChemRenderer';
import {
  BookmarkCheck,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface QuestionCardProps {
  question: ExamQuestion;
  currentIndex: number;
  totalQuestions: number;
  answerState: StudentAnswerState;
  onSelectOption: (optionId: string) => void;
  onSelectMsqOption: (optionId: string) => void;
  onUpdateNumerical: (value: string) => void;
  onUpdateMechanism: (text: string) => void;
  onToggleMarkForReview: () => void;
  onClearResponse: () => void;
  onPrev: () => void;
  onNext: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  answerState,
  onSelectOption,
  onSelectMsqOption,
  onUpdateNumerical,
  onUpdateMechanism,
  onToggleMarkForReview,
  onClearResponse,
  onPrev,
  onNext,
  isFirst,
  isLast,
}) => {
  const [isChemCanvasOpen, setIsChemCanvasOpen] = React.useState(false);

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-card overflow-hidden flex flex-col justify-between">
      {/* 1. Header Bar */}
      <div className="px-6 py-3.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold font-mono text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
            {question.domain} • {question.topic}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            +{question.marks} Marks
          </span>
          {question.negativeMarks && question.negativeMarks > 0 && (
            <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              -{question.negativeMarks} Negative
            </span>
          )}
        </div>
      </div>

      {/* 2. Question Statement Body */}
      <div className="p-6 space-y-6 select-none">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
          <ChemRenderer text={question.questionText} />
        </h2>

        {/* Chemical Equation Banner if present */}
        {question.chemicalEquation && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center font-mono text-sm sm:text-base text-blue-700 font-bold">
            <ChemRenderer text={question.chemicalEquation} block />
          </div>
        )}

        {/* 3. Input Controls based on Question Type */}
        {question.type === 'mcq' && question.options && (
          <div className="space-y-2.5 pt-1">
            {question.options.map((opt) => {
              const isSelected = answerState.selectedOptionIds?.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectOption(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 shadow-xs ring-1 ring-blue-500 text-slate-900 font-semibold'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-sm pt-0.5 leading-snug"><ChemRenderer text={opt.text} /></div>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'msq' && question.options && (
          <div className="space-y-2.5 pt-1">
            <p className="text-xs text-indigo-700 font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Multiple Select Question: One or more options may be correct.
            </p>
            {question.options.map((opt) => {
              const isSelected = answerState.selectedOptionIds?.includes(opt.id);
              return (
                <div
                  key={opt.id}
                  onClick={() => onSelectMsqOption(opt.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3.5 ${
                    isSelected
                      ? 'bg-indigo-50 border-indigo-500 shadow-xs ring-1 ring-indigo-500 text-slate-900 font-semibold'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md shrink-0 flex items-center justify-center font-mono text-xs font-bold transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-sm pt-0.5 leading-snug"><ChemRenderer text={opt.text} /></div>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'numerical' && (
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Enter Calculated Value ({question.numericalUnit || 'Numerical Unit'}):
            </label>
            <div className="flex items-center gap-3 max-w-sm">
              <input
                type="number"
                step="any"
                placeholder="e.g. 1.10 or -50.80"
                value={answerState.numericalAnswer || ''}
                onChange={(e) => onUpdateNumerical(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {question.numericalUnit && (
                <span className="px-3 py-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs text-blue-700 font-bold whitespace-nowrap shadow-xs">
                  {question.numericalUnit}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              Tolerance accepted: ±{question.numericalTolerance || 0.05} {question.numericalUnit}
            </p>
          </div>
        )}

        {question.type === 'mechanism' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Provide Reaction Mechanism / Step-by-Step Explanation:
              </label>
              <Button
                variant="secondary"
                size="sm"
                className="text-xs"
                leftIcon={<Layers className="w-3.5 h-3.5 text-blue-600" />}
                onClick={() => setIsChemCanvasOpen(true)}
              >
                Launch 2D Mechanism Sketcher
              </Button>
            </div>

            <textarea
              rows={5}
              placeholder="Step 1: Protonation / Electrophilic attack on...\nStep 2: Carbocation rearrangement / Intermediate formation...\nStep 3: Nucleophilic capture..."
              value={answerState.mechanismText || ''}
              onChange={(e) => onUpdateMechanism(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
            />
            <div className="text-[11px] text-slate-500">
              Tip: You can use the 2D Mechanism Sketcher above to draw reaction rings, electron pushing arrows, and heteroatoms.
            </div>
          </div>
        )}
      </div>

      {/* ChemCanvas Modal */}
      <ChemCanvasModal
        isOpen={isChemCanvasOpen}
        onClose={() => setIsChemCanvasOpen(false)}
        onSaveStructure={(st) => {
          const summary = `[Structure: ${st.atoms.length} atoms, ${st.bonds.length} bonds, ${st.arrows.length} curly arrows attached]`;
          onUpdateMechanism((answerState.mechanismText || '') + (answerState.mechanismText ? '\n' : '') + summary);
        }}
      />

      {/* 4. Action Footer Bar */}
      <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={answerState.isMarkedForReview ? 'primary' : 'secondary'}
            size="sm"
            leftIcon={<BookmarkCheck className="w-4 h-4" />}
            onClick={onToggleMarkForReview}
          >
            {answerState.isMarkedForReview ? 'Marked for Review' : 'Mark for Review'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<RotateCcw className="w-4 h-4" />}
            onClick={onClearResponse}
          >
            Clear Response
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isFirst}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            onClick={onPrev}
          >
            Previous
          </Button>

          <Button
            variant="primary"
            size="sm"
            rightIcon={!isLast ? <ArrowRight className="w-4 h-4" /> : undefined}
            onClick={onNext}
          >
            {isLast ? 'Save & Review' : 'Save & Next'}
          </Button>
        </div>
      </div>
    </div>
  );
};
