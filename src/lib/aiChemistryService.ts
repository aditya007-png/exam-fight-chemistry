import { ChemistryDomain, ExamQuestion, QuestionDifficulty, QuestionType } from '../types/exam';

export interface GenerateQuestionParams {
  domain: ChemistryDomain;
  topic: string;
  difficulty: QuestionDifficulty;
  type: QuestionType;
  customPrompt?: string;
}

// AI Question templates and synthesis engine
export const generateChemistryQuestion = async (
  params: GenerateQuestionParams
): Promise<ExamQuestion> => {
  // Simulate AI LLM inference latency
  await new Promise((res) => setTimeout(res, 900));

  const id = `ai-gen-${Date.now()}`;
  const { domain, topic, difficulty, type } = params;

  if (domain === 'Organic Chemistry') {
    if (type === 'mcq') {
      return {
        id,
        questionNumber: 1,
        type: 'mcq',
        domain: 'Organic Chemistry',
        topic: topic || 'Electrophilic Aromatic Substitution',
        difficulty,
        marks: 4,
        negativeMarks: 1,
        questionText: 'Predict the major regioisomeric product when anisole (methoxybenzene) undergoes monobromination in the presence of FeBr₃ catalyst:',
        chemicalEquation: 'C₆H₅OCH₃ + Br₂ --[FeBr₃]--> Major Product + HBr',
        options: [
          { id: 'opt-1', label: 'A', text: 'para-bromoanisole (4-bromoanisole) due to +M resonance stabilization', isCorrect: true },
          { id: 'opt-2', label: 'B', text: 'meta-bromoanisole due to -I induction of the oxygen atom', isCorrect: false },
          { id: 'opt-3', label: 'C', text: 'ortho-bromoanisole exclusively due to steric directing effects', isCorrect: false },
          { id: 'opt-4', label: 'D', text: '2,4,6-tribromoanisole under standard monobromination conditions', isCorrect: false },
        ],
        explanation: 'The methoxy (-OCH₃) group has lone pairs on oxygen that donate electron density into the aromatic π-system via +M resonance. This strongly activates the ortho and para positions. The para position is the major product because it minimizes steric hindrance compared to the ortho position.',
        stepByStepRubric: [
          'Identify electronic effect: -OCH₃ is a strong activating +M ortho/para director.',
          'Evaluate steric clash: Ortho position experiences significant van der Waals repulsion.',
          'Conclusion: Para-bromoanisole forms as the predominant thermodynamic/kinetic product.',
        ],
      };
    } else if (type === 'mechanism') {
      return {
        id,
        questionNumber: 1,
        type: 'mechanism',
        domain: 'Organic Chemistry',
        topic: topic || 'Aldol Condensation & Enolate Chemistry',
        difficulty,
        marks: 6,
        questionText: 'Explain the detailed step-by-step mechanism for the base-catalyzed Aldol addition of acetaldehyde (ethanal) to form 3-hydroxybutanal (aldol):',
        chemicalEquation: '2 CH₃CHO --[OH⁻, H₂O]--> CH₃-CH(OH)-CH₂-CHO',
        explanation: 'Step 1: Deprotonation of α-hydrogen by OH⁻ to generate resonance-stabilized enolate. Step 2: Nucleophilic attack of enolate carbon onto the carbonyl carbon of a second acetaldehyde molecule. Step 3: Proton transfer from H₂O to alkoxide intermediate yielding 3-hydroxybutanal and regenerating OH⁻.',
        stepByStepRubric: [
          'Enolate generation via α-deprotonation (+2 pts)',
          'Nucleophilic carbonyl addition forming alkoxide (+2 pts)',
          'Protonation & base catalyst regeneration (+2 pts)',
        ],
      };
    }
  }

  if (domain === 'Physical Chemistry') {
    return {
      id,
      questionNumber: 1,
      type: 'numerical',
      domain: 'Physical Chemistry',
      topic: topic || 'Gibbs Free Energy & Chemical Equilibrium',
      difficulty,
      marks: 4,
      questionText: 'For a given reaction at 298.15 K, the standard enthalpy change is ΔH° = -74.8 kJ/mol and the standard entropy change is ΔS° = -80.5 J/(mol·K). Calculate the standard Gibbs Free Energy change ΔG° in kJ/mol (to 2 decimal places):',
      chemicalEquation: 'ΔG° = ΔH° - TΔS°',
      correctNumericalAnswer: -50.80,
      numericalTolerance: 0.2,
      numericalUnit: 'kJ/mol',
      acceptableUnits: ['kJ/mol', 'kJ mol^-1'],
      explanation: 'ΔG° = ΔH° - TΔS° = -74.8 kJ/mol - (298.15 K × -0.0805 kJ/(mol·K)) = -74.8 + 24.00 = -50.80 kJ/mol. Since ΔG° < 0, the reaction is thermodynamically spontaneous at standard conditions.',
      stepByStepRubric: [
        'Convert ΔS° units: -80.5 J/(mol·K) = -0.0805 kJ/(mol·K)',
        'Multiply T × ΔS°: 298.15 × -0.0805 = -24.00 kJ/mol',
        'Subtract from ΔH°: -74.8 - (-24.00) = -50.80 kJ/mol',
      ],
    };
  }

  // Inorganic Default
  return {
    id,
    questionNumber: 1,
    type: 'mcq',
    domain: 'Inorganic Chemistry',
    topic: topic || 'Crystal Field Theory & d-Orbital Splitting',
    difficulty,
    marks: 4,
    negativeMarks: 1,
    questionText: 'Consider the octahedral complex [Fe(CN)₆]⁴⁻. Determine the electronic configuration of the Fe²⁺ central ion and its crystal field stabilization energy (CFSE) in terms of Δₒ (ignoring pairing energy):',
    chemicalEquation: '[Fe(CN)₆]⁴⁻ (Low Spin Octahedral)',
    options: [
      { id: 'opt-1', label: 'A', text: 't₂g⁶ eg⁰ with CFSE = -2.4 Δₒ (Diamagnetic)', isCorrect: true },
      { id: 'opt-2', label: 'B', text: 't₂g⁴ eg² with CFSE = -0.4 Δₒ (Paramagnetic)', isCorrect: false },
      { id: 'opt-3', label: 'C', text: 't₂g⁵ eg¹ with CFSE = -1.6 Δₒ (Paramagnetic)', isCorrect: false },
      { id: 'opt-4', label: 'D', text: 't₂g³ eg³ with CFSE = 0.0 Δₒ', isCorrect: false },
    ],
    explanation: 'Fe²⁺ has a 3d⁶ configuration. Cyanide (CN⁻) is a strong-field ligand near the top of the spectrochemical series, causing large splitting (Δₒ > P). Consequently, all 6 d-electrons pair in the lower t₂g subshell: (t₂g)⁶(eg)⁰. CFSE = 6 × (-0.4 Δₒ) = -2.4 Δₒ.',
    stepByStepRubric: [
      'Identify Fe oxidation state: Fe(II) = 3d⁶ valence configuration.',
      'Evaluate ligand field strength: CN⁻ is strong field (low spin).',
      'Calculate CFSE: 6 electrons × (-0.4 Δₒ) = -2.4 Δₒ.',
    ],
  };
};

