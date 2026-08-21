import { MoleculeSpectrumData, GalvanicElectrode, KineticsReaction } from '../types/spectrum';

export const MOCK_SPECTRA_DATA: Record<string, MoleculeSpectrumData> = {
  ethanol: {
    id: 'ethanol',
    moleculeName: 'Ethanol',
    chemicalFormula: 'C₂H₆O',
    smiles: 'CCO',
    nmr1H: {
      solvent: 'CDCl₃',
      frequency: '400 MHz',
      peaks: [
        {
          id: 'p1',
          chemicalShift: 1.22,
          multiplicity: 'triplet',
          integration: 3,
          assignment: '-CH₃ (coupled to -CH₂-)',
          couplingConstant: 7.0,
        },
        {
          id: 'p2',
          chemicalShift: 3.68,
          multiplicity: 'quartet',
          integration: 2,
          assignment: '-CH₂- (coupled to -CH₃)',
          couplingConstant: 7.0,
        },
        {
          id: 'p3',
          chemicalShift: 2.61,
          multiplicity: 'singlet',
          integration: 1,
          assignment: '-OH (hydroxyl proton)',
        },
      ],
      rawCurve: [
        [0.0, 5], [0.5, 5], [1.15, 8], [1.20, 65], [1.22, 100], [1.24, 62], [1.30, 8],
        [2.0, 5], [2.58, 12], [2.61, 45], [2.64, 10], [3.0, 5],
        [3.62, 10], [3.65, 45], [3.68, 70], [3.71, 44], [3.74, 9], [4.5, 5], [5.0, 5]
      ],
    },
    irSpectrum: {
      peaks: [
        {
          id: 'ir-1',
          wavenumber: 3350,
          intensity: 'broad',
          functionalGroup: 'O-H stretch (H-bonded)',
        },
        {
          id: 'ir-2',
          wavenumber: 2975,
          intensity: 'strong',
          functionalGroup: 'C-H aliphatic stretch (sp³)',
        },
        {
          id: 'ir-3',
          wavenumber: 1050,
          intensity: 'strong',
          functionalGroup: 'C-O stretch (primary alcohol)',
        },
      ],
      rawCurve: [
        [4000, 95], [3600, 85], [3350, 20], [3100, 75], [2975, 15], [2850, 45],
        [2400, 95], [1650, 90], [1450, 60], [1380, 55], [1050, 10], [880, 70], [600, 90]
      ],
    },
  },
  ethyl_acetate: {
    id: 'ethyl_acetate',
    moleculeName: 'Ethyl Acetate',
    chemicalFormula: 'C₄H₈O₂',
    smiles: 'CCOC(=O)C',
    nmr1H: {
      solvent: 'CDCl₃',
      frequency: '400 MHz',
      peaks: [
        {
          id: 'ea-1',
          chemicalShift: 1.26,
          multiplicity: 'triplet',
          integration: 3,
          assignment: '-CH₂-CH₃ (ester ethyl methyl)',
          couplingConstant: 7.1,
        },
        {
          id: 'ea-2',
          chemicalShift: 2.04,
          multiplicity: 'singlet',
          integration: 3,
          assignment: 'CH₃-C=O (acetyl methyl)',
        },
        {
          id: 'ea-3',
          chemicalShift: 4.12,
          multiplicity: 'quartet',
          integration: 2,
          assignment: '-O-CH₂-CH₃ (ester methylene)',
          couplingConstant: 7.1,
        },
      ],
      rawCurve: [
        [0.0, 5], [1.20, 10], [1.24, 70], [1.26, 95], [1.28, 68], [1.32, 10],
        [1.8, 5], [2.02, 25], [2.04, 100], [2.06, 25], [3.0, 5],
        [4.08, 12], [4.10, 50], [4.12, 75], [4.14, 48], [4.16, 10], [5.0, 5]
      ],
    },
    irSpectrum: {
      peaks: [
        {
          id: 'ir-ea-1',
          wavenumber: 2985,
          intensity: 'medium',
          functionalGroup: 'C-H sp³ stretch',
        },
        {
          id: 'ir-ea-2',
          wavenumber: 1740,
          intensity: 'strong',
          functionalGroup: 'C=O ester carbonyl stretch',
        },
        {
          id: 'ir-ea-3',
          wavenumber: 1240,
          intensity: 'strong',
          functionalGroup: 'C-O ester stretch',
        },
      ],
      rawCurve: [
        [4000, 95], [3000, 80], [2985, 35], [2900, 60], [2300, 95],
        [1740, 5], [1450, 65], [1370, 45], [1240, 8], [1045, 20], [600, 85]
      ],
    },
  },
  acetone: {
    id: 'acetone',
    moleculeName: 'Acetone',
    chemicalFormula: 'C₃H₆O',
    smiles: 'CC(=O)C',
    nmr1H: {
      solvent: 'CDCl₃',
      frequency: '400 MHz',
      peaks: [
        {
          id: 'ac-1',
          chemicalShift: 2.17,
          multiplicity: 'singlet',
          integration: 6,
          assignment: '2x -CH₃ (symmetric ketone methyls)',
        },
      ],
      rawCurve: [
        [0.0, 5], [1.5, 5], [2.14, 15], [2.17, 100], [2.20, 15], [3.5, 5], [5.0, 5]
      ],
    },
    irSpectrum: {
      peaks: [
        {
          id: 'ir-ac-1',
          wavenumber: 2960,
          intensity: 'medium',
          functionalGroup: 'C-H stretch',
        },
        {
          id: 'ir-ac-2',
          wavenumber: 1715,
          intensity: 'strong',
          functionalGroup: 'C=O ketone carbonyl stretch',
        },
        {
          id: 'ir-ac-3',
          wavenumber: 1365,
          intensity: 'medium',
          functionalGroup: 'C-H bend (-CH₃)',
        },
      ],
      rawCurve: [
        [4000, 95], [3000, 75], [2960, 40], [2400, 95],
        [1715, 8], [1420, 50], [1365, 30], [1220, 25], [600, 85]
      ],
    },
  },
};

