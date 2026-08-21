import React from 'react';

interface FormulaTagProps {
  formula: string;
  name?: string;
  variant?: 'cyan' | 'indigo' | 'slate' | 'emerald';
}

export const FormulaTag: React.FC<FormulaTagProps> = ({
  formula,
  name,
  variant = 'cyan',
}) => {
  const variantStyles = {
    cyan: 'bg-chem-500/10 text-chem-300 border-chem-500/30 hover:border-chem-400',
    indigo: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:border-indigo-400',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700 hover:border-slate-600',
    emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono border transition-colors ${variantStyles[variant]}`}
    >
      <span className="font-semibold">{formula}</span>
      {name && <span className="text-[10px] text-slate-400 font-sans border-l border-slate-700/60 pl-1.5">{name}</span>}
    </span>
  );
};
