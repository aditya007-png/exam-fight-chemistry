import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { MoleculeViewer3D } from './MoleculeViewer3D';
import { MOLECULAR_MODELS } from '../../lib/molecularModelsData';
import { MolecularModel } from '../../types/molecule';
import { Atom } from 'lucide-react';

interface MoleculeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMoleculeId?: string;
}

export const MoleculeModal: React.FC<MoleculeModalProps> = ({
  isOpen,
  onClose,
  initialMoleculeId = 'mol-benzene',
}) => {
  const [selectedModel, setSelectedModel] = useState<MolecularModel>(
    MOLECULAR_MODELS.find((m) => m.id === initialMoleculeId) || MOLECULAR_MODELS[0]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="3D Molecular Structure & Orbital Inspector"
      subtitle="Interactive stereochemistry and coordinate geometry visualizer"
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Molecule Selector Tabs */}
        <div className="flex flex-wrap gap-2 pb-2 border-b border-slate-800">
          {MOLECULAR_MODELS.map((mol) => (
            <button
              key={mol.id}
              onClick={() => setSelectedModel(mol)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                selectedModel.id === mol.id
                  ? 'bg-chem-500 text-slate-950 shadow-md font-bold'
                  : 'bg-surface-200 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>{mol.name}</span>
              <span className="font-mono opacity-80 text-[10px]">({mol.formula})</span>
            </button>
          ))}
        </div>

        {/* 3D Visualizer Canvas */}
        <MoleculeViewer3D model={selectedModel} height={320} />

        {/* Chemical Summary Info */}
        <div className="p-4 rounded-xl bg-surface-200/90 border border-slate-800 space-y-2 text-xs text-slate-300">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <div>
              <span className="text-slate-400 block text-[11px]">Formula:</span>
              <span className="font-mono font-bold text-white text-sm">{selectedModel.formula}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Molar Mass:</span>
              <span className="font-mono text-chem-300 font-bold">{selectedModel.molarMass} g/mol</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Classification:</span>
              <span className="text-indigo-300 font-semibold">{selectedModel.category}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-800 pt-2">
            {selectedModel.description}
          </p>
        </div>
      </div>
    </Modal>
  );
};