export const GALVANIC_ELECTRODES: GalvanicElectrode[] = [
  {
    element: 'Zinc',
    symbol: 'Zn',
    standardReductionPotential: -0.76,
    halfReaction: 'Zn²⁺ + 2e⁻ ⇌ Zn(s)',
    color: '#94a3b8',
  },
  {
    element: 'Copper',
    symbol: 'Cu',
    standardReductionPotential: +0.34,
    halfReaction: 'Cu²⁺ + 2e⁻ ⇌ Cu(s)',
    color: '#f97316',
  },
  {
    element: 'Silver',
    symbol: 'Ag',
    standardReductionPotential: +0.80,
    halfReaction: 'Ag⁺ + e⁻ ⇌ Ag(s)',
    color: '#e2e8f0',
  },
  {
    element: 'Iron',
    symbol: 'Fe',
    standardReductionPotential: -0.44,
    halfReaction: 'Fe²⁺ + 2e⁻ ⇌ Fe(s)',
    color: '#71717a',
  },
  {
    element: 'Magnesium',
    symbol: 'Mg',
    standardReductionPotential: -2.37,
    halfReaction: 'Mg²⁺ + 2e⁻ ⇌ Mg(s)',
    color: '#cbd5e1',
  },
  {
    element: 'Lead',
    symbol: 'Pb',
    standardReductionPotential: -0.13,
    halfReaction: 'Pb²⁺ + 2e⁻ ⇌ Pb(s)',
    color: '#64748b',
  },
];

export const MOCK_KINETICS_REACTION: KineticsReaction = {
  id: 'kin-01',
  name: 'Decomposition of N₂O₅ (Dinitrogen Pentoxide)',
  equation: '2 N₂O₅(g) → 4 NO₂(g) + O₂(g)',
  order: 1,
  rateConstant: 0.035, // s^-1
  initialConcentration: 1.0,
  timePoints: [0, 10, 20, 30, 45, 60, 90, 120],
  concentrations: [1.000, 0.705, 0.497, 0.350, 0.207, 0.122, 0.043, 0.015],
};
