// src/pages/teacher/ExamBuilderPage.tsx
// 4-step exam creation workflow:
//   Step 1: Exam Details
//   Step 2: Add Questions (Manual | Upload PDF | AI Generate)
//   Step 3: Review & Arrange
//   Step 4: Publish

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ChemQuestionEditor } from '../../components/teacher/ChemQuestionEditor';
import { PdfImportReview } from '../../components/teacher/PdfImportReview';
import { AiReviewScreen } from '../../components/teacher/AiReviewScreen';
import { QuestionArrangeList } from '../../components/teacher/QuestionArrangeList';
import { extractMcqsFromPdf } from '../../lib/pdfParser';
import { generateAiQuestions, AiGenerateParams } from '../../lib/aiQuestionService';
import { createOrUpdateExam } from '../../lib/examService';
import { ChemQuestion, ChemTopic, QuestionDifficulty } from '../../types/question';
import {
  CheckCircle2, Clock, PenLine, Upload, Sparkles, ChevronRight,
  ChevronLeft, Loader2, AlertTriangle, FlaskConical,
} from 'lucide-react';

// ── Step labels ───────────────────────────────────────────────────────────────

const STEPS = [
  { num: 1, label: 'Exam Details' },
  { num: 2, label: 'Add Questions' },
  { num: 3, label: 'Review & Arrange' },
  { num: 4, label: 'Publish' },
];

const TOPICS: ChemTopic[] = [
  'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry',
  'Electrochemistry', 'Thermodynamics', 'Chemical Bonding', 'Equilibrium',
  'Solutions', 'Atomic Structure', 'Coordination Chemistry', 'General Chemistry',
];
const DIFFICULTIES: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

import { useAuth } from '../../context/AuthContext';
import { getStoredClasses, getStoredSections } from '../../lib/classService';
import { AcademicClass, AcademicSection } from '../../types/academic';

// ── Main component ────────────────────────────────────────────────────────────

