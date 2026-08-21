import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Atom, Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-chem-500/10 border border-chem-500/30 flex items-center justify-center text-chem-400 mb-6">
        <Atom className="w-8 h-8 animate-spin-slow" />
      </div>
      <h1 className="text-5xl font-mono font-extrabold text-white mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-200 mb-2">Chemical State Undefined</h2>
      <p className="text-sm text-slate-400 max-w-md mb-8">
        The requested coordinate or exam pathway does not exist in the current reaction equilibrium.
      </p>
      <Link to="/">
        <Button variant="glow" leftIcon={<Home className="w-4 h-4" />}>
          Return to Platform Home
        </Button>
      </Link>
    </div>
  );
};
