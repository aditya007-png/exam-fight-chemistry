import React from 'react';
import { Atom } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Synthesizing Data...',
  subMessage = 'Connecting to quantum chemistry assessment engine',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Animated Orbital Ring & Atom */}
      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-chem-500/20 border-t-chem-400 animate-spin" />
        <div className="absolute inset-1 rounded-full border-2 border-indigo-500/20 border-b-indigo-400 animate-spin-slow" />
        <Atom className="w-7 h-7 text-chem-300 animate-pulse" />
      </div>

      <h4 className="text-sm font-semibold text-slate-200">{message}</h4>
      {subMessage && <p className="text-xs text-slate-400 mt-1 max-w-xs">{subMessage}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/90 backdrop-blur-md flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return (
    <div className="w-full py-16 flex items-center justify-center">
      {content}
    </div>
  );
};
