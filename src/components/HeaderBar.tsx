import React from 'react';
import {
  Paintbrush,
  PenTool,
  Box,
  Presentation,
  FileText,
  Video,
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
} from 'lucide-react';
import { AppMode, CloudStorageConfig, Collaborator } from '../types';

interface HeaderBarProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  cloudConfig: CloudStorageConfig;
  onOpenCloudModal: () => void;
  onOpenShortcutsModal: () => void;
  onOpenLayoutModal: () => void;
  collaborators: Collaborator[];
  activeLayoutName: string;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentMode,
  onModeChange,
  cloudConfig,
  onOpenCloudModal,
  onOpenShortcutsModal,
  onOpenLayoutModal,
  collaborators,
  activeLayoutName,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const modes: { id: AppMode; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'painting', label: 'Pintura Digital', icon: Paintbrush },
    { id: 'vector', label: 'Vetores Exatos', icon: PenTool },
    { id: '3d_render', label: 'Render 3D', icon: Box },
    { id: 'presentation', label: 'Apresentação', icon: Presentation },
    { id: 'document', label: 'Documentos', icon: FileText },
    { id: 'video', label: 'Vídeo Timeline', icon: Video },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-4 py-2 flex items-center justify-between shadow-md select-none">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            MNAnimat <span className="text-cyan-400 font-extrabold">Visuals</span>
          </h1>
          <p className="text-[10px] text-slate-400 -mt-0.5 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping"></span>
            Pro Creative Suite v3.2
          </p>
        </div>
      </div>

      {/* Mode Switches */}
      <nav className="flex items-center gap-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 shadow-inner">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = currentMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => onModeChange(mode.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/25 ring-1 ring-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Undo / Redo Header Actions */}
      {onUndo && onRedo && (
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl + Z / Cmd + Z)"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              canUndo
                ? 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white shadow cursor-pointer ring-1 ring-white/10'
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
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              canRedo
                ? 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white shadow cursor-pointer ring-1 ring-white/10'
                : 'bg-slate-900/50 text-slate-600 cursor-not-allowed opacity-50'
            }`}
          >
            <Redo2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden xl:inline">Refazer</span>
          </button>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Hardware GPU Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400 font-mono">GPU:</span>
          <span className="text-emerald-400 font-semibold">WebGL 2.0 Acelerada</span>
        </div>

        {/* Layout Customizer */}
        <button
          onClick={onOpenLayoutModal}
          title="Personalizar Arranjo de Janelas"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-lg border border-slate-700/60 text-xs text-slate-200 font-medium transition-colors"
        >
          <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">{activeLayoutName}</span>
        </button>

        {/* Cloud Sync Button */}
        <button
          onClick={onOpenCloudModal}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            cloudConfig.connected
              ? 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
              : 'bg-indigo-950/50 border-indigo-800/80 text-indigo-300 hover:bg-indigo-900/50'
          }`}
        >
          {cloudConfig.connected ? (
            <>
              <Cloud className="w-4 h-4 text-emerald-400" />
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-semibold flex items-center gap-1">
                  {cloudConfig.provider === 'google_drive' ? 'Google Drive' : 'Cloudflare R2'}
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 inline" />
                </span>
                <span className="text-[9px] text-slate-400">Sincronizado</span>
              </div>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4 text-amber-400 animate-bounce" />
              <span>Conectar Nuvem</span>
            </>
          )}
        </button>

        {/* Collaboration Room Avatars */}
        <div className="flex items-center -space-x-2 pl-1">
          {collaborators.map((c) => (
            <div
              key={c.id}
              title={`${c.name} (${c.role}) - ${c.activeTool}`}
              className="w-7 h-7 rounded-full border-2 border-slate-900 overflow-hidden flex items-center justify-center font-bold text-[10px] text-white shadow"
              style={{ backgroundColor: c.color }}
            >
              {c.avatar}
            </div>
          ))}
          <div
            title="Equipe em tempo real ativa"
            className="w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-semibold text-slate-300"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        </div>

        {/* Keyboard Shortcuts Button */}
        <button
          onClick={onOpenShortcutsModal}
          title="Atalhos do Teclado (?)"
          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700/80 transition-colors"
        >
          <Keyboard className="w-4 h-4 text-violet-400" />
        </button>
      </div>
    </header>
  );
};
