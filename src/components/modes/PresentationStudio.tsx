import React, { useState } from 'react';
import {
  Presentation,
  Plus,
  Trash2,
  Copy,
  Play,
  Type,
  Square,
  Image as ImageIcon,
  Palette,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Slide, SlideElement } from '../../types';

export const PresentationStudio: React.FC = () => {
  const [slides, setSlides] = useState<Slide[]>([
    {
      id: 'slide_1',
      title: 'Apresentação de Projeto Criativo',
      background: 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900',
      notes: 'Destacar o uso do Google Drive para sincronização e o renderizador 3D.',
      elements: [
        {
          id: 'el_1',
          type: 'text',
          content: 'Lançamento AetherStudio 2026',
          x: 100,
          y: 120,
          width: 600,
          height: 80,
          fontSize: 36,
          color: '#38bdf8',
        },
        {
          id: 'el_2',
          type: 'text',
          content: 'Plataforma Criativa Completa em Nuvem com Colaboração em Tempo Real',
          x: 100,
          y: 220,
          width: 650,
          height: 100,
          fontSize: 18,
          color: '#94a3b8',
        },
      ],
    },
    {
      id: 'slide_2',
      title: 'Principais Recursos & Módulos',
      background: 'bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950',
      notes: 'Explicar a mesa digitalizadora e suporte a pressão de caneta.',
      elements: [
        {
          id: 'el_3',
          type: 'text',
          content: 'Arquitetura Multi-Módulo',
          x: 80,
          y: 80,
          width: 500,
          height: 60,
          fontSize: 28,
          color: '#ffffff',
        },
        {
          id: 'el_4',
          type: 'text',
          content: '• Pintura Digital com Pressão de Caneta\n• Vetores com Medidas Exatas em mm/cm\n• Renderizador 3D Acelerado por GPU\n• Linha do Tempo de Vídeo e Edição Rich-Text',
          x: 80,
          y: 160,
          width: 600,
          height: 200,
          fontSize: 16,
          color: '#cbd5e1',
        },
      ],
    },
  ]);

  const [activeSlideId, setActiveSlideId] = useState<string>('slide_1');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState<number>(0);

  const activeSlide = slides.find((s) => s.id === activeSlideId) || slides[0];

  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      title: `Novo Slide ${slides.length + 1}`,
      background: 'bg-slate-900',
      notes: '',
      elements: [
        {
          id: `el_${Date.now()}`,
          type: 'text',
          content: 'Clique para editar este título',
          x: 100,
          y: 150,
          width: 500,
          height: 60,
          fontSize: 28,
          color: '#ffffff',
        },
      ],
    };
    setSlides((prev) => [...prev, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const deleteActiveSlide = () => {
    if (slides.length <= 1) return;
    setSlides((prev) => prev.filter((s) => s.id !== activeSlideId));
    setActiveSlideId(slides[0].id);
  };

  const addTextElement = () => {
    const newEl: SlideElement = {
      id: `el_${Date.now()}`,
      type: 'text',
      content: 'Novo Texto Adicionado',
      x: 150,
      y: 200,
      width: 400,
      height: 50,
      fontSize: 20,
      color: '#e2e8f0',
    };
    setSlides((prev) =>
      prev.map((s) =>
        s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s
      )
    );
  };

  const updateElementContent = (elementId: string, content: string) => {
    setSlides((prev) =>
      prev.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) =>
                el.id === elementId ? { ...el, content } : el
              ),
            }
          : s
      )
    );
  };

  // Keyboard listener for Presentation Studio
  React.useEffect(() => {
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

      if (e.key === 'F5' || (e.shiftKey && e.key.toLowerCase() === 'p')) {
        e.preventDefault();
        setIsPlaying(true);
        const idx = slides.findIndex((s) => s.id === activeSlideId);
        setCurrentPlayIndex(idx >= 0 ? idx : 0);
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        addSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [slides, activeSlideId]);

  return (
    <div className="flex-1 flex bg-[#0a0a0a] overflow-hidden text-gray-300 select-none">
      {/* Left Sidebar: Slide Deck Thumbnails */}
      <aside className="w-64 bg-[#161616] border-r border-white/10 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Presentation className="w-4 h-4 text-indigo-400" />
              Deck ({slides.length})
            </h3>
            <button
              onClick={addSlide}
              className="p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[60vh] pr-1">
            {slides.map((slide, idx) => {
              const isActive = slide.id === activeSlideId;
              return (
                <div
                  key={slide.id}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`p-2.5 rounded border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-400 font-mono">#{idx + 1}</span>
                    <span className="text-gray-200 truncate max-w-[120px]">
                      {slide.title}
                    </span>
                  </div>
                  {/* Miniature Slide Preview */}
                  <div className={`w-full h-16 rounded ${slide.background} border border-white/10 p-2 overflow-hidden flex flex-col justify-center`}>
                    <span className="text-[10px] font-bold text-indigo-300 truncate">
                      {slide.elements[0]?.content || 'Slide Sem Título'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={deleteActiveSlide}
          className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir Slide</span>
        </button>
      </aside>

      {/* Main Slide Editor */}
      <div className="flex-1 flex flex-col bg-[#111111] overflow-hidden">
        {/* Top Floating Tools */}
        <div className="bg-[#161616] border-b border-white/10 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={addTextElement}
              className="px-3 py-1 bg-[#222222] hover:bg-[#2a2a2a] border border-white/10 rounded text-xs font-medium flex items-center gap-2 text-gray-200"
            >
              <Type className="w-4 h-4 text-indigo-400" />
              <span>Adicionar Caixa de Texto</span>
            </button>
          </div>

          <button
            onClick={() => {
              setCurrentPlayIndex(slides.findIndex((s) => s.id === activeSlideId));
              setIsPlaying(true);
            }}
            className="flex items-center gap-2 px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs shadow transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>Apresentar em Tela Cheia</span>
          </button>
        </div>

        {/* Canvas Display */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto">
          <div
            className={`w-[850px] h-[500px] rounded-lg ${activeSlide.background} border border-white/10 shadow-2xl relative overflow-hidden p-8 flex flex-col justify-start`}
          >
            {activeSlide.elements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x}px`,
                  top: `${el.y}px`,
                  width: `${el.width}px`,
                  color: el.color,
                  fontSize: `${el.fontSize}px`,
                }}
                className="font-sans leading-relaxed group border border-transparent hover:border-indigo-500/50 p-1 rounded transition-colors"
              >
                <textarea
                  value={el.content}
                  onChange={(e) => updateElementContent(el.id, e.target.value)}
                  className="w-full bg-transparent focus:outline-none resize-none font-bold"
                  style={{ color: el.color, fontSize: `${el.fontSize}px` }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Speaker Notes Drawer */}
        <div className="h-28 bg-[#161616] border-t border-white/10 p-4">
          <span className="text-xs font-bold text-gray-400 block mb-1">
            Anotações do Apresentador:
          </span>
          <textarea
            value={activeSlide.notes || ''}
            onChange={(e) => {
              const val = e.target.value;
              setSlides((prev) =>
                prev.map((s) => (s.id === activeSlideId ? { ...s, notes: val } : s))
              );
            }}
            placeholder="Digite suas notas para este slide..."
            className="w-full h-14 bg-black border border-white/10 rounded p-2.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Fullscreen Presentation Mode Modal */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <button
            onClick={() => setIsPlaying(false)}
            className="absolute top-6 right-6 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className={`w-[1100px] h-[650px] rounded-2xl ${slides[currentPlayIndex].background} border border-slate-800 shadow-2xl p-12 relative flex flex-col justify-start`}
          >
            {slides[currentPlayIndex].elements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x * 1.3}px`,
                  top: `${el.y * 1.3}px`,
                  width: `${el.width * 1.3}px`,
                  color: el.color,
                  fontSize: `${(el.fontSize || 20) * 1.3}px`,
                }}
                className="font-bold leading-relaxed"
              >
                {el.content}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-6 mt-6">
            <button
              onClick={() => setCurrentPlayIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentPlayIndex === 0}
              className="p-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-full text-white border border-slate-700"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-bold text-slate-300 font-mono">
              Slide {currentPlayIndex + 1} de {slides.length}
            </span>
            <button
              onClick={() =>
                setCurrentPlayIndex((prev) => Math.min(slides.length - 1, prev + 1))
              }
              disabled={currentPlayIndex === slides.length - 1}
              className="p-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-full text-white border border-slate-700"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
