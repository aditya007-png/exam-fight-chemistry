import React, { useState } from 'react';
import { ChemCanvas2D } from '../../components/chemistry/ChemCanvas2D';
import { SpectrumViewer } from '../../components/chemistry/SpectrumViewer';
import { GalvanicCellSimulator } from '../../components/chemistry/GalvanicCellSimulator';
import { KineticsPlotter } from '../../components/chemistry/KineticsPlotter';
import {
  Activity,
  Zap,
  TrendingDown,
  Sparkles,
  Layers,
} from 'lucide-react';

export const ChemistryLabPage: React.FC = () => {
  const [activeLabTab, setActiveLabTab] = useState<'canvas' | 'spectra' | 'electro' | 'kinetics'>('canvas');

  return (
    <div className="space-y-8 max-w-7xl mx-auto py-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-surface-100 border border-slate-700/80 p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-chem-400 animate-pulse" />
            <span className="text-xs font-mono text-chem-300 bg-chem-500/10 px-2 py-0.5 rounded border border-chem-500/20">
              Virtual Chemistry Sandbox
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Interactive Chemistry Exploration Lab
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Interactive 2D structure drawing, organic reaction mechanism arrows, NMR/FTIR spectroscopy, electrochemistry, and kinetics simulators.
          </p>
        </div>
      </div>

      {/* Lab Navigation Tabs */}
      <div className="flex flex-wrap rounded-2xl bg-surface-100 p-1.5 border border-slate-800 text-xs font-bold gap-1.5 shadow-lg">
        <button
          onClick={() => setActiveLabTab('canvas')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeLabTab === 'canvas'
              ? 'bg-chem-500 text-slate-950 font-extrabold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>2D Molecule & Mechanism Canvas</span>
        </button>

        <button
          onClick={() => setActiveLabTab('spectra')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeLabTab === 'spectra'
              ? 'bg-chem-500 text-slate-950 font-extrabold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>¹H-NMR & FTIR Spectroscopy</span>
        </button>

        <button
          onClick={() => setActiveLabTab('electro')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeLabTab === 'electro'
              ? 'bg-chem-500 text-slate-950 font-extrabold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Galvanic Cell Simulator</span>
        </button>

        <button
          onClick={() => setActiveLabTab('kinetics')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeLabTab === 'kinetics'
              ? 'bg-chem-500 text-slate-950 font-extrabold shadow'
              : 'text-slate-400 hover:text-slate-200 hover:bg-surface-200'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Reaction Kinetics Plotter</span>
        </button>
      </div>

      {/* Active Tab View */}
      {activeLabTab === 'canvas' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-surface-200/50 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-chem-400" />
              <span>
                Draw bonds, attach substituents, construct rings, and draw curly reaction arrows with the 2D sketcher.
              </span>
            </div>
            <span className="font-mono text-chem-300 font-bold">ChemCanvas 2D Engine</span>
          </div>

          <ChemCanvas2D height={500} />
        </div>
      )}

      {activeLabTab === 'spectra' && <SpectrumViewer />}

      {activeLabTab === 'electro' && <GalvanicCellSimulator />}

      {activeLabTab === 'kinetics' && <KineticsPlotter />}
    </div>
  );
};