export const extractQuestionsFromDocument = async (fileName: string): Promise<ExamQuestion[]> => {
  // Simulate OCR & AI document parser parsing
  await new Promise((res) => setTimeout(res, 1200));

  return [
    {
      id: `doc-q-1-${Date.now()}`,
      questionNumber: 1,
      type: 'mcq',
      domain: 'Organic Chemistry',
      topic: 'Stereochemistry & Optical Activity',
      difficulty: 'Intermediate',
      marks: 4,
      questionText: `[Extracted from ${fileName}] Which of the following molecules possesses a chiral center and exhibits optical isomerism?`,
      chemicalEquation: 'CH₃-CH(OH)-COOH (Lactic Acid)',
      options: [
        { id: 'd1-a', label: 'A', text: '2-hydroxypropanoic acid (Lactic acid)', isCorrect: true },
        { id: 'd1-b', label: 'B', text: 'Ethanol (CH₃CH₂OH)', isCorrect: false },
        { id: 'd1-c', label: 'C', text: 'Propan-2-ol ((CH₃)₂CHOH)', isCorrect: false },
        { id: 'd1-d', label: 'D', text: 'Acetic acid (CH₃COOH)', isCorrect: false },
      ],
      explanation: 'Carbon-2 of lactic acid is bonded to 4 distinct chemical substituents (-H, -OH, -CH₃, -COOH), creating a non-superimposable chiral stereocenter.',
    },
    {
      id: `doc-q-2-${Date.now()}`,
      questionNumber: 2,
      type: 'numerical',
      domain: 'Physical Chemistry',
      topic: 'Chemical Kinetics & Rate Laws',
      difficulty: 'Advanced',
      marks: 4,
      questionText: `[Extracted from ${fileName}] A first-order reaction has a rate constant k = 2.31 × 10⁻³ s⁻¹ at 300 K. Calculate the half-life t₁/₂ of the reaction in seconds:`,
      chemicalEquation: 't₁/₂ = ln(2) / k',
      correctNumericalAnswer: 300.0,
      numericalTolerance: 1.0,
      numericalUnit: 's',
      explanation: 't₁/₂ = 0.693 / (2.31 × 10⁻³ s⁻¹) = 300.0 seconds.',
    },
  ];
};
