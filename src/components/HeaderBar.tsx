import React, { useState, useEffect } from 'react';
import {
  Paintbrush,
  PenTool,
  Box,
  Film,
  Image as ImageIcon,
  Presentation,
  FileText,
  Video,
  Table,
  Cloud,
  CloudOff,
  Users,
  Keyboard,
  Cpu,
  LayoutGrid,
  CheckCircle2,
  Sparkles,
  Undo2,
  Redo2,
  GripVertical,
  MousePointer2,
  Save,
  Download,
} from 'lucide-react';
import { AppMode, CloudStorageConfig, Collaborator } from '../types';

interface HeaderBarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  cloudConfig: CloudStorageConfig;
  onOpenCloudModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenLayoutModal: () => void;
  onOpenExportModal?: () => void;
  collaborators: Collaborator[];
  activeLayoutName: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  cursorsEnabled?: boolean;
  onToggleCursors?: () => void;
  lastAutoSaveTime?: Date | null;
  isSaving?: boolean;
  onTriggerAutoSave?: () => void;
}

interface ModeDef {
  id: AppMode;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const DEFAULT_MODES: ModeDef[] = [
  { id: 'painting', label: 'Pintura Digital', icon: Paintbrush },
  { id: 'vector', label: 'Vetores', icon: PenTool },
  { id: '3d_render', label: '3D', icon: Box },
  { id: 'animation2d', label: 'Animação 2D', icon: Film },
  { id: 'image_editor', label: 'Imagem', icon: ImageIcon },
  { id: 'presentation', label: 'Apresentação', icon: Presentation },
  { id: 'document', label: 'Documentos', icon: FileText },
  { id: 'spreadsheet', label: 'Planilhas', icon: Table },
  { id: 'video', label: 'Vídeo', icon: Video },
];

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentMode,
  onModeChange,
  cloudConfig,
  onOpenCloudModal,
  onOpenShortcutsModal,
  onOpenLayoutModal,
  onOpenExportModal,
  collaborators,
  activeLayoutName,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  cursorsEnabled = true,
  onToggleCursors,
  lastAutoSaveTime,
  isSaving = false,
  onTriggerAutoSave,
}) => {
  const [modesList, setModesList] = useState<ModeDef[]>(() => {
    try {
      const saved = localStorage.getItem('mn_tab_order');
      if (saved) {
        const ids: AppMode[] = JSON.parse(saved);
        const map = new Map(DEFAULT_MODES.map((m) => [m.id, m]));
        const ordered = ids.map((id) => map.get(id)).filter(Boolean) as ModeDef[];
        // Add any missing default modes
        DEFAULT_MODES.forEach((m) => {
          if (!ordered.find((o) => o.id === m.id)) {
            ordered.push(m);
          }
        });
        return ordered;
      }
    } catch (e) {
      // fallback
    }
    return DEFAULT_MODES;
  });

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newList = [...modesList];
    const [moved] = newList.splice(draggedIndex, 1);
    newList.splice(dropIndex, 0, moved);

    setModesList(newList);
    setDraggedIndex(null);

    try {
      localStorage.setItem('mn_tab_order', JSON.stringify(newList.map((m) => m.id)));
    } catch (err) {
      // ignore
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-3 py-1.5 flex flex-wrap items-center justify-between shadow-md select-none gap-2">
      {/* Brand & Logo */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-none">
            MNAnimat <span className="text-cyan-400 font-extrabold">Visuals</span>
          </h1>
          <p className="text-[9px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            Micael Nildo
          </p>
        </div>
      </div>

      {/* Mode Switches with Drag & Drop Reordering */}
      <nav className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner overflow-x-auto scrollbar-none max-w-full">
        {modesList.map((mode, index) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <div
              key={mode.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              title="Clique para alternar ou Arraste para reordenar esta página"
              className={`flex items-center group cursor-grab active:cursor-grabbing rounded-lg transition-all duration-150 ${
                draggedIndex === index ? 'opacity-40 scale-95' : 'opacity-100'
              }`}
            >
              <button
                onClick={() => onModeChange(mode.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 transition-colors" />
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">{mode.label}</span>
              </button>
            </div>
          );
        })}
      </nav>

      {/* Global Undo / Redo Header Actions */}
      {onUndo && onRedo && (
        <div className="hidden md:flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl + Z / Cmd + Z)"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              canUndo
                ? 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white shadow cursor-pointer'
                : 'bg-slate-900/50 text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Desfazer</span>
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl + Y / Ctrl + Shift + Z)"
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all ${
              canRedo
                ? 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white shadow cursor-pointer'
                : 'bg-slate-900/50 text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Refazer</span>
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Real-time Cursors Toggle */}
        {onToggleCursors && (
          <button
            onClick={onToggleCursors}
            title={cursorsEnabled ? 'Ocultar Ponteiros em Tempo Real' : 'Exibir Ponteiros de Colaboradores'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              cursorsEnabled
                ? 'bg-cyan-950/60 border-cyan-800/80 text-cyan-300 shadow-sm shadow-cyan-500/20'
                : 'bg-slate-800/50 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <MousePointer2 className={`w-3.5 h-3.5 ${cursorsEnabled ? 'text-cyan-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Ponteiros Ao Vivo</span>
          </button>
        )}

        {/* Layout Customizer */}
        <button
          onClick={onOpenLayoutModal}
          title="Personalizar Arranjo de Janelas"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 text-xs text-slate-200 font-medium transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{activeLayoutName}</span>
        </button>

        {/* Global Export Button */}
        {onOpenExportModal && (
          <button
            onClick={onOpenExportModal}
            title="Módulo de Exportação Global (PDF, MP4, SVG, PNG)"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg border border-cyan-400/30 text-xs font-extrabold shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Exportar Projeto</span>
          </button>
        )}

        {/* Auto-Save Indicator & Manual Save Trigger */}
        <button
          onClick={onTriggerAutoSave}
          title={
            lastAutoSaveTime
              ? `Auto-salvo às ${lastAutoSaveTime.toLocaleTimeString()}. Clique para salvar agora.`
              : 'Auto-save ativo. Clique para salvar agora.'
          }
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
            isSaving
              ? 'bg-amber-950/70 border-amber-800 text-amber-300 animate-pulse'
              : 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300 hover:bg-emerald-900/60 shadow-sm shadow-emerald-500/20'
          }`}
        >
          {isSaving ? (
            <>
              <Save className="w-3.5 h-3.5 text-amber-400 animate-spin" />
              <span className="hidden sm:inline text-[11px]">Salvando...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline text-[11px]">
                {lastAutoSaveTime ? 'Auto-Salvo ✓' : 'Auto-Save'}
              </span>
            </>
          )}
        </button>

        {/* Cloud Sync Button */}
        <button
          onClick={onOpenCloudModal}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            cloudConfig.connected
              ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-indigo-950/50 border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/50'
          }`}
        >
          {cloudConfig.connected ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline text-[11px] font-semibold">Nuvem Conectada</span>
            </>
          ) : (
            <>
              <CloudOff className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden lg:inline">Conectar Nuvem</span>
            </>
          )}
        </button>

        {/* Collaboration Room Avatars */}
        <div className="flex items-center -space-x-1.5 pl-0.5">
          {collaborators.map((c) => (
            <div
              key={c.id}
              title={`${c.name} (${c.role}) - ${c.activeTool}`}
              className="w-6 h-6 rounded-full border border-slate-900 overflow-hidden flex items-center justify-center font-bold text-[9px] text-white shadow"
              style={{ backgroundColor: c.color }}
            >
              {c.avatar}
            </div>
          ))}
          <div
            title="Equipe em tempo real ativa"
            className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[9px] font-semibold text-slate-300"
          >
            <Users className="w-3 h-3 text-cyan-400" />
          </div>
        </div>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcutsModal}
          title="Atalhos do Teclado (?)"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-colors"
        >
          <Keyboard className="w-3.5 h-3.5 text-violet-400" />
        </button>
      </div>
    </header>
  );
};
