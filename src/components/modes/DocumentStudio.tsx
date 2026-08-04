import React, { useState } from 'react';
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
} from 'lucide-react';

export const DocumentStudio: React.FC = () => {
  const [docTitle, setDocTitle] = useState<string>('Documento_Tecnico_Especificacao.docx');
  const [content, setContent] = useState<string>(
    `# Especificação do Projeto AetherStudio\n\n## Visão Geral\nO AetherStudio é uma plataforma completa e integrada para equipes criativas modernas. Desenvolvido com aceleração local de GPU, o software oferece ferramentas avançadas de pintura digital com sensibilidade a pressão de caneta em mesas digitalizadoras.\n\n## Módulos Principais:\n- **Pintura Digital**: Suporte completo a sensibilidade de pressão (stylus), pincéis com física de tinta, camadas e modos de mesclagem avançados.\n- **Vetores Exatos**: Módulo técnico para modelagem bidimensional com cotas e medidas em milímetros, centímetros e polegadas.\n- **Renderizador 3D**: Motor WebGL acoplado para renderização de cenas tridimensionais com materiais PBR e iluminação em tempo real.\n\n> "A sincronização direta com o Google Drive e Cloudflare R2 garante que todo o fluxo de trabalho permaneça seguro e altamente escalável."`
  );

  const wordsCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charsCount = content.length;
  const readingTime = Math.ceil(wordsCount / 200);

  const exportDocument = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docTitle.endsWith('.md') ? docTitle : `${docTitle}.md`;
    link.click();
  };

  return (
    <div className="flex-1 flex bg-[#0a0a0a] overflow-hidden text-gray-300 select-none">
      {/* Main Document Layout */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Formatting Toolbar */}
        <div className="bg-[#161616] border-b border-white/10 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="bg-black border border-white/10 rounded px-3 py-1 text-xs text-gray-200 font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 w-64"
            />

            <div className="h-4 w-[1px] bg-white/10" />

            <div className="flex items-center gap-1 bg-black p-1 rounded border border-white/10">
              <button
                onClick={() => setContent((prev) => prev + '\n**Texto em Negrito**')}
                title="Negrito"
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n*Texto em Itálico*')}
                title="Itálico"
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n# Título 1')}
                title="Título 1"
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Heading1 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n## Título 2')}
                title="Título 2"
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Heading2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n- Item de lista')}
                title="Lista"
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setContent((prev) => prev + '\n> Citação')}
                title="Citação"
                className="p-1.5 text-gray-400 hover:text-white rounded hover:bg-white/10"
              >
                <Quote className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <button
            onClick={exportDocument}
            className="flex items-center gap-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded text-xs shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Documento</span>
          </button>
        </div>

        {/* Paper Canvas */}
        <div className="flex-1 bg-[#111111] p-8 overflow-y-auto flex justify-center">
          <div className="w-[800px] min-h-[900px] bg-[#161616] border border-white/10 rounded-lg p-12 shadow-2xl flex flex-col space-y-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-full bg-transparent text-gray-200 font-sans leading-relaxed text-sm focus:outline-none resize-none min-h-[800px]"
              placeholder="Comece a digitar seu documento profissional..."
            />
          </div>
        </div>

        {/* Document Stats Footer */}
        <div className="bg-[#161616] border-t border-white/10 px-6 py-2 flex items-center justify-between text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-4">
            <span>{wordsCount} Palavras</span>
            <span>{charsCount} Caracteres</span>
            <span>~{readingTime} min de leitura</span>
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
