import React, { useState } from 'react';
import { X, Search, Keyboard, Sparkles } from 'lucide-react';
import { ShortcutItem } from '../types';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ALL_SHORTCUTS: ShortcutItem[] = [
  // Geral
  { key: 'Ctrl + S', description: 'Salvar e Sincronizar na Nuvem (Google Drive / R2)', category: 'Geral' },
  { key: 'Ctrl + Z', description: 'Desfazer última ação', category: 'Geral' },
  { key: 'Ctrl + Y / Shift + Ctrl + Z', description: 'Refazer ação desfeita', category: 'Geral' },
  { key: 'Space + Arrastar', description: 'Navegar / Mover Pan no Canvas', category: 'Geral' },
  { key: 'Ctrl + + / Ctrl + -', description: 'Aumentar / Diminuir Zoom', category: 'Geral' },
  { key: '?', description: 'Abrir este menu de lista de atalhos', category: 'Geral' },

  // Pintura Digital
  { key: 'B', description: 'Selecionar Pincel (Aceita Pressão Stylus)', category: 'Pintura' },
  { key: 'E', description: 'Selecionar Borracha', category: 'Pintura' },
  { key: 'I / Alt + Clique', description: 'Conta-gotas (Capturar cor do canvas)', category: 'Pintura' },
  { key: '[  /  ]', description: 'Diminuir / Aumentar tamanho do pincel', category: 'Pintura' },
  { key: 'Shift + [  /  ]', description: 'Diminuir / Aumentar dureza do pincel', category: 'Pintura' },
  { key: '1 - 0', description: 'Ajustar opacidade do pincel de 10% a 100%', category: 'Pintura' },
  { key: 'Ctrl + Shift + N', description: 'Criar Nova Camada', category: 'Pintura' },
  { key: 'Ctrl + E', description: 'Mesclar Camada Atual com a de Baixo', category: 'Pintura' },

  // Vetores
  { key: 'V', description: 'Ferramenta de Seleção e Mover Nós', category: 'Vetores' },
  { key: 'P', description: 'Caneta Vetorial (Pen Tool / Bézier)', category: 'Vetores' },
  { key: 'R', description: 'Desenhar Retângulo com Medidas Exatas', category: 'Vetores' },
  { key: 'C', description: 'Desenhar Círculo / Elipse', category: 'Vetores' },
  { key: 'M', description: 'Ferramenta de Cota de Medida / Dimensão', category: 'Vetores' },
  { key: 'Shift + Drag', description: 'Travar Proporção (1:1 / Ângulo de 45°)', category: 'Vetores' },
  { key: 'Ctrl + G', description: 'Agrupar Elementos Vetoriais', category: 'Vetores' },

  // 3D Render
  { key: 'Shift + R', description: 'Renderizar Frame em Alta Resolução (GPU)', category: '3D Render' },
  { key: 'W / E / R', description: 'Mudar Modos de Transformação (Mover / Rotacionar / Escalar)', category: '3D Render' },
  { key: 'NumPad 1 / 3 / 7', description: 'Vistas Ortográficas (Frente / Lado / Topo)', category: '3D Render' },
  { key: 'Alt + Scroll', description: 'Orbitar Câmera 3D', category: '3D Render' },
  { key: 'Shift + A', description: 'Adicionar Objeto 3D (Cubo, Esfera, Luz)', category: '3D Render' },

  // Apresentação
  { key: 'F5', description: 'Iniciar Apresentação em Tela Cheia', category: 'Apresentação' },
  { key: 'Ctrl + M', description: 'Inserir Novo Slide', category: 'Apresentação' },
  { key: 'Ctrl + D', description: 'Duplicar Elemento ou Slide', category: 'Apresentação' },

  // Documentos
  { key: 'Ctrl + B', description: 'Texto em Negrito', category: 'Documentos' },
  { key: 'Ctrl + I', description: 'Texto em Itálico', category: 'Documentos' },
  { key: 'Ctrl + U', description: 'Texto Sublinhado', category: 'Documentos' },

  // Vídeo
  { key: 'Espaço', description: 'Iniciar / Pausar Reprodução do Vídeo', category: 'Vídeo' },
  { key: 'K / S', description: 'Cortar / Dividir Clip no Marcador de Tempo', category: 'Vídeo' },
  { key: 'Shift + S', description: 'Ativar / Desativar Magnetismo do Timeline', category: 'Vídeo' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');

  if (!isOpen) return null;

  const categories = ['Todas', 'Geral', 'Pintura', 'Vetores', '3D Render', 'Apresentação', 'Documentos', 'Vídeo'];

  const filtered = ALL_SHORTCUTS.filter((item) => {
    const matchesSearch =
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategory === 'Todas' || item.category === activeCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 rounded-xl border border-indigo-500/30 text-indigo-400">
              <Keyboard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Guia de Atalhos de Teclado
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </h2>
              <p className="text-xs text-slate-400">
                Aumente sua produtividade na criação e edição rápida
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

        {/* Filter Controls */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar atalho (ex: pincel, desfazer, render...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Shortcuts Table */}
        <div className="p-6 overflow-y-auto flex-1 space-y-2">
          {filtered.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-8">Nenhum atalho encontrado.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((shortcut, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-200">
                      {shortcut.description}
                    </span>
                    <span className="text-[10px] text-slate-500">{shortcut.category}</span>
                  </div>
                  <kbd className="px-2.5 py-1 bg-slate-800 border border-slate-700/80 rounded-lg font-mono text-[11px] text-cyan-300 font-bold shadow-sm whitespace-nowrap">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between text-xs text-slate-400">
          <span>Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-[10px] text-slate-200">Esc</kbd> para fechar</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
