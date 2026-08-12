import React, { useState, useEffect } from 'react';
import { AppMode, CloudStorageConfig, Collaborator, FloatingWindow } from './types';
import { getInitialCloudConfig } from './utils/cloudSync';
import { HeaderBar } from './components/HeaderBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { CloudStorageModal } from './components/CloudStorageModal';
import { LayoutCustomizerModal } from './components/LayoutCustomizerModal';
import { GlobalExportModal } from './components/GlobalExportModal';
import { CollaborativeCursors } from './components/CollaborativeCursors';
import { FloatingWindowManager } from './components/FloatingWindowManager';
import { LoginAndProjects } from './components/LoginAndProjects';

import { PaintingStudio } from './components/modes/PaintingStudio';
import { VectorStudio } from './components/modes/VectorStudio';
import { ThreeStudio } from './components/modes/ThreeStudio';
import { Animation2DStudio } from './components/modes/Animation2DStudio';
import { ImageStudio } from './components/modes/ImageStudio';
import { PresentationStudio } from './components/modes/PresentationStudio';
import { DocumentStudio } from './components/modes/DocumentStudio';
import { VideoStudio } from './components/modes/VideoStudio';
import { SpreadsheetStudio } from './components/modes/SpreadsheetStudio';

const INITIAL_WINDOWS: FloatingWindow[] = [
  {
    id: 'win_tools',
    title: 'Caixa de Ferramentas & Pincéis',
    content: 'tools',
    x: 20,
    y: 70,
    width: 260,
    height: 380,
    isMinimized: true,
    isMaximized: false,
    zIndex: 20,
  },
  {
    id: 'win_layers',
    title: 'Gerenciador de Camadas (Layers)',
    content: 'layers',
    x: window.innerWidth - 320,
    y: 70,
    width: 300,
    height: 420,
    isMinimized: true,
    isMaximized: false,
    zIndex: 21,
  },
  {
    id: 'win_color',
    title: 'Paleta de Cores HSL & Amostras',
    content: 'color_picker',
    x: 20,
    y: 470,
    width: 260,
    height: 280,
    isMinimized: true,
    isMaximized: false,
    zIndex: 22,
  },
];

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('vector');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('shared') === 'true') return true;
    return localStorage.getItem('mn_user_logged') === 'true';
  });

  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('shared') === 'true') {
      return urlParams.get('project') || 'proj_default';
    }
    return localStorage.getItem('mn_active_project_id');
  });

  const [cloudConfig, setCloudConfig] = useState<CloudStorageConfig>(getInitialCloudConfig());
  const [activeLayoutName, setActiveLayoutName] = useState<string>('Desenho Vetorial');
  const [cursorsEnabled, setCursorsEnabled] = useState<boolean>(true);
  const [floatingWindows, setFloatingWindows] = useState<FloatingWindow[]>(INITIAL_WINDOWS);

  // Automatically adjust currentMode if active project dictates it
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('mn_active_project_id', activeProjectId);
      const saved = localStorage.getItem('mn_user_projects');
      if (saved) {
        try {
          const list = JSON.parse(saved);
          const found = list.find((p: any) => p.id === activeProjectId);
          if (found) {
            setCurrentMode(found.mode);
            if (found.mode === 'painting') setActiveLayoutName('Pintura e Ilustração');
            else if (found.mode === '3d_render') setActiveLayoutName('Modelagem 3D');
            else setActiveLayoutName('Desenho Vetorial');
          }
        } catch (e) {
          // ignore
        }
      }
    } else {
      localStorage.removeItem('mn_active_project_id');
    }
  }, [activeProjectId]);

  // Auto-Save State
  const [lastAutoSaveTime, setLastAutoSaveTime] = useState<Date | null>(new Date());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [autoSaveNotification, setAutoSaveNotification] = useState<string | null>(null);

  const triggerAutoSave = React.useCallback(() => {
    setIsSaving(true);
    try {
      const saveData = {
        mode: currentMode,
        layout: activeLayoutName,
        windows: floatingWindows,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem('mnanimat_autosave_data', JSON.stringify(saveData));
      setTimeout(() => {
        setIsSaving(false);
        setLastAutoSaveTime(new Date());
        setAutoSaveNotification('Projeto Auto-Salvo com Sucesso ✓');
        setTimeout(() => setAutoSaveNotification(null), 2500);
      }, 350);
    } catch (e) {
      setIsSaving(false);
    }
  }, [currentMode, activeLayoutName, floatingWindows]);

  // Periodic Auto-Save Every 15 Seconds
  useEffect(() => {
    const interval = setInterval(() => {
      triggerAutoSave();
    }, 15000);
    return () => clearInterval(interval);
  }, [triggerAutoSave]);

  // Auto-save when switching modes or closing
  useEffect(() => {
    const handleBeforeUnload = () => {
      triggerAutoSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [triggerAutoSave]);

  // Undo / Redo active handler state
  const [undoState, setUndoState] = useState<{
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
  } | null>(null);

  const handleUndoStateChange = React.useCallback(
    (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => {
      setUndoState((prev) => {
        if (
          prev &&
          prev.canUndo === canUndo &&
          prev.canRedo === canRedo &&
          prev.undo === undo &&
          prev.redo === redo
        ) {
          return prev;
        }
        return { canUndo, canRedo, undo, redo };
      });
    },
    []
  );

  // Modals state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Real-time team collaborators sample state
  const [collaborators] = useState<Collaborator[]>([
    {
      id: 'collab_1',
      name: 'Ana Silva',
      color: '#ec4899',
      avatar: 'AS',
      role: 'Design Lead',
      currentMode: 'painting',
      activeTool: 'Pincel Aquarela',
    },
    {
      id: 'collab_2',
      name: 'Carlos Ramos',
      color: '#3b82f6',
      avatar: 'CR',
      role: 'Modelador 3D',
      currentMode: '3d_render',
      activeTool: 'Shaders PBR',
    },
  ]);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        setIsShortcutsOpen((prev) => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleUpdateWindow = (updatedWin: FloatingWindow) => {
    setFloatingWindows((prev) => prev.map((w) => (w.id === updatedWin.id ? updatedWin : w)));
  };

  const handleMinimizeAllWindows = () => {
    setFloatingWindows((prev) => prev.map((w) => ({ ...w, isMinimized: true })));
  };

  const handleResetWindows = () => {
    setFloatingWindows(INITIAL_WINDOWS.map((w) => ({ ...w, isMinimized: true })));
  };

  const renderFloatingContent = (type: FloatingWindow['content']) => {
    switch (type) {
      case 'tools':
        return (
          <div className="space-y-2">
            <p className="text-slate-400">Atalhos rápidos de seleção e atalhos de ferramentas ativas do {currentMode}.</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-cyan-400 font-bold block">Pincel (B)</span>
                <span className="text-slate-400 text-[10px]">Tamanho e opacidade configurados</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-indigo-400 font-bold block">Borracha (E)</span>
                <span className="text-slate-400 text-[10px]">Suave / Dura</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-emerald-400 font-bold block">Conta-gotas (I)</span>
                <span className="text-slate-400 text-[10px]">Amostragem em tela</span>
              </div>
              <div className="p-2 bg-slate-950 rounded border border-slate-800">
                <span className="text-amber-400 font-bold block">Mover (V)</span>
                <span className="text-slate-400 text-[10px]">Arrastar objetos e camadas</span>
              </div>
            </div>
          </div>
        );
      case 'layers':
        return (
          <div className="space-y-2">
            <p className="text-slate-400">Arranjo de camadas ativas e modos de mesclagem do documento.</p>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-slate-200">Camada Principal (Ativa)</span>
              <span className="text-[10px] text-emerald-400 font-mono">100% Opacidade</span>
            </div>
            <div className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between opacity-70">
              <span className="font-semibold text-slate-300">Fundo Canvas</span>
              <span className="text-[10px] text-slate-400 font-mono">Bloqueada</span>
            </div>
          </div>
        );
      case 'color_picker':
        return (
          <div className="space-y-2 text-center">
            <p className="text-slate-400 text-[11px]">Seletor de Cores Flutuante e Amostras Rápidas</p>
            <div className="h-12 w-full rounded-xl bg-gradient-to-r from-red-500 via-green-500 via-blue-500 to-purple-500 shadow-inner border border-white/20" />
            <div className="flex items-center justify-center gap-2 pt-1">
              <div className="w-6 h-6 rounded-full bg-cyan-400 border border-white shadow" />
              <div className="w-6 h-6 rounded-full bg-indigo-500 border border-white shadow" />
              <div className="w-6 h-6 rounded-full bg-emerald-500 border border-white shadow" />
              <div className="w-6 h-6 rounded-full bg-amber-400 border border-white shadow" />
              <div className="w-6 h-6 rounded-full bg-rose-500 border border-white shadow" />
            </div>
          </div>
        );
      default:
        return <p className="text-slate-400">Painel personalizado ativo.</p>;
    }
  };

  if (!isLoggedIn || !activeProjectId) {
    return (
      <LoginAndProjects
        isLoggedIn={isLoggedIn}
        activeProjectId={activeProjectId}
        onLoginSuccess={(userName, userAge) => {
          setIsLoggedIn(true);
        }}
        onSelectProject={(projectId, projectMode) => {
          setCurrentMode(projectMode);
          setActiveProjectId(projectId);
        }}
        onLogout={() => {
          setIsLoggedIn(false);
          setActiveProjectId(null);
          localStorage.removeItem('mn_user_logged');
          localStorage.removeItem('mn_active_project_id');
        }}
        onBackToDashboard={() => {
          const savedProj = localStorage.getItem('mn_active_project_id') || 'proj_default';
          setActiveProjectId(savedProj);
        }}
      />
    );
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden antialiased relative">
      {/* Real-time Collaboration Live Cursors Overlay */}
      <CollaborativeCursors enabled={cursorsEnabled} currentMode={currentMode} />

      {/* Floating Windows Customizer */}
      <FloatingWindowManager
        windows={floatingWindows}
        onUpdateWindow={handleUpdateWindow}
        onResetWindows={handleResetWindows}
        onMinimizeAllWindows={handleMinimizeAllWindows}
        renderContent={renderFloatingContent}
      />

      {/* Top Header Navigation */}
      <HeaderBar
        currentMode={currentMode}
        onModeChange={(mode) => {
          setCurrentMode(mode);
          setUndoState(null);
        }}
        cloudConfig={cloudConfig}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsOpen(true)}
        onOpenLayoutModal={() => setIsLayoutModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenDashboard={() => setActiveProjectId(null)}
        collaborators={collaborators}
        activeLayoutName={activeLayoutName}
        onUndo={undoState?.canUndo ? undoState.undo : undefined}
        onRedo={undoState?.canRedo ? undoState.redo : undefined}
        canUndo={undoState?.canUndo}
        canRedo={undoState?.canRedo}
        cursorsEnabled={cursorsEnabled}
        onToggleCursors={() => setCursorsEnabled((prev) => !prev)}
        lastAutoSaveTime={lastAutoSaveTime}
        isSaving={isSaving}
        onTriggerAutoSave={triggerAutoSave}
      />

      {/* Floating Auto-Save Notification Toast */}
      {autoSaveNotification && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/90 border border-emerald-500/80 text-emerald-300 px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{autoSaveNotification}</span>
        </div>
      )}

      {/* Main Studio Mode Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentMode === 'painting' && (
          <PaintingStudio
            cloudConfig={cloudConfig}
            onUndoStateChange={handleUndoStateChange}
          />
        )}
        {currentMode === 'vector' && (
          <VectorStudio
            onUndoStateChange={handleUndoStateChange}
          />
        )}
        {currentMode === '3d_render' && <ThreeStudio />}
        {currentMode === 'animation2d' && <Animation2DStudio />}
        {currentMode === 'image_editor' && <ImageStudio />}
        {currentMode === 'presentation' && <PresentationStudio />}
        {currentMode === 'document' && <DocumentStudio />}
        {currentMode === 'video' && <VideoStudio />}
        {currentMode === 'spreadsheet' && <SpreadsheetStudio />}
      </main>

      {/* Keyboard Shortcuts Reference Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Cloud Storage & Sync Modal (Google Drive & Cloudflare R2) */}
      <CloudStorageModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        config={cloudConfig}
        onUpdateConfig={setCloudConfig}
      />

      {/* Layout & Window Customizer Modal */}
      <LayoutCustomizerModal
        isOpen={isLayoutModalOpen}
        onClose={() => setIsLayoutModalOpen(false)}
        activeLayoutName={activeLayoutName}
        onSelectLayout={setActiveLayoutName}
      />

      {/* Global Export Module Modal */}
      <GlobalExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentMode={currentMode}
      />
    </div>
  );
}
