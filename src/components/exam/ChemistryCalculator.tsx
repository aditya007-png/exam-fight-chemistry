// src/components/exam/ChemistryCalculator.tsx
// Professional Scientific Calculator for active examinations
import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Delete } from 'lucide-react';

interface ChemistryCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChemistryCalculator: React.FC<ChemistryCalculatorProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState<string>('0');
  const [history, setHistory] = useState<string>('');

  const appendValue = (val: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(val);
    } else {
      setDisplay((prev) => prev + val);
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setHistory('');
  };

  const deleteLast = () => {
    if (display.length <= 1 || display === 'Error') {
      setDisplay('0');
    } else {
      setDisplay((prev) => prev.slice(0, -1));
    }
  };

  const applyMathFunc = (fn: (n: number) => number, fnName: string) => {
    try {
      const val = parseFloat(display);
      if (isNaN(val)) return;
      const res = fn(val);
      setHistory(`${fnName}(${val}) =`);
      setDisplay(Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(8)).toString());
    } catch {
      setDisplay('Error');
    }
  };

  const evaluateResult = () => {
    try {
      // Safe sanitize expression
      let sanitized = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/\^/g, '**')
        .replace(/π/g, `${Math.PI}`)
        .replace(/e(?![xp])/g, `${Math.E}`);

      // Evaluate safely
      const res = Function(`'use strict'; return (${sanitized})`)();
      if (typeof res !== 'number' || isNaN(res) || !isFinite(res)) {
        setDisplay('Error');
        return;
      }
      setHistory(`${display} =`);
      setDisplay(Number.isInteger(res) ? res.toString() : parseFloat(res.toFixed(8)).toString());
    } catch {
      setDisplay('Error');
    }
  };

  const insertConstant = (value: number, name: string) => {
    setHistory(`Const [${name}]`);
    setDisplay(value.toString());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scientific Calculator"
      subtitle="Standard computation & physical chemistry constants"
      maxWidth="md"
    >
      <div className="space-y-3.5">
        {/* Calculator Display Screen */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-right shadow-2xs">
          <div className="text-xs text-slate-400 font-mono min-h-[16px] truncate">
            {history || '\u00A0'}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900 tracking-wider truncate">
            {display}
          </div>
        </div>

        {/* Quick Physical Chemistry Constants */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Physical Constants (Click to insert)
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => insertConstant(8.314, 'R = 8.314 J/(mol·K)')}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-center hover:border-blue-300 transition"
              title="Ideal Gas Constant: 8.314 J/(mol·K)"
            >
              R (8.314)
            </button>
            <button
              type="button"
              onClick={() => insertConstant(6.022e23, 'N_A = 6.022e23')}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-center hover:border-blue-300 transition"
              title="Avogadro Constant: 6.022 × 10²³ mol⁻¹"
            >
              Nₐ (6.02e23)
            </button>
            <button
              type="button"
              onClick={() => insertConstant(96485, 'F = 96,485 C/mol')}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-center hover:border-blue-300 transition"
              title="Faraday Constant: 96,485 C/mol"
            >
              F (96485)
            </button>
            <button
              type="button"
              onClick={() => insertConstant(6.626e-34, 'h = 6.626e-34 J·s')}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-center hover:border-blue-300 transition"
              title="Planck Constant: 6.626 × 10⁻³⁴ J·s"
            >
              h (6.63e-34)
            </button>
            <button
              type="button"
              onClick={() => insertConstant(2.998e8, 'c = 2.998e8 m/s')}
              className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 text-blue-700 font-bold text-center hover:border-blue-300 transition"
              title="Speed of Light: 2.998 × 10⁸ m/s"
            >
              c (3.0e8)
            </button>
          </div>
        </div>

        {/* Calculator Scientific & Arithmetic Keypad */}
        <div className="grid grid-cols-5 gap-1.5 font-mono text-xs sm:text-sm">
          {/* Row 1: Scientific Functions */}
          <button
            type="button"
            onClick={() => applyMathFunc((x) => Math.sin((x * Math.PI) / 180), 'sin(deg)')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200"
          >
            sin
          </button>
          <button
            type="button"
            onClick={() => applyMathFunc((x) => Math.cos((x * Math.PI) / 180), 'cos(deg)')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200"
          >
            cos
          </button>
          <button
            type="button"
            onClick={() => applyMathFunc((x) => Math.tan((x * Math.PI) / 180), 'tan(deg)')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200"
          >
            tan
          </button>
          <button
            type="button"
            onClick={() => applyMathFunc(Math.log10, 'log₁₀')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200"
          >
            log
          </button>
          <button
            type="button"
            onClick={() => applyMathFunc(Math.log, 'ln')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200"
          >
            ln
          </button>

          {/* Row 2: Powers & Roots */}
          <button
            type="button"
            onClick={() => applyMathFunc((x) => Math.pow(10, x), '10ˣ')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200"
          >
            10ˣ
          </button>
          <button
            type="button"
            onClick={() => applyMathFunc(Math.exp, 'eˣ')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200"
          >
            eˣ
          </button>
          <button
            type="button"
            onClick={() => applyMathFunc(Math.sqrt, '√')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200"
          >
            √x
          </button>
          <button
            type="button"
            onClick={() => applyMathFunc((x) => x * x, 'x²')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200"
          >
            x²
          </button>
          <button
            type="button"
            onClick={() => appendValue('^')}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-indigo-700 font-semibold border border-slate-200"
          >
            xʸ
          </button>

          {/* Row 3: Clear / Delete / Parentheses / % */}
          <button
            type="button"
            onClick={clearAll}
            className="p-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200"
          >
            AC
          </button>
          <button
            type="button"
            onClick={deleteLast}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => appendValue('(')}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200"
          >
            (
          </button>
          <button
            type="button"
            onClick={() => appendValue(')')}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200"
          >
            )
          </button>
          <button
            type="button"
            onClick={() => appendValue('/100')}
            className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200"
          >
            %
          </button>

          {/* Row 4: 7, 8, 9, ÷, π */}
          <button type="button" onClick={() => appendValue('7')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">7</button>
          <button type="button" onClick={() => appendValue('8')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">8</button>
          <button type="button" onClick={() => appendValue('9')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">9</button>
          <button type="button" onClick={() => appendValue('÷')} className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 text-base">÷</button>
          <button type="button" onClick={() => appendValue('π')} className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200">π</button>

          {/* Row 5: 4, 5, 6, ×, e */}
          <button type="button" onClick={() => appendValue('4')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">4</button>
          <button type="button" onClick={() => appendValue('5')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">5</button>
          <button type="button" onClick={() => appendValue('6')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">6</button>
          <button type="button" onClick={() => appendValue('×')} className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 text-base">×</button>
          <button type="button" onClick={() => appendValue('e')} className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200">e</button>

          {/* Row 6: 1, 2, 3, -, +/- */}
          <button type="button" onClick={() => appendValue('1')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">1</button>
          <button type="button" onClick={() => appendValue('2')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">2</button>
          <button type="button" onClick={() => appendValue('3')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs">3</button>
          <button type="button" onClick={() => appendValue('-')} className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 text-base">-</button>
          <button
            type="button"
            onClick={() => {
              if (display.startsWith('-')) setDisplay(display.slice(1));
              else if (display !== '0') setDisplay('-' + display);
            }}
            className="p-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200"
          >
            ±
          </button>

          {/* Row 7: 0, ., =, + */}
          <button type="button" onClick={() => appendValue('0')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs col-span-2">0</button>
          <button type="button" onClick={() => appendValue('.')} className="p-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold border border-slate-200 shadow-2xs font-bold">.</button>
          <button type="button" onClick={() => appendValue('+')} className="p-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold border border-blue-200 text-base">+</button>
          <button
            type="button"
            onClick={evaluateResult}
            className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-xs text-base transition active:scale-95"
          >
            =
          </button>
        </div>
      </div>
    </Modal>
  );
};
