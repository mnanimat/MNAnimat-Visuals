import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  Square,
  Circle as CircleIcon,
  Ruler,
  MousePointer,
  Download,
  Grid,
  Maximize,
  Sliders,
  Type,
  Trash2,
  Copy,
  Plus,
  Undo2,
  Redo2,
} from 'lucide-react';
import { UnitType, VectorShape } from '../../types';

export interface VectorStudioProps {
  onUndoStateChange?: (canUndo: boolean, canRedo: boolean, undoFn: () => void, redoFn: () => void) => void;
}

export const VectorStudio: React.FC<VectorStudioProps> = ({ onUndoStateChange }) => {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [unit, setUnit] = useState<UnitType>('mm');
  const [gridSnap, setGridSnap] = useState<boolean>(true);
  const [activeTool, setActiveTool] = useState<
    'select' | 'pen' | 'rect' | 'circle' | 'line' | 'dimension' | 'text'
  >('select');

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Conversion factors relative to px (assumed 96 DPI: 1 inch = 25.4 mm = 96 px)
  const pxPerUnit = {
    px: 1,
    mm: 3.7795275591,
    cm: 37.795275591,
    in: 96,
  };

  const pxToUnit = (px: number): number => {
    return parseFloat((px / pxPerUnit[unit]).toFixed(1));
  };

  const unitToPx = (val: number): number => {
    return val * pxPerUnit[unit];
  };

  // Initial Sample Shapes
  const initialShapes: VectorShape[] = [
    {
      id: 'shape_1',
      type: 'rect',
      x: 100,
      y: 100,
      width: 250,
      height: 150,
      fill: 'rgba(59, 130, 246, 0.15)',
      stroke: '#3b82f6',
      strokeWidth: 2,
      unit: 'mm',
      label: 'Caixa de Encaixe Técnico',
    },
    {
      id: 'shape_2',
      type: 'circle',
      x: 450,
      y: 180,
      width: 140,
      height: 140,
      fill: 'rgba(168, 85, 247, 0.15)',
      stroke: '#a855f7',
      strokeWidth: 2,
      unit: 'mm',
      label: 'Furo Cilíndrico Ø 37.0 mm',
    },
    {
      id: 'shape_3',
      type: 'dimension',
      x: 100,
      y: 80,
      width: 250,
      height: 20,
      fill: 'none',
      stroke: '#38bdf8',
      strokeWidth: 1.5,
      unit: 'mm',
      label: '66.1 mm',
    },
  ];

  const [shapes, setShapes] = useState<VectorShape[]>(initialShapes);
  const [history, setHistory] = useState<VectorShape[][]>([initialShapes]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = useCallback((newShapes: VectorShape[]) => {
    setHistory((prev) => {
      const sliced = prev.slice(0, historyIndex + 1);
      return [...sliced, newShapes];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      setShapes(history[prevIdx]);
      setHistoryIndex(prevIdx);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      setShapes(history[nextIdx]);
      setHistoryIndex(nextIdx);
    }
  }, [historyIndex, history]);

  useEffect(() => {
    if (onUndoStateChange) {
      onUndoStateChange(canUndo, canRedo, handleUndo, handleRedo);
    }
  }, [canUndo, canRedo, handleUndo, handleRedo, onUndoStateChange]);

  // Global Shortcuts for VectorStudio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (selectedShapeId) {
          const shapeToDup = shapes.find((s) => s.id === selectedShapeId);
          if (shapeToDup) {
            const dup: VectorShape = {
              ...shapeToDup,
              id: `shape_${Date.now()}`,
              x: shapeToDup.x + 20,
              y: shapeToDup.y + 20,
              label: `${shapeToDup.label || 'Objeto'} (Cópia)`,
            };
            setShapes((prev) => [...prev, dup]);
            setSelectedShapeId(dup.id);
            pushHistory([...shapes, dup]);
          }
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedShapeId) {
          e.preventDefault();
          const nextShapes = shapes.filter((s) => s.id !== selectedShapeId);
          setShapes(nextShapes);
          setSelectedShapeId(null);
          pushHistory(nextShapes);
        }
      } else if (e.key.toLowerCase() === 'v') {
        setActiveTool('select');
      } else if (e.key.toLowerCase() === 'p') {
        setActiveTool('pen');
      } else if (e.key.toLowerCase() === 'r') {
        setActiveTool('rect');
      } else if (e.key.toLowerCase() === 'c') {
        setActiveTool('circle');
      } else if (e.key.toLowerCase() === 'm') {
        setActiveTool('dimension');
      } else if (e.key.toLowerCase() === 't') {
        setActiveTool('text');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedShapeId, shapes, pushHistory]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

  // Handle drawing interaction
  const handleSVGMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeTool === 'select') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (gridSnap) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing || !startPos) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (gridSnap) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }

    setCurrentPos({ x, y });
  };

  const handleSVGMouseUp = () => {
    if (!isDrawing || !startPos || !currentPos) return;
    setIsDrawing(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.max(20, Math.abs(currentPos.x - startPos.x));
    const height = Math.max(20, Math.abs(currentPos.y - startPos.y));

    const newShape: VectorShape = {
      id: `shape_${Date.now()}`,
      type: activeTool === 'dimension' ? 'dimension' : activeTool === 'circle' ? 'circle' : 'rect',
      x,
      y,
      width,
      height,
      fill: activeTool === 'dimension' ? 'none' : 'rgba(59, 130, 246, 0.2)',
      stroke: activeTool === 'dimension' ? '#38bdf8' : '#3b82f6',
      strokeWidth: 2,
      unit,
      label: activeTool === 'dimension' ? `${pxToUnit(width)} ${unit}` : 'Novo Elemento Vetorial',
    };

    setShapes((prev) => [...prev, newShape]);
    setSelectedShapeId(newShape.id);
    setActiveTool('select');
  };

  const activeShape = shapes.find((s) => s.id === selectedShapeId);

  const updateSelectedShape = (field: keyof VectorShape, val: any) => {
    if (!selectedShapeId) return;
    setShapes((prev) =>
      prev.map((s) => (s.id === selectedShapeId ? { ...s, [field]: val } : s))
    );
  };

  const deleteSelectedShape = () => {
    if (!selectedShapeId) return;
    setShapes((prev) => prev.filter((s) => s.id !== selectedShapeId));
    setSelectedShapeId(null);
  };

  const exportSVG = () => {
    if (!canvasRef.current) return;
    const svgData = new XMLSerializer().serializeToString(canvasRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Aether_Vetor_Precisao_${Date.now()}.svg`;
    link.click();
  };

  return (
    <div className="flex-1 flex bg-[#0a0a0a] overflow-hidden text-gray-300 select-none">
      {/* Tool Selection Sidebar */}
      <aside className="w-12 bg-[#161616] border-r border-white/10 flex flex-col items-center py-4 gap-3 shrink-0">
        <button
          onClick={() => setActiveTool('select')}
          title="Seleção & Edição de Nós (V)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            activeTool === 'select'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool('pen')}
          title="Caneta Bézier (P)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            activeTool === 'pen'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <PenTool className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool('rect')}
          title="Retângulo de Medida Exata (R)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            activeTool === 'rect'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool('circle')}
          title="Círculo / Elipse (C)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            activeTool === 'circle'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <CircleIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => setActiveTool('dimension')}
          title="Cota de Medida Técnica (M)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            activeTool === 'dimension'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Ruler className="w-4 h-4" />
        </button>

        <div className="w-8 h-[1px] bg-white/10 my-1" />

        <button
          onClick={() => setGridSnap(!gridSnap)}
          title="Ativar/Desativar Magnetismo de Grade (Snap)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            gridSnap
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Grid className="w-4 h-4" />
        </button>

        <div className="w-8 h-[1px] bg-white/10 my-1" />

        <button
          onClick={handleUndo}
          disabled={!canUndo}
          title="Desfazer Ação (Ctrl + Z)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            canUndo
              ? 'text-slate-200 hover:bg-white/10 hover:text-white'
              : 'text-slate-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleRedo}
          disabled={!canRedo}
          title="Refazer Ação (Ctrl + Y)"
          className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
            canRedo
              ? 'text-slate-200 hover:bg-white/10 hover:text-white'
              : 'text-slate-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </aside>

      {/* Main Canvas with Precision Rulers */}
      <div className="flex-1 bg-slate-950 relative flex flex-col overflow-hidden">
        {/* Top Control Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold">Unidade de Medida:</span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                {(['mm', 'cm', 'px', 'in'] as UnitType[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-2.5 py-1 rounded text-xs font-bold uppercase transition-colors ${
                      unit === u
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-4 w-[1px] bg-slate-800" />

            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <Grid className="w-4 h-4 text-emerald-400" />
              <span>Grade de Precisão: 20px / 5.3mm</span>
            </div>
          </div>

          <button
            onClick={exportSVG}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar SVG Técnico</span>
          </button>
        </div>

        {/* Vector Drawing Canvas */}
        <div className="flex-1 relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] overflow-auto flex items-center justify-center p-8">
          <svg
            ref={canvasRef}
            width={1000}
            height={650}
            onMouseDown={handleSVGMouseDown}
            onMouseMove={handleSVGMouseMove}
            onMouseUp={handleSVGMouseUp}
            className="bg-slate-900/90 border border-slate-800 rounded-xl shadow-2xl cursor-crosshair overflow-visible"
          >
            {/* Grid Pattern */}
            <defs>
              <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="1000" height="650" fill="url(#gridPattern)" />

            {/* Existing Shapes */}
            {shapes.map((shape) => {
              const isSelected = shape.id === selectedShapeId;

              if (shape.type === 'rect') {
                return (
                  <g key={shape.id} onClick={() => setSelectedShapeId(shape.id)}>
                    <rect
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      rx={4}
                      className="cursor-pointer hover:stroke-cyan-400 transition-colors"
                    />
                    {isSelected && (
                      <rect
                        x={shape.x - 3}
                        y={shape.y - 3}
                        width={shape.width + 6}
                        height={shape.height + 6}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    )}
                    {shape.label && (
                      <text
                        x={shape.x + shape.width / 2}
                        y={shape.y + shape.height / 2}
                        fill="#cbd5e1"
                        fontSize="11"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="pointer-events-none font-mono"
                      >
                        {shape.label}
                      </text>
                    )}
                  </g>
                );
              }

              if (shape.type === 'circle') {
                const rx = shape.width / 2;
                const ry = shape.height / 2;
                return (
                  <g key={shape.id} onClick={() => setSelectedShapeId(shape.id)}>
                    <ellipse
                      cx={shape.x + rx}
                      cy={shape.y + ry}
                      rx={rx}
                      ry={ry}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      className="cursor-pointer hover:stroke-cyan-400 transition-colors"
                    />
                    {isSelected && (
                      <rect
                        x={shape.x - 3}
                        y={shape.y - 3}
                        width={shape.width + 6}
                        height={shape.height + 6}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                      />
                    )}
                  </g>
                );
              }

              if (shape.type === 'dimension') {
                return (
                  <g key={shape.id} onClick={() => setSelectedShapeId(shape.id)}>
                    {/* Dimension Arrow Line */}
                    <line
                      x1={shape.x}
                      y1={shape.y + 10}
                      x2={shape.x + shape.width}
                      y2={shape.y + 10}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                    />
                    <line
                      x1={shape.x}
                      y1={shape.y}
                      x2={shape.x}
                      y2={shape.y + 20}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                    />
                    <line
                      x1={shape.x + shape.width}
                      y1={shape.y}
                      x2={shape.x + shape.width}
                      y2={shape.y + 20}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                    />
                    <text
                      x={shape.x + shape.width / 2}
                      y={shape.y + 6}
                      fill="#38bdf8"
                      fontSize="10"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      {shape.label || `${pxToUnit(shape.width)} ${unit}`}
                    </text>
                  </g>
                );
              }

              return null;
            })}

            {/* Drawing Preview */}
            {isDrawing && startPos && currentPos && (
              <rect
                x={Math.min(startPos.x, currentPos.x)}
                y={Math.min(startPos.y, currentPos.y)}
                width={Math.abs(currentPos.x - startPos.x)}
                height={Math.abs(currentPos.y - startPos.y)}
                fill="rgba(56, 189, 248, 0.15)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
            )}
          </svg>
        </div>
      </div>

      {/* Right Sidebar: Exact Measurement Inspector */}
      <div className="w-72 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Inspetor de Medidas Exatas
          </h3>

          {activeShape ? (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-slate-400 font-medium">Rótulo do Elemento:</span>
                <input
                  type="text"
                  value={activeShape.label || ''}
                  onChange={(e) => updateSelectedShape('label', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
                />
              </div>

              {/* Position X, Y */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    Posição X ({unit})
                  </span>
                  <input
                    type="number"
                    value={pxToUnit(activeShape.x)}
                    onChange={(e) =>
                      updateSelectedShape('x', unitToPx(Number(e.target.value)))
                    }
                    className="w-full bg-transparent font-mono text-cyan-300 font-bold text-sm focus:outline-none"
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    Posição Y ({unit})
                  </span>
                  <input
                    type="number"
                    value={pxToUnit(activeShape.y)}
                    onChange={(e) =>
                      updateSelectedShape('y', unitToPx(Number(e.target.value)))
                    }
                    className="w-full bg-transparent font-mono text-cyan-300 font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Width, Height */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    Largura W ({unit})
                  </span>
                  <input
                    type="number"
                    value={pxToUnit(activeShape.width)}
                    onChange={(e) =>
                      updateSelectedShape('width', unitToPx(Number(e.target.value)))
                    }
                    className="w-full bg-transparent font-mono text-emerald-400 font-bold text-sm focus:outline-none"
                  />
                </div>

                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">
                    Altura H ({unit})
                  </span>
                  <input
                    type="number"
                    value={pxToUnit(activeShape.height)}
                    onChange={(e) =>
                      updateSelectedShape('height', unitToPx(Number(e.target.value)))
                    }
                    className="w-full bg-transparent font-mono text-emerald-400 font-bold text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Stroke & Fill */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Cor de Borda (Stroke):</span>
                  <input
                    type="color"
                    value={activeShape.stroke}
                    onChange={(e) => updateSelectedShape('stroke', e.target.value)}
                    className="w-6 h-6 rounded bg-transparent cursor-pointer border-0 p-0"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Espessura do Traço:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={activeShape.strokeWidth}
                    onChange={(e) =>
                      updateSelectedShape('strokeWidth', Number(e.target.value))
                    }
                    className="w-16 px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-right font-mono text-slate-200"
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              Selecione uma forma no canvas para editar suas dimensões exatas.
            </p>
          )}
        </div>

        {activeShape && (
          <button
            onClick={deleteSelectedShape}
            className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir Forma</span>
          </button>
        )}
      </div>
    </div>
  );
};
