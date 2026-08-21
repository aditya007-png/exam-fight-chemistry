import React, { useState } from 'react';
import { MOCK_SPECTRA_DATA } from '../../lib/spectraMockData';
import { MoleculeSpectrumData, NMRPeak, IRPeak } from '../../types/spectrum';
import {
  Activity,
  Waves,
  Info,
  Sparkles,
} from 'lucide-react';

export const SpectrumViewer: React.FC = () => {
  const [selectedMoleculeId, setSelectedMoleculeId] = useState<string>('ethanol');
  const [spectrumMode, setSpectrumMode] = useState<'nmr' | 'ir'>('nmr');
  const [selectedPeak, setSelectedPeak] = useState<NMRPeak | IRPeak | null>(null);

  const activeMolecule: MoleculeSpectrumData =
    MOCK_SPECTRA_DATA[selectedMoleculeId] || MOCK_SPECTRA_DATA['ethanol'];

  return (
    <div className="rounded-2xl bg-surface-100 border border-slate-800 p-6 space-y-6 shadow-2xl">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/50">
              Analytical Spectroscopy Workstation
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Spectral Elucidation Simulator
          </h2>
          <p className="text-xs text-slate-400">
            Interactive high-resolution ¹H-NMR and Fourier-Transform Infrared (FTIR) spectral analyzer
          </p>
        </div>

        {/* Molecule & Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedMoleculeId}
            onChange={(e) => {
              setSelectedMoleculeId(e.target.value);
              setSelectedPeak(null);
            }}
            className="px-3 py-1.5 rounded-xl bg-surface-200 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:ring-1 focus:ring-chem-400"
          >
            <option value="ethanol">Ethanol (C₂H₆O)</option>
            <option value="ethyl_acetate">Ethyl Acetate (C₄H₈O₂)</option>
            <option value="acetone">Acetone (C₃H₆O)</option>
          </select>

          <div className="flex rounded-xl bg-surface-200 p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => {
                setSpectrumMode('nmr');
                setSelectedPeak(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                spectrumMode === 'nmr'
                  ? 'bg-chem-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              ¹H-NMR (400 MHz)
            </button>

            <button
              onClick={() => {
                setSpectrumMode('ir');
                setSelectedPeak(null);
              }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                spectrumMode === 'ir'
                  ? 'bg-chem-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              FTIR Spectrum
            </button>
          </div>
        </div>
      </div>

      {/* Spectrum Graph Stage (SVG Vector rendering) */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-6 overflow-hidden shadow-inner space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">{activeMolecule.moleculeName}</span>
            <span className="text-chem-300">({activeMolecule.chemicalFormula})</span>
            <span className="text-slate-600">•</span>
            <span>SMILES: {activeMolecule.smiles}</span>
          </div>

          <span className="text-slate-400">
            {spectrumMode === 'nmr' ? 'Solvent: CDCl₃ • TMS Reference @ 0.0 ppm' : 'Transmittance (%) vs Wavenumber (cm⁻¹)'}
          </span>
        </div>

        {/* 1. NMR Mode Graph */}
        {spectrumMode === 'nmr' && (
          <div className="relative h-64 w-full">
            <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
              {/* Baseline */}
              <line x1="50" y1="200" x2="650" y2="200" stroke="#334155" strokeWidth="1.5" />

              {/* Chemical Shift X-Axis Ticks (5.0 ppm down to 0.0 ppm) */}
              {[5.0, 4.0, 3.0, 2.0, 1.0, 0.0].map((ppm, idx) => {
                const x = 50 + idx * 120;
                return (
                  <g key={ppm}>
                    <line x1={x} y1="200" x2={x} y2="206" stroke="#64748b" strokeWidth="1.5" />
                    <text
                      x={x}
                      y="222"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {ppm.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Spectral Baseline Intensity Curve */}
              <path
                d={
                  'M 50 200 ' +
                  activeMolecule.nmr1H.rawCurve
                    .map(([ppm, intensity]) => {
                      const x = 50 + (5.0 - ppm) * 120;
                      const y = 200 - (intensity / 100) * 160;
                      return `L ${x} ${y}`;
                    })
                    .join(' ') +
                  ' L 650 200'
                }
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2"
              />

              {/* Interactive Clickable Peaks */}
              {activeMolecule.nmr1H.peaks.map((p) => {
                const x = 50 + (5.0 - p.chemicalShift) * 120;
                const isSelected = selectedPeak?.id === p.id;

                return (
                  <g
                    key={p.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedPeak(p)}
                  >
                    {/* Integration line / Peak marker */}
                    <line
                      x1={x}
                      y1="30"
                      x2={x}
                      y2="195"
                      stroke={isSelected ? '#f43f5e' : '#f59e0b'}
                      strokeWidth={isSelected ? '2' : '1'}
                      strokeDasharray="3,3"
                    />

                    <circle
                      cx={x}
                      cy="40"
                      r={isSelected ? '6' : '4'}
                      fill={isSelected ? '#f43f5e' : '#38bdf8'}
                      className="group-hover:scale-125 transition-transform"
                    />

                    <text
                      x={x}
                      y="25"
                      fill={isSelected ? '#f43f5e' : '#cbd5e1'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.chemicalShift.toFixed(2)} ppm ({p.integration}H)
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* 2. IR Mode Graph */}
        {spectrumMode === 'ir' && (
          <div className="relative h-64 w-full">
            <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
              {/* Baseline at 100% transmittance */}
              <line x1="50" y1="40" x2="650" y2="40" stroke="#334155" strokeWidth="1.5" />
              <line x1="50" y1="200" x2="650" y2="200" stroke="#334155" strokeWidth="1.5" />

              {/* Wavenumber X-Axis Ticks (4000 to 500 cm^-1) */}
              {[4000, 3500, 3000, 2500, 2000, 1500, 1000, 500].map((wn, idx) => {
                const x = 50 + idx * 85.7;
                return (
                  <g key={wn}>
                    <line x1={x} y1="200" x2={x} y2="206" stroke="#64748b" strokeWidth="1.5" />
                    <text
                      x={x}
                      y="222"
                      fill="#94a3b8"
                      fontSize="10"
                      fontFamily="monospace"
                      textAnchor="middle"
                    >
                      {wn}
                    </text>
                  </g>
                );
              })}

              {/* IR Transmittance Curve */}
              <path
                d={
                  'M 50 40 ' +
                  activeMolecule.irSpectrum.rawCurve
                    .map(([wn, trans]) => {
                      const x = 50 + ((4000 - wn) / 3500) * 600;
                      const y = 40 + ((100 - trans) / 100) * 160;
                      return `L ${x} ${y}`;
                    })
                    .join(' ')
                }
                fill="none"
                stroke="#a855f7"
                strokeWidth="2"
              />

              {/* Clickable IR Characteristic Absorption Bands */}
              {activeMolecule.irSpectrum.peaks.map((p) => {
                const x = 50 + ((4000 - p.wavenumber) / 3500) * 600;
                const isSelected = selectedPeak?.id === p.id;

                return (
                  <g
                    key={p.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedPeak(p)}
                  >
                    <line
                      x1={x}
                      y1="40"
                      x2={x}
                      y2="195"
                      stroke={isSelected ? '#f43f5e' : '#f59e0b'}
                      strokeWidth={isSelected ? '2' : '1'}
                      strokeDasharray="3,3"
                    />

                    <circle
                      cx={x}
                      cy="190"
                      r={isSelected ? '6' : '4'}
                      fill={isSelected ? '#f43f5e' : '#a855f7'}
                    />

                    <text
                      x={x}
                      y="30"
                      fill={isSelected ? '#f43f5e' : '#e2e8f0'}
                      fontSize="10"
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {p.wavenumber} cm⁻¹
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Peak Data Inspection Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl bg-surface-200/80 border border-slate-800 p-4 space-y-2">
          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-chem-400" />
            <span>Assigned Resonance Peaks & Multiplicity</span>
          </h4>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400">
                  <th className="pb-1.5">{spectrumMode === 'nmr' ? 'Shift (δ)' : 'Wavenumber'}</th>
                  <th className="pb-1.5">{spectrumMode === 'nmr' ? 'Multiplicity' : 'Intensity'}</th>
                  <th className="pb-1.5">{spectrumMode === 'nmr' ? 'Integration' : 'Band'}</th>
                  <th className="pb-1.5">Chemical Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {spectrumMode === 'nmr'
                  ? activeMolecule.nmr1H.peaks.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPeak(p)}
                        className={`cursor-pointer transition-colors ${
                          selectedPeak?.id === p.id
                            ? 'bg-chem-500/20 text-white font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <td className="py-2 text-chem-300">{p.chemicalShift.toFixed(2)} ppm</td>
                        <td className="py-2 capitalize">{p.multiplicity}</td>
                        <td className="py-2">{p.integration}H</td>
                        <td className="py-2 text-slate-400">{p.assignment}</td>
                      </tr>
                    ))
                  : activeMolecule.irSpectrum.peaks.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPeak(p)}
                        className={`cursor-pointer transition-colors ${
                          selectedPeak?.id === p.id
                            ? 'bg-chem-500/20 text-white font-bold'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <td className="py-2 text-purple-300">{p.wavenumber} cm⁻¹</td>
                        <td className="py-2 capitalize">{p.intensity}</td>
                        <td className="py-2 text-slate-400">IR active</td>
                        <td className="py-2 text-slate-400">{p.functionalGroup}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Peak Diagnostic Card */}
        <div className="rounded-xl bg-surface-200/80 border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Selected Peak Inspector
            </span>
            {selectedPeak ? (
              <div className="space-y-1 text-xs">
                <div className="text-base font-bold text-white">
                  {'chemicalShift' in selectedPeak
                    ? `${selectedPeak.chemicalShift.toFixed(2)} ppm (${selectedPeak.multiplicity})`
                    : `${selectedPeak.wavenumber} cm⁻¹ (${selectedPeak.intensity})`}
                </div>
                <p className="text-slate-300">
                  {'assignment' in selectedPeak
                    ? selectedPeak.assignment
                    : selectedPeak.functionalGroup}
                </p>
                {'couplingConstant' in selectedPeak && selectedPeak.couplingConstant && (
                  <div className="text-[11px] font-mono text-chem-300 pt-1">
                    J-Coupling Constant: <strong>{selectedPeak.couplingConstant} Hz</strong>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 py-4 text-center">
                Click any peak on the spectrum or table to inspect chemical shift splitting and functional group assignments.
              </div>
            )}
          </div>

          <div className="p-2.5 rounded-lg bg-surface-100 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-chem-400 shrink-0" />
            <span>NMR data calculated via standard spin-spin splitting \((n+1)\) rule.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
