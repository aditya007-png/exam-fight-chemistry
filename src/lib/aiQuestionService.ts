// src/lib/aiQuestionService.ts
// Mock AI chemistry question generator — returns well-structured draft questions.
// In production, replace generateAiQuestions() body with a real LLM API call.

import { ChemQuestion, ChemTopic, QuestionDifficulty } from '../types/question';

export interface AiGenerateParams {
  topic: ChemTopic;
  difficulty: QuestionDifficulty;
  count: number;
  additionalInstruction?: string;
}

// ── Mock question bank ────────────────────────────────────────────────────────

const MOCK_BANK: Omit<ChemQuestion, 'id' | 'source' | 'needsReview' | 'reviewReason'>[] = [
  // Organic Chemistry
  {
    questionText: 'Which reagent converts an alkene into a vicinal diol via a syn addition mechanism?',
    options: [
      { label: 'A', text: 'OsO₄ (osmium tetroxide)' },
      { label: 'B', text: 'Br₂ in CCl₄' },
      { label: 'C', text: 'HBr (anti-Markovnikov)' },
      { label: 'D', text: 'KMnO₄ (hot, concentrated)' },
    ],
    correctAnswer: 'A',
    explanation: 'OsO₄ undergoes a concerted [3+2] cycloaddition with the alkene, giving a syn diol via an osmate ester intermediate.',
    topic: 'Organic Chemistry',
    difficulty: 'Medium',
    marks: 4,
  },
  {
    questionText: 'What is the IUPAC name for CH₃-CH(OH)-COOH?',
    options: [
      { label: 'A', text: '2-hydroxypropanoic acid' },
      { label: 'B', text: '3-hydroxypropanoic acid' },
      { label: 'C', text: 'Acetic acid' },
      { label: 'D', text: '2-methylmalonic acid' },
    ],
    correctAnswer: 'A',
    explanation: 'The parent chain is propanoic acid (3 carbons with COOH). The OH group is at C-2, giving 2-hydroxypropanoic acid (lactic acid).',
    topic: 'Organic Chemistry',
    difficulty: 'Easy',
    marks: 2,
  },
  {
    questionText: 'In the SN2 reaction of (R)-2-bromobutane with NaCN in DMF, what is the stereochemical outcome?',
    options: [
      { label: 'A', text: '(S)-2-methylbutanenitrile via Walden inversion' },
      { label: 'B', text: 'Racemic mixture via SN1 mechanism' },
      { label: 'C', text: 'Retention of configuration' },
      { label: 'D', text: 'E2 elimination product' },
    ],
    correctAnswer: 'A',
    explanation: 'SN2 is a backside attack mechanism causing complete inversion of configuration at the chiral center (Walden inversion).',
    topic: 'Organic Chemistry',
    difficulty: 'Medium',
    marks: 4,
  },
  // Physical Chemistry
  {
    questionText: 'For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g), what happens to Kp when temperature is increased?',
    options: [
      { label: 'A', text: 'Kp decreases (reaction is exothermic)' },
      { label: 'B', text: 'Kp increases (reaction is endothermic)' },
      { label: 'C', text: 'Kp remains unchanged' },
      { label: 'D', text: 'Kp increases then decreases' },
    ],
    correctAnswer: 'A',
    explanation: 'The Haber process is exothermic (ΔH° = -92 kJ/mol). By Le Chatelier\'s principle, increasing temperature shifts equilibrium left, decreasing Kp.',
    topic: 'Equilibrium',
    difficulty: 'Medium',
    marks: 4,
  },
  {
    questionText: 'Calculate the pH of a 0.01 M HCl solution at 25°C.',
    options: [
      { label: 'A', text: 'pH = 2' },
      { label: 'B', text: 'pH = 12' },
      { label: 'C', text: 'pH = 7' },
      { label: 'D', text: 'pH = 4' },
    ],
    correctAnswer: 'A',
    explanation: 'HCl is a strong acid that fully dissociates. [H⁺] = 0.01 M = 10⁻². pH = -log[H⁺] = -log(10⁻²) = 2.',
    topic: 'Physical Chemistry',
    difficulty: 'Easy',
    marks: 2,
  },
  {
    questionText: 'Which of the following has the highest lattice enthalpy?',
    options: [
      { label: 'A', text: 'MgO' },
      { label: 'B', text: 'NaCl' },
      { label: 'C', text: 'KBr' },
      { label: 'D', text: 'CsI' },
    ],
    correctAnswer: 'A',
    explanation: 'Lattice enthalpy ∝ (charge product)/(ionic radius sum). MgO has Mg²⁺ and O²⁻ giving charge product = 4, much higher than Na⁺Cl⁻ (product = 1).',
    topic: 'Chemical Bonding',
    difficulty: 'Medium',
    marks: 4,
  },
  // Inorganic Chemistry
  {
    questionText: 'What is the oxidation state of Cr in K₂Cr₂O₇?',
    options: [
      { label: 'A', text: '+6' },
      { label: 'B', text: '+3' },
      { label: 'C', text: '+7' },
      { label: 'D', text: '+4' },
    ],
    correctAnswer: 'A',
    explanation: 'In K₂Cr₂O₇: 2(+1) + 2x + 7(-2) = 0 → 2 + 2x - 14 = 0 → x = +6.',
    topic: 'Inorganic Chemistry',
    difficulty: 'Easy',
    marks: 2,
  },
  {
    questionText: 'Which complex has a square planar geometry?',
    options: [
      { label: 'A', text: '[Pt(NH₃)₂Cl₂]' },
      { label: 'B', text: '[Fe(CN)₆]³⁻' },
      { label: 'C', text: '[NiCl₄]²⁻' },
      { label: 'D', text: '[Co(NH₃)₄]²⁺' },
    ],
    correctAnswer: 'A',
    explanation: 'Pt²⁺ is d⁸. d⁸ metal complexes with strong-field ligands like NH₃ adopt square planar geometry due to CFSE considerations.',
    topic: 'Coordination Chemistry',
    difficulty: 'Hard',
    marks: 4,
  },
  // Electrochemistry
  {
    questionText: 'The standard cell potential for Zn | Zn²⁺ || Cu²⁺ | Cu is:',
    options: [
      { label: 'A', text: '+1.10 V' },
      { label: 'B', text: '-1.10 V' },
      { label: 'C', text: '+0.34 V' },
      { label: 'D', text: '+0.76 V' },
    ],
    correctAnswer: 'A',
    explanation: 'E°cell = E°cathode - E°anode = E°(Cu²⁺/Cu) - E°(Zn²⁺/Zn) = 0.34 - (-0.76) = +1.10 V.',
    topic: 'Electrochemistry',
    difficulty: 'Medium',
    marks: 4,
  },
  {
    questionText: 'Which reaction represents a combustion reaction?',
    options: [
      { label: 'A', text: 'CH₄(g) + 2O₂(g) → CO₂(g) + 2H₂O(l)' },
      { label: 'B', text: 'CaCO₃(s) → CaO(s) + CO₂(g)' },
      { label: 'C', text: 'N₂(g) + 3H₂(g) ⇌ 2NH₃(g)' },
      { label: 'D', text: 'AgNO₃(aq) + NaCl(aq) → AgCl(s) + NaNO₃(aq)' },
    ],
    correctAnswer: 'A',
    explanation: 'Combustion involves rapid reaction of a fuel with O₂, producing CO₂ and H₂O. CH₄ + 2O₂ → CO₂ + 2H₂O is the combustion of methane.',
    topic: 'Thermodynamics',
    difficulty: 'Easy',
    marks: 2,
  },
  {
    questionText: 'For the reaction CaCO₃(s) → CaO(s) + CO₂(g), what is ΔS° expected to be?',
    options: [
      { label: 'A', text: 'Positive, because gas is produced from a solid' },
      { label: 'B', text: 'Negative, because bond breaking requires energy' },
      { label: 'C', text: 'Zero, because the number of moles is unchanged' },
      { label: 'D', text: 'Cannot be determined without data' },
    ],
    correctAnswer: 'A',
    explanation: 'Production of CO₂(g) from CaCO₃(s) increases disorder significantly. Gas has much higher entropy than solid, so ΔS° > 0.',
    topic: 'Thermodynamics',
    difficulty: 'Medium',
    marks: 4,
  },
  {
    questionText: 'Which of these is an example of an electrophilic aromatic substitution?',
    options: [
      { label: 'A', text: 'Nitration of benzene using HNO₃/H₂SO₄' },
      { label: 'B', text: 'Addition of Br₂ to cyclohexene' },
      { label: 'C', text: 'Saponification of an ester' },
      { label: 'D', text: 'Aldol condensation' },
    ],
    correctAnswer: 'A',
    explanation: 'Nitration of benzene involves attack by the nitronium ion (NO₂⁺) as electrophile on the aromatic ring, a classic EAS reaction.',
    topic: 'Organic Chemistry',
    difficulty: 'Medium',
    marks: 4,
  },
];

// ── Service function ──────────────────────────────────────────────────────────

export async function generateAiQuestions(params: AiGenerateParams): Promise<ChemQuestion[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1500));

  const { topic, difficulty, count } = params;

  // Filter by topic and difficulty when possible
  let pool = MOCK_BANK.filter((q) => {
    const topicMatch = q.topic === topic || topic === 'General Chemistry';
    const diffMatch = q.difficulty === difficulty;
    return topicMatch && diffMatch;
  });

  // If not enough matching, fall back to same topic any difficulty
  if (pool.length < count) {
    pool = MOCK_BANK.filter((q) => q.topic === topic || topic === 'General Chemistry');
  }

  // If still not enough, use full bank
  if (pool.length < count) {
    pool = [...MOCK_BANK];
  }

  // Shuffle and take `count`
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((q) => ({
    ...q,
    id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    source: 'ai' as const,
    needsReview: true,
    reviewReason: 'AI-generated — teacher review required before publishing.',
  }));
}
