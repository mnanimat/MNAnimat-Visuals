import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import {
  Presentation,
  Plus,
  Trash2,
  Copy,
  Play,
  Type,
  Square,
  Image as ImageIcon,
  Video,
  Palette,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Download,
  FileCode,
  FileText,
  Printer,
  Move,
  Wand2,
  Layers,
  Sparkle,
} from 'lucide-react';
import { Slide, SlideElement } from '../../types';

export type TransitionType = 'fade' | 'slide_right' | 'zoom' | 'flip';
export type ElementAnimationType = 'fade_in' | 'bounce' | 'scale_up' | 'slide_top';

export type PaperSizeType = '1920x1080' | 'A4' | 'A3';

export interface ExtendedSlideElement extends SlideElement {
  animation?: ElementAnimationType;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  isHeading?: boolean;
}

export interface ExtendedSlide extends Omit<Slide, 'elements'> {
  transition?: TransitionType;
  elements: ExtendedSlideElement[];
}

export const PresentationStudio: React.FC = () => {
  const [paperSize, setPaperSize] = useState<PaperSizeType>('1920x1080');
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  const showShortcutToast = (msg: string) => {
    setShortcutToast(msg);
    setTimeout(() => setShortcutToast(null), 2500);
  };

  const [slides, setSlides] = useState<ExtendedSlide[]>([
    {
      id: 'slide_1',
      title: 'Apresentação de Projeto Criativo',
      background: 'bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900',
      transition: 'zoom',
      notes: 'Destacar o uso do Google Drive para sincronização e os novos módulos de apresentação.',
      elements: [
        {
          id: 'el_1',
          type: 'text',
          content: 'MNAnimat Visuals 2026',
          x: 80,
          y: 60,
          width: 650,
          height: 80,
          fontSize: 34,
          color: '#38bdf8',
          animation: 'bounce',
          isBold: true,
          isHeading: true,
        },
        {
          id: 'el_2',
          type: 'text',
          content: 'Plataforma Criativa Completa em Nuvem com Animação, Mídia e Apresentações',
          x: 80,
          y: 150,
          width: 650,
          height: 80,
          fontSize: 18,
          color: '#94a3b8',
          animation: 'fade_in',
        },
      ],
    },
  ]);

  const [activeSlideId, setActiveSlideId] = useState<string>('slide_1');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [draggingElId, setDraggingElId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentPlayIndex, setCurrentPlayIndex] = useState<number>(0);

  // Commercial-use Icon Library modal state
  const [showIconLibrary, setShowIconLibrary] = useState<boolean>(false);

  // Commercial Vector Icons
  const COMMERCIAL_ICONS = [
    { name: 'Foguete (Startup)', icon: '🚀', category: 'Inovação' },
    { name: 'Troféu (Sucesso)', icon: '🏆', category: 'Conquistas' },
    { name: 'Gráfico (Crescimento)', icon: '📈', category: 'Negócios' },
    { name: 'Escudo (Segurança)', icon: '🛡️', category: 'Tecnologia' },
    { name: 'Lâmpada (Ideias)', icon: '💡', category: 'Inovação' },
    { name: 'Globo (Alcance)', icon: '🌐', category: 'Negócios' },
    { name: 'Maleta (Corporativo)', icon: '💼', category: 'Corporativo' },
    { name: 'Alvo (Objetivos)', icon: '🎯', category: 'Estratégia' },
    { name: 'Coroa (Liderança)', icon: '👑', category: 'Conquistas' },
    { name: 'Engrenagem (Sistemas)', icon: '⚙️', category: 'Tecnologia' },
    { name: 'Equipe (Pessoas)', icon: '👥', category: 'Corporativo' },
    { name: 'Raio (Velocidade)', icon: '⚡', category: 'Inovação' },
  ];

  const insertIconToSlide = (symbol: string, label: string) => {
    const newEl: ExtendedSlideElement = {
      id: `el_icon_${Date.now()}`,
      type: 'text',
      content: `${symbol} ${label}`,
      x: 250,
      y: 200,
      width: 300,
      height: 60,
      fontSize: 28,
      color: '#38bdf8',
      animation: 'scale_up',
    };
    setSlides((prev) =>
      prev.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s))
    );
    setSelectedElementId(newEl.id);
    setShowIconLibrary(false);
  };

  // Preset Presentation Templates
  const applyPresentationTemplate = (type: 'pitch' | 'corporate' | 'portfolio' | 'education') => {
    let templateSlides: ExtendedSlide[] = [];

    if (type === 'pitch') {
      templateSlides = [
        {
          id: 'tpl_1',
          title: 'Pitch Deck Startup',
          background: 'bg-gradient-to-tr from-slate-950 via-indigo-950 to-slate-900',
          transition: 'zoom',
          elements: [
            { id: 't1_1', type: 'text', content: '🚀 Startup Tech Vision 2026', x: 80, y: 80, width: 680, height: 70, fontSize: 36, color: '#38bdf8', animation: 'bounce' },
            { id: 't1_2', type: 'text', content: 'Transformando a criação de mídia digital com IA & Ferramentas Vetoriais', x: 80, y: 170, width: 680, height: 60, fontSize: 18, color: '#cbd5e1', animation: 'fade_in' },
          ],
        },
        {
          id: 'tpl_2',
          title: 'O Problema & A Solução',
          background: 'bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950',
          transition: 'slide_right',
          elements: [
            { id: 't2_1', type: 'text', content: '🎯 Problema do Mercado', x: 80, y: 60, width: 650, height: 50, fontSize: 26, color: '#f43f5e', animation: 'slide_top' },
            { id: 't2_2', type: 'text', content: '💡 Nossa Solução Integrada MNAnimat', x: 80, y: 220, width: 650, height: 50, fontSize: 26, color: '#22c55e', animation: 'scale_up' },
          ],
        },
      ];
    } else if (type === 'corporate') {
      templateSlides = [
        {
          id: 'tpl_corp_1',
          title: 'Relatório Executivo',
          background: 'bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950',
          transition: 'fade',
          elements: [
            { id: 'tc_1', type: 'text', content: '📈 Relatório de Desempenho Q1', x: 80, y: 90, width: 650, height: 70, fontSize: 32, color: '#60a5fa', animation: 'fade_in' },
            { id: 'tc_2', type: 'text', content: '💼 Indicadores e Metas Cumpridas', x: 80, y: 180, width: 650, height: 50, fontSize: 20, color: '#94a3b8', animation: 'slide_top' },
          ],
        },
      ];
    } else {
      templateSlides = [
        {
          id: 'tpl_gen_1',
          title: 'Portfólio Criativo Visual',
          background: 'bg-gradient-to-tr from-purple-950 via-slate-950 to-slate-900',
          transition: 'zoom',
          elements: [
            { id: 'tg_1', type: 'text', content: '🎨 Galeria de Projetos Criativos', x: 80, y: 80, width: 650, height: 70, fontSize: 34, color: '#c084fc', animation: 'scale_up' },
          ],
        },
      ];
    }

    setSlides(templateSlides);
    setActiveSlideId(templateSlides[0].id);
  };
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const activeSlide = slides.find((s) => s.id === activeSlideId) || slides[0];

  // Shortcut key listener (CTRL+B, CTRL+I, CTRL+U, CTRL+H)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && selectedElementId) {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          e.preventDefault();
          toggleElementStyle(selectedElementId, 'isBold');
          showShortcutToast('Negrito Ativado [CTRL + B]');
        } else if (key === 'i') {
          e.preventDefault();
          toggleElementStyle(selectedElementId, 'isItalic');
          showShortcutToast('Itálico Ativado [CTRL + I]');
        } else if (key === 'u') {
          e.preventDefault();
          toggleElementStyle(selectedElementId, 'isUnderline');
          showShortcutToast('Sublinhado Ativado [CTRL + U]');
        } else if (key === 'h') {
          e.preventDefault();
          toggleElementStyle(selectedElementId, 'isHeading');
          showShortcutToast('Título Destaque Ativado [CTRL + H]');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, activeSlideId]);

  const toggleElementStyle = (
    elId: string,
    styleProp: 'isBold' | 'isItalic' | 'isUnderline' | 'isHeading'
  ) => {
    setSlides((prev) =>
      prev.map((s) => {
        if (s.id !== activeSlideId) return s;
        return {
          ...s,
          elements: s.elements.map((el) => {
            if (el.id !== elId) return el;
            if (styleProp === 'isHeading') {
              const newIsHeading = !el.isHeading;
              return {
                ...el,
                isHeading: newIsHeading,
                fontSize: newIsHeading ? 36 : 20,
                isBold: newIsHeading ? true : el.isBold,
              };
            }
            return {
              ...el,
              [styleProp]: !el[styleProp],
            };
          }),
        };
      })
    );
  };

  const addAdjustableTextBox = () => {
    const newEl: ExtendedSlideElement = {
      id: `el_textbox_${Date.now()}`,
      type: 'text',
      content: 'Caixa de Texto Ajustável (Edite e Redimensione)',
      x: 180,
      y: 160,
      width: 420,
      height: 120,
      fontSize: 22,
      color: '#38bdf8',
      animation: 'scale_up',
      isBold: false,
      isItalic: false,
    };
    setSlides((prev) =>
      prev.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s))
    );
    setSelectedElementId(newEl.id);
    showShortcutToast('Nova Caixa de Texto Ajustável Adicionada!');
  };

  const exportPresentationPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      slides.forEach((slide, idx) => {
        if (idx > 0) doc.addPage();

        // Dark Background
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

        // Slide Title
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.text(slide.title, 20, 25);

        // Slide Elements
        let textY = 45;
        slide.elements.forEach((el) => {
          if (el.type === 'text') {
            doc.setFontSize(el.fontSize ? Math.min(el.fontSize, 18) : 12);
            doc.setTextColor(el.color === '#ffffff' ? 240 : 56, 189, 248);
            doc.text(el.content, 20, textY);
            textY += 15;
          }
        });

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(148, 163, 184);
        doc.text(`Slide ${idx + 1} de ${slides.length} • Apresentação MNAnimat`, 20, 195);
      });

      doc.save(`Apresentacao_${Date.now()}.pdf`);
      showShortcutToast('Deck de Slides Exportado para PDF! ✓');
    } catch (e) {
      window.print();
    }
  };

  const addSlide = () => {
    const newSlide: ExtendedSlide = {
      id: `slide_${Date.now()}`,
      title: `Slide ${slides.length + 1}`,
      background: 'bg-slate-900',
      transition: 'fade',
      notes: '',
      elements: [
        {
          id: `el_${Date.now()}`,
          type: 'text',
          content: 'Título do Slide',
          x: 80,
          y: 80,
          width: 500,
          height: 60,
          fontSize: 28,
          color: '#ffffff',
          animation: 'scale_up',
        },
      ],
    };
    setSlides([...slides, newSlide]);
    setActiveSlideId(newSlide.id);
  };

  const addMediaElement = (type: 'image' | 'video', url: string) => {
    const newEl: ExtendedSlideElement = {
      id: `el_${Date.now()}`,
      type: type,
      content: url,
      x: 200,
      y: 120,
      width: 360,
      height: 220,
      animation: 'fade_in',
    };
    setSlides((prev) =>
      prev.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s))
    );
    setSelectedElementId(newEl.id);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          addMediaElement(type, evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addTextElement = () => {
    const newEl: ExtendedSlideElement = {
      id: `el_${Date.now()}`,
      type: 'text',
      content: 'Novo Texto Livre',
      x: 100,
      y: 220,
      width: 400,
      height: 50,
      fontSize: 20,
      color: '#e2e8f0',
      animation: 'slide_top',
    };
    setSlides((prev) =>
      prev.map((s) => (s.id === activeSlideId ? { ...s, elements: [...s.elements, newEl] } : s))
    );
    setSelectedElementId(newEl.id);
  };

  // Pointer Drag Handlers for Free Positioning
  const handlePointerDownEl = (e: React.PointerEvent, el: ExtendedSlideElement) => {
    e.stopPropagation();
    setSelectedElementId(el.id);
    setDraggingElId(el.id);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveEl = (e: React.PointerEvent, canvasRect: DOMRect | null) => {
    if (!draggingElId || !canvasRect) return;

    const newX = Math.max(0, Math.min(canvasRect.width - 100, e.clientX - canvasRect.left - dragOffset.x));
    const newY = Math.max(0, Math.min(canvasRect.height - 50, e.clientY - canvasRect.top - dragOffset.y));

    setSlides((prev) =>
      prev.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) => (el.id === draggingElId ? { ...el, x: newX, y: newY } : el)),
            }
          : s
      )
    );
  };

  const handlePointerUpEl = (e: React.PointerEvent) => {
    if (draggingElId) {
      setDraggingElId(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const updateSelectedAnimation = (anim: ElementAnimationType) => {
    if (!selectedElementId) return;
    setSlides((prev) =>
      prev.map((s) =>
        s.id === activeSlideId
          ? {
              ...s,
              elements: s.elements.map((el) => (el.id === selectedElementId ? { ...el, animation: anim } : el)),
            }
          : s
      )
    );
  };

  const updateSlideTransition = (trans: TransitionType) => {
    setSlides((prev) =>
      prev.map((s) => (s.id === activeSlideId ? { ...s, transition: trans } : s))
    );
  };

  const exportPdfPrint = () => {
    window.print();
  };

  const exportPdfNormal = () => {
    exportPresentationPDF();
  };

  const activeElement = activeSlide.elements.find((el) => el.id === selectedElementId);

  return (
    <div className="flex-1 flex bg-[#0a0a0a] overflow-hidden text-gray-300 select-none">
      {/* CSS Animation Keyframes Injector */}
      <style>{`
        @keyframes animFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes animBounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-15px); }
          60% { transform: translateY(-7px); }
        }
        @keyframes animScaleUp {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes animSlideTop {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .anim-fade_in { animation: animFadeIn 0.8s ease-out forwards; }
        .anim-bounce { animation: animBounce 1s ease-out forwards; }
        .anim-scale_up { animation: animScaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        .anim-slide_top { animation: animSlideTop 0.7s ease-out forwards; }

        .trans-fade { animation: animFadeIn 0.5s ease-in-out; }
        .trans-slide_right { animation: animSlideTop 0.5s ease-out; }
        .trans-zoom { animation: animScaleUp 0.5s ease-out; }
      `}</style>

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

          <div className="space-y-2 overflow-y-auto max-h-[55vh] pr-1">
            {slides.map((slide, idx) => {
              const isActive = slide.id === activeSlideId;
              return (
                <div
                  key={slide.id}
                  onClick={() => {
                    setActiveSlideId(slide.id);
                    setSelectedElementId(null);
                  }}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 border-cyan-400/80 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-400 font-mono">#{idx + 1}</span>
                    <span className="text-gray-200 truncate max-w-[120px]">{slide.title}</span>
                  </div>
                  <div className={`w-full h-16 rounded ${slide.background} border border-white/10 p-2 overflow-hidden flex flex-col justify-center`}>
                    <span className="text-[10px] font-bold text-cyan-300 truncate">
                      {slide.elements[0]?.content || 'Slide Sem Título'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            if (slides.length <= 1) return;
            setSlides((prev) => prev.filter((s) => s.id !== activeSlideId));
            setActiveSlideId(slides[0].id);
          }}
          className="w-full py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Excluir Slide</span>
        </button>
      </aside>

      {/* Main Slide Editor */}
      <div className="flex-1 flex flex-col bg-[#111111] overflow-hidden">
        {/* Top Toolbar */}
        <div className="bg-[#161616] border-b border-white/10 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={addAdjustableTextBox}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow transition-all"
              title="Inserir Caixa de Texto Livre com Ajuste de Tamanho"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Caixa de Texto Ajustável</span>
            </button>

            {/* Paper Size Selection */}
            <div className="flex items-center gap-1.5 text-xs bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
              <span className="text-gray-400 font-semibold">Tamanho da Folha:</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as PaperSizeType)}
                className="bg-black border border-slate-700 text-cyan-300 font-bold rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="1920x1080">1920x1080 (Widescreen 16:9)</option>
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="A3">A3 (297 x 420 mm)</option>
              </select>
            </div>

            {/* Media Upload Buttons */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-[#222222] hover:bg-[#2a2a2a] border border-white/10 rounded-lg text-xs font-medium text-gray-200 cursor-pointer">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imagem</span>
              <input type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} className="hidden" />
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-[#222222] hover:bg-[#2a2a2a] border border-white/10 rounded-lg text-xs font-medium text-gray-200 cursor-pointer">
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>Vídeo</span>
              <input type="file" accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} className="hidden" />
            </label>

            <button
              onClick={() => setShowIconLibrary(true)}
              className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-700/80 hover:bg-indigo-900 rounded-lg text-xs font-bold flex items-center gap-1.5 text-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ícones Comerciais</span>
            </button>

            {/* Modelos de Apresentação Dropdown */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400 font-semibold">Modelos:</span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    applyPresentationTemplate(e.target.value as any);
                    e.target.value = '';
                  }
                }}
                className="bg-black border border-white/10 text-amber-300 font-semibold rounded px-2 py-1 focus:outline-none"
              >
                <option value="">-- Carregar Modelo --</option>
                <option value="pitch">Pitch Deck Startup</option>
                <option value="corporate">Relatório Corporativo</option>
                <option value="portfolio">Portfólio Criativo</option>
              </select>
            </div>

            <div className="h-4 w-[1px] bg-white/10 mx-1" />

            {/* Slide Transition Selection */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-gray-400">Transição:</span>
              <select
                value={activeSlide.transition || 'fade'}
                onChange={(e) => updateSlideTransition(e.target.value as TransitionType)}
                className="bg-black border border-white/10 text-cyan-300 font-semibold rounded px-2 py-1 focus:outline-none"
              >
                <option value="fade">Fade Suave</option>
                <option value="slide_right">Slide Lateral</option>
                <option value="zoom">Zoom em Destaque</option>
                <option value="flip">Flip 3D</option>
              </select>
            </div>

            {/* Element Animation Selection */}
            {selectedElementId && (
              <div className="flex items-center gap-1.5 text-xs bg-indigo-950/60 p-1 rounded border border-indigo-800">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-indigo-200 font-semibold">Animação Objeto:</span>
                <select
                  value={activeElement?.animation || 'fade_in'}
                  onChange={(e) => updateSelectedAnimation(e.target.value as ElementAnimationType)}
                  className="bg-black border border-indigo-700 text-amber-300 font-bold rounded px-2 py-0.5 focus:outline-none"
                >
                  <option value="fade_in">Fade In</option>
                  <option value="bounce">Quicar (Bounce)</option>
                  <option value="scale_up">Aumentar Escala</option>
                  <option value="slide_top">Subir da Base</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPdfPrint}
              title="PDF para Impressão com Altas Margens"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>PDF Impressão</span>
            </button>

            <button
              onClick={exportPdfNormal}
              title="PDF Digital para Visualização"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>PDF Normal</span>
            </button>

            <button
              onClick={() => {
                setCurrentPlayIndex(slides.findIndex((s) => s.id === activeSlideId));
                setIsPlaying(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-lg text-xs shadow-lg transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Apresentar</span>
            </button>
          </div>
        </div>

        {/* Canvas Display with Free Element Positioning & Dragging */}
        <div
          className="flex-1 p-8 flex items-center justify-center overflow-auto relative"
          onPointerMove={(e) => {
            const canvasEl = document.getElementById('slide_canvas_box');
            if (canvasEl) {
              handlePointerMoveEl(e, canvasEl.getBoundingClientRect());
            }
          }}
        >
          {/* Floating Keyboard Shortcuts Hint Badge */}
          <div className="absolute top-3 left-4 bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3">
            <span className="font-bold text-slate-200">Atalhos de Teclado:</span>
            <span><strong className="text-cyan-300">CTRL+B</strong> Negrito</span>
            <span><strong className="text-cyan-300">CTRL+I</strong> Itálico</span>
            <span><strong className="text-cyan-300">CTRL+U</strong> Sublinhado</span>
            <span><strong className="text-cyan-300">CTRL+H</strong> Título</span>
          </div>

          <div
            id="slide_canvas_box"
            onClick={() => setSelectedElementId(null)}
            style={{
              width: paperSize === '1920x1080' ? '880px' : paperSize === 'A4' ? '580px' : '720px',
              height: paperSize === '1920x1080' ? '495px' : paperSize === 'A4' ? '820px' : '1018px',
            }}
            className={`rounded-2xl ${activeSlide.background} border border-white/10 shadow-2xl relative overflow-hidden p-8 flex flex-col justify-start transition-all duration-300 trans-${activeSlide.transition}`}
          >
            {activeSlide.elements.map((el) => {
              const isSelected = el.id === selectedElementId;
              return (
                <div
                  key={el.id}
                  onPointerDown={(e) => handlePointerDownEl(e, el)}
                  onPointerUp={handlePointerUpEl}
                  style={{
                    position: 'absolute',
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: el.height ? `${el.height}px` : 'auto',
                  }}
                  className={`group cursor-move transition-all rounded p-1 select-none anim-${el.animation || 'fade_in'} ${
                    isSelected ? 'ring-2 ring-cyan-400 bg-cyan-950/30' : 'hover:ring-1 hover:ring-indigo-400/50'
                  }`}
                >
                  <div className="absolute -top-6 left-0 bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 flex items-center gap-1 pointer-events-none z-10">
                    <Move className="w-3 h-3" /> Arraste para Mover (Caixa Ajustável)
                  </div>

                  {el.type === 'text' ? (
                    <textarea
                      value={el.content}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSlides((prev) =>
                          prev.map((s) =>
                            s.id === activeSlideId
                              ? {
                                  ...s,
                                  elements: s.elements.map((item) =>
                                    item.id === el.id ? { ...item, content: val } : item
                                  ),
                                }
                              : s
                          )
                        );
                      }}
                      className="w-full h-full bg-transparent focus:outline-none resize-none leading-relaxed"
                      style={{
                        color: el.color || '#ffffff',
                        fontSize: el.isHeading ? '36px' : `${el.fontSize || 20}px`,
                        fontWeight: el.isBold || el.isHeading ? 'bold' : 'normal',
                        fontStyle: el.isItalic ? 'italic' : 'normal',
                        textDecoration: el.isUnderline ? 'underline' : 'none',
                      }}
                    />
                  ) : el.type === 'image' ? (
                    <img
                      src={el.content}
                      alt="Elemento de Mídia"
                      className="w-full h-auto max-h-[300px] object-cover rounded-xl shadow-xl pointer-events-none"
                    />
                  ) : (
                    <video
                      src={el.content}
                      controls
                      className="w-full h-auto max-h-[300px] rounded-xl shadow-xl"
                    />
                  )}

                  {/* Corner Resize Grip */}
                  {isSelected && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyan-400 rounded-full border border-white shadow" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Floating Shortcut Action Toast */}
        {shortcutToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/80 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{shortcutToast}</span>
          </div>
        )}

        {/* Bottom Speaker Notes Drawer */}
        <div className="h-28 bg-[#161616] border-t border-white/10 p-3 flex flex-col justify-between shrink-0">
          <span className="text-xs font-bold text-gray-400 block mb-1">Anotações do Apresentador:</span>
          <textarea
            value={activeSlide.notes || ''}
            onChange={(e) => {
              const val = e.target.value;
              setSlides((prev) =>
                prev.map((s) => (s.id === activeSlideId ? { ...s, notes: val } : s))
              );
            }}
            placeholder="Digite suas notas para este slide..."
            className="w-full h-14 bg-black border border-white/10 rounded-lg p-2.5 text-xs text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Fullscreen Presentation Mode Modal with Animations */}
      {isPlaying && (
        <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-8 animate-in fade-in duration-300">
          <button
            onClick={() => setIsPlaying(false)}
            className="absolute top-6 right-6 p-3 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full border border-slate-700 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className={`w-[1100px] h-[650px] rounded-2xl ${slides[currentPlayIndex].background} border border-slate-800 shadow-2xl p-12 relative overflow-hidden trans-${slides[currentPlayIndex].transition || 'fade'}`}
          >
            {slides[currentPlayIndex].elements.map((el) => (
              <div
                key={el.id}
                style={{
                  position: 'absolute',
                  left: `${el.x * 1.3}px`,
                  top: `${el.y * 1.3}px`,
                  width: `${el.width * 1.3}px`,
                }}
                className={`font-bold leading-relaxed anim-${el.animation || 'fade_in'}`}
              >
                {el.type === 'text' ? (
                  <span style={{ color: el.color || '#ffffff', fontSize: `${(el.fontSize || 20) * 1.3}px` }}>
                    {el.content}
                  </span>
                ) : el.type === 'image' ? (
                  <img src={el.content} alt="Apresentação" className="w-full rounded-xl shadow-2xl" />
                ) : (
                  <video src={el.content} autoPlay controls className="w-full rounded-xl shadow-2xl" />
                )}
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
              onClick={() => setCurrentPlayIndex((prev) => Math.min(slides.length - 1, prev + 1))}
              disabled={currentPlayIndex === slides.length - 1}
              className="p-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-30 rounded-full text-white border border-slate-700"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
      {/* Icon Library Modal */}
      {showIconLibrary && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-[#141416] border border-white/10 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Biblioteca de Ícones para Uso Comercial
              </h3>
              <button
                onClick={() => setShowIconLibrary(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Selecione um ícone vetorial de alta qualidade para inserir instantaneamente no slide ativo:
            </p>

            <div className="grid grid-cols-3 gap-3 max-h-[50vh] overflow-y-auto pr-1">
              {COMMERCIAL_ICONS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => insertIconToSlide(item.icon, item.name)}
                  className="p-3 bg-white/5 hover:bg-indigo-600/20 border border-white/10 hover:border-cyan-400/80 rounded-xl flex flex-col items-center justify-center gap-2 text-center group transition-all"
                >
                  <span className="text-3xl group-hover:scale-125 transition-transform">{item.icon}</span>
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-cyan-300">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">{item.category}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
