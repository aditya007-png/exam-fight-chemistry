import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ExamQuestion } from '../../types/exam';
import { extractQuestionsFromDocument } from '../../lib/aiChemistryService';
import { FileUp, CheckCircle2, Sparkles, Plus } from 'lucide-react';

interface PDFExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsExtracted: (questions: ExamQuestion[]) => void;
}

export const PDFExtractorModal: React.FC<PDFExtractorModalProps> = ({
  isOpen,
  onClose,
  onQuestionsExtracted,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedQuestions, setExtractedQuestions] = useState<ExamQuestion[]>([]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!selectedFile) return;
    setIsExtracting(true);
    try {
      const parsed = await extractQuestionsFromDocument(selectedFile.name);
      setExtractedQuestions(parsed);
    } catch (err) {
      console.error('Error parsing document:', err);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImportAll = () => {
    onQuestionsExtracted(extractedQuestions);
    onClose();
    setSelectedFile(null);
    setExtractedQuestions([]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chemistry Exam Document & PDF Parser"
      subtitle="Extract balanced reaction equations, diagrams, and questions from past papers"
      maxWidth="lg"
    >
      {extractedQuestions.length === 0 ? (
        <div className="space-y-4">
          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-700 hover:border-chem-400/80 rounded-2xl p-8 text-center transition-all bg-surface-200/40 cursor-pointer"
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf,.doc,.docx,.tex';
              input.onchange = (ev: any) => {
                if (ev.target.files?.[0]) setSelectedFile(ev.target.files[0]);
              };
              input.click();
            }}
          >
            <div className="w-12 h-12 rounded-xl bg-chem-500/10 border border-chem-500/30 text-chem-400 flex items-center justify-center mx-auto mb-3">
              <FileUp className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">
              {selectedFile ? selectedFile.name : 'Drag & Drop Chemistry Examination PDF'}
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Supports .pdf, .docx, and LaTeX .tex chemistry question papers
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="glow"
              size="sm"
              disabled={!selectedFile}
              isLoading={isExtracting}
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleProcessFile}
            >
              Parse Chemistry Questions
            </Button>
          </div>
        </div>
      ) : (
        /* Parsed Questions List */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Extracted {extractedQuestions.length} Chemistry Questions Successfully
            </span>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {extractedQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="p-3.5 rounded-xl bg-surface-200 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex justify-between items-center text-slate-400">
                  <span className="font-bold text-white">Question #{idx + 1} ({q.domain})</span>
                  <span className="text-chem-300 font-mono">+{q.marks} pts</span>
                </div>
                <p className="text-slate-200">{q.questionText}</p>
                {q.chemicalEquation && (
                  <div className="p-2 rounded bg-surface-100 font-mono text-[11px] text-chem-300">
                    {q.chemicalEquation}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setExtractedQuestions([])}>
              Re-upload
            </Button>
            <Button
              variant="glow"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleImportAll}
            >
              Import {extractedQuestions.length} Questions to Exam
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};
