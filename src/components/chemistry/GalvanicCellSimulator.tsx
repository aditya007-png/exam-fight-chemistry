import React, { useState } from 'react';
import { GALVANIC_ELECTRODES } from '../../lib/spectraMockData';
import { GalvanicElectrode } from '../../types/spectrum';
import {
  Zap,
} from 'lucide-react';

export const GalvanicCellSimulator: React.FC = () => {
  const [anodeSymbol, setAnodeSymbol] = useState<string>('Zn');
  const [cathodeSymbol, setCathodeSymbol] = useState<string>('Cu');
  const [anodeConcentration, setAnodeConcentration] = useState<number>(1.0); // M
  const [cathodeConcentration, setCathodeConcentration] = useState<number>(1.0); // M

  const anode: GalvanicElectrode =
    GALVANIC_ELECTRODES.find((e) => e.symbol === anodeSymbol) || GALVANIC_ELECTRODES[0];
  const cathode: GalvanicElectrode =
    GALVANIC_ELECTRODES.find((e) => e.symbol === cathodeSymbol) || GALVANIC_ELECTRODES[1];

  // Standard Cell Potential: E°cell = E°cathode - E°anode
  const standardCellPotential = +(cathode.standardReductionPotential - anode.standardReductionPotential).toFixed(2);

  // Nernst Equation: E = E° - (0.0592 / n) * log10([Anode] / [Cathode]), assuming n = 2 electrons
  const nElectrons = 2;
  const qRatio = anodeConcentration / cathodeConcentration;
  const nernstCorrection = +( (0.0592 / nElectrons) * Math.log10(qRatio) ).toFixed(4);
  const actualCellPotential = +(standardCellPotential - nernstCorrection).toFixed(3);

  // Delta G° = -n * F * E° (kJ/mol)
  const faradayConstant = 96.485; // kJ / (V * mol)
  const deltaGStandard = +(-nElectrons * faradayConstant * standardCellPotential).toFixed(1);
  const isSpontaneous = actualCellPotential > 0;

  return (
    <div className="rounded-2xl bg-surface-100 border border-slate-800 p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-mono text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/50">
              Electrochemistry Simulator
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Galvanic / Voltaic Cell Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Real-time Anode & Cathode redox potential engine with Nernst equation equilibrium dynamics
          </p>
        </div>

        {/* Live Voltmeter Display */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-700 p-3 rounded-2xl shadow-inner">
          <Zap className={`w-7 h-7 ${isSpontaneous ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
          <div>
            <span className="text-[10px] font-mono text-slate-400 block">CELL VOLTAGE (E_cell)</span>
            <span className={`text-2xl font-mono font-extrabold ${
              isSpontaneous ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {actualCellPotential > 0 ? `+${actualCellPotential.toFixed(3)}` : actualCellPotential.toFixed(3)} V
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Visual Schematic SVG */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 overflow-hidden">
        <svg className="w-full h-56" viewBox="0 0 700 220">
          {/* External Circuit Wire */}
          <path
            d="M 180 80 L 180 30 L 350 30 L 520 30 L 520 80"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="3"
          />

          {/* Voltmeter in Middle of Circuit */}
          <circle cx="350" cy="30" r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.5" />
          <text x="350" y="34" fill="#38bdf8" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            {actualCellPotential > 0 ? `+${actualCellPotential.toFixed(2)}V` : `${actualCellPotential.toFixed(2)}V`}
          </text>

          {/* Electron Flow Arrows */}
          {isSpontaneous && (
            <g className="animate-pulse">
              <polygon points="260,26 270,30 260,34" fill="#f59e0b" />
              <text x="250" y="20" fill="#f59e0b" fontSize="9" fontFamily="monospace">e⁻ flow →</text>
              <polygon points="430,26 440,30 430,34" fill="#f59e0b" />
            </g>
          )}

          {/* Salt Bridge (U-tube) */}
          <path
            d="M 270 120 L 270 65 Q 350 60 430 65 L 430 120"
            fill="none"
            stroke="#64748b"
            strokeWidth="16"
            strokeLinecap="round"
          />
          <path
            d="M 270 120 L 270 65 Q 350 60 430 65 L 430 120"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <text x="350" y="80" fill="#020617" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
            KNO₃ Salt Bridge
          </text>

          {/* Left Beaker (Anode - Oxidation Half-Cell) */}
          <rect x="110" y="90" width="140" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Solution Liquid */}
          <rect x="115" y="115" width="130" height="90" rx="4" fill="#0369a1" opacity="0.35" />
          {/* Anode Metal Strip */}
          <rect x="165" y="60" width="30" height="120" rx="2" fill={anode.color} stroke="#334155" strokeWidth="1.5" />
          <text x="180" y="130" fill="#020617" fontSize="12" fontWeight="extrabold" textAnchor="middle">
            {anode.symbol}
          </text>
          <text x="180" y="200" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
            Anode (-): {anode.element}
          </text>

          {/* Right Beaker (Cathode - Reduction Half-Cell) */}
          <rect x="450" y="90" width="140" height="120" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          {/* Solution Liquid */}
          <rect x="455" y="115" width="130" height="90" rx="4" fill="#0d9488" opacity="0.35" />
          {/* Cathode Metal Strip */}
          <rect x="505" y="60" width="30" height="120" rx="2" fill={cathode.color} stroke="#334155" strokeWidth="1.5" />
          <text x="520" y="130" fill="#020617" fontSize="12" fontWeight="extrabold" textAnchor="middle">
            {cathode.symbol}
          </text>
          <text x="520" y="200" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">
            Cathode (+): {cathode.element}
          </text>
        </svg>
      </div>

      {/* Electrode Controls & Nernst Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Anode Half-Cell Selector */}
        <div className="p-4 rounded-xl bg-surface-200/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Anode Half-Cell (Oxidation)</span>
            <span className="text-[11px] font-mono text-chem-300">
              E° = {anode.standardReductionPotential > 0 ? `+${anode.standardReductionPotential}` : anode.standardReductionPotential} V
            </span>
          </div>

          <div className="space-y-2">
            <select
              value={anodeSymbol}
              onChange={(e) => setAnodeSymbol(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-100 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-chem-400"
            >
              {GALVANIC_ELECTRODES.map((el) => (
                <option key={el.symbol} value={el.symbol}>
                  {el.element} ({el.symbol}) — E° = {el.standardReductionPotential} V
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>[Anode²⁺] Concentration:</span>
              <span className="font-mono text-white font-bold">{anodeConcentration} M</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="2.0"
              step="0.05"
              value={anodeConcentration}
              onChange={(e) => setAnodeConcentration(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-chem-400"
            />
          </div>
        </div>

        {/* Cathode Half-Cell Selector */}
        <div className="p-4 rounded-xl bg-surface-200/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Cathode Half-Cell (Reduction)</span>
            <span className="text-[11px] font-mono text-chem-300">
              E° = {cathode.standardReductionPotential > 0 ? `+${cathode.standardReductionPotential}` : cathode.standardReductionPotential} V
            </span>
          </div>

          <div className="space-y-2">
            <select
              value={cathodeSymbol}
              onChange={(e) => setCathodeSymbol(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface-100 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-chem-400"
            >
              {GALVANIC_ELECTRODES.map((el) => (
                <option key={el.symbol} value={el.symbol}>
                  {el.element} ({el.symbol}) — E° = {el.standardReductionPotential} V
                </option>
              ))}
            </select>

            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>[Cathode²⁺] Concentration:</span>
              <span className="font-mono text-white font-bold">{cathodeConcentration} M</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="2.0"
              step="0.05"
              value={cathodeConcentration}
              onChange={(e) => setCathodeConcentration(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-chem-400"
            />
          </div>
        </div>
      </div>

      {/* Thermodynamic Energy Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-200/50 border border-slate-800 text-xs font-mono">
        <div>
          <span className="text-slate-500 block">Standard Potential (E°cell):</span>
          <span className="font-bold text-chem-300 text-sm">{standardCellPotential} V</span>
        </div>
        <div>
          <span className="text-slate-500 block">Gibbs Free Energy (ΔG°):</span>
          <span className={`font-bold text-sm ${deltaGStandard < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {deltaGStandard} kJ/mol
          </span>
        </div>
        <div>
          <span className="text-slate-500 block">Thermodynamic Spontaneity:</span>
          <span className={`font-bold text-sm ${isSpontaneous ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isSpontaneous ? '✓ Spontaneous Reaction' : '✗ Non-Spontaneous (Electrolytic)'}
          </span>
        </div>
      </div>
    </div>
  );
};
