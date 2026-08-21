import React, { useState, useRef, useEffect } from 'react';
import { MolecularModel, MolecularRenderMode } from '../../types/molecule';
import { ZoomIn, ZoomOut, Play, Pause } from 'lucide-react';

interface MoleculeViewer3DProps {
  model: MolecularModel;
  height?: number;
  interactive?: boolean;
  initialRenderMode?: MolecularRenderMode;
}

export const MoleculeViewer3D: React.FC<MoleculeViewer3DProps> = ({
  model,
  height = 360,
  interactive = true,
  initialRenderMode = 'ball-and-stick',
}) => {
  const [rotX, setRotX] = useState(0.4);
  const [rotY, setRotY] = useState(0.6);
  const [zoom, setZoom] = useState(65);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [renderMode, setRenderMode] = useState<MolecularRenderMode>(initialRenderMode);
  const [hoveredAtom, setHoveredAtom] = useState<string | null>(null);

  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });

  // Auto-rotation loop
  useEffect(() => {
    if (!isAutoRotating) return;
    const interval = setInterval(() => {
      setRotY((prev) => prev + 0.015);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // Mouse drag listeners
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
    setIsAutoRotating(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !interactive) return;
    const dx = e.clientX - prevMousePos.current.x;
    const dy = e.clientY - prevMousePos.current.y;
    setRotY((prev) => prev + dx * 0.01);
    setRotX((prev) => prev + dy * 0.01);
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  // 3D Matrix Projection
  const projectAtom = (x: number, y: number, z: number) => {
    // Rotation around Y (yaw)
    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const x1 = x * cosY + z * sinY;
    const z1 = -x * sinY + z * cosY;

    // Rotation around X (pitch)
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);
    const y2 = y * cosX - z1 * sinX;
    const z2 = y * sinX + z1 * cosX;

    // Perspective projection onto 2D canvas
    const scale = zoom / (zoom * 0.05 + z2 + 8);
    const canvasCenterX = 200;
    const canvasCenterY = height / 2;

    return {
      screenX: canvasCenterX + x1 * scale * 25,
      screenY: canvasCenterY - y2 * scale * 25,
      depth: z2,
      scale,
    };
  };

  // Pre-calculate projected atoms and sort by depth for proper Z-ordering
  const projectedAtoms = model.atoms.map((atom) => {
    const proj = projectAtom(atom.x, atom.y, atom.z);
    return { ...atom, ...proj };
  }).sort((a, b) => a.depth - b.depth);

  const atomMap = new Map(projectedAtoms.map((a) => [a.id, a]));

  return (
    <div
      className="relative rounded-2xl bg-surface-200/90 border border-slate-700/80 overflow-hidden select-none group"
      style={{ height }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* SVG Canvas for 3D Bonds and Atoms */}
      <svg className="w-full h-full cursor-grab active:cursor-grabbing" viewBox={`0 0 400 ${height}`}>
        <defs>
          <radialGradient id="atom-glow" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#888888" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* 1. Draw Bonds */}
        {renderMode !== 'space-filling' &&
          model.bonds.map((bond, idx) => {
            const a1 = atomMap.get(bond.atom1);
            const a2 = atomMap.get(bond.atom2);
            if (!a1 || !a2) return null;

            const strokeWidth = renderMode === 'wireframe' ? 2 : bond.order === 2 ? 6 : 4;
            const strokeColor = '#64748B';

            return (
              <g key={`bond-${idx}`}>
                <line
                  x1={a1.screenX}
                  y1={a1.screenY}
                  x2={a2.screenX}
                  y2={a2.screenY}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity="0.8"
                />
                {bond.order === 2 && (
                  <line
                    x1={a1.screenX + 3}
                    y1={a1.screenY + 3}
                    x2={a2.screenX + 3}
                    y2={a2.screenY + 3}
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                )}
              </g>
            );
          })}

        {/* 2. Draw Atoms */}
        {projectedAtoms.map((atom) => {
          const radiusMultiplier = renderMode === 'space-filling' ? 38 : renderMode === 'wireframe' ? 12 : 24;
          const atomRadius = Math.max(6, atom.radius * radiusMultiplier * atom.scale);
          const isHovered = hoveredAtom === atom.id;

          return (
            <g
              key={atom.id}
              onMouseEnter={() => setHoveredAtom(atom.id)}
              onMouseLeave={() => setHoveredAtom(null)}
              className="transition-transform duration-75 cursor-pointer"
            >
              {/* Atom Sphere Base */}
              <circle
                cx={atom.screenX}
                cy={atom.screenY}
                r={atomRadius}
                fill={atom.color}
                stroke={isHovered ? '#38BDF8' : '#0F172A'}
                strokeWidth={isHovered ? 2 : 1}
              />

              {/* Shading Overlay for 3D Volume */}
              <circle
                cx={atom.screenX}
                cy={atom.screenY}
                r={atomRadius}
                fill="url(#atom-glow)"
                opacity="0.6"
              />

              {/* Element Label */}
              <text
                x={atom.screenX}
                y={atom.screenY + 3}
                textAnchor="middle"
                fontSize={Math.max(8, atomRadius * 0.75)}
                fontWeight="bold"
                fill="#FFFFFF"
                pointerEvents="none"
                fontFamily="monospace"
              >
                {atom.element}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Info Overlay (Formula & Name) */}
      <div className="absolute top-3 left-3 p-2.5 rounded-xl bg-surface-100/90 backdrop-blur-md border border-slate-700/80 text-xs shadow-lg pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white">{model.name}</span>
          <span className="font-mono text-chem-300 bg-chem-500/10 px-1.5 py-0.5 rounded border border-chem-500/20 text-[10px]">
            {model.formula}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 block">{model.iupacName}</span>
      </div>

      {/* Floating Controls Bar */}
      {interactive && (
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 p-1.5 rounded-xl bg-surface-100/90 backdrop-blur-md border border-slate-700/80 text-xs shadow-lg">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              isAutoRotating ? 'bg-chem-500/20 text-chem-300' : 'text-slate-400 hover:text-white'
            }`}
            title={isAutoRotating ? 'Pause Rotation' : 'Auto Rotate'}
          >
            {isAutoRotating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => setZoom((prev) => Math.min(110, prev + 10))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom((prev) => Math.max(35, prev - 10))}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={() =>
              setRenderMode(
                renderMode === 'ball-and-stick'
                  ? 'space-filling'
                  : renderMode === 'space-filling'
                  ? 'wireframe'
                  : 'ball-and-stick'
              )
            }
            className="px-2 py-1 rounded-lg text-[10px] font-mono bg-surface-200 text-slate-300 hover:text-white border border-slate-700 capitalize"
            title="Toggle Render Mode"
          >
            {renderMode.replace(/-/g, ' ')}
          </button>
        </div>
      )}
    </div>
  );
};
