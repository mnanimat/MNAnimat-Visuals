import React, { useState, useEffect } from 'react';
import { AppMode, CloudStorageConfig, Collaborator } from './types';
import { getInitialCloudConfig } from './utils/cloudSync';
import { HeaderBar } from './components/HeaderBar';
import { ShortcutsModal } from './components/ShortcutsModal';
import { CloudStorageModal } from './components/CloudStorageModal';
import { LayoutCustomizerModal } from './components/LayoutCustomizerModal';

import { PaintingStudio } from './components/modes/PaintingStudio';
import { VectorStudio } from './components/modes/VectorStudio';
import { ThreeStudio } from './components/modes/ThreeStudio';
import { PresentationStudio } from './components/modes/PresentationStudio';
import { DocumentStudio } from './components/modes/DocumentStudio';
import { VideoStudio } from './components/modes/VideoStudio';

export default function App() {
  const [currentMode, setCurrentMode] = useState<AppMode>('painting');
  const [cloudConfig, setCloudConfig] = useState<CloudStorageConfig>(getInitialCloudConfig());
  const [activeLayoutName, setActiveLayoutName] = useState<string>('Pintura e Ilustração');

  // Undo / Redo active handler state
  const [undoState, setUndoState] = useState<{
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
  } | null>(null);

  // Modals state
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden antialiased">
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
        collaborators={collaborators}
        activeLayoutName={activeLayoutName}
        onUndo={undoState?.canUndo ? undoState.undo : undefined}
        onRedo={undoState?.canRedo ? undoState.redo : undefined}
        canUndo={undoState?.canUndo}
        canRedo={undoState?.canRedo}
      />

      {/* Main Studio Mode Container */}
      <main className="flex-1 flex overflow-hidden relative">
        {currentMode === 'painting' && (
          <PaintingStudio
            onUndoStateChange={(canUndo, canRedo, undo, redo) => {
              setUndoState({ canUndo, canRedo, undo, redo });
            }}
          />
        )}
        {currentMode === 'vector' && <VectorStudio />}
        {currentMode === '3d_render' && <ThreeStudio />}
        {currentMode === 'presentation' && <PresentationStudio />}
        {currentMode === 'document' && <DocumentStudio />}
        {currentMode === 'video' && <VideoStudio />}
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
    </div>
  );
}
