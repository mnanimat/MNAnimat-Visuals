import React, { useState } from 'react';
import {
  Move,
  Minus,
  Square,
  Maximize2,
  X,
  Palette,
  Layers as LayersIcon,
  Wrench,
  Sliders,
  Clock,
  Eye,
  EyeOff,
  RotateCcw,
  LayoutGrid,
} from 'lucide-react';
import { FloatingWindow } from '../types';

interface FloatingWindowManagerProps {
  windows: FloatingWindow[];
  onUpdateWindow: (updated: FloatingWindow) => void;
  onResetWindows: () => void;
  onMinimizeAllWindows?: () => void;
  renderContent: (type: FloatingWindow['content']) => React.ReactNode;
  isAllHidden?: boolean;
}

export const FloatingWindowManager: React.FC<FloatingWindowManagerProps> = ({
  windows,
  onUpdateWindow,
  onResetWindows,
  onMinimizeAllWindows,
  renderContent,
  isAllHidden = false,
}) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  }>({ x: 0, y: 0, w: 0, h: 0 });

  const handlePointerDownHeader = (e: React.PointerEvent, win: FloatingWindow) => {
    // Bring window to front
    const maxZ = Math.max(...windows.map((w) => w.zIndex), 10);
    onUpdateWindow({ ...win, zIndex: maxZ + 1 });

    setDraggingId(win.id);
    setDragOffset({
      x: e.clientX - win.x,
      y: e.clientY - win.y,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveHeader = (e: React.PointerEvent, win: FloatingWindow) => {
    if (draggingId === win.id) {
      const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.x));
      const newY = Math.max(40, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y));
      onUpdateWindow({ ...win, x: newX, y: newY });
    }
  };

  const handlePointerUpHeader = (e: React.PointerEvent) => {
    if (draggingId) {
      setDraggingId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const handleResizeStart = (e: React.PointerEvent, win: FloatingWindow) => {
    e.stopPropagation();
    setResizingId(win.id);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      w: win.width,
      h: win.height,
    });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizeMove = (e: React.PointerEvent, win: FloatingWindow) => {
    if (resizingId === win.id) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      const newW = Math.max(220, resizeStart.w + deltaX);
      const newH = Math.max(160, resizeStart.h + deltaY);
      onUpdateWindow({ ...win, width: newW, height: newH });
    }
  };

  const handleResizeEnd = (e: React.PointerEvent) => {
    if (resizingId) {
      setResizingId(null);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const getIcon = (type: FloatingWindow['content']) => {
    switch (type) {
      case 'tools':
        return Wrench;
      case 'layers':
        return LayersIcon;
      case 'color_picker':
        return Palette;
      case 'inspector':
        return Sliders;
      case 'timeline':
        return Clock;
      case 'preview':
        return Eye;
      default:
        return LayoutGrid;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Floating Control Reset Bar */}
      <div className="absolute top-16 right-4 pointer-events-auto flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-2xl">
        <span className="text-[11px] text-slate-300 font-semibold flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          Interface Flutuante
        </span>
        {onMinimizeAllWindows && (
          <button
            onClick={onMinimizeAllWindows}
            title="Minimizar todas as janelas flutuantes"
            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
          >
            <Minus className="w-3 h-3 text-cyan-400" />
            <span>Minimizar Todas</span>
          </button>
        )}
        <button
          onClick={onResetWindows}
          title="Resetar Posição das Janelas Flutuantes"
          className="flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3 text-indigo-400" />
          <span>Restaurar Layout</span>
        </button>
      </div>

      {!isAllHidden && windows.map((win) => {
        const Icon = getIcon(win.content);
        if (win.isMinimized) {
          // Render minimized taskbar tab at bottom
          return (
            <div
              key={win.id}
              onClick={() => onUpdateWindow({ ...win, isMinimized: false })}
              className="pointer-events-auto absolute bottom-2 px-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 hover:text-white rounded-lg shadow-xl cursor-pointer flex items-center gap-2 text-xs font-bold transition-all hover:scale-105 z-50"
              style={{ left: win.x }}
            >
              <Icon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{win.title}</span>
            </div>
          );
        }

        return (
          <div
            key={win.id}
            className="pointer-events-auto absolute flex flex-col bg-slate-900/95 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md ring-1 ring-white/10 transition-shadow hover:shadow-cyan-500/10"
            style={{
              left: win.isMaximized ? 8 : win.x,
              top: win.isMaximized ? 50 : win.y,
              width: win.isMaximized ? 'calc(100vw - 16px)' : win.width,
              height: win.isMaximized ? 'calc(100vh - 60px)' : win.height,
              zIndex: win.zIndex,
            }}
          >
            {/* Window Header */}
            <div
              onPointerDown={(e) => handlePointerDownHeader(e, win)}
              onPointerMove={(e) => handlePointerMoveHeader(e, win)}
              onPointerUp={handlePointerUpHeader}
              className="bg-slate-950/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between cursor-move select-none shrink-0"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-100">
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{win.title}</span>
              </div>

              <div className="flex items-center gap-1">
                {/* Minimize */}
                <button
                  onClick={() => onUpdateWindow({ ...win, isMinimized: true })}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  title="Minimizar"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                {/* Maximize */}
                <button
                  onClick={() => onUpdateWindow({ ...win, isMaximized: !win.isMaximized })}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                  title={win.isMaximized ? 'Restaurar Tamanho' : 'Maximizar'}
                >
                  <Square className="w-3 h-3" />
                </button>
                {/* Close/Dock */}
                <button
                  onClick={() => onUpdateWindow({ ...win, isMinimized: true })}
                  className="p-1 hover:bg-rose-600/80 rounded text-slate-400 hover:text-white transition-colors"
                  title="Ocultar Painel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Window Body Content */}
            <div className="flex-1 overflow-auto p-3 text-slate-200 text-xs">
              {renderContent(win.content)}
            </div>

            {/* Resize Corner Handle */}
            {!win.isMaximized && (
              <div
                onPointerDown={(e) => handleResizeStart(e, win)}
                onPointerMove={(e) => handleResizeMove(e, win)}
                onPointerUp={handleResizeEnd}
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-slate-600 hover:text-cyan-400 select-none"
              >
                <div className="w-2 h-2 border-r-2 border-b-2 border-current" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
