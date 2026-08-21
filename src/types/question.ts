/**
 * ChemQuestion — the unified question type used across:
 *   - Manual teacher creation (source: 'teacher')
 *   - PDF extraction (source: 'pdf')
 *   - AI generation (source: 'ai')
 */

export type QuestionSource = 'teacher' | 'pdf' | 'ai';
export type QuestionDifficulty = 'Easy' | 'Medium' | 'Hard';

export type ChemTopic =
  | 'Organic Chemistry'
  | 'Inorganic Chemistry'
  | 'Physical Chemistry'
  | 'Electrochemistry'
  | 'Thermodynamics'
  | 'Chemical Bonding'
  | 'Equilibrium'
  | 'Solutions'
  | 'Atomic Structure'
  | 'Coordination Chemistry'
  | 'General Chemistry';

export interface ChemOption {
  label: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ChemQuestion {
  id: string;
  source: QuestionSource;
  /** Full question text — may include chemical notation like H₂SO₄, 2H₂ + O₂ → 2H₂O */
  questionText: string;
  options: ChemOption[];
  /** 'A' | 'B' | 'C' | 'D' */
  correctAnswer: string;
  explanation?: string;
  topic: ChemTopic;
  difficulty: QuestionDifficulty;
  marks: number;
  /**
   * Set to true when the question needs teacher review before it is published.
   * Always true for AI and PDF-extracted questions initially.
   */
  needsReview: boolean;
  reviewReason?: string;
}
