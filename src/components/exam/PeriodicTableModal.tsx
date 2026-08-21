import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { PERIODIC_TABLE_ELEMENTS, ElementData } from '../../lib/periodicTableData';
import { Search } from 'lucide-react';

interface PeriodicTableModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PeriodicTableModal: React.FC<PeriodicTableModalProps> = ({ isOpen, onClose }) => {
  const [selectedElement, setSelectedElement] = useState<ElementData>(PERIODIC_TABLE_ELEMENTS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredElements = PERIODIC_TABLE_ELEMENTS.filter(
    (el) =>
      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.number.toString() === searchQuery.trim()
  );

  const getCategoryColor = (category: ElementData['category']) => {
    switch (category) {
      case 'noble-gas':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40 hover:bg-purple-500/30';
      case 'alkali-metal':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30';
      case 'alkaline-earth':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30';
      case 'halogen':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30';
      case 'metalloid':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40 hover:bg-teal-500/30';
      case 'transition-metal':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40 hover:bg-blue-500/30';
      case 'post-transition':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40 hover:bg-indigo-500/30';
      case 'nonmetal':
      default:
        return 'bg-chem-500/20 text-chem-300 border-chem-500/40 hover:bg-chem-500/30';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="IUPAC Interactive Periodic Table of Elements"
      subtitle="Examine atomic properties, electron configurations, and electronegativities"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search element by name, symbol (e.g. Fe, Carbon, 26)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-200 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-chem-400"
          />
        </div>

        {/* Top Split: Selected Element Inspector Card */}
        {selectedElement && (
          <div className="p-4 rounded-xl bg-surface-200/90 border border-chem-500/40 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center shadow-lg">
            {/* Element Tile */}
            <div className="sm:col-span-3 text-center p-3 rounded-lg bg-surface-100 border border-slate-700 space-y-1">
              <span className="text-[11px] font-mono text-slate-400 block">{selectedElement.number}</span>
              <span className="text-3xl font-extrabold font-mono text-chem-300 block">{selectedElement.symbol}</span>
              <span className="text-xs font-semibold text-white block truncate">{selectedElement.name}</span>
              <span className="text-[10px] font-mono text-slate-400 block">{selectedElement.atomicMass.toFixed(3)} u</span>
            </div>

            {/* Element Properties */}
            <div className="sm:col-span-9 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-slate-400">Category: </span>
                  <span className="capitalize font-medium text-white">{selectedElement.category.replace('-', ' ')}</span>
                </div>
                <div>
                  <span className="text-slate-400">Electronegativity: </span>
                  <span className="font-mono text-chem-300 font-semibold">{selectedElement.electronegativity || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400">Electron Config: </span>
                  <span className="font-mono text-indigo-300 font-semibold">{selectedElement.electronConfiguration}</span>
                </div>
                <div>
                  <span className="text-slate-400">Oxidation States: </span>
                  <span className="font-mono text-amber-300">{selectedElement.oxidationStates || '0'}</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-800 pt-1.5 leading-relaxed">
                {selectedElement.summary}
              </p>
            </div>
          </div>
        )}

        {/* Elements Grid View */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Click any element to inspect:</span>
            <span>{filteredElements.length} Elements Listed</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-1.5 max-h-64 overflow-y-auto p-1 bg-surface-200/40 rounded-xl border border-slate-800">
            {filteredElements.map((el) => {
              const isSelected = selectedElement?.number === el.number;
              return (
                <button
                  key={el.number}
                  onClick={() => setSelectedElement(el)}
                  className={`p-1.5 rounded-lg border text-center transition-all flex flex-col items-center justify-center ${
                    isSelected
                      ? 'ring-2 ring-chem-400 scale-105 shadow-md shadow-cyan-950/40'
                      : ''
                  } ${getCategoryColor(el.category)}`}
                >
                  <span className="text-[9px] font-mono opacity-70 block">{el.number}</span>
                  <span className="text-xs font-bold font-mono block">{el.symbol}</span>
                  <span className="text-[8px] truncate max-w-full block">{el.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