export const ExamBuilderPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // ── Step 1 state ─────────────────────────────────────────────────────────
  const [examName, setExamName] = useState('Organic Chemistry — Unit Test');
  const [courseCode, setCourseCode] = useState('CHEM-302');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [subject, setSubject] = useState('Organic Chemistry');

  // Class & Section Selection State
  const [availableClasses, setAvailableClasses] = useState<AcademicClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [availableSections, setAvailableSections] = useState<AcademicSection[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');

  useEffect(() => {
    const cls = getStoredClasses(user?.id);
    setAvailableClasses(cls);
    if (cls.length > 0) {
      setSelectedClassId(cls[0].id);
      setCourseCode(cls[0].classCode);
      const secs = getStoredSections(cls[0].id);
      setAvailableSections(secs);
      if (secs.length > 0) {
        setSelectedSectionId(secs[0].id);
      }
    }
  }, [user?.id]);

  const handleClassChange = (clsId: string) => {
    setSelectedClassId(clsId);
    const cls = availableClasses.find((c) => c.id === clsId);
    if (cls) {
      setCourseCode(cls.classCode);
    }
    const secs = getStoredSections(clsId);
    setAvailableSections(secs);
    setSelectedSectionId(secs.length > 0 ? secs[0].id : '');
  };

  // ── Question bank for this exam ───────────────────────────────────────────
  const [questions, setQuestions] = useState<ChemQuestion[]>([]);

  // ── Step 2 modals ─────────────────────────────────────────────────────────
  type Step2Mode = null | 'manual' | 'pdf' | 'ai';
  const [step2Mode, setStep2Mode] = useState<Step2Mode>(null);

  // Manual editor
  const [manualModalOpen, setManualModalOpen] = useState(false);

  // PDF upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfParsing, setPdfParsing] = useState(false);
  const [pdfResult, setPdfResult] = useState<{
    questions: ChemQuestion[];
    fileName: string;
    isScanned: boolean;
  } | null>(null);
  const [pdfError, setPdfError] = useState('');

  // AI generation form
  const [aiForm, setAiForm] = useState<AiGenerateParams>({
    topic: 'Organic Chemistry',
    difficulty: 'Medium',
    count: 5,
    additionalInstruction: '',
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiDrafts, setAiDrafts] = useState<ChemQuestion[] | null>(null);

  // ── PDF file handler ──────────────────────────────────────────────────────
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfParsing(true);
    setPdfError('');
    setPdfResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const result = await extractMcqsFromPdf(buffer);
      setPdfResult({ questions: result.questions, fileName: file.name, isScanned: result.isScanned });
    } catch (err) {
      console.error(err);
      setPdfError('Failed to read PDF. Please try a different file.');
    }
    setPdfParsing(false);
    // reset input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePdfConfirm = (accepted: ChemQuestion[]) => {
    setQuestions((prev) => [...prev, ...accepted]);
    setPdfResult(null);
    setStep2Mode(null);
  };

  // ── AI handler ────────────────────────────────────────────────────────────
  const handleAiGenerate = async () => {
    setAiGenerating(true);
    try {
      const drafts = await generateAiQuestions(aiForm);
      setAiDrafts(drafts);
    } catch (err) {
      alert('AI generation failed. Please try again.');
    }
    setAiGenerating(false);
  };

  const handleAiConfirm = (accepted: ChemQuestion[]) => {
    setQuestions((prev) => [...prev, ...accepted]);
    setAiDrafts(null);
    setStep2Mode(null);
  };

  // ── Publish ───────────────────────────────────────────────────────────────
  const handlePublish = () => {
    const selectedClassObj = availableClasses.find((c) => c.id === selectedClassId);
    const selectedSectionObj = availableSections.find((s) => s.id === selectedSectionId);

    createOrUpdateExam(
      {
        title: examName,
        courseCode,
        durationMinutes,
        className: selectedClassObj?.name || 'All Cohorts',
        classId: selectedClassId || undefined,
        sectionId: selectedSectionId || undefined,
        sectionName: selectedSectionObj?.name || 'All Sections',
        topic: subject,
        teacherId: user?.id,
        teacherName: user?.full_name || 'Faculty Instructor',
        status: 'active',
      },
      questions
    );

    alert(`✅ Examination "${examName}" published and assigned to ${selectedClassObj?.name || 'Class'} (${selectedSectionObj?.name || 'All Sections'}).`);
    navigate('/teacher/exams');
  };

  // ── Step navigation ───────────────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 1) return examName.trim() && courseCode.trim();
    if (step === 2) return true; // can always proceed (teacher may go back)
    if (step === 3) return questions.length > 0;
    return false;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-1">
            <FlaskConical className="w-3.5 h-3.5" />
            Chemistry Examination Builder
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Examination</h1>
          <p className="text-xs text-slate-500 mt-0.5">Build your chemistry exam and assign it to your class sections.</p>
        </div>
      </div>

      {/* Step Progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, idx) => (
          <React.Fragment key={s.num}>
            <button
              type="button"
              onClick={() => step > s.num && setStep(s.num)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                step === s.num
                  ? 'bg-blue-600 text-white shadow-sm'
                  : step > s.num
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 cursor-default'
              }`}
            >
              {step > s.num ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">{s.num}</span>
              )}
              {s.label}
            </button>
            {idx < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-slate-300 mx-1 shrink-0" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── STEP 1: Exam Details ── */}
      {step === 1 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-5">
          <h2 className="text-base font-bold text-slate-900">Examination & Section Assignment Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Examination Title *</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. Organic Chemistry — Unit Test"
              />
            </div>

            {/* Target Class Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Class *</label>
              {availableClasses.length > 0 ? (
                <select
                  value={selectedClassId}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {availableClasses.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.classCode})
                    </option>
                  ))}
                </select>
              ) : (
                <Link to="/teacher/classes" className="text-xs text-blue-600 font-semibold hover:underline block pt-2">
                  + Create a class first in Classes page
                </Link>
              )}
            </div>

            {/* Target Section Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Target Section *</label>
              {availableSections.length > 0 ? (
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
                >
                  {availableSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name} (Code: {sec.enrollmentCode})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-slate-400 pt-2">
                  No sections available for selected class.
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Course Code *</label>
              <input
                type="text"
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="e.g. CHEM-302"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Subject Topic</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Duration (Minutes) *</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="number"
                  min={5}
                  max={300}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!canGoNext()}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => setStep(2)}
            >
              Next: Add Questions
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Add Questions ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Three method cards */}
          {!step2Mode && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Manual */}
              <div
                onClick={() => { setStep2Mode('manual'); setManualModalOpen(true); }}
                className="rounded-2xl bg-white border-2 border-slate-200 p-6 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center group-hover:bg-blue-100 transition">
                  <PenLine className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5">Create Manually</h3>
                  <p className="text-xs text-slate-500">Type questions with chemistry notation toolbar and live preview.</p>
                </div>
              </div>

              {/* Upload PDF */}
              <div
                onClick={() => { setStep2Mode('pdf'); fileInputRef.current?.click(); }}
                className="rounded-2xl bg-white border-2 border-slate-200 p-6 hover:border-amber-400 hover:shadow-lg transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center group-hover:bg-amber-100 transition">
                  <Upload className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5">Upload Question PDF</h3>
                  <p className="text-xs text-slate-500">Upload a PDF with MCQs. System extracts and formats chemistry questions.</p>
                </div>
              </div>

              {/* AI Generate */}
              <div
                onClick={() => setStep2Mode('ai')}
                className="rounded-2xl bg-white border-2 border-slate-200 p-6 hover:border-violet-400 hover:shadow-lg transition-all cursor-pointer space-y-3 group"
              >
                <div className="w-12 h-12 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center group-hover:bg-violet-100 transition">
                  <Sparkles className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-0.5">Generate with AI</h3>
                  <p className="text-xs text-slate-500">AI generates chemistry MCQs by topic, difficulty, and count.</p>
                </div>
              </div>
            </div>
          )}

          {/* Hidden PDF input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handlePdfUpload}
          />

          {/* PDF loading state */}
          {pdfParsing && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <Loader2 className="w-5 h-5 animate-spin shrink-0" />
              Parsing PDF and extracting chemistry MCQs...
            </div>
          )}
          {pdfError && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              {pdfError}
              <button className="ml-auto text-xs underline" onClick={() => { setPdfError(''); setStep2Mode(null); }}>Dismiss</button>
            </div>
          )}

          {/* PDF review screen */}
          {pdfResult && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card">
              <h2 className="text-base font-bold text-slate-900 mb-4">PDF Import Review</h2>
              <PdfImportReview
                questions={pdfResult.questions}
                fileName={pdfResult.fileName}
                isScanned={pdfResult.isScanned}
                onConfirm={handlePdfConfirm}
                onCancel={() => { setPdfResult(null); setStep2Mode(null); }}
              />
            </div>
          )}

          {/* AI Generate form */}
          {step2Mode === 'ai' && !aiDrafts && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                <h2 className="text-base font-bold text-slate-900">AI Question Generator</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Topic</label>
                  <select
                    value={aiForm.topic}
                    onChange={(e) => setAiForm((p) => ({ ...p, topic: e.target.value as ChemTopic }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none"
                  >
                    {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Difficulty</label>
                  <select
                    value={aiForm.difficulty}
                    onChange={(e) => setAiForm((p) => ({ ...p, difficulty: e.target.value as QuestionDifficulty }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none"
                  >
                    {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Number of Questions</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={aiForm.count}
                    onChange={(e) => setAiForm((p) => ({ ...p, count: parseInt(e.target.value) || 5 }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Additional Instruction <span className="text-slate-400">(optional)</span></label>
                  <input
                    type="text"
                    value={aiForm.additionalInstruction}
                    onChange={(e) => setAiForm((p) => ({ ...p, additionalInstruction: e.target.value }))}
                    placeholder="e.g. Focus on reaction mechanisms"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-between gap-3">
                <Button variant="secondary" size="sm" onClick={() => setStep2Mode(null)}>Back</Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  onClick={handleAiGenerate}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? 'Generating...' : `Generate ${aiForm.count} Questions`}
                </Button>
              </div>
            </div>
          )}

          {/* AI Review screen */}
          {aiDrafts && (
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card">
              <h2 className="text-base font-bold text-slate-900 mb-4">AI Generated Questions</h2>
              <AiReviewScreen
                questions={aiDrafts}
                onConfirm={handleAiConfirm}
                onCancel={() => { setAiDrafts(null); setStep2Mode(null); }}
              />
            </div>
          )}

          {/* Current questions count bar */}
          {questions.length > 0 && !pdfResult && !aiDrafts && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-4 h-4" />
                <strong>{questions.length}</strong> questions added
                <span className="text-emerald-600">({questions.reduce((s, q) => s + q.marks, 0)} total marks)</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => setStep(3)}
              >
                Review & Arrange
              </Button>
            </div>
          )}

          {/* Nav */}
          {!pdfResult && !aiDrafts && !step2Mode && (
            <div className="flex justify-between pt-2 border-t border-slate-200">
              <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="primary"
                size="sm"
                rightIcon={<ChevronRight className="w-4 h-4" />}
                onClick={() => setStep(3)}
                disabled={questions.length === 0}
              >
                Review & Arrange ({questions.length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── STEP 3: Review & Arrange ── */}
      {step === 3 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Exam Questions</h2>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<PenLine className="w-4 h-4 text-blue-600" />}
              onClick={() => { setStep2Mode(null); setStep(2); }}
            >
              Add More Questions
            </Button>
          </div>

          <QuestionArrangeList questions={questions} onChange={setQuestions} />

          <div className="flex justify-between pt-2 border-t border-slate-200">
            <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={questions.length === 0}
              rightIcon={<ChevronRight className="w-4 h-4" />}
              onClick={() => setStep(4)}
            >
              Proceed to Publish
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Publish ── */}
      {step === 4 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-8 shadow-card space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 mb-1">{examName}</h2>
            <p className="text-sm text-slate-500">
              {courseCode} • {availableClasses.find((c) => c.id === selectedClassId)?.name || 'Class'} ({availableSections.find((s) => s.id === selectedSectionId)?.name || 'Section'}) • {durationMinutes} minutes
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto text-center text-sm">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xl font-bold text-slate-900 block">{questions.length}</span>
              <span className="text-xs text-slate-500">Questions</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xl font-bold text-slate-900 block">{questions.reduce((s, q) => s + q.marks, 0)}</span>
              <span className="text-xs text-slate-500">Total Marks</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-xl font-bold text-slate-900 block">{durationMinutes}m</span>
              <span className="text-xs text-slate-500">Duration</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="secondary" size="sm" leftIcon={<ChevronLeft className="w-4 h-4" />} onClick={() => setStep(3)}>
              Back to Arrange
            </Button>
            <Button
              variant="primary"
              size="lg"
              leftIcon={<CheckCircle2 className="w-5 h-5" />}
              onClick={handlePublish}
              className="shadow-md"
            >
              Publish Examination
            </Button>
          </div>
        </div>
      )}

      {/* Manual question editor modal */}
      <Modal isOpen={manualModalOpen} onClose={() => { setManualModalOpen(false); setStep2Mode(null); }} title="Create Chemistry Question" maxWidth="2xl">
        <ChemQuestionEditor
          onSave={(q) => {
            setQuestions((prev) => [...prev, q]);
            setManualModalOpen(false);
            setStep2Mode(null);
          }}
          onCancel={() => { setManualModalOpen(false); setStep2Mode(null); }}
        />
      </Modal>
    </div>
  );
};
