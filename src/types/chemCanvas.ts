export type BondType = 'single' | 'double' | 'triple' | 'wedge' | 'dash';

export type RingType = 'benzene' | 'cyclohexane' | 'cyclopentane' | 'cyclopropane';

export type HeteroAtom = 'C' | 'N' | 'O' | 'F' | 'Cl' | 'Br' | 'I' | 'S' | 'P' | 'H';

export type FormalCharge = '+1' | '-1' | '0' | 'radical' | 'lone_pair';

export type ArrowType = 'electron_pair' | 'single_electron' | 'resonance' | 'reaction';

export interface CanvasAtom {
  id: string;
  element: HeteroAtom;
  x: number;
  y: number;
  charge: FormalCharge;
}

export interface CanvasBond {
  id: string;
  sourceAtomId: string;
  targetAtomId: string;
  type: BondType;
}

export interface CurvedArrow {
  id: string;
  startX: number;
  startY: number;
  controlX: number;
  controlY: number;
  endX: number;
  endY: number;
  type: ArrowType;
  label?: string;
}

export interface ChemCanvasState {
  atoms: CanvasAtom[];
  bonds: CanvasBond[];
  arrows: CurvedArrow[];
}
