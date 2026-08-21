import React, { useState } from 'react';

export const KineticsPlotter: React.FC = () => {
  const [plotType, setPlotType] = useState<'conc' | 'ln' | 'inv'>('conc');
  const [initialConc, setInitialConc] = useState<number>(1.0); // M
  const [rateConstant, setRateConstant] = useState<number>(0.035); // s^-1
  const [reactionOrder, setReactionOrder] = useState<0 | 1 | 2>(1);

  // Time series from 0 to 120 seconds
  const timePoints = [0, 10, 20, 30, 45, 60, 75, 90, 105, 120];

  // Calculate concentration [A] at time t
  const getConcentration = (t: number) => {
    if (reactionOrder === 0) {
      return Math.max(0, initialConc - rateConstant * t);
    }
    if (reactionOrder === 1) {
      return initialConc * Math.exp(-rateConstant * t);
    }
    // Order 2: 1/[A] = 1/[A]0 + k*t => [A] = 1 / (1/[A]0 + k*t)
    return 1 / (1 / initialConc + rateConstant * t);
  };

  // Half-life t1/2 calculation
  const getHalfLife = () => {
    if (reactionOrder === 0) {
      return (initialConc / (2 * rateConstant)).toFixed(1);
    }
    if (reactionOrder === 1) {
      return (Math.log(2) / rateConstant).toFixed(1);
    }
    return (1 / (rateConstant * initialConc)).toFixed(1);
  };

  return (
    <div className="rounded-2xl bg-surface-100 border border-slate-800 p-6 space-y-6 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/50">
              Reaction Kinetics Grapher
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Integrated Rate Law Plotter
          </h2>
          <p className="text-xs text-slate-400">
            Determine reaction orders & instantaneous half-lives via \([A]\), \(\ln[A]\), and \(1/[A]\) graphical linearity
          </p>
        </div>

        {/* Reaction Order Selector */}
        <div className="flex rounded-xl bg-surface-200 p-0.5 border border-slate-700 text-xs">
          {([0, 1, 2] as const).map((ord) => (
            <button
              key={ord}
              onClick={() => setReactionOrder(ord)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                reactionOrder === ord
                  ? 'bg-chem-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Order {ord}
            </button>
          ))}
        </div>
      </div>

      {/* Plot Type Tabs */}
      <div className="flex rounded-xl bg-surface-200/80 p-1 border border-slate-800 text-xs font-semibold gap-1">
        <button
          onClick={() => setPlotType('conc')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            plotType === 'conc'
              ? 'bg-chem-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          [A] vs Time (Zero-Order Linear)
        </button>

        <button
          onClick={() => setPlotType('ln')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            plotType === 'ln'
              ? 'bg-chem-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ln[A] vs Time (1st-Order Linear)
        </button>

        <button
          onClick={() => setPlotType('inv')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            plotType === 'inv'
              ? 'bg-chem-500 text-slate-950 font-bold shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          1/[A] vs Time (2nd-Order Linear)
        </button>
      </div>

      {/* SVG Kinetics Graph Stage */}
      <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 sm:p-6 overflow-hidden space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Y-Axis: {plotType === 'conc' ? 'Concentration [A] (M)' : plotType === 'ln' ? 'ln[A]' : '1/[A] (M⁻¹)'}</span>
          <span>X-Axis: Time t (seconds)</span>
        </div>

        <div className="h-60 w-full">
          <svg className="w-full h-full" viewBox="0 0 700 240" preserveAspectRatio="none">
            {/* Grid Lines */}
            {[0, 30, 60, 90, 120].map((t, idx) => {
              const x = 60 + idx * 145;
              return (
                <g key={t}>
                  <line x1={x} y1="30" x2={x} y2="200" stroke="#1e293b" strokeWidth="1" />
                  <text x={x} y="220" fill="#64748b" fontSize="10" fontFamily="monospace" textAnchor="middle">
                    {t}s
                  </text>
                </g>
              );
            })}

            {/* Axes */}
            <line x1="60" y1="200" x2="650" y2="200" stroke="#475569" strokeWidth="1.5" />
            <line x1="60" y1="20" x2="60" y2="200" stroke="#475569" strokeWidth="1.5" />

            {/* Plotted Data Curve */}
            <path
              d={
                'M ' +
                timePoints
                  .map((t) => {
                    const conc = getConcentration(t);
                    const x = 60 + (t / 120) * 580;
                    let yVal = 0;
                    if (plotType === 'conc') {
                      yVal = 200 - (conc / initialConc) * 160;
                    } else if (plotType === 'ln') {
                      const lnVal = Math.log(Math.max(0.001, conc));
                      // Scale ln from 0 down to -5
                      yVal = 40 + (Math.abs(lnVal) / 5) * 150;
                    } else {
                      const invVal = 1 / Math.max(0.001, conc);
                      yVal = 200 - Math.min(160, (invVal / (10 / initialConc)) * 160);
                    }
                    return `${x} ${yVal}`;
                  })
                  .join(' L ')
              }
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
            />

            {/* Data Points */}
            {timePoints.map((t) => {
              const conc = getConcentration(t);
              const x = 60 + (t / 120) * 580;
              let yVal = 0;
              if (plotType === 'conc') {
                yVal = 200 - (conc / initialConc) * 160;
              } else if (plotType === 'ln') {
                const lnVal = Math.log(Math.max(0.001, conc));
                yVal = 40 + (Math.abs(lnVal) / 5) * 150;
              } else {
                const invVal = 1 / Math.max(0.001, conc);
                yVal = 200 - Math.min(160, (invVal / (10 / initialConc)) * 160);
              }

              return (
                <circle
                  key={t}
                  cx={x}
                  cy={yVal}
                  r="4"
                  fill="#38bdf8"
                  stroke="#020617"
                  strokeWidth="1.5"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Kinetics Parameter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-surface-200/80 border border-slate-800 space-y-2">
          <span className="text-slate-400 block">Initial Concentration [A]₀:</span>
          <div className="text-base font-bold text-white">{initialConc.toFixed(2)} M</div>
          <input
            type="range"
            min="0.1"
            max="2.0"
            step="0.1"
            value={initialConc}
            onChange={(e) => setInitialConc(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-chem-400"
          />
        </div>

        <div className="p-4 rounded-xl bg-surface-200/80 border border-slate-800 space-y-2">
          <span className="text-slate-400 block">Rate Constant (k):</span>
          <div className="text-base font-bold text-white">{rateConstant.toFixed(4)} s⁻¹</div>
          <input
            type="range"
            min="0.005"
            max="0.1"
            step="0.005"
            value={rateConstant}
            onChange={(e) => setRateConstant(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-chem-400"
          />
        </div>

        <div className="p-4 rounded-xl bg-surface-200/80 border border-slate-800 space-y-2">
          <span className="text-slate-400 block">Calculated Half-Life (t₁/₂):</span>
          <div className="text-base font-bold text-emerald-400">{getHalfLife()} seconds</div>
          <span className="text-[11px] text-slate-500 block font-sans">
            {reactionOrder === 1 ? 'Independent of initial concentration [A]₀' : 'Concentration-dependent'}
          </span>
        </div>
      </div>
    </div>
  );
};
