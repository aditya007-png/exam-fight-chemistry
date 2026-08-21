// src/pages/student/PeriodicTablePage.tsx
// Dedicated Student Periodic Table Page — Clean White Academic Design
import React, { useState } from 'react';
import { PERIODIC_TABLE_ELEMENTS, ElementData } from '../../lib/periodicTableData';
import {
  Search,
  Atom,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const PeriodicTablePage: React.FC = () => {
  const [selectedElement, setSelectedElement] = useState<ElementData>(PERIODIC_TABLE_ELEMENTS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Elements' },
    { id: 'alkali-metal', label: 'Alkali Metals' },
    { id: 'alkaline-earth', label: 'Alkaline Earth' },
    { id: 'transition-metal', label: 'Transition Metals' },
    { id: 'post-transition', label: 'Post-Transition' },
    { id: 'metalloid', label: 'Metalloids' },
    { id: 'nonmetal', label: 'Nonmetals' },
    { id: 'halogen', label: 'Halogens' },
    { id: 'noble-gas', label: 'Noble Gases' },
  ];

  const filteredElements = PERIODIC_TABLE_ELEMENTS.filter((el) => {
    const matchesCat = activeCategory === 'all' || el.category === activeCategory;
    const matchesSearch =
      el.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      el.number.toString() === searchQuery.trim();
    return matchesCat && matchesSearch;
  });

  const getCategoryColor = (category: ElementData['category'], isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/40 shadow-md scale-105';
    }

    switch (category) {
      case 'noble-gas':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 hover:border-purple-300';
      case 'alkali-metal':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300';
      case 'alkaline-earth':
        return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100 hover:border-amber-300';
      case 'halogen':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300';
      case 'metalloid':
        return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-300';
      case 'transition-metal':
        return 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100 hover:border-sky-300';
      case 'post-transition':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300';
      case 'nonmetal':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* 1. Page Header */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            Reference Database
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Atom className="w-6 h-6 text-blue-600" />
            IUPAC Periodic Table of Elements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Explore atomic properties, electron configurations, and standard physical constants.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search element, symbol, or atomic # (e.g. Fe, Carbon, 26)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* 2. Top Selected Element Detail Panel (Card) */}
      {selectedElement && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Element Hero Badge Tile */}
            <div className="md:col-span-3 text-center p-5 rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/50 border border-blue-200 space-y-1.5 shadow-xs">
              <span className="text-xs font-mono font-bold text-blue-600 block">
                Atomic No. {selectedElement.number}
              </span>
              <span className="text-5xl font-black font-mono text-slate-900 block tracking-tight">
                {selectedElement.symbol}
              </span>
              <span className="text-base font-extrabold text-slate-900 block">
                {selectedElement.name}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 block">
                {selectedElement.atomicMass.toFixed(3)} u
              </span>
              <span className="inline-block text-[11px] font-semibold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 capitalize mt-1">
                {selectedElement.category.replace('-', ' ')}
              </span>
            </div>

            {/* Element Specifications Grid */}
            <div className="md:col-span-9 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Element Information & Properties
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  Group {selectedElement.group} • Period {selectedElement.period}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Electron Config</span>
                  <strong className="text-slate-900 font-mono block mt-0.5">
                    {selectedElement.electronConfiguration}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Electronegativity</span>
                  <strong className="text-blue-700 font-mono block mt-0.5">
                    {selectedElement.electronegativity ? `${selectedElement.electronegativity} (Pauling)` : 'N/A'}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Oxidation States</span>
                  <strong className="text-amber-700 font-mono block mt-0.5">
                    {selectedElement.oxidationStates || '0'}
                  </strong>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                  <span className="text-slate-400 block text-[11px]">Standard State</span>
                  <strong className="text-slate-900 capitalize block mt-0.5">
                    {selectedElement.category === 'noble-gas' || selectedElement.number === 1 || selectedElement.number === 7 || selectedElement.number === 8 || selectedElement.number === 9 || selectedElement.number === 17
                      ? 'Gas'
                      : selectedElement.number === 35 || selectedElement.number === 80
                      ? 'Liquid'
                      : 'Solid'}
                  </strong>
                </div>
              </div>

              {/* Summary Description */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>{selectedElement.summary}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-bold uppercase tracking-wider pr-1 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> Filter:
        </span>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setActiveCategory(c.id)}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition ${
              activeCategory === c.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 4. Interactive Elements Grid View */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-card space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700">Click any element below to inspect properties:</span>
          <span>Showing {filteredElements.length} of {PERIODIC_TABLE_ELEMENTS.length} elements</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {filteredElements.map((el) => {
            const isSelected = selectedElement?.number === el.number;
            return (
              <button
                key={el.number}
                type="button"
                onClick={() => setSelectedElement(el)}
                className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between cursor-pointer ${getCategoryColor(
                  el.category,
                  isSelected
                )}`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-mono opacity-70">
                  <span>{el.number}</span>
                  <span className="text-[8px]">{el.atomicMass.toFixed(1)}</span>
                </div>
                <span className="text-lg font-black font-mono my-0.5 block">{el.symbol}</span>
                <span className="text-[10px] font-medium truncate max-w-full block">{el.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
