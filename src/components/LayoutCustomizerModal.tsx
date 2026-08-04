import React from 'react';
import { X, LayoutGrid, SlidersHorizontal, Check, PanelLeft, PanelRight, Layers, History, Paintbrush, Box, Clock } from 'lucide-react';

interface LayoutCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeLayoutName: string;
  onSelectLayout: (layoutName: string) => void;
}

export const LayoutCustomizerModal: React.FC<LayoutCustomizerModalProps> = ({
  isOpen,
  onClose,
  activeLayoutName,
  onSelectLayout,
}) => {
  if (!isOpen) return null;

  const presets = [
    {
      id: 'Pintura e Ilustração',
      description: 'Painel expandido de Camadas à direita, Histórico à esquerda e Pincéis Flutuantes.',
      icon: Paintbrush,
    },
    {
      id: 'Vetores e CAD Técnico',
      description: 'Réguas milimétricas ativas, inspetor de nós e dimensões com snapping ativado.',
      icon: SlidersHorizontal,
    },
    {
      id: '3D Render Studio',
      description: 'Viewport WebGL 3D em tela inteira com inspetor de materiais e shaders.',
      icon: Box,
    },
    {
      id: 'Apresentação & Slides',
      description: 'Painel de miniaturas de slides à esquerda e inspetor de elementos à direita.',
      icon: LayoutGrid,
    },
    {
      id: 'Produção de Vídeo',
      description: 'Timeline de áudio/vídeo expandida na parte inferior com pré-visualização 4K.',
      icon: Clock,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Flexibilidade da Disposição de Janelas</h2>
              <p className="text-xs text-slate-400">
                Ajuste os painéis, acoplamento de janelas e áreas de trabalho para seu fluxo de trabalho
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Arranjos de Workspace Pré-definidos:
          </h3>

          <div className="space-y-2.5">
            {presets.map((preset) => {
              const Icon = preset.icon;
              const isSelected = activeLayoutName === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    onSelectLayout(preset.id);
                    onClose();
                  }}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3.5 transition-all ${
                    isSelected
                      ? 'bg-indigo-950/60 border-indigo-500/80 text-white shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div
                    className={`p-2.5 rounded-lg ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-100">{preset.id}</span>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-[10px] font-semibold rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{preset.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>Você também pode redimensionar ou minimizar painéis na barra lateral</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Aplicar Arranjo
          </button>
        </div>
      </div>
    </div>
  );
};
