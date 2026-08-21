import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ChemistryDomain, ExamQuestion, QuestionDifficulty, QuestionType } from '../../types/exam';
import { generateChemistryQuestion } from '../../lib/aiChemistryService';
import { BrainCircuit, Plus } from 'lucide-react';

interface AIQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionGenerated: (question: ExamQuestion) => void;
}

export const AIQuestionModal: React.FC<AIQuestionModalProps> = ({
  isOpen,
  onClose,
  onQuestionGenerated,
}) => {
  const [domain, setDomain] = useState<ChemistryDomain>('Organic Chemistry');
  const [topic, setTopic] = useState('Electrophilic Aromatic Substitution');
  const [difficulty, setDifficulty] = useState<QuestionDifficulty>('Intermediate');
  const [type, setType] = useState<QuestionType>('mcq');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<ExamQuestion | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const q = await generateChemistryQuestion({
        domain,
        topic,
        difficulty,
        type,
        customPrompt,
      });
      setGeneratedQuestion(q);
    } catch (err) {
      console.error('Error generating question:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedQuestion) {
      onQuestionGenerated(generatedQuestion);
      onClose();
      setGeneratedQuestion(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI Chemistry Question Synthesizer"
      subtitle="Generate rigorous chemical problems with balanced equations, rubrics and distractors"
      maxWidth="xl"
    >
      {!generatedQuestion ? (
        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chemistry Domain
              </label>
              <select
                value={domain}
                onChange={(e) => setDomain(e.target.value as ChemistryDomain)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-200 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-chem-400"
              >
                <option value="Organic Chemistry">Organic Chemistry</option>
                <option value="Physical Chemistry">Physical Chemistry</option>
                <option value="Inorganic Chemistry">Inorganic Chemistry</option>
                <option value="Analytical Chemistry">Analytical Chemistry</option>
                <option value="Biochemistry">Biochemistry</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as QuestionDifficulty)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-200 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-chem-400"
              >
                <option value="Foundation">Foundation (Introductory)</option>
                <option value="Intermediate">Intermediate (Undergraduate)</option>
                <option value="Advanced">Advanced (Honors / Graduate)</option>
                <option value="Olympiad">Olympiad / Competitive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Specific Topic Area
              </label>
              <input
                type="text"
                placeholder="e.g. Aldol Condensation or Gibbs Energy"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-200 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-chem-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Question Format
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as QuestionType)}
                className="w-full px-3.5 py-2 rounded-lg bg-surface-200 border border-slate-700 text-xs text-white focus:outline-none focus:ring-2 focus:ring-chem-400"
              >
                <option value="mcq">Multiple Choice (MCQ)</option>
                <option value="numerical">Numerical Value Problem</option>
                <option value="mechanism">Reaction Mechanism / Explanation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Custom Prompt Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Include subtle common misconception traps in options C and D..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full p-3 rounded-lg bg-surface-200 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-chem-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="glow"
              size="sm"
              type="submit"
              isLoading={isGenerating}
              leftIcon={<BrainCircuit className="w-4 h-4" />}
            >
              Synthesize Question
            </Button>
          </div>
        </form>
      ) : (
        /* Synthesized Question Preview */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-surface-200/90 border border-chem-500/40 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold font-mono text-chem-300 bg-chem-500/10 px-2 py-0.5 rounded border border-chem-500/20">
                {generatedQuestion.domain} • {generatedQuestion.difficulty}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                +{generatedQuestion.marks} Marks
              </span>
            </div>

            <h4 className="text-sm font-semibold text-white leading-snug">
              {generatedQuestion.questionText}
            </h4>

            {generatedQuestion.chemicalEquation && (
              <div className="p-3 rounded-lg bg-surface-100 border border-slate-700 text-center font-mono text-xs text-chem-300 font-bold">
                {generatedQuestion.chemicalEquation}
              </div>
            )}

            {generatedQuestion.options && (
              <div className="space-y-1.5 pt-1">
                {generatedQuestion.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                      opt.isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200 font-medium'
                        : 'bg-surface-100/60 border-slate-800 text-slate-300'
                    }`}
                  >
                    <span className="font-mono font-bold">{opt.label})</span>
                    <span>{opt.text}</span>
                    {opt.isCorrect && (
                      <span className="ml-auto text-[10px] uppercase font-bold text-emerald-400">
                        (Correct Key)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="p-3 rounded-lg bg-surface-100/90 border border-slate-800 text-xs text-slate-300 space-y-1">
              <span className="text-chem-400 font-bold block text-[11px] uppercase tracking-wider">
                Step-by-step chemical rationale:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300">{generatedQuestion.explanation}</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setGeneratedQuestion(null)}
            >
              Re-generate
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Discard
              </Button>
              <Button
                variant="glow"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAccept}
              >
                Add to Exam Set
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};
