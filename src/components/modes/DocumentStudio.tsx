import React, { useState } from 'react';
import jsPDF from 'jspdf';
import {
  FileText,
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  List,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  Video,
  Printer,
  Globe,
  Code,
  FileCode,
  Move,
  Trash2,
} from 'lucide-react';

export interface FloatingDocumentMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type DocPaperSizeType = 'A4' | 'A3' | '1920x1080';

export interface AdjustableTextBox {
  id: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  isBold?: boolean;
  isItalic?: boolean;
}

export const DocumentStudio: React.FC = () => {
  const [docTitle, setDocTitle] = useState<string>('Documento_Tecnico_Especificacao');
  const [paperSize, setPaperSize] = useState<DocPaperSizeType>('A4');
  const [shortcutToast, setShortcutToast] = useState<string | null>(null);

  const showShortcutToast = (msg: string) => {
    setShortcutToast(msg);
    setTimeout(() => setShortcutToast(null), 2500);
  };

  const [content, setContent] = useState<string>(
    `# Especificação do Projeto MNAnimat Visuals\n\n## Visão Geral\nO MNAnimat Visuals é uma plataforma completa e integrada para equipes criativas modernas. Desenvolvido com aceleração local de GPU, o software oferece ferramentas avançadas de pintura digital, animação 2D, vetores, 3D, vídeo, planilhas e documentos.\n\n## Módulos Principais:\n- **Pintura Digital**: Suporte completo a sensibilidade de pressão (stylus), pincéis com física de tinta, camadas e modos de mesclagem avançados.\n- **Vetores**: Módulo técnico para modelagem bidimensional com cotas, logos, cartoons e arte vetorial.\n- **Animação 2D**: Keyframes, Onion Skinning e suporte a taxas de quadros personalizadas.\n- **Renderizador 3D**: Motor WebGL acoplado para renderização de cenas tridimensionais com iluminação direcional, pontual e ambiente.\n\n> "A sincronização direta com o Google Drive e Cloudflare R2 garante que todo o fluxo de trabalho permaneça seguro e altamente escalável."`
  );

  const [textBoxes, setTextBoxes] = useState<AdjustableTextBox[]>([
    {
      id: 'tb_1',
      content: 'Caixa de Texto Ajustável (Arraste e Edite)',
      x: 480,
      y: 260,
      width: 280,
      height: 100,
      fontSize: 16,
      color: '#38bdf8',
      isBold: true,
    },
  ]);

  // Keyboard shortcut listener (CTRL+B, CTRL+I, CTRL+U, CTRL+H)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'b') {
          e.preventDefault();
          setContent((prev) => prev + '\n**Texto em Negrito**');
          showShortcutToast('Negrito Aplicado no Documento [CTRL + B]');
        } else if (key === 'i') {
          e.preventDefault();
          setContent((prev) => prev + '\n*Texto em Itálico*');
          showShortcutToast('Itálico Aplicado no Documento [CTRL + I]');
        } else if (key === 'u') {
          e.preventDefault();
          setContent((prev) => prev + '\n<u>Texto Sublinhado</u>');
          showShortcutToast('Sublinhado Aplicado no Documento [CTRL + U]');
        } else if (key === 'h') {
          e.preventDefault();
          setContent((prev) => prev + '\n# Título de Destaque');
          showShortcutToast('Título de Destaque Aplicado [CTRL + H]');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addAdjustableTextBox = () => {
    const newTb: AdjustableTextBox = {
      id: `tb_${Date.now()}`,
      content: 'Nova Caixa de Texto Livre',
      x: 120,
      y: 180,
      width: 300,
      height: 110,
      fontSize: 16,
      color: '#f59e0b',
    };
    setTextBoxes((prev) => [...prev, newTb]);
    showShortcutToast('Nova Caixa de Texto Ajustável Inserida!');
  };

  const [mediaList, setMediaList] = useState<FloatingDocumentMedia[]>([
    {
      id: 'demo_img_1',
      type: 'image',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      x: 480,
      y: 60,
      width: 260,
      height: 180,
    },
  ]);

  const [draggingMediaId, setDraggingMediaId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charsCount = content.length;
  const readingTime = Math.ceil(wordsCount / 200);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setMediaList((prev) => [
            ...prev,
            {
              id: `media_${Date.now()}`,
              type,
              url: evt.target.result as string,
              x: 100,
              y: 200,
              width: 300,
              height: 200,
            },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePointerDownMedia = (e: React.PointerEvent, m: FloatingDocumentMedia) => {
    e.stopPropagation();
    setDraggingMediaId(m.id);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveMedia = (e: React.PointerEvent, canvasRect: DOMRect | null) => {
    if (!draggingMediaId || !canvasRect) return;

    const newX = Math.max(0, Math.min(canvasRect.width - 100, e.clientX - canvasRect.left - dragOffset.x));
    const newY = Math.max(0, Math.min(canvasRect.height - 100, e.clientY - canvasRect.top - dragOffset.y));

    setMediaList((prev) =>
      prev.map((item) => (item.id === draggingMediaId ? { ...item, x: newX, y: newY } : item))
    );
  };

  const handlePointerUpMedia = (e: React.PointerEvent) => {
    if (draggingMediaId) {
      setDraggingMediaId(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  const removeMedia = (id: string) => {
    setMediaList((prev) => prev.filter((m) => m.id !== id));
  };

  const exportPdfPrint = () => {
    window.print();
  };

  const exportPdfDigital = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: paperSize === 'A3' ? 'a3' : 'a4',
      });

      // Dark Banner Header
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 30, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(docTitle.toUpperCase(), 15, 18);

      doc.setFontSize(9);
      doc.setTextColor(56, 189, 248);
      doc.text('MNAnimat Document Studio • PDF Export', 15, 25);

      // Body Content
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      const textLines = doc.splitTextToSize(content, doc.internal.pageSize.getWidth() - 30);
      doc.text(textLines, 15, 42);

      // Add Text Boxes
      let currentY = 120;
      textBoxes.forEach((tb) => {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 20, 'F');
        doc.setDrawColor(2, 132, 199);
        doc.rect(15, currentY, doc.internal.pageSize.getWidth() - 30, 20, 'S');

        doc.setFont('helvetica', tb.isBold ? 'bold' : 'normal');
        doc.setFontSize(tb.fontSize || 10);
        doc.setTextColor(15, 23, 42);
        doc.text(tb.content, 20, currentY + 12);
        currentY += 26;
      });

      doc.save(`${docTitle}.pdf`);
      showShortcutToast('PDF exportado com sucesso! ✓');
    } catch (err) {
      window.print();
    }
  };

  const exportHtmlCssJs = () => {
    const fullBundle = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #ffffff; color: #1e293b; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 20px; position: relative; }
    h1 { color: #0284c7; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    h2 { color: #4f46e5; margin-top: 24px; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 16px; color: #64748b; font-style: italic; }
    img, video { border-radius: 12px; shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <div id="content">
    ${content.replace(/\n/g, '<br/>')}
  </div>
  ${mediaList
    .map(
      (m) => `
    <div style="position: absolute; left: ${m.x}px; top: ${m.y}px; width: ${m.width}px;">
      ${m.type === 'image' ? `<img src="${m.url}" style="width: 100%;" />` : `<video src="${m.url}" controls style="width: 100%;"></video>`}
    </div>`
    )
    .join('')}
  <script>
    console.log('Documento e mídias livres carregados com sucesso!');
  </script>
</body>
</html>`;
    const blob = new Blob([fullBundle], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${docTitle}_bundle.html`;
    a.click();
  };

  return (
    <div className="flex-1 flex bg-[#0a0a0a] overflow-hidden text-gray-300 select-none">
      {/* Main Document Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Formatting Toolbar */}
        <div className="bg-[#161616] border-b border-white/10 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-3 py-1 text-xs text-gray-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-56"
            />

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-white/10">
              <button
                onClick={() => setContent((prev) => prev + '\n**Texto em Negrito**')}
                title="Negrito"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n*Texto em Itálico*')}
                title="Itálico"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n# Título 1')}
                title="Título 1"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n## Título 2')}
                title="Título 2"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n- Item de lista')}
                title="Lista"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n> Citação')}
                title="Citação"
                className="p-1 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-white/10" />

            {/* Adjustable Text Box Insert Button */}
            <button
              onClick={addAdjustableTextBox}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow transition-all"
              title="Inserir Caixa de Texto Livre com Ajuste de Tamanho"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Caixa de Texto Ajustável</span>
            </button>

            {/* Paper Size Selector */}
            <div className="flex items-center gap-1.5 text-xs bg-black px-2 py-1 rounded-lg border border-white/10">
              <span className="text-gray-400 font-semibold">Folha:</span>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as DocPaperSizeType)}
                className="bg-slate-900 border border-slate-700 text-cyan-300 font-bold rounded px-2 py-0.5 focus:outline-none"
              >
                <option value="A4">A4 (210 x 297 mm)</option>
                <option value="A3">A3 (297 x 420 mm)</option>
                <option value="1920x1080">1920x1080 Widescreen</option>
              </select>
            </div>

            {/* Media Upload Buttons for Free Positioning */}
            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 cursor-pointer transition-colors">
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>Imagem Livre</span>
              <input type="file" accept="image/*" onChange={(e) => handleMediaUpload(e, 'image')} className="hidden" />
            </label>

            <label className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg border border-slate-700 cursor-pointer transition-colors">
              <Video className="w-3.5 h-3.5 text-rose-400" />
              <span>Vídeo Livre</span>
              <input type="file" accept="video/*" onChange={(e) => handleMediaUpload(e, 'video')} className="hidden" />
            </label>
          </div>

          {/* Export Options */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportPdfPrint}
              title="PDF para Impressão com Altas Margens"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>PDF Impressão</span>
            </button>

            <button
              onClick={exportPdfDigital}
              title="PDF para Apresentação Digital"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>PDF Digital</span>
            </button>

            <button
              onClick={exportHtmlCssJs}
              title="Exportar em Pacote HTML + CSS + JS"
              className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow transition-colors"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>HTML, CSS & JS</span>
            </button>
          </div>
        </div>

        {/* Paper Canvas with Free Floating Images and Text Boxes */}
        <div
          className="flex-1 bg-[#111111] p-8 overflow-y-auto flex justify-center relative"
          onPointerMove={(e) => {
            const paperEl = document.getElementById('document_paper_canvas');
            if (paperEl) {
              handlePointerMoveMedia(e, paperEl.getBoundingClientRect());
            }
          }}
        >
          {/* Floating Shortcuts Hint Badge */}
          <div className="absolute top-3 left-4 bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-3 z-30">
            <span className="font-bold text-slate-200">Atalhos no Texto:</span>
            <span><strong className="text-cyan-300">CTRL+B</strong> Negrito</span>
            <span><strong className="text-cyan-300">CTRL+I</strong> Itálico</span>
            <span><strong className="text-cyan-300">CTRL+U</strong> Sublinhado</span>
            <span><strong className="text-cyan-300">CTRL+H</strong> Título</span>
          </div>

          <div
            id="document_paper_canvas"
            style={{
              width: paperSize === 'A4' ? '800px' : paperSize === 'A3' ? '980px' : '1100px',
              minHeight: paperSize === 'A4' ? '980px' : paperSize === 'A3' ? '1280px' : '620px',
            }}
            className="bg-[#161616] border border-white/10 rounded-2xl p-10 shadow-2xl relative overflow-hidden flex flex-col space-y-4 transition-all duration-300"
          >
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-transparent text-gray-200 font-sans leading-relaxed text-sm focus:outline-none resize-none min-h-[600px] z-10"
              placeholder="Comece a digitar seu documento profissional..."
            />

            {/* Draggable Adjustable Text Boxes */}
            {textBoxes.map((tb) => (
              <div
                key={tb.id}
                style={{
                  position: 'absolute',
                  left: `${tb.x}px`,
                  top: `${tb.y}px`,
                  width: `${tb.width}px`,
                  height: `${tb.height}px`,
                }}
                className="group cursor-move z-20 border border-cyan-500/60 p-2 rounded-xl bg-slate-950/80 backdrop-blur-md shadow-2xl select-none"
              >
                <div className="absolute -top-6 left-0 bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 flex items-center gap-1 pointer-events-none z-30">
                  <Move className="w-3 h-3" /> Arraste para Mover
                </div>
                <textarea
                  value={tb.content}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTextBoxes((prev) =>
                      prev.map((item) => (item.id === tb.id ? { ...item, content: val } : item))
                    );
                  }}
                  className="w-full h-full bg-transparent focus:outline-none resize-none leading-relaxed text-xs font-semibold"
                  style={{ color: tb.color, fontWeight: tb.isBold ? 'bold' : 'normal' }}
                />
              </div>
            ))}

            {/* Floating Draggable Images/Videos over the Document */}
            {mediaList.map((m) => (
              <div
                key={m.id}
                onPointerDown={(e) => handlePointerDownMedia(e, m)}
                onPointerUp={handlePointerUpMedia}
                style={{
                  position: 'absolute',
                  left: `${m.x}px`,
                  top: `${m.y}px`,
                  width: `${m.width}px`,
                }}
                className="group cursor-move z-20 border-2 border-transparent hover:border-cyan-400 p-1 rounded-xl bg-slate-900/60 backdrop-blur-sm shadow-2xl transition-all select-none"
              >
                <div className="absolute -top-7 left-0 right-0 bg-slate-950/90 border border-slate-700 text-[10px] text-cyan-300 px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-between shadow">
                  <span className="flex items-center gap-1 font-bold">
                    <Move className="w-3 h-3" /> Mover livremente
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMedia(m.id);
                    }}
                    className="p-0.5 text-rose-400 hover:text-white hover:bg-rose-600/80 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {m.type === 'image' ? (
                  <img
                    src={m.url}
                    alt="Imagem Livre"
                    className="w-full h-auto max-h-[260px] object-cover rounded-lg shadow-md pointer-events-none"
                  />
                ) : (
                  <video src={m.url} controls className="w-full h-auto max-h-[260px] rounded-lg shadow-md" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Floating Shortcut Toast Notification */}
        {shortcutToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-cyan-500/80 text-cyan-300 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>{shortcutToast}</span>
          </div>
        )}

        {/* Document Stats Footer */}
        <div className="bg-[#161616] border-t border-white/10 px-6 py-2 flex items-center justify-between text-xs text-gray-400 font-mono shrink-0">
          <div className="flex items-center gap-4">
            <span>{wordsCount} Palavras</span>
            <span>{charsCount} Caracteres</span>
            <span>~{readingTime} min de leitura</span>
            <span className="text-cyan-400 font-sans font-semibold">({mediaList.length} mídias posicionadas)</span>
          </div>
          <span className="text-emerald-400 flex items-center gap-1 font-sans font-medium text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sincronizado no Google Drive
          </span>
        </div>
      </div>
    </div>
  );
};
