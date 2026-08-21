export interface ElementData {
  number: number;
  symbol: string;
  name: string;
  atomicMass: number;
  category:
    | 'nonmetal'
    | 'noble-gas'
    | 'alkali-metal'
    | 'alkaline-earth'
    | 'metalloid'
    | 'halogen'
    | 'transition-metal'
    | 'post-transition'
    | 'lanthanide'
    | 'actinide';
  group: number;
  period: number;
  electronConfiguration: string;
  electronegativity?: number;
  oxidationStates?: string;
  summary: string;
}

export const PERIODIC_TABLE_ELEMENTS: ElementData[] = [
  { number: 1, symbol: 'H', name: 'Hydrogen', atomicMass: 1.008, category: 'nonmetal', group: 1, period: 1, electronConfiguration: '1s¹', electronegativity: 2.20, oxidationStates: '+1, -1', summary: 'The lightest and most abundant chemical element in the universe.' },
  { number: 2, symbol: 'He', name: 'Helium', atomicMass: 4.0026, category: 'noble-gas', group: 18, period: 1, electronConfiguration: '1s²', summary: 'Colorless, odorless, inert noble gas with the lowest boiling point.' },
  { number: 3, symbol: 'Li', name: 'Lithium', atomicMass: 6.94, category: 'alkali-metal', group: 1, period: 2, electronConfiguration: '[He] 2s¹', electronegativity: 0.98, oxidationStates: '+1', summary: 'Soft, silvery alkali metal with the lowest density of all solid elements.' },
  { number: 4, symbol: 'Be', name: 'Beryllium', atomicMass: 9.0122, category: 'alkaline-earth', group: 2, period: 2, electronConfiguration: '[He] 2s²', electronegativity: 1.57, oxidationStates: '+2', summary: 'Relatively rare alkaline earth metal used in lightweight aerospace alloys.' },
  { number: 5, symbol: 'B', name: 'Boron', atomicMass: 10.81, category: 'metalloid', group: 13, period: 2, electronConfiguration: '[He] 2s² 2p¹', electronegativity: 2.04, oxidationStates: '+3', summary: 'Low-abundance metalloid crucial for Lewis acid-base chemistry.' },
  { number: 6, symbol: 'C', name: 'Carbon', atomicMass: 12.011, category: 'nonmetal', group: 14, period: 2, electronConfiguration: '[He] 2s² 2p²', electronegativity: 2.55, oxidationStates: '-4, +2, +4', summary: 'The fundamental chemical backbone for all known organic chemistry and life.' },
  { number: 7, symbol: 'N', name: 'Nitrogen', atomicMass: 14.007, category: 'nonmetal', group: 15, period: 2, electronConfiguration: '[He] 2s² 2p³', electronegativity: 3.04, oxidationStates: '-3, +3, +5', summary: 'Diatomic gas making up roughly 78% of Earth’s atmosphere.' },
  { number: 8, symbol: 'O', name: 'Oxygen', atomicMass: 15.999, category: 'nonmetal', group: 16, period: 2, electronConfiguration: '[He] 2s² 2p⁴', electronegativity: 3.44, oxidationStates: '-2', summary: 'Highly reactive nonmetal and oxidizing agent essential for aerobic respiration.' },
  { number: 9, symbol: 'F', name: 'Fluorine', atomicMass: 18.998, category: 'halogen', group: 17, period: 2, electronConfiguration: '[He] 2s² 2p⁵', electronegativity: 3.98, oxidationStates: '-1', summary: 'The most electronegative and chemically reactive of all elements.' },
  { number: 10, symbol: 'Ne', name: 'Neon', atomicMass: 20.180, category: 'noble-gas', group: 18, period: 2, electronConfiguration: '[He] 2s² 2p⁶', summary: 'Inert noble gas glowing reddish-orange in high-voltage electrical discharge.' },
  { number: 11, symbol: 'Na', name: 'Sodium', atomicMass: 22.990, category: 'alkali-metal', group: 1, period: 3, electronConfiguration: '[Ne] 3s¹', electronegativity: 0.93, oxidationStates: '+1', summary: 'Highly reactive alkali metal vigorously reacting with water.' },
  { number: 12, symbol: 'Mg', name: 'Magnesium', atomicMass: 24.305, category: 'alkaline-earth', group: 2, period: 3, electronConfiguration: '[Ne] 3s²', electronegativity: 1.31, oxidationStates: '+2', summary: 'Shiny gray solid essential for Grignard reagents in organic synthesis.' },
  { number: 13, symbol: 'Al', name: 'Aluminium', atomicMass: 26.982, category: 'post-transition', group: 13, period: 3, electronConfiguration: '[Ne] 3s² 3p¹', electronegativity: 1.61, oxidationStates: '+3', summary: 'Lightweight, corrosion-resistant post-transition metal.' },
  { number: 14, symbol: 'Si', name: 'Silicon', atomicMass: 28.085, category: 'metalloid', group: 14, period: 3, electronConfiguration: '[Ne] 3s² 3p²', electronegativity: 1.90, oxidationStates: '+4, -4', summary: 'Semiconductor metalloid forming the foundation of microelectronics.' },
  { number: 15, symbol: 'P', name: 'Phosphorus', atomicMass: 30.974, category: 'nonmetal', group: 15, period: 3, electronConfiguration: '[Ne] 3s² 3p³', electronegativity: 2.19, oxidationStates: '-3, +3, +5', summary: 'Essential nutrient and key constituent of DNA, RNA, and ATP molecules.' },
  { number: 16, symbol: 'S', name: 'Sulfur', atomicMass: 32.06, category: 'nonmetal', group: 16, period: 3, electronConfiguration: '[Ne] 3s² 3p⁴', electronegativity: 2.58, oxidationStates: '-2, +4, +6', summary: 'Yellow crystalline nonmetal central to sulfuric acid manufacture.' },
  { number: 17, symbol: 'Cl', name: 'Chlorine', atomicMass: 35.45, category: 'halogen', group: 17, period: 3, electronConfiguration: '[Ne] 3s² 3p⁵', electronegativity: 3.16, oxidationStates: '-1, +1, +3, +5, +7', summary: 'Yellow-green halogen gas utilized widely in water treatment.' },
  { number: 18, symbol: 'Ar', name: 'Argon', atomicMass: 39.948, category: 'noble-gas', group: 18, period: 3, electronConfiguration: '[Ne] 3s² 3p⁶', summary: 'Inert gas widely used as a protective shielding atmosphere in laboratories.' },
  { number: 19, symbol: 'K', name: 'Potassium', atomicMass: 39.098, category: 'alkali-metal', group: 1, period: 4, electronConfiguration: '[Ar] 4s¹', electronegativity: 0.82, oxidationStates: '+1', summary: 'Alkali metal vital for cellular ion channels and neural signaling.' },
  { number: 20, symbol: 'Ca', name: 'Calcium', atomicMass: 40.078, category: 'alkaline-earth', group: 2, period: 4, electronConfiguration: '[Ar] 4s²', electronegativity: 1.00, oxidationStates: '+2', summary: 'Alkaline earth metal essential for living organisms and structural mineralogy.' },
  { number: 21, symbol: 'Sc', name: 'Scandium', atomicMass: 44.956, category: 'transition-metal', group: 3, period: 4, electronConfiguration: '[Ar] 3d¹ 4s²', electronegativity: 1.36, oxidationStates: '+3', summary: 'First d-block transition element with applications in high-strength alloys.' },
  { number: 22, symbol: 'Ti', name: 'Titanium', atomicMass: 47.867, category: 'transition-metal', group: 4, period: 4, electronConfiguration: '[Ar] 3d² 4s²', electronegativity: 1.54, oxidationStates: '+4', summary: 'Lustrous transition metal with high strength-to-density ratio.' },
  { number: 23, symbol: 'V', name: 'Vanadium', atomicMass: 50.942, category: 'transition-metal', group: 5, period: 4, electronConfiguration: '[Ar] 3d³ 4s²', electronegativity: 1.63, oxidationStates: '+2, +3, +4, +5', summary: 'Known for colorful oxidation states in aqueous solutions.' },
  { number: 24, symbol: 'Cr', name: 'Chromium', atomicMass: 51.996, category: 'transition-metal', group: 6, period: 4, electronConfiguration: '[Ar] 3d⁵ 4s¹', electronegativity: 1.66, oxidationStates: '+3, +6', summary: 'Known for anomalous half-filled d-subshell and Jones reagent oxidations.' },
  { number: 25, symbol: 'Mn', name: 'Manganese', atomicMass: 54.938, category: 'transition-metal', group: 7, period: 4, electronConfiguration: '[Ar] 3d⁵ 4s²', electronegativity: 1.55, oxidationStates: '+2, +4, +7', summary: 'Versatile redox metal with \(KMnO_4\) acting as a powerful oxidizer.' },
  { number: 26, symbol: 'Fe', name: 'Iron', atomicMass: 55.845, category: 'transition-metal', group: 8, period: 4, electronConfiguration: '[Ar] 3d⁶ 4s²', electronegativity: 1.83, oxidationStates: '+2, +3', summary: 'Most abundant element on Earth by mass, core to hemoglobin coordination.' },
  { number: 27, symbol: 'Co', name: 'Cobalt', atomicMass: 58.933, category: 'transition-metal', group: 9, period: 4, electronConfiguration: '[Ar] 3d⁷ 4s²', electronegativity: 1.88, oxidationStates: '+2, +3', summary: 'Central atom in Vitamin B12 and Werner coordination complexes.' },
  { number: 28, symbol: 'Ni', name: 'Nickel', atomicMass: 58.693, category: 'transition-metal', group: 10, period: 4, electronConfiguration: '[Ar] 3d⁸ 4s²', electronegativity: 1.91, oxidationStates: '+2', summary: 'Transition metal used widely in Raney nickel catalytic hydrogenations.' },
  { number: 29, symbol: 'Cu', name: 'Copper', atomicMass: 63.546, category: 'transition-metal', group: 11, period: 4, electronConfiguration: '[Ar] 3d¹⁰ 4s¹', electronegativity: 1.90, oxidationStates: '+1, +2', summary: 'Full d-subshell coin metal with excellent thermal and electrical conductivity.' },
  { number: 30, symbol: 'Zn', name: 'Zinc', atomicMass: 65.38, category: 'post-transition', group: 12, period: 4, electronConfiguration: '[Ar] 3d¹⁰ 4s²', electronegativity: 1.65, oxidationStates: '+2', summary: 'Diamagnetic metal forming colorless coordination compounds.' },
  { number: 35, symbol: 'Br', name: 'Bromine', atomicMass: 79.904, category: 'halogen', group: 17, period: 4, electronConfiguration: '[Ar] 3d¹⁰ 4s² 4p⁵', electronegativity: 2.96, oxidationStates: '-1', summary: 'Deep red-brown liquid halogen commonly used in electrophilic brominations.' },
  { number: 47, symbol: 'Ag', name: 'Silver', atomicMass: 107.87, category: 'transition-metal', group: 11, period: 5, electronConfiguration: '[Kr] 4d¹⁰ 5s¹', electronegativity: 1.93, oxidationStates: '+1', summary: 'Highest electrical conductivity of any element, used in Tollens’ reagent.' },
  { number: 53, symbol: 'I', name: 'Iodine', atomicMass: 126.90, category: 'halogen', group: 17, period: 5, electronConfiguration: '[Kr] 4d¹⁰ 5s² 5p⁵', electronegativity: 2.66, oxidationStates: '-1', summary: 'Lustrous purple-black solid that sublimes into violet gas.' },
  { number: 78, symbol: 'Pt', name: 'Platinum', atomicMass: 195.08, category: 'transition-metal', group: 10, period: 6, electronConfiguration: '[Xe] 4f¹⁴ 5d⁹ 6s¹', electronegativity: 2.28, oxidationStates: '+2, +4', summary: 'Noble metal forming cisplatin, a landmark chemotherapy coordination drug.' },
  { number: 79, symbol: 'Au', name: 'Gold', atomicMass: 196.97, category: 'transition-metal', group: 11, period: 6, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s¹', electronegativity: 2.54, oxidationStates: '+1, +3', summary: 'Highly unreactive transition metal shaped by relativistic orbital contraction.' },
  { number: 80, symbol: 'Hg', name: 'Mercury', atomicMass: 200.59, category: 'post-transition', group: 12, period: 6, electronConfiguration: '[Xe] 4f¹⁴ 5d¹⁰ 6s²', electronegativity: 2.00, oxidationStates: '+1, +2', summary: 'Heavy liquid metal used in oxymercuration-demercuration reactions.' },
];
