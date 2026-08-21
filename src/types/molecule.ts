export interface Atom3D {
  id: string;
  element: string; // H, C, N, O, Fe, Pt, Cl
  x: number;
  y: number;
  z: number;
  color: string;
  radius: number;
}

export interface Bond3D {
  atom1: string;
  atom2: string;
  order: 1 | 2 | 3;
}

export interface MolecularModel {
  id: string;
  name: string;
  formula: string;
  iupacName: string;
  molarMass: number;
  category: 'Organic' | 'Inorganic' | 'Coordination Complex' | 'Biochemistry';
  description: string;
  atoms: Atom3D[];
  bonds: Bond3D[];
}

export type MolecularRenderMode = 'ball-and-stick' | 'space-filling' | 'wireframe';
