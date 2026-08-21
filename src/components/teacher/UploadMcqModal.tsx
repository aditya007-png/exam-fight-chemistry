// src/components/teacher/UploadMcqModal.tsx
import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { extractMcqsFromPdf } from '../../lib/pdfParser';
import { generateAiOptions } from '../../lib/aiService';
import { McqQuestion } from '../../types/mcq';
import {
  Upload,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileText,
  FlaskConical,
} from 'lucide-react';
import { Button } from '../common/Button';

const CHEM_PREFIXES = [
  { label: 'None', value: '' },
  { label: '1H-NMR', value: '1H-NMR: ' },
  { label: '13C-NMR', value: '13C-NMR: ' },
  { label: 'IR Spectrum', value: 'IR Spectrum: ' },
  { label: 'Ka/Eq', value: 'Ka: ' },
  { label: 'DeltaG', value: 'DeltaG: ' },
  { label: 'Mechanism', value: 'Mechanism: ' },
  { label: 'Reaction', value: 'Reaction: ' },
];

const McqCard: React.FC<{
  q: McqQuestion;
  index: number;
  onUpdate: (updated: McqQuestion) => void;
}> = ({ q, index, onUpdate }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-sm font-bold text-slate-800 text-left flex-1 truncate pr-2">
          Q{index + 1}. {q.stem.length > 80 ? q.stem.substring(0, 80) + '...' : q.stem}
        </span>
        {q.answerIndex !== undefined ? (
          <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold shrink-0 mr-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Answer set
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-500 text-xs font-bold shrink-0 mr-2">
            <AlertTriangle className="w-3.5 h-3.5" /> No answer
          </span>
        )}
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Chemistry Prefix</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {CHEM_PREFIXES.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onUpdate({ ...q, stem: p.value + q.stem.replace(/^[^:]+:\s*/, '') })}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-bold border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition whitespace-nowrap"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Question Stem</label>
            <textarea
              value={q.stem}
              rows={2}
              onChange={(e) => onUpdate({ ...q, stem: e.target.value })}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-500">
              Answer Options <span className="text-slate-400 font-normal">(click to mark correct)</span>
            </label>
            {q.options.map((opt, oi) => (
              <div
                key={oi}
                className={'flex items-center gap-2 rounded-xl border px-3 py-2 transition cursor-pointer ' +
                  (q.answerIndex === oi ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50')}
                onClick={() => onUpdate({ ...q, answerIndex: oi })}
              >
                <span className={'w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ' +
                  (q.answerIndex === oi ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500')}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <input
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = q.options.map((o, i) => i === oi ? { text: e.target.value } : o);
                    onUpdate({ ...q, options: newOpts });
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none"
                />
                {q.answerIndex === oi && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

interface UploadMcqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadMcqModal: React.FC<UploadMcqModalProps> = ({ isOpen, onClose }) => {
  const [questions, setQuestions] = useState<McqQuestion[]>([]);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [aiEnriching, setAiEnriching] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setError('');
    setQuestions([]);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await extractMcqsFromPdf(arrayBuffer);
      // UploadMcqModal uses its own McqQuestion type — bridge via the questions array
      // We just set an empty array here since this modal is superseded by the new ExamBuilder flow
      setQuestions([]);
      if (result.questions.length === 0) {
        setError(result.isScanned ? 'Scanned PDF detected. Text extraction unavailable.' : 'No MCQs found in PDF.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to parse PDF. Ensure MCQs follow: 1. Stem, A. Option B. Option C. Option D. Option');
    }
    setLoading(false);
  };

  const handleAiEnrich = async () => {
    setAiEnriching(true);
    const enriched = await Promise.all(
      questions.map(async (q) => {
        if (q.options.length === 0) {
          const aiOpts = await generateAiOptions(q.stem);
          return { ...q, options: aiOpts };
        }
        return q;
      })
    );
    setQuestions(enriched);
    setAiEnriching(false);
  };

  const updateQuestion = (updated: McqQuestion) =>
    setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));

  const handleSave = () => {
    alert(questions.length + ' questions saved to Question Bank!');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload MCQ PDF" maxWidth="2xl">
      <div className="space-y-5">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-blue-300 rounded-2xl bg-blue-50 hover:bg-blue-100 cursor-pointer transition">
          <Upload className="w-8 h-8 text-blue-400 mb-1" />
          <span className="text-sm font-semibold text-blue-600">{fileName ? fileName : 'Click to upload PDF'}</span>
          <span className="text-xs text-slate-400 mt-0.5">MCQ format: 1. Stem, A. ... B. ... C. ... D. ...</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} disabled={loading} />
        </label>

        {loading && (
          <div className="flex items-center gap-2 text-sm text-blue-600">
            <Loader2 className="w-4 h-4 animate-spin" /> Parsing PDF and extracting MCQs...
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}

        {questions.length > 0 && (
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-sm text-slate-700">
              <FileText className="w-4 h-4 text-blue-500" />
              <strong>{questions.length}</strong> questions extracted
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={aiEnriching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-violet-500" />}
                onClick={handleAiEnrich}
                disabled={aiEnriching}
              >
                {aiEnriching ? 'Generating...' : 'AI Generate Options'}
              </Button>
              <Button variant="primary" size="sm" leftIcon={<FlaskConical className="w-4 h-4" />} onClick={handleSave}>
                Save to Question Bank
              </Button>
            </div>
          </div>
        )}

        {questions.length > 0 && (
          <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <McqCard key={q.id} q={q} index={idx} onUpdate={updateQuestion} />
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
