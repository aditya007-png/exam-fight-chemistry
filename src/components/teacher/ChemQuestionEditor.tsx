// src/components/teacher/ChemQuestionEditor.tsx
// High-grade chemistry question editor with categorised Chemistry Keyboard & live preview
import React, { useState, useRef } from 'react';
import { ChemRenderer } from '../chemistry/ChemRenderer';
import { ChemQuestion, ChemTopic, QuestionDifficulty } from '../../types/question';
import { Button } from '../common/Button';
import {
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Layers,
} from 'lucide-react';

// ── Chemistry Keyboard Definition ─────────────────────────────────────────────

interface KeyboardCategory {
  id: string;
  name: string;
  keys: Array<{ label: string; insert: string; title: string }>;
}

const CHEMISTRY_KEYBOARD_TABS: KeyboardCategory[] = [
  {
    id: 'arrows',
    name: 'Arrows & React',
    keys: [
      { label: '→', insert: ' -> ', title: 'Reaction arrow' },
      { label: '⇌', insert: ' <=> ', title: 'Equilibrium arrow' },
      { label: '⇄', insert: ' ⇄ ', title: 'Reversible reaction' },
      { label: '↑', insert: '↑', title: 'Gas evolution' },
      { label: '↓', insert: '↓', title: 'Precipitate formed' },
      { label: '+', insert: ' + ', title: 'Plus / Addition' },
      { label: 'Δ', insert: 'Δ', title: 'Heat / Energy added' },
      { label: 'hν', insert: 'hν', title: 'Photochemical / Light' },
    ],
  },
  {
    id: 'subscripts',
    name: 'Subscripts',
    keys: [
      { label: '₀', insert: '0', title: 'Subscript 0 (auto-subscripted)' },
      { label: '₁', insert: '1', title: 'Subscript 1' },
      { label: '₂', insert: '2', title: 'Subscript 2 (e.g. H2 → H₂)' },
      { label: '₃', insert: '3', title: 'Subscript 3 (e.g. NH3 → NH₃)' },
      { label: '₄', insert: '4', title: 'Subscript 4 (e.g. CH4 → CH₄)' },
      { label: '₅', insert: '5', title: 'Subscript 5' },
      { label: '₆', insert: '6', title: 'Subscript 6' },
      { label: '₇', insert: '7', title: 'Subscript 7' },
      { label: '₈', insert: '8', title: 'Subscript 8' },
      { label: '₉', insert: '9', title: 'Subscript 9' },
      { label: '₍', insert: '(', title: 'Subscript open bracket' },
      { label: '₎', insert: ')', title: 'Subscript close bracket' },
    ],
  },
  {
    id: 'superscripts',
    name: 'Charges / Super',
    keys: [
      { label: '⁺', insert: '+', title: 'Positive ion charge (H+ → H⁺)' },
      { label: '⁻', insert: '-', title: 'Negative ion charge (Cl- → Cl⁻)' },
      { label: '²⁺', insert: '2+', title: 'Divalent cation (Mg2+ → Mg²⁺)' },
      { label: '³⁺', insert: '3+', title: 'Trivalent cation (Fe3+ → Fe³⁺)' },
      { label: '²⁻', insert: '2-', title: 'Divalent anion (SO42- → SO₄²⁻)' },
      { label: '³⁻', insert: '3-', title: 'Trivalent anion (PO43- → PO₄³⁻)' },
      { label: '⁰', insert: '⁰', title: 'Oxidation state 0' },
      { label: '¹', insert: '¹', title: 'Superscript 1' },
      { label: '²', insert: '²', title: 'Square / Power of 2' },
      { label: '³', insert: '³', title: 'Cube / Power of 3' },
    ],
  },
  {
    id: 'formulas',
    name: 'Common Groups',
    keys: [
      { label: 'H₂O', insert: 'H2O', title: 'Water' },
      { label: 'H⁺', insert: 'H+', title: 'Hydronium/Hydrogen ion' },
      { label: 'OH⁻', insert: 'OH-', title: 'Hydroxide ion' },
      { label: 'SO₄²⁻', insert: 'SO42-', title: 'Sulfate ion' },
      { label: 'NO₃⁻', insert: 'NO3-', title: 'Nitrate ion' },
      { label: 'CO₃²⁻', insert: 'CO32-', title: 'Carbonate ion' },
      { label: 'NH₄⁺', insert: 'NH4+', title: 'Ammonium ion' },
      { label: 'Cl⁻', insert: 'Cl-', title: 'Chloride ion' },
      { label: 'Na⁺', insert: 'Na+', title: 'Sodium ion' },
      { label: 'CO₂', insert: 'CO2', title: 'Carbon dioxide' },
      { label: 'CH₄', insert: 'CH4', title: 'Methane' },
      { label: 'HCl', insert: 'HCl', title: 'Hydrochloric acid' },
      { label: 'NaOH', insert: 'NaOH', title: 'Sodium hydroxide' },
    ],
  },
  {
    id: 'states',
    name: 'States',
    keys: [
      { label: '(s)', insert: '(s)', title: 'Solid state' },
      { label: '(l)', insert: '(l)', title: 'Liquid state' },
      { label: '(g)', insert: '(g)', title: 'Gaseous state' },
      { label: '(aq)', insert: '(aq)', title: 'Aqueous solution' },
    ],
  },
  {
    id: 'greek',
    name: 'Greek / Math',
    keys: [
      { label: 'α', insert: 'alpha', title: 'Alpha particle / angle' },
      { label: 'β', insert: 'beta', title: 'Beta particle' },
      { label: 'γ', insert: 'gamma', title: 'Gamma radiation' },
      { label: 'δ', insert: 'δ', title: 'Partial charge delta' },
      { label: 'Δ', insert: 'Delta', title: 'Delta / Change' },
      { label: 'λ', insert: 'lambda', title: 'Wavelength' },
      { label: 'π', insert: 'pi', title: 'Pi bond / constant' },
      { label: 'σ', insert: 'sigma', title: 'Sigma bond' },
      { label: 'θ', insert: 'theta', title: 'Angle theta' },
      { label: 'μ', insert: 'mu', title: 'Dipole moment / micro' },
      { label: 'ν', insert: 'nu', title: 'Frequency' },
    ],
  },
  {
    id: 'thermo',
    name: 'Units & Thermo',
    keys: [
      { label: 'ΔH°', insert: 'ΔH°', title: 'Standard enthalpy change' },
      { label: 'ΔG°', insert: 'ΔG°', title: 'Standard Gibbs free energy' },
      { label: 'ΔS°', insert: 'ΔS°', title: 'Standard entropy change' },
      { label: 'pH', insert: 'pH', title: 'pH value' },
      { label: 'pKa', insert: 'pKa', title: 'Acid dissociation constant' },
      { label: 'Keq', insert: 'Keq', title: 'Equilibrium constant' },
      { label: 'mol/L', insert: ' mol/L', title: 'Molar concentration unit' },
      { label: 'kJ/mol', insert: ' kJ/mol', title: 'Energy unit' },
      { label: 'atm', insert: ' atm', title: 'Pressure unit' },
      { label: '°C', insert: '°C', title: 'Degrees Celsius' },
      { label: 'K', insert: ' K', title: 'Kelvin temperature' },
    ],
  },
];

