export interface NMRPeak {
  id: string;
  chemicalShift: number; // ppm (e.g. 1.25)
  multiplicity: 'singlet' | 'doublet' | 'triplet' | 'quartet' | 'multiplet';
  integration: number; // e.g. 3H
  assignment: string; // e.g. -CH3 adjacent to -CH2-
  couplingConstant?: number; // J in Hz (e.g. 7.1)
}

export interface IRPeak {
  id: string;
  wavenumber: number; // cm^-1 (e.g. 1715)
  intensity: 'strong' | 'medium' | 'weak' | 'broad';
  functionalGroup: string; // e.g. C=O carbonyl stretch
}

export interface MoleculeSpectrumData {
  id: string;
  moleculeName: string;
  chemicalFormula: string;
  smiles: string;
  nmr1H: {
    solvent: string;
    frequency: string;
    peaks: NMRPeak[];
    rawCurve: [number, number][]; // [ppm, intensity]
  };
  irSpectrum: {
    peaks: IRPeak[];
    rawCurve: [number, number][]; // [wavenumber, % transmittance]
  };
}

export interface GalvanicElectrode {
  element: string;
  symbol: string;
  standardReductionPotential: number; // E° in V
  halfReaction: string;
  color: string;
}

export interface KineticsReaction {
  id: string;
  name: string;
  equation: string;
  rateConstant: number;
  order: 0 | 1 | 2;
  initialConcentration: number; // M
  timePoints: number[]; // seconds
  concentrations: number[]; // [A] at t
}
