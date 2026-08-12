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
    'select' | 'pen' | 'rect' | 'circle' | 'line' | 'dimension' | 'text' | 'star' | 'polygon'
  >('select');

  const [selectedShapeId, setSelectedShapeId] = useState<string | null>(null);

  // Connected Pen Points Path state
  const [penPoints, setPenPoints] = useState<{
    x: number;
    y: number;
    curveType?: 'linear' | 'bezier';
    cp1x?: number;
    cp1y?: number;
  }[]>([]);
  
  const [draggingPenPointIndex, setDraggingPenPointIndex] = useState<number | null>(null);
  const [isDraggingHandle, setIsDraggingHandle] = useState<boolean>(false);

  const [activeFill, setActiveFill] = useState<string>('rgba(99, 102, 241, 0.25)');
  const [activeStroke, setActiveStroke] = useState<string>('#6366f1');

  // Node editing state
  const [draggedNode, setDraggedNode] = useState<{
    shapeId: string;
    nodeIndex: number;
    type: 'anchor' | 'cp1';
  } | null>(null);

  // Shape dragging state
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null);
  const [lastDragPos, setLastDragPos] = useState<{ x: number; y: number } | null>(null);

  // Selected node index inside pen shapes for inspector editing
  const [selectedNodeIndex, setSelectedNodeIndex] = useState<number | null>(null);

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

  // Presets for Logos, Cartoons, and Realistic Vector Art
  const handleLoadVectorPreset = (presetType: 'logo' | 'cartoon' | 'realistic') => {
    let presetShapes: VectorShape[] = [];

    if (presetType === 'logo') {
      presetShapes = [
        {
          id: 'logo_bg',
          type: 'rect',
          x: 100,
          y: 80,
          width: 320,
          height: 320,
          fill: '#0f172a',
          stroke: '#38bdf8',
          strokeWidth: 4,
          unit: 'mm',
          label: 'Fundo Logo Tech',
        },
        {
          id: 'logo_symbol',
          type: 'circle',
          x: 260,
          y: 240,
          width: 180,
          height: 180,
          fill: 'url(#gradientLogo)',
          stroke: '#818cf8',
          strokeWidth: 6,
          unit: 'mm',
          label: 'Símbolo do Logo',
        },
        {
          id: 'logo_text',
          type: 'text',
          x: 150,
          y: 360,
          width: 220,
          height: 40,
          fill: '#ffffff',
          stroke: 'none',
          strokeWidth: 1,
          unit: 'mm',
          label: 'MNAnimat LOGO',
        },
      ];
    } else if (presetType === 'cartoon') {
      presetShapes = [
        {
          id: 'cartoon_head',
          type: 'circle',
          x: 250,
          y: 200,
          width: 220,
          height: 220,
          fill: '#fde047',
          stroke: '#000000',
          strokeWidth: 8,
          unit: 'mm',
          label: 'Cabeça Cartoon',
        },
        {
          id: 'cartoon_eye_l',
          type: 'circle',
          x: 200,
          y: 180,
          width: 40,
          height: 40,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 4,
          unit: 'mm',
          label: 'Olho Esquerdo',
        },
        {
          id: 'cartoon_eye_r',
          type: 'circle',
          x: 300,
          y: 180,
          width: 40,
          height: 40,
          fill: '#ffffff',
          stroke: '#000000',
          strokeWidth: 4,
          unit: 'mm',
          label: 'Olho Direito',
        },
      ];
    } else if (presetType === 'realistic') {
      presetShapes = [
        {
          id: 'real_base',
          type: 'rect',
          x: 80,
          y: 80,
          width: 400,
          height: 300,
          fill: '#1e1b4b',
          stroke: '#6366f1',
          strokeWidth: 2,
          unit: 'mm',
          label: 'Degradê Gradiente Vetorial Realista',
        },
        {
          id: 'real_highlight',
          type: 'circle',
          x: 280,
          y: 200,
          width: 240,
          height: 240,
          fill: 'rgba(236, 72, 153, 0.4)',
          stroke: '#ec4899',
          strokeWidth: 1.5,
          unit: 'mm',
          label: 'Luz Volumétrica Vetorial',
        },
      ];
    }

    setShapes(presetShapes);
    pushHistory(presetShapes);
  };

  const defaultShapes: VectorShape[] = [
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
  ];

  const [shapes, setShapes] = useState<VectorShape[]>(defaultShapes);
  const [history, setHistory] = useState<VectorShape[][]>([defaultShapes]);
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

  const onUndoStateChangeRef = useRef(onUndoStateChange);
  useEffect(() => {
    onUndoStateChangeRef.current = onUndoStateChange;
  }, [onUndoStateChange]);

  useEffect(() => {
    if (onUndoStateChangeRef.current) {
      onUndoStateChangeRef.current(canUndo, canRedo, handleUndo, handleRedo);
    }
  }, [canUndo, canRedo, handleUndo, handleRedo]);

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
          const targetShape = shapes.find(s => s.id === selectedShapeId);
          if (targetShape && targetShape.type === 'pen' && selectedNodeIndex !== null && targetShape.points) {
            if (targetShape.points.length > 2) {
              const updatedPoints = targetShape.points.filter((_, idx) => idx !== selectedNodeIndex);
              setShapes((prev) =>
                prev.map((s) => (s.id === selectedShapeId ? { ...s, points: updatedPoints } : s))
              );
              setSelectedNodeIndex(null);
              pushHistory(shapes);
            }
          } else {
            const nextShapes = shapes.filter((s) => s.id !== selectedShapeId);
            setShapes(nextShapes);
            setSelectedShapeId(null);
            pushHistory(nextShapes);
          }
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedShapeId, shapes, pushHistory, selectedNodeIndex]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number } | null>(null);

  // Handle drawing & selection interaction
  const handleSVGMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (gridSnap) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }

    if (activeTool === 'select') {
      // Click on blank canvas space deselects
      setSelectedShapeId(null);
      setSelectedNodeIndex(null);
      return;
    }

    if (activeTool === 'pen') {
      // Add connected point
      const newPt = {
        x,
        y,
        curveType: 'linear' as const,
      };
      const newPts = [...penPoints, newPt];
      setPenPoints(newPts);
      
      // Setup dragging of the control handle for click-and-drag Bezier creation!
      setDraggingPenPointIndex(newPts.length - 1);
      setIsDraggingHandle(true);
      return;
    }

    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  };

  const handleFinishPenPath = (closed: boolean = true) => {
    if (penPoints.length < 2) {
      setPenPoints([]);
      return;
    }

    const xs = penPoints.map((p) => p.x);
    const ys = penPoints.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs);
    const maxY = Math.max(...ys);
    const width = Math.max(20, maxX - minX);
    const height = Math.max(20, maxY - minY);

    // Create proper points with curveType
    const pointsWithCurves = penPoints.map((pt) => {
      return {
        x: pt.x,
        y: pt.y,
        curveType: pt.curveType || 'linear',
        cp1x: pt.cp1x,
        cp1y: pt.cp1y
      };
    });

    const newShape: VectorShape = {
      id: `shape_${Date.now()}`,
      type: 'pen',
      x: minX,
      y: minY,
      width,
      height,
      fill: closed ? activeFill : 'none',
      stroke: activeStroke,
      strokeWidth: 2,
      points: pointsWithCurves,
      unit,
      label: `Curva Bézier (${penPoints.length} nós${closed ? ', Fechado' : ''})`,
    };

    setShapes((prev) => [...prev, newShape]);
    pushHistory([...shapes, newShape]);
    setSelectedShapeId(newShape.id);
    setPenPoints([]);
    setActiveTool('select');
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;

    if (gridSnap) {
      x = Math.round(x / 20) * 20;
      y = Math.round(y / 20) * 20;
    }

    // 1. DRAGGING PEN CONTROL POINT (DURING DRAWING)
    if (activeTool === 'pen' && isDraggingHandle && draggingPenPointIndex !== null) {
      setPenPoints((prev) => {
        const updated = [...prev];
        const pt = updated[draggingPenPointIndex];
        if (pt) {
          pt.curveType = 'bezier';
          pt.cp1x = x;
          pt.cp1y = y;
        }
        return updated;
      });
      return;
    }

    // 2. DRAGGING NODE / CONTROL POINT (IN SELECT MODE)
    if (activeTool === 'select' && draggedNode) {
      const { shapeId, nodeIndex, type } = draggedNode;
      setShapes((prev) =>
        prev.map((s) => {
          if (s.id === shapeId && s.points) {
            const updatedPoints = [...s.points];
            const targetPt = { ...updatedPoints[nodeIndex] };

            if (type === 'anchor') {
              const dx = x - targetPt.x;
              const dy = y - targetPt.y;
              targetPt.x = x;
              targetPt.y = y;
              // Shift control points relatively
              if (targetPt.cp1x !== undefined) targetPt.cp1x += dx;
              if (targetPt.cp1y !== undefined) targetPt.cp1y += dy;
            } else if (type === 'cp1') {
              targetPt.cp1x = x;
              targetPt.cp1y = y;
            }

            updatedPoints[nodeIndex] = targetPt;

            // Recompute bounds
            const xs = updatedPoints.map((p) => p.x);
            const ys = updatedPoints.map((p) => p.y);
            const minX = Math.min(...xs);
            const minY = Math.min(...ys);
            const maxX = Math.max(...xs);
            const maxY = Math.max(...ys);
            const width = Math.max(20, maxX - minX);
            const height = Math.max(20, maxY - minY);

            return {
              ...s,
              x: minX,
              y: minY,
              width,
              height,
              points: updatedPoints,
            };
          }
          return s;
        })
      );
      return;
    }

    // 3. DRAGGING SOLID SHAPE
    if (activeTool === 'select' && draggedShapeId && lastDragPos) {
      const dx = x - lastDragPos.x;
      const dy = y - lastDragPos.y;

      setShapes((prev) =>
        prev.map((s) => {
          if (s.id === draggedShapeId) {
            if (s.type === 'pen' && s.points) {
              const updatedPoints = s.points.map((pt) => ({
                ...pt,
                x: pt.x + dx,
                y: pt.y + dy,
                cp1x: pt.cp1x !== undefined ? pt.cp1x + dx : undefined,
                cp1y: pt.cp1y !== undefined ? pt.cp1y + dy : undefined,
              }));
              return {
                ...s,
                x: s.x + dx,
                y: s.y + dy,
                points: updatedPoints,
              };
            }
            return {
              ...s,
              x: s.x + dx,
              y: s.y + dy,
            };
          }
          return s;
        })
      );
      setLastDragPos({ x, y });
      return;
    }

    // 4. DRAWING PREVIEW FOR OTHER TOOLS
    if (isDrawing) {
      setCurrentPos({ x, y });
    }
  };

  const handleSVGMouseUp = () => {
    if (activeTool === 'pen') {
      setIsDraggingHandle(false);
      setDraggingPenPointIndex(null);
      return;
    }

    if (draggedNode) {
      pushHistory(shapes);
      setDraggedNode(null);
      return;
    }

    if (draggedShapeId) {
      pushHistory(shapes);
      setDraggedShapeId(null);
      setLastDragPos(null);
      return;
    }

    if (!isDrawing || !startPos || !currentPos) return;
    setIsDrawing(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.max(20, Math.abs(currentPos.x - startPos.x));
    const height = Math.max(20, Math.abs(currentPos.y - startPos.y));

    let shapeLabel = 'Novo Elemento Vetorial';
    if (activeTool === 'rect') shapeLabel = 'Retângulo Técnico';
    if (activeTool === 'circle') shapeLabel = 'Elipse Vetorial';
    if (activeTool === 'dimension') shapeLabel = `${pxToUnit(width)} ${unit}`;

    const newShape: VectorShape = {
      id: `shape_${Date.now()}`,
      type: activeTool === 'dimension' ? 'dimension' : activeTool === 'circle' ? 'circle' : 'rect',
      x,
      y,
      width,
      height,
      fill: activeTool === 'dimension' ? 'none' : activeFill,
      stroke: activeTool === 'dimension' ? '#38bdf8' : activeStroke,
      strokeWidth: 2,
      unit,
      label: shapeLabel,
    };

    setShapes((prev) => [...prev, newShape]);
    pushHistory([...shapes, newShape]);
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

  // Helper to construct the d path for pen shapes
  const getPathData = (shape: VectorShape): string => {
    if (!shape.points || shape.points.length === 0) return '';
    let d = '';
    shape.points.forEach((pt, idx) => {
      if (idx === 0) {
        d += `M ${pt.x} ${pt.y}`;
      } else {
        if (pt.curveType === 'bezier' && pt.cp1x !== undefined && pt.cp1y !== undefined) {
          d += ` Q ${pt.cp1x} ${pt.cp1y}, ${pt.x} ${pt.y}`;
        } else {
          d += ` L ${pt.x} ${pt.y}`;
        }
      }
    });
    if (shape.fill !== 'none') {
      d += ' Z';
    }
    return d;
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

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Presets:</span>
              <button
                onClick={() => handleLoadVectorPreset('logo')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px]"
              >
                Logo Tech
              </button>
              <button
                onClick={() => handleLoadVectorPreset('cartoon')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px]"
              >
                Boneco Cartoon
              </button>
              <button
                onClick={() => handleLoadVectorPreset('realistic')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-[11px]"
              >
                Gradiente 3D
              </button>
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
                  <g key={shape.id}>
                    <rect
                      x={shape.x}
                      y={shape.y}
                      width={shape.width}
                      height={shape.height}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      rx={4}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (activeTool === 'select') {
                          setSelectedShapeId(shape.id);
                          setSelectedNodeIndex(null);
                          setDraggedShapeId(shape.id);
                          setLastDragPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
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
                  <g key={shape.id}>
                    <ellipse
                      cx={shape.x + rx}
                      cy={shape.y + ry}
                      rx={rx}
                      ry={ry}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (activeTool === 'select') {
                          setSelectedShapeId(shape.id);
                          setSelectedNodeIndex(null);
                          setDraggedShapeId(shape.id);
                          setLastDragPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
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
                  <g key={shape.id}>
                    {/* Dimension Arrow Line */}
                    <line
                      x1={shape.x}
                      y1={shape.y + 10}
                      x2={shape.x + shape.width}
                      y2={shape.y + 10}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (activeTool === 'select') {
                          setSelectedShapeId(shape.id);
                          setSelectedNodeIndex(null);
                          setDraggedShapeId(shape.id);
                          setLastDragPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      className="cursor-move"
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
                      className="font-mono cursor-pointer"
                      onClick={() => setSelectedShapeId(shape.id)}
                    >
                      {shape.label || `${pxToUnit(shape.width)} ${unit}`}
                    </text>
                  </g>
                );
              }

              if (shape.type === 'pen') {
                return (
                  <g key={shape.id}>
                    {/* Main path */}
                    <path
                      d={getPathData(shape)}
                      fill={shape.fill}
                      stroke={shape.stroke}
                      strokeWidth={shape.strokeWidth}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (activeTool === 'select') {
                          setSelectedShapeId(shape.id);
                          setDraggedShapeId(shape.id);
                          setLastDragPos({ x: e.clientX, y: e.clientY });
                        }
                      }}
                      className="cursor-pointer hover:stroke-cyan-400 transition-colors"
                    />

                    {/* Nodes and Bezier handles (Only when Selected in select tool) */}
                    {isSelected && activeTool === 'select' && shape.points && (
                      <g>
                        {shape.points.map((pt, idx) => {
                          const isNodeSelected = selectedNodeIndex === idx;
                          return (
                            <g key={idx}>
                              {/* Anchor line for Bezier control point cp1 */}
                              {pt.curveType === 'bezier' && pt.cp1x !== undefined && pt.cp1y !== undefined && (
                                <g>
                                  <line
                                    x1={pt.x}
                                    y1={pt.y}
                                    x2={pt.cp1x}
                                    y2={pt.cp1y}
                                    stroke="#10b981"
                                    strokeWidth="1.2"
                                    strokeDasharray="2 2"
                                  />
                                  {/* Control point 1 handle */}
                                  <circle
                                    cx={pt.cp1x}
                                    cy={pt.cp1y}
                                    r="5.5"
                                    fill="#10b981"
                                    stroke="#ffffff"
                                    strokeWidth="1.5"
                                    className="cursor-move hover:fill-emerald-300"
                                    onMouseDown={(e) => {
                                      e.stopPropagation();
                                      setDraggedNode({
                                        shapeId: shape.id,
                                        nodeIndex: idx,
                                        type: 'cp1',
                                      });
                                      setSelectedNodeIndex(idx);
                                    }}
                                  />
                                </g>
                              )}

                              {/* Principal Anchor point */}
                              <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isNodeSelected ? '7' : '5'}
                                fill={isNodeSelected ? '#ef4444' : '#3b82f6'}
                                stroke="#ffffff"
                                strokeWidth="2"
                                className="cursor-move hover:fill-indigo-300"
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setDraggedNode({
                                    shapeId: shape.id,
                                    nodeIndex: idx,
                                    type: 'anchor',
                                  });
                                  setSelectedNodeIndex(idx);
                                }}
                              />
                            </g>
                          );
                        })}
                      </g>
                    )}
                  </g>
                );
              }

              return null;
            })}

            {/* Connected Pen Path Preview */}
            {penPoints.length > 0 && (
              <g>
                <path
                  d={getPathData({ points: penPoints, fill: 'none' } as any)}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                />
                {penPoints.map((pt, idx) => (
                  <g key={idx}>
                    {/* Anchor point */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="5.5"
                      fill="#38bdf8"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                    {/* Bezier control handle preview */}
                    {pt.curveType === 'bezier' && pt.cp1x !== undefined && pt.cp1y !== undefined && (
                      <g>
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.cp1x}
                          y2={pt.cp1y}
                          stroke="#10b981"
                          strokeWidth="1.2"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={pt.cp1x}
                          cy={pt.cp1y}
                          r="4.5"
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      </g>
                    )}
                  </g>
                ))}
              </g>
            )}

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

          {/* Floating Finish Pen Path Control Bar */}
          {penPoints.length > 0 && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-cyan-500/50 backdrop-blur-md px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-3 text-xs z-30 animate-in fade-in duration-200">
              <span className="text-cyan-300 font-bold font-mono">
                Desenhando Linhas Conectadas ({penPoints.length} nós)
              </span>
              <button
                onClick={() => handleFinishPenPath(true)}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow"
              >
                Fechar Caminho (Polígono)
              </button>
              <button
                onClick={() => handleFinishPenPath(false)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg border border-slate-700"
              >
                Concluir Aberto
              </button>
              <button
                onClick={() => setPenPoints([])}
                className="p-1 text-rose-400 hover:text-white rounded hover:bg-rose-950/80"
                title="Cancelar"
              >
                Cancelar
              </button>
            </div>
          )}
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
                  <span className="text-slate-400">Cor de Preenchimento:</span>
                  <input
                    type="color"
                    value={activeShape.fill === 'none' ? '#6366f1' : activeShape.fill.startsWith('rgba') ? '#6366f1' : activeShape.fill}
                    onChange={(e) => updateSelectedShape('fill', e.target.value)}
                    className="w-6 h-6 rounded bg-transparent cursor-pointer border-0 p-0"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <button
                    onClick={() => updateSelectedShape('fill', activeShape.fill === 'none' ? 'rgba(99,102,241,0.25)' : 'none')}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded"
                  >
                    {activeShape.fill === 'none' ? 'Ativar Preenchimento' : 'Remover Preenchimento'}
                  </button>
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

              {/* Bézier Node inspector */}
              {activeShape.type === 'pen' && activeShape.points && selectedNodeIndex !== null && activeShape.points[selectedNodeIndex] && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Nó Bézier Selecionado (#{selectedNodeIndex + 1})
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Nó X ({unit})</span>
                      <input
                        type="number"
                        value={pxToUnit(activeShape.points[selectedNodeIndex].x)}
                        onChange={(e) => {
                          const val = unitToPx(Number(e.target.value));
                          const updatedPts = [...(activeShape.points || [])];
                          if (updatedPts[selectedNodeIndex]) {
                            updatedPts[selectedNodeIndex] = { ...updatedPts[selectedNodeIndex], x: val };
                            updateSelectedShape('points', updatedPts);
                          }
                        }}
                        className="w-full bg-transparent font-mono text-cyan-300 text-xs focus:outline-none"
                      />
                    </div>
                    <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                      <span className="text-[9px] text-slate-500 block">Nó Y ({unit})</span>
                      <input
                        type="number"
                        value={pxToUnit(activeShape.points[selectedNodeIndex].y)}
                        onChange={(e) => {
                          const val = unitToPx(Number(e.target.value));
                          const updatedPts = [...(activeShape.points || [])];
                          if (updatedPts[selectedNodeIndex]) {
                            updatedPts[selectedNodeIndex] = { ...updatedPts[selectedNodeIndex], y: val };
                            updateSelectedShape('points', updatedPts);
                          }
                        }}
                        className="w-full bg-transparent font-mono text-cyan-300 text-xs focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-500 block">Tipo de Curva</span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          const updatedPts = [...(activeShape.points || [])];
                          if (updatedPts[selectedNodeIndex]) {
                            updatedPts[selectedNodeIndex] = {
                              ...updatedPts[selectedNodeIndex],
                              curveType: 'linear',
                              cp1x: undefined,
                              cp1y: undefined,
                            };
                            updateSelectedShape('points', updatedPts);
                          }
                        }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded ${
                          activeShape.points[selectedNodeIndex].curveType !== 'bezier'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Linear
                      </button>
                      <button
                        onClick={() => {
                          const updatedPts = [...(activeShape.points || [])];
                          const pt = updatedPts[selectedNodeIndex];
                          if (pt) {
                            updatedPts[selectedNodeIndex] = {
                              ...pt,
                              curveType: 'bezier',
                              cp1x: pt.x + 30,
                              cp1y: pt.y - 30,
                            };
                            updateSelectedShape('points', updatedPts);
                          }
                        }}
                        className={`flex-1 py-1 text-[10px] font-bold rounded ${
                          activeShape.points[selectedNodeIndex].curveType === 'bezier'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Bézier
                      </button>
                    </div>
                  </div>

                  {activeShape.points[selectedNodeIndex].curveType === 'bezier' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">Alça X ({unit})</span>
                        <input
                          type="number"
                          value={pxToUnit(activeShape.points[selectedNodeIndex].cp1x || 0)}
                          onChange={(e) => {
                            const val = unitToPx(Number(e.target.value));
                            const updatedPts = [...(activeShape.points || [])];
                            if (updatedPts[selectedNodeIndex]) {
                              updatedPts[selectedNodeIndex] = { ...updatedPts[selectedNodeIndex], cp1x: val };
                              updateSelectedShape('points', updatedPts);
                            }
                          }}
                          className="w-full bg-transparent font-mono text-emerald-400 text-xs focus:outline-none"
                        />
                      </div>
                      <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">
                        <span className="text-[9px] text-slate-500 block">Alça Y ({unit})</span>
                        <input
                          type="number"
                          value={pxToUnit(activeShape.points[selectedNodeIndex].cp1y || 0)}
                          onChange={(e) => {
                            const val = unitToPx(Number(e.target.value));
                            const updatedPts = [...(activeShape.points || [])];
                            if (updatedPts[selectedNodeIndex]) {
                              updatedPts[selectedNodeIndex] = { ...updatedPts[selectedNodeIndex], cp1y: val };
                              updateSelectedShape('points', updatedPts);
                            }
                          }}
                          className="w-full bg-transparent font-mono text-emerald-400 text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
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
