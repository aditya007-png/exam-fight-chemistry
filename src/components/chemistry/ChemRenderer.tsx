/**
 * ChemRenderer — converts shorthand chemical notation to properly formatted
 * Unicode text and renders it in a <span>.
 *
 * Supports:
 *  - Subscripts:    H2O → H₂O, H2SO4 → H₂SO₄
 *  - Superscripts:  Fe^3+ → Fe³⁺, SO4^2- → SO₄²⁻
 *  - Arrows:        -> → →,  <=> or <-> → ⇌
 *  - States:        (s) (l) (g) (aq) — preserved
 *  - Conditions:    Delta/Δ, heat, catalyst
 *  - Greek letters: alpha→α, beta→β, gamma→γ, delta→Δ, lambda→λ, mu→μ
 */

import React from 'react';

// --------------------------------------------------------------------------
// Unicode mapping tables
// --------------------------------------------------------------------------

const SUB_MAP: Record<string, string> = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
};

const SUP_MAP: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻',
};

const GREEK: Record<string, string> = {
  'alpha': 'α', 'beta': 'β', 'gamma': 'γ', 'delta': 'δ', 'Delta': 'Δ',
  'epsilon': 'ε', 'theta': 'θ', 'lambda': 'λ', 'mu': 'μ', 'nu': 'ν',
  'pi': 'π', 'sigma': 'σ', 'omega': 'Ω', 'phi': 'φ', 'psi': 'ψ',
};

// --------------------------------------------------------------------------
// Core conversion function
// --------------------------------------------------------------------------

export function convertChemText(raw: string): string {
  let s = raw;

  // 1. Arrows
  s = s.replace(/<=>|<->|⇌/g, '⇌');
  s = s.replace(/->|→/g, '→');
  s = s.replace(/↑/g, '↑');
  s = s.replace(/↓/g, '↓');

  // 2. Greek words → symbols
  for (const [word, sym] of Object.entries(GREEK)) {
    s = s.replace(new RegExp(`\\b${word}\\b`, 'g'), sym);
  }

  // 3. Superscripts written as ^N+, ^N-, ^N (before subscripts so digits aren't double-processed)
  // e.g. Fe^3+  SO4^2-  Ca^2+  Na^+  Cl^-
  s = s.replace(/\^(\d*)([+-])/g, (_match, digits, sign) => {
    const dPart = digits ? digits.split('').map((d: string) => SUP_MAP[d] || d).join('') : '';
    const sPart = SUP_MAP[sign] || sign;
    return dPart + sPart;
  });
  // bare ^N (no sign)
  s = s.replace(/\^(\d+)/g, (_match, digits) =>
    digits.split('').map((d: string) => SUP_MAP[d] || d).join('')
  );

  // 4. Ionic charges written inline: Fe3+  Fe2+  Ca2+  Na+  Cl-  NH4+  SO42-
  // Pattern: after a letter (or closing paren), digits then + or -
  // We match only when the digit+sign immediately follows a non-space character
  s = s.replace(/([A-Za-z\)])(\d+)([+-])/g, (_m, pre, digits, sign) => {
    const dPart = digits.split('').map((d: string) => SUP_MAP[d] || d).join('');
    return pre + dPart + (SUP_MAP[sign] || sign);
  });
  // single +/- right after a letter or closing bracket (Na+ → Na⁺, Cl- → Cl⁻)
  s = s.replace(/([A-Za-z\)])([+-])(?!\w)/g, (_m, pre, sign) => pre + (SUP_MAP[sign] || sign));

  // 5. Subscripts: digits right after letters/closing brackets not already superscripted
  // e.g. H2O → H₂O, C6H12O6 → C₆H₁₂O₆
  // We only subscript digits that are part of molecular formulas (preceded by a letter or closing bracket)
  s = s.replace(/([A-Za-z\)])(\d+)/g, (_m, pre, digits) =>
    pre + digits.split('').map((d: string) => SUB_MAP[d] || d).join('')
  );

  // 6. Conditions: heat keyword, catalyst keyword, Delta as standalone
  s = s.replace(/\bDelta\b/g, 'Δ');
  s = s.replace(/\bheat\b/gi, (m) => m); // keep as-is but could style

  return s;
}

// --------------------------------------------------------------------------
// React component
// --------------------------------------------------------------------------

interface ChemRendererProps {
  text: string;
  className?: string;
  /** block = display:block centered, inline = span (default) */
  block?: boolean;
}

export const ChemRenderer: React.FC<ChemRendererProps> = ({ text, className = '', block = false }) => {
  const converted = convertChemText(text);

  if (block) {
    return (
      <div
        className={`font-mono text-blue-800 text-center py-2 ${className}`}
        style={{ fontFamily: "'DejaVu Sans Mono', 'Courier New', monospace" }}
      >
        {converted}
      </div>
    );
  }

  return (
    <span
      className={className}
      style={{ fontFamily: 'inherit' }}
    >
      {converted}
    </span>
  );
};

export default ChemRenderer;
