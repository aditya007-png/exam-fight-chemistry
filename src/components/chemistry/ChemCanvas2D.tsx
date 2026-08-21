import React, { useState, useRef, useEffect } from 'react';
import {
  CanvasAtom,
  CanvasBond,
  CurvedArrow,
  HeteroAtom,
  BondType,
  FormalCharge,
  RingType,
  ChemCanvasState,
} from '../../types/chemCanvas';
import { Button } from '../common/Button';
import {
  Trash2,
  RotateCcw,
  Download,
  Sparkles,
  MousePointer,
  Check,
} from 'lucide-react';

interface ChemCanvas2DProps {
  initialState?: ChemCanvasState;
  onChange?: (state: ChemCanvasState) => void;
  readOnly?: boolean;
  height?: number;
}

export const ChemCanvas2D: React.FC<ChemCanvas2DProps> = ({
  initialState,
  onChange,
  readOnly = false,
  height = 420,
}) => {
  // Preload default benzene with substituent if none provided
  const [atoms, setAtoms] = useState<CanvasAtom[]>(
    initialState?.atoms || [
      { id: 'a1', element: 'C', x: 260, y: 140, charge: '0' },
      { id: 'a2', element: 'C', x: 320, y: 175, charge: '0' },
      { id: 'a3', element: 'C', x: 320, y: 245, charge: '0' },
      { id: 'a4', element: 'C', x: 260, y: 280, charge: '0' },
      { id: 'a5', element: 'C', x: 200, y: 245, charge: '0' },
      { id: 'a6', element: 'C', x: 200, y: 175, charge: '0' },
      { id: 'a7', element: 'O', x: 260, y: 70, charge: '0' },
      { id: 'a8', element: 'H', x: 310, y: 40, charge: '0' },
    ]
  );

  const [bonds, setBonds] = useState<CanvasBond[]>(
    initialState?.bonds || [
      { id: 'b1', sourceAtomId: 'a1', targetAtomId: 'a2', type: 'double' },
      { id: 'b2', sourceAtomId: 'a2', targetAtomId: 'a3', type: 'single' },
      { id: 'b3', sourceAtomId: 'a3', targetAtomId: 'a4', type: 'double' },
      { id: 'b4', sourceAtomId: 'a4', targetAtomId: 'a5', type: 'single' },
      { id: 'b5', sourceAtomId: 'a5', targetAtomId: 'a6', type: 'double' },
      { id: 'b6', sourceAtomId: 'a6', targetAtomId: 'a1', type: 'single' },
      { id: 'b7', sourceAtomId: 'a1', targetAtomId: 'a7', type: 'single' },
      { id: 'b8', sourceAtomId: 'a7', targetAtomId: 'a8', type: 'single' },
    ]
  );

  const [arrows, setArrows] = useState<CurvedArrow[]>(
    initialState?.arrows || [
      {
        id: 'arr1',
        startX: 265,
        startY: 65,
        controlX: 350,
        controlY: 50,
        endX: 380,
        endY: 100,
        type: 'electron_pair',
        label: ':B⁻ proton transfer',
      },
    ]
  );

  const [activeTool, setActiveTool] = useState<
    'select' | 'bond' | 'atom' | 'ring' | 'arrow' | 'charge' | 'delete'
  >('bond');
  const [selectedElement, setSelectedElement] = useState<HeteroAtom>('C');
  const [selectedBondType, setSelectedBondType] = useState<BondType>('single');
  const [selectedRing, setSelectedRing] = useState<RingType>('benzene');
  const [selectedCharge, setSelectedCharge] = useState<FormalCharge>('+1');
  const [selectedAtomId, setSelectedAtomId] = useState<string | null>(null);
  const [arrowDraftStart, setArrowDraftStart] = useState<{ x: number; y: number } | null>(null);

  const [history, setHistory] = useState<{ atoms: CanvasAtom[]; bonds: CanvasBond[]; arrows: CurvedArrow[] }[]>([]);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({ atoms, bonds, arrows });
    }
  }, [atoms, bonds, arrows, onChange]);

  const saveHistory = () => {
    setHistory((prev) => [...prev.slice(-10), { atoms, bonds, arrows }]);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setAtoms(last.atoms);
    setBonds(last.bonds);
    setArrows(last.arrows);
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (confirm('Clear entire chemical drawing canvas?')) {
      saveHistory();
      setAtoms([]);
      setBonds([]);
      setArrows([]);
      setSelectedAtomId(null);
    }
  };

  // Canvas Click Handler
  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly) return;
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);

    if (activeTool === 'atom') {
      saveHistory();
      const newAtom: CanvasAtom = {
        id: `a-${Date.now()}`,
        element: selectedElement,
        x,
        y,
        charge: '0',
      };
      setAtoms((prev) => [...prev, newAtom]);
    } else if (activeTool === 'ring') {
      saveHistory();
      placeRingTemplate(x, y, selectedRing);
    } else if (activeTool === 'arrow') {
      if (!arrowDraftStart) {
        setArrowDraftStart({ x, y });
      } else {
        saveHistory();
        const newArrow: CurvedArrow = {
          id: `arr-${Date.now()}`,
          startX: arrowDraftStart.x,
          startY: arrowDraftStart.y,
          controlX: (arrowDraftStart.x + x) / 2 + 30,
          controlY: (arrowDraftStart.y + y) / 2 - 40,
          endX: x,
          endY: y,
          type: 'electron_pair',
        };
        setArrows((prev) => [...prev, newArrow]);
        setArrowDraftStart(null);
      }
    }
  };

  // Atom Click Handler
  const handleAtomClick = (e: React.MouseEvent, atom: CanvasAtom) => {
    e.stopPropagation();
    if (readOnly) return;

    if (activeTool === 'delete') {
      saveHistory();
      setAtoms((prev) => prev.filter((a) => a.id !== atom.id));
      setBonds((prev) => prev.filter((b) => b.sourceAtomId !== atom.id && b.targetAtomId !== atom.id));
      return;
    }

    if (activeTool === 'charge') {
      saveHistory();
      setAtoms((prev) =>
        prev.map((a) => (a.id === atom.id ? { ...a, charge: selectedCharge } : a))
      );
      return;
    }

    if (activeTool === 'atom') {
      saveHistory();
      setAtoms((prev) =>
        prev.map((a) => (a.id === atom.id ? { ...a, element: selectedElement } : a))
      );
      return;
    }

    if (activeTool === 'bond') {
      if (!selectedAtomId) {
        setSelectedAtomId(atom.id);
      } else if (selectedAtomId === atom.id) {
        setSelectedAtomId(null);
      } else {
        saveHistory();
        // Check if bond already exists between the two atoms
        const existingBond = bonds.find(
          (b) =>
            (b.sourceAtomId === selectedAtomId && b.targetAtomId === atom.id) ||
            (b.sourceAtomId === atom.id && b.targetAtomId === selectedAtomId)
        );

        if (existingBond) {
          // Cycle bond type
          const nextType: BondType =
            existingBond.type === 'single'
              ? 'double'
              : existingBond.type === 'double'
              ? 'triple'
              : existingBond.type === 'triple'
              ? 'wedge'
              : existingBond.type === 'wedge'
              ? 'dash'
              : 'single';

          setBonds((prev) =>
            prev.map((b) => (b.id === existingBond.id ? { ...b, type: nextType } : b))
          );
        } else {
          const newBond: CanvasBond = {
            id: `b-${Date.now()}`,
            sourceAtomId: selectedAtomId,
            targetAtomId: atom.id,
            type: selectedBondType,
          };
          setBonds((prev) => [...prev, newBond]);
        }
        setSelectedAtomId(null);
      }
    }
  };

  // Predefined Ring Template Placer
  const placeRingTemplate = (cx: number, cy: number, ring: RingType) => {
    const numPoints = ring === 'cyclopentane' ? 5 : ring === 'cyclopropane' ? 3 : 6;
    const radius = 50;
    const newAtoms: CanvasAtom[] = [];
    const newBonds: CanvasBond[] = [];

    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = Math.round(cx + radius * Math.cos(angle));
      const y = Math.round(cy + radius * Math.sin(angle));
      const atomId = `a-ring-${Date.now()}-${i}`;
      newAtoms.push({ id: atomId, element: 'C', x, y, charge: '0' });
    }

    for (let i = 0; i < numPoints; i++) {
      const source = newAtoms[i].id;
      const target = newAtoms[(i + 1) % numPoints].id;
      const isDouble = ring === 'benzene' && i % 2 === 0;
      newBonds.push({
        id: `b-ring-${Date.now()}-${i}`,
        sourceAtomId: source,
        targetAtomId: target,
        type: isDouble ? 'double' : 'single',
      });
    }

    setAtoms((prev) => [...prev, ...newAtoms]);
    setBonds((prev) => [...prev, ...newBonds]);
  };

  // Color Mapping for Heteroatoms
  const getAtomColor = (elem: HeteroAtom) => {
    switch (elem) {
      case 'O':
        return '#ef4444'; // Red
      case 'N':
        return '#3b82f6'; // Blue
      case 'Cl':
      case 'F':
        return '#10b981'; // Green
      case 'Br':
        return '#b45309'; // Brown
      case 'I':
        return '#8b5cf6'; // Purple
      case 'S':
        return '#eab308'; // Yellow
      case 'P':
        return '#f97316'; // Orange
      case 'H':
        return '#94a3b8'; // Light slate
      case 'C':
      default:
        return '#38bdf8'; // Cyan
    }
  };

  // Calculate estimated chemical formula
  const getFormula = () => {
    const counts: Record<string, number> = {};
    atoms.forEach((a) => {
      counts[a.element] = (counts[a.element] || 0) + 1;
    });

    let str = '';
    if (counts['C']) str += `C${counts['C'] > 1 ? counts['C'] : ''}`;
    if (counts['H']) str += `H${counts['H'] > 1 ? counts['H'] : ''}`;
    Object.keys(counts)
      .filter((k) => k !== 'C' && k !== 'H')
      .sort()
      .forEach((k) => {
        str += `${k}${counts[k] > 1 ? counts[k] : ''}`;
      });

    return str || 'Empty Canvas';
  };

  return (
    <div className="rounded-2xl bg-surface-100 border border-slate-800 overflow-hidden flex flex-col shadow-2xl">
      {/* Top Toolbar */}
      {!readOnly && (
        <div className="bg-surface-200/90 border-b border-slate-800 p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Main Action Tools */}
          <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => {
                setActiveTool('select');
                setSelectedAtomId(null);
              }}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTool === 'select'
                  ? 'bg-chem-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Select & Move"
            >
              <MousePointer className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => {
                setActiveTool('bond');
                setSelectedAtomId(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                activeTool === 'bond'
                  ? 'bg-chem-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bond Tool
            </button>

            <button
              onClick={() => {
                setActiveTool('ring');
                setSelectedAtomId(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                activeTool === 'ring'
                  ? 'bg-chem-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Ring
            </button>

            <button
              onClick={() => {
                setActiveTool('arrow');
                setSelectedAtomId(null);
                setArrowDraftStart(null);
              }}
              className={`px-2.5 py-1.5 rounded-lg transition-colors font-medium ${
                activeTool === 'arrow'
                  ? 'bg-chem-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Draw Curly Reaction Arrow"
            >
              Mechanism ↷
            </button>

            <button
              onClick={() => {
                setActiveTool('charge');
                setSelectedAtomId(null);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                activeTool === 'charge'
                  ? 'bg-chem-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Formal Charge / Radical"
            >
              ± Charge
            </button>

            <button
              onClick={() => {
                setActiveTool('delete');
                setSelectedAtomId(null);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                activeTool === 'delete'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-400 hover:text-rose-400'
              }`}
              title="Delete element"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Sub-palette depending on active tool */}
          <div className="flex items-center gap-1.5">
            {activeTool === 'bond' && (
              <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-slate-700/60 font-mono text-[11px]">
                {(['single', 'double', 'triple', 'wedge', 'dash'] as BondType[]).map((bt) => (
                  <button
                    key={bt}
                    onClick={() => setSelectedBondType(bt)}
                    className={`px-2 py-1 rounded-lg capitalize ${
                      selectedBondType === bt
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {bt}
                  </button>
                ))}
              </div>
            )}

            {activeTool === 'ring' && (
              <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-slate-700/60 text-[11px]">
                {(['benzene', 'cyclohexane', 'cyclopentane', 'cyclopropane'] as RingType[]).map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setSelectedRing(rt)}
                    className={`px-2 py-1 rounded-lg capitalize ${
                      selectedRing === rt
                        ? 'bg-chem-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {rt}
                  </button>
                ))}
              </div>
            )}

            {activeTool === 'charge' && (
              <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-slate-700/60 font-mono text-[11px]">
                {(['+1', '-1', 'radical', 'lone_pair'] as FormalCharge[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setSelectedCharge(ch)}
                    className={`px-2 py-1 rounded-lg ${
                      selectedCharge === ch
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ch === '+1' ? '⊕ +1' : ch === '-1' ? '⊖ -1' : ch === 'radical' ? '• Rad' : ': Pairs'}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Heteroatom Switcher */}
            <div className="flex items-center gap-1 bg-surface-100 p-1 rounded-xl border border-slate-700/60 font-mono font-bold">
              {(['C', 'O', 'N', 'F', 'Cl', 'Br', 'I', 'S', 'H'] as HeteroAtom[]).map((elem) => (
                <button
                  key={elem}
                  onClick={() => {
                    setActiveTool('atom');
                    setSelectedElement(elem);
                  }}
                  className={`w-6 h-6 rounded-lg text-xs flex items-center justify-center transition-all ${
                    selectedElement === elem && activeTool === 'atom'
                      ? 'bg-chem-400 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  style={{
                    color:
                      selectedElement === elem && activeTool === 'atom' ? '#020617' : getAtomColor(elem),
                  }}
                >
                  {elem}
                </button>
              ))}
            </div>

            {/* Undo & Clear */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                className="p-1.5 rounded-lg bg-surface-100 text-slate-400 hover:text-white border border-slate-700/60"
                title="Undo"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 rounded-lg bg-surface-100 text-slate-400 hover:text-rose-400 border border-slate-700/60"
                title="Clear All"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SVG Canvas Stage */}
      <div className="relative bg-slate-950 flex-1 overflow-hidden" style={{ height }}>
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair select-none"
          onClick={handleCanvasClick}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <path d="M0,0 L0,6 L9,3 z" fill="#f43f5e" />
            </marker>
          </defs>

          {/* 1. Render Bonds */}
          {bonds.map((bond) => {
            const src = atoms.find((a) => a.id === bond.sourceAtomId);
            const tgt = atoms.find((a) => a.id === bond.targetAtomId);
            if (!src || !tgt) return null;

            const dx = tgt.x - src.x;
            const dy = tgt.y - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const perpX = (-dy / dist) * 4;
            const perpY = (dx / dist) * 4;

            if (bond.type === 'double') {
              return (
                <g key={bond.id}>
                  <line
                    x1={src.x + perpX}
                    y1={src.y + perpY}
                    x2={tgt.x + perpX}
                    y2={tgt.y + perpY}
                    stroke="#cbd5e1"
                    strokeWidth="2.5"
                  />
                  <line
                    x1={src.x - perpX}
                    y1={src.y - perpY}
                    x2={tgt.x - perpX}
                    y2={tgt.y - perpY}
                    stroke="#cbd5e1"
                    strokeWidth="2.5"
                  />
                </g>
              );
            }

            if (bond.type === 'triple') {
              return (
                <g key={bond.id}>
                  <line x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y} stroke="#cbd5e1" strokeWidth="2.5" />
                  <line
                    x1={src.x + perpX * 1.6}
                    y1={src.y + perpY * 1.6}
                    x2={tgt.x + perpX * 1.6}
                    y2={tgt.y + perpY * 1.6}
                    stroke="#cbd5e1"
                    strokeWidth="2"
                  />
                  <line
                    x1={src.x - perpX * 1.6}
                    y1={src.y - perpY * 1.6}
                    x2={tgt.x - perpX * 1.6}
                    y2={tgt.y - perpY * 1.6}
                    stroke="#cbd5e1"
                    strokeWidth="2"
                  />
                </g>
              );
            }

            if (bond.type === 'dash') {
              return (
                <line
                  key={bond.id}
                  x1={src.x}
                  y1={src.y}
                  x2={tgt.x}
                  y2={tgt.y}
                  stroke="#cbd5e1"
                  strokeWidth="3"
                  strokeDasharray="4,4"
                />
              );
            }

            if (bond.type === 'wedge') {
              return (
                <polygon
                  key={bond.id}
                  points={`${src.x},${src.y} ${tgt.x + perpX * 2},${tgt.y + perpY * 2} ${tgt.x - perpX * 2},${tgt.y - perpY * 2}`}
                  fill="#cbd5e1"
                />
              );
            }

            // Single bond default
            return (
              <line
                key={bond.id}
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke="#cbd5e1"
                strokeWidth="2.5"
              />
            );
          })}

          {/* 2. Render Curved Reaction Mechanism Arrows */}
          {arrows.map((arr) => {
            const pathData = `M ${arr.startX} ${arr.startY} Q ${arr.controlX} ${arr.controlY} ${arr.endX} ${arr.endY}`;
            return (
              <g key={arr.id}>
                <path
                  d={pathData}
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="6,2"
                  markerEnd="url(#arrowhead)"
                />
                {arr.label && (
                  <text
                    x={arr.controlX}
                    y={arr.controlY - 8}
                    fill="#fda4af"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {arr.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* 3. Render Atoms & Heteroatoms */}
          {atoms.map((atom) => {
            const isSelected = selectedAtomId === atom.id;
            const isCarbonWithBonds = atom.element === 'C' && bonds.some((b) => b.sourceAtomId === atom.id || b.targetAtomId === atom.id);

            return (
              <g
                key={atom.id}
                className="cursor-pointer"
                onClick={(e) => handleAtomClick(e, atom)}
              >
                {/* Highlight ring if selected */}
                {isSelected && (
                  <circle
                    cx={atom.x}
                    cy={atom.y}
                    r="16"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="3,3"
                    className="animate-spin"
                  />
                )}

                {/* Background disc for heteroatoms to mask underlying bond lines */}
                {(!isCarbonWithBonds || atom.charge !== '0') && (
                  <circle cx={atom.x} cy={atom.y} r="12" fill="#020617" />
                )}

                {/* Element text if not carbon in a junction */}
                {(!isCarbonWithBonds || atom.element !== 'C') && (
                  <text
                    x={atom.x}
                    y={atom.y + 4.5}
                    fill={getAtomColor(atom.element)}
                    fontSize="13"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                  >
                    {atom.element}
                  </text>
                )}

                {/* Carbon junction vertex dot */}
                {isCarbonWithBonds && atom.element === 'C' && (
                  <circle cx={atom.x} cy={atom.y} r="3" fill="#64748b" />
                )}

                {/* Formal Charges */}
                {atom.charge === '+1' && (
                  <text
                    x={atom.x + 8}
                    y={atom.y - 8}
                    fill="#38bdf8"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    ⊕
                  </text>
                )}
                {atom.charge === '-1' && (
                  <text
                    x={atom.x + 8}
                    y={atom.y - 8}
                    fill="#ef4444"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    ⊖
                  </text>
                )}
                {atom.charge === 'radical' && (
                  <circle cx={atom.x + 8} cy={atom.y - 8} r="2.5" fill="#f59e0b" />
                )}
                {atom.charge === 'lone_pair' && (
                  <g>
                    <circle cx={atom.x + 6} cy={atom.y - 8} r="1.5" fill="#a855f7" />
                    <circle cx={atom.x + 10} cy={atom.y - 8} r="1.5" fill="#a855f7" />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Bottom Metadata Info Card */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="px-3 py-1 rounded-xl bg-slate-900/90 backdrop-blur border border-slate-800 text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-chem-400" />
            <span>Formula: <strong>{getFormula()}</strong></span>
            <span className="text-slate-600">•</span>
            <span>{atoms.length} Atoms, {bonds.length} Bonds</span>
          </div>

          <div className="pointer-events-auto">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs"
              leftIcon={copiedSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              onClick={() => {
                setCopiedSuccess(true);
                setTimeout(() => setCopiedSuccess(false), 1500);
              }}
            >
              {copiedSuccess ? 'Structure Exported!' : 'Export SMILES'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
