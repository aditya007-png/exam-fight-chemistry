import React from 'react';

interface ChemistryBackgroundProps {
  variant?: 'subtle' | 'hero' | 'minimal';
}

export const ChemistryBackground: React.FC<ChemistryBackgroundProps> = ({ variant = 'subtle' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10">
      {/* Radial plasma glow gradient */}
      <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-chem-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-chem-accent/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Hexagonal molecular bond grid pattern */}
      <svg
        className={`absolute inset-0 w-full h-full ${
          variant === 'minimal' ? 'opacity-[0.03]' : variant === 'hero' ? 'opacity-[0.08]' : 'opacity-[0.05]'
        }`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="chem-hex-pattern" width="56" height="96" patternUnits="userSpaceOnUse" patternTransform="scale(1)">
            <path
              d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z M28 64 L56 80 L56 112 L28 128 L0 112 L0 80 Z"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="0.75"
            />
            <circle cx="28" cy="0" r="1.5" fill="#38BDF8" />
            <circle cx="56" cy="16" r="1.5" fill="#38BDF8" />
            <circle cx="0" cy="16" r="1.5" fill="#38BDF8" />
            <circle cx="28" cy="64" r="1.5" fill="#38BDF8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#chem-hex-pattern)" />
      </svg>

      {/* Floating chemical orbital rings (for hero variant) */}
      {variant === 'hero' && (
        <div className="absolute top-20 right-10 md:right-28 w-96 h-96 opacity-20 animate-spin-slow">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="100" cy="100" rx="90" ry="35" stroke="#38BDF8" strokeWidth="1" strokeDasharray="6 6" transform="rotate(30 100 100)" />
            <ellipse cx="100" cy="100" rx="90" ry="35" stroke="#818CF8" strokeWidth="1" strokeDasharray="6 6" transform="rotate(-30 100 100)" />
            <ellipse cx="100" cy="100" rx="90" ry="35" stroke="#22D3EE" strokeWidth="1" strokeDasharray="6 6" transform="rotate(90 100 100)" />
            <circle cx="100" cy="100" r="8" fill="#38BDF8" className="animate-pulse" />
          </svg>
        </div>
      )}
    </div>
  );
};
