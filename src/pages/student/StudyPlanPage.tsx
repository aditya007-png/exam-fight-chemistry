import React from 'react';
import { Button } from '../../components/common/Button';
import { FormulaTag } from '../../components/chemistry/FormulaTag';
import { MoleculeViewer3D } from '../../components/chemistry/MoleculeViewer3D';
import { MOLECULAR_MODELS } from '../../lib/molecularModelsData';
import {
  Sparkles,
  ArrowLeft,
  Atom,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudyPlanPage: React.FC = () => {
  const recommendations = [
    {
      domain: 'Organic Chemistry',
      topic: 'Carbocation Rearrangements & Methyl Shifts',
      status: 'High Priority',
      description:
        'You missed the 1,2-methanide rearrangement in Question #5. Review secondary to tertiary carbocation hyperconjugation stability.',
      formula: '(CH₃)₃C-CH⁺-CH₃ → (CH₃)₂C⁺-CH(CH₃)₂',
      suggestedReading: 'Wade Organic Chemistry, Chapter 8.4 (Electrophilic Additions)',
    },
    {
      domain: 'Physical Chemistry',
      topic: 'Entropy Unit Normalization in Gibbs Equation',
      status: 'Mastered',
      description:
        'Excellent precision converting J/(mol·K) to kJ/(mol·K) in temperature-dependent spontaneity calculations.',
      formula: 'ΔG° = ΔH° - TΔS°',
      suggestedReading: 'Atkins Physical Chemistry, Chapter 3.2',
    },
    {
      domain: 'Inorganic Chemistry',
      topic: 'Optical Activity in Coordination Chelates',
      status: 'Review Recommended',
      description:
        'Focus on why cis-[Co(en)₂Cl₂]⁺ is chiral (helical geometry) while trans-[Co(en)₂Cl₂]⁺ has an inversion center (achiral).',
      formula: 'cis-[Co(en)₂Cl₂]⁺ vs trans-[Co(en)₂Cl₂]⁺',
      suggestedReading: 'Miessler Inorganic Chemistry, Chapter 9.3',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-6">
      {/* 1. Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-surface-200 via-surface-100 to-chem-950/40 border border-slate-700/80 p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-chem-300 bg-chem-500/10 px-2 py-0.5 rounded border border-chem-500/20">
              AI Academic Tutor
            </span>
            <span className="text-xs text-slate-400">Personalized Diagnostic Roadmap</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Targeted Chemistry Remediation Plan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Synthesized from your recent performance on the <strong>Thermodynamics & Organic Assessments</strong>.
          </p>
        </div>

        <Link to="/student/dashboard">
          <Button variant="secondary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* 2. Molecular Modeling Companion */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center rounded-2xl bg-surface-100 border border-slate-700/80 p-6 shadow-xl">
        <div className="md:col-span-6 space-y-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-chem-500/10 border border-chem-500/30 text-chem-300 text-xs font-semibold">
            <Atom className="w-3.5 h-3.5 text-chem-400" />
            <span>Interactive 3D Structure Companion</span>
          </div>
          <h2 className="text-xl font-bold text-white">
            Benzene Ring π-Delocalization (\(C_6H_6\))
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Drag to rotate the planar aromatic system in 3D. Notice the 120° bond angles and equal carbon-carbon bond lengths (1.39 Å) resulting from cyclic resonance conjugation.
          </p>
          <div className="pt-1 flex gap-2">
            <FormulaTag formula="ΔH_hyd = -208 kJ/mol" name="Resonance Energy" variant="cyan" />
            <FormulaTag formula="sp² Hybridized" name="Planar Geometry" variant="indigo" />
          </div>
        </div>

        <div className="md:col-span-6">
          <MoleculeViewer3D model={MOLECULAR_MODELS[0]} height={260} />
        </div>
      </div>

      {/* 3. Action Items List */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Prioritized Concept Review Modules
        </h3>

        <div className="space-y-4">
          {recommendations.map((rec, idx) => (
            <div
              key={idx}
              className="rounded-2xl bg-surface-100 border border-slate-700/80 p-6 space-y-3 shadow-md hover:border-slate-600 transition-colors"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                    Module #{idx + 1}
                  </span>
                  <span className="text-xs font-semibold text-chem-300 bg-chem-500/10 px-2 py-0.5 rounded border border-chem-500/20">
                    {rec.domain}
                  </span>
                </div>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    rec.status === 'High Priority'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : rec.status === 'Mastered'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {rec.status}
                </span>
              </div>

              <h4 className="text-sm font-bold text-white">{rec.topic}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{rec.description}</p>

              <div className="p-3 rounded-lg bg-surface-200/80 font-mono text-xs text-chem-300 font-semibold text-center border border-slate-800">
                {rec.formula}
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <span>📚 Reference: <strong className="text-slate-200">{rec.suggestedReading}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
