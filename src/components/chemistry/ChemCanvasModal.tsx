import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { ChemCanvas2D } from './ChemCanvas2D';
import { ChemCanvasState } from '../../types/chemCanvas';
import { Check } from 'lucide-react';

interface ChemCanvasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveStructure?: (state: ChemCanvasState) => void;
  title?: string;
}

export const ChemCanvasModal: React.FC<ChemCanvasModalProps> = ({
  isOpen,
  onClose,
  onSaveStructure,
  title = '2D Chemical Structure & Mechanism Builder',
}) => {
  const [currentState, setCurrentState] = useState<ChemCanvasState>({
    atoms: [],
    bonds: [],
    arrows: [],
  });

  const handleSave = () => {
    if (onSaveStructure) {
      onSaveStructure(currentState);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle="Draw chemical rings, heteroatoms, stereochemical wedge/dash bonds, and curved electron-pushing reaction arrows"
      maxWidth="2xl"
    >
      <div className="space-y-4">
        <ChemCanvas2D
          height={420}
          onChange={(st) => setCurrentState(st)}
        />

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="glow"
            size="sm"
            leftIcon={<Check className="w-4 h-4" />}
            onClick={handleSave}
          >
            Attach Structure to Answer
          </Button>
        </div>
      </div>
    </Modal>
  );
};