const TOPICS: ChemTopic[] = [
  'Organic Chemistry',
  'Inorganic Chemistry',
  'Physical Chemistry',
  'Electrochemistry',
  'Thermodynamics',
  'Chemical Bonding',
  'Equilibrium',
  'Solutions',
  'Atomic Structure',
  'Coordination Chemistry',
  'General Chemistry',
];

const DIFFICULTIES: QuestionDifficulty[] = ['Easy', 'Medium', 'Hard'];

// ── Types ─────────────────────────────────────────────────────────────────────

interface EditorDraft {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  topic: ChemTopic;
  difficulty: QuestionDifficulty;
  marks: number;
  explanation: string;
}

const BLANK_DRAFT: EditorDraft = {
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
  topic: 'General Chemistry',
  difficulty: 'Medium',
  marks: 4,
  explanation: '',
};

interface ChemQuestionEditorProps {
  onSave: (q: ChemQuestion) => void;
  onCancel: () => void;
  initial?: Partial<EditorDraft>;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const ChemQuestionEditor: React.FC<ChemQuestionEditorProps> = ({
  onSave,
  onCancel,
  initial = {},
}) => {
  const [draft, setDraft] = useState<EditorDraft>({ ...BLANK_DRAFT, ...initial });
  const [activeTab, setActiveTab] = useState<string>('arrows');
  const [showPreview, setShowPreview] = useState<boolean>(false);
  
  // Track last focused input ('questionText' | 'optionA' | 'optionB' | 'optionC' | 'optionD')
  const [focusedField, setFocusedField] = useState<string>('questionText');
  const inputRefs = useRef<Record<string, HTMLTextAreaElement | HTMLInputElement | null>>({});

  const update = (key: keyof EditorDraft, val: string | number) =>
    setDraft((prev) => ({ ...prev, [key]: val }));

  // Insert text into whichever field was last active
  const insertSymbol = (textToInsert: string) => {
    const field = focusedField;
    const el = inputRefs.current[field];
    const currentVal = (draft[field as keyof EditorDraft] as string) || '';

    if (el && typeof el.selectionStart === 'number') {
      const start = el.selectionStart;
      const end = el.selectionEnd || start;
      const nextVal = currentVal.slice(0, start) + textToInsert + currentVal.slice(end);
      update(field as keyof EditorDraft, nextVal);

      setTimeout(() => {
        el.focus();
        const newCursorPos = start + textToInsert.length;
        el.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    } else {
      // Fallback: append to field
      update(field as keyof EditorDraft, currentVal + textToInsert);
    }
  };

  const handleSave = () => {
    if (!draft.questionText.trim()) return alert('Please enter the question text.');
    if (!draft.optionA || !draft.optionB || !draft.optionC || !draft.optionD)
      return alert('Please fill in all four options.');

    const q: ChemQuestion = {
      id: `teacher-${Date.now()}`,
      source: 'teacher',
      questionText: draft.questionText,
      options: [
        { label: 'A', text: draft.optionA },
        { label: 'B', text: draft.optionB },
        { label: 'C', text: draft.optionC },
        { label: 'D', text: draft.optionD },
      ],
      correctAnswer: draft.correctAnswer,
      explanation: draft.explanation || undefined,
      topic: draft.topic,
      difficulty: draft.difficulty,
      marks: draft.marks,
      needsReview: false,
    };
    onSave(q);
  };

  const optionKeys: Array<{ key: keyof EditorDraft; label: 'A' | 'B' | 'C' | 'D' }> = [
    { key: 'optionA', label: 'A' },
    { key: 'optionB', label: 'B' },
    { key: 'optionC', label: 'C' },
    { key: 'optionD', label: 'D' },
  ];

  const currentCategory = CHEMISTRY_KEYBOARD_TABS.find((tab) => tab.id === activeTab) || CHEMISTRY_KEYBOARD_TABS[0];

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* 1. Header Toolbar with Preview Switch */}
      <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            ⚛
          </div>
          <span className="text-xs font-bold text-slate-800">
            Interactive Chemistry Keyboard Active
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            (Target: <span className="font-mono font-bold text-blue-600">{focusedField === 'questionText' ? 'Question Stem' : `Option ${focusedField.slice(-1)}`}</span>)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            showPreview
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {showPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
        </button>
      </div>

      {/* 2. Virtual Chemistry Keyboard Widget */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-3 space-y-2.5">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pr-1 flex items-center gap-1">
            <Layers className="w-3 h-3" /> Keyboard:
          </span>
          {CHEMISTRY_KEYBOARD_TABS.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === cat.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Keyboard Keys Grid */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          {currentCategory.keys.map((k) => (
            <button
              key={k.label}
              type="button"
              title={k.title}
              onClick={() => insertSymbol(k.insert)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white text-slate-800 border border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/80 hover:text-blue-700 active:scale-95 transition-all shadow-2xs"
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5 border-t border-slate-200/60">
          <span>Click any key above to insert into the selected input field.</span>
          <span className="hidden sm:inline">Auto-formats: <code>H2SO4</code> → <strong>H₂SO₄</strong>, <code>Fe3+</code> → <strong>Fe³⁺</strong></span>
        </div>
      </div>

      {/* 3. Question Stem Textarea */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            Question Stem <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-400">Supports chemical formulas, equations & LaTeX</span>
        </div>

        <textarea
          ref={(el) => {
            inputRefs.current['questionText'] = el;
          }}
          rows={3}
          value={draft.questionText}
          onFocus={() => setFocusedField('questionText')}
          onChange={(e) => update('questionText', e.target.value)}
          className="w-full p-3.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400 resize-none font-mono shadow-2xs"
          placeholder="e.g. Calculate the equilibrium constant for the reaction: N2(g) + 3H2(g) <=> 2NH3(g)"
        />

        {/* Real-time Render Preview beneath question stem */}
        {draft.questionText && (
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-sm text-slate-800 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-0.5">
                Real-Time Chemistry Render
              </span>
              <div className="font-medium text-slate-900 leading-relaxed">
                <ChemRenderer text={draft.questionText} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MCQ Options (A, B, C, D) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800">
            Options & Correct Answer <span className="text-rose-500">*</span>
          </label>
          <span className="text-[11px] text-slate-500">Select the radio button for the correct choice</span>
        </div>

        <div className="space-y-2">
          {optionKeys.map(({ key, label }) => {
            const val = (draft[key] as string) || '';
            const isCorrect = draft.correctAnswer === label;
            const fieldId = key as string;

            return (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-xl border p-2.5 transition-all ${
                  isCorrect
                    ? 'border-emerald-400 bg-emerald-50/50 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* Radio button for correct answer */}
                <input
                  type="radio"
                  name="correctAnswerGroup"
                  checked={isCorrect}
                  onChange={() => update('correctAnswer', label)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer shrink-0 ml-1"
                  title={`Mark Option ${label} as correct answer`}
                />

                {/* Option Label Badge */}
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                    isCorrect
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {label}
                </span>

                {/* Option text input */}
                <input
                  ref={(el) => {
                    inputRefs.current[fieldId] = el;
                  }}
                  type="text"
                  value={val}
                  onFocus={() => setFocusedField(fieldId)}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={`Option ${label} text (e.g. 2.45 mol/L or H2SO4)`}
                  className="flex-1 bg-transparent text-sm text-slate-900 focus:outline-none placeholder-slate-400 font-mono"
                />

                {/* Inline Chem Preview for this option */}
                {val && (
                  <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 font-sans shrink-0 max-w-[200px] truncate">
                    <ChemRenderer text={val} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Metadata Row (Topic, Difficulty, Marks, Explanation) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Topic</label>
          <select
            value={draft.topic}
            onChange={(e) => update('topic', e.target.value as ChemTopic)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Difficulty</label>
          <select
            value={draft.difficulty}
            onChange={(e) => update('difficulty', e.target.value as QuestionDifficulty)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Marks</label>
          <input
            type="number"
            min={1}
            max={20}
            value={draft.marks}
            onChange={(e) => update('marks', parseInt(e.target.value) || 4)}
            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Explanation <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={draft.explanation}
            onChange={(e) => update('explanation', e.target.value)}
            placeholder="Key concept rationale..."
            className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* 6. Full Student View Preview Box */}
      {showPreview && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Student View Preview
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Marks: +{draft.marks} | {draft.topic}
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-900 leading-relaxed bg-white p-3 rounded-lg border border-blue-100">
            <ChemRenderer text={draft.questionText || '(Question text is currently empty)'} />
          </div>

          <div className="space-y-1.5">
            {optionKeys.map(({ key, label }) => {
              const val = draft[key] as string;
              const isCorrect = draft.correctAnswer === label;
              return (
                <div
                  key={label}
                  className={`flex items-center gap-3 px-3.5 py-2 rounded-lg border text-xs ${
                    isCorrect
                      ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold font-mono ${
                      isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {label}
                  </span>
                  <div className="flex-1">
                    <ChemRenderer text={val || `Option ${label}`} />
                  </div>
                  {isCorrect && (
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                      ✓ Correct Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 7. Action Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Click Save to add to your examination question bank</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave}>
            Save Question
          </Button>
        </div>
      </div>
    </div>
  );
};
