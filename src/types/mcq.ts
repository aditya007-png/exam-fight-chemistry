// Types for extracted MCQ questions
export interface McqOption {
  // Text of the option, e.g., "Hydrogen"
  text: string;
}

export interface McqQuestion {
  /** Unique identifier (generated client‑side) */
  id: string;
  /** Question stem without the answer options */
  stem: string;
  /** Extracted or AI‑generated answer options */
  options: McqOption[];
  /** Index of the correct answer (0‑based). Optional until teacher sets it. */
  answerIndex?: number;
}
