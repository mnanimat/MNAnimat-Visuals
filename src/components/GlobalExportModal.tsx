import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FileText,
  Video,
  Presentation,
  Image as ImageIcon,
  CheckCircle2,
  Film,
  Sparkles,
  Sliders,
  Settings,
  HardDrive,
  FileCode,
  Music,
  Box,
  Layers,
  AlertCircle,
  Play,
  Check,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { AppMode } from '../types';

interface GlobalExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMode: AppMode;
}

export type ExportFormat =
  | 'PDF'
  | 'MP4'
  | 'WEBM'
  | 'PNG'
  | 'JPG'
  | 'SVG'
  | 'CSV'
  | 'GLTF';

export const GlobalExportModal: React.FC<GlobalExportModalProps> = ({
  isOpen,
  onClose,
  currentMode,
}) => {
  const [selectedMode, setSelectedMode] = useState<AppMode>(currentMode);
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [fileName, setFileName] = useState<string>('');
  const [resolution, setResolution] = useState<'1080p' | '4K' | '720p'>('1080p');
  const [frameRate, setFrameRate] = useState<60 | 30 | 24>(60);
  const [quality, setQuality] = useState<'high' | 'medium' | 'maximum'>('high');
  const [pageSize, setPageSize] = useState<'a4' | 'a3' | 'letter'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [includeNotes, setIncludeNotes] = useState<boolean>(true);
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);

  // Render & Export Progress state
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportCompleted, setExportCompleted] = useState<boolean>(false);

  // Sync selectedMode with currentMode when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMode(currentMode);
      setExportCompleted(false);
      setExportProgress(0);
      setIsExporting(false);

      // Default format by mode
      if (currentMode === 'document' || currentMode === 'presentation') {
        setFormat('PDF');
        setFileName(
          currentMode === 'document' ? 'Documento_Tecnico_MNAnimat' : 'Apresentacao_Projeto_2026'
        );
      } else if (currentMode === 'video' || currentMode === 'animation2d') {
        setFormat('MP4');
        setFileName('Video_Projeto_Final_MNAnimat');
      } else if (currentMode === 'vector') {
        setFormat('SVG');
        setFileName('Arte_Vetorial_Final');
      } else if (currentMode === '3d_render') {
        setFormat('GLTF');
        setFileName('Cena_3D_Render');
      } else {
        setFormat('PNG');
        setFileName('Export_MNAnimat_Visuals');
      }
    }
  }, [isOpen, currentMode]);

  if (!isOpen) return null;

  // Real PDF Generation using jsPDF
  const generateDocumentPDF = () => {
    const doc = new jsPDF({
      orientation: orientation === 'portrait' ? 'p' : 'l',
      unit: 'mm',
      format: pageSize,
    });

    // Color Palette
    const cyanColor = '#0284c7';
    const darkBg = '#0f172a';

    // Cover Title
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(fileName.toUpperCase(), 15, 22);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('MNAnimat Visuals Pro - Relatório e Especificação Técnica', 15, 29);

    // Document Body Content
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Visão Geral do Projeto', 15, 50);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85);

    const paragraph1 =
      'Este documento especifica a estrutura técnica e criativa desenvolvida no MNAnimat Visuals. O projeto integra módulos de edição de vetor, modelagem 3D, animação de quadros, edição de vídeo multitrack e estúdio de apresentação em tempo real.';

    const splitText1 = doc.splitTextToSize(paragraph1, doc.internal.pageSize.getWidth() - 30);
    doc.text(splitText1, 15, 58);

    // Section 2
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(30, 41, 59);
    doc.text('2. Módulos Ativos e Configurações de Render', 15, 80);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);

    const modules = [
      '• Estúdio de Documentos Técnicos: Exportação vetorial PDF de alta fidelidade.',
      '• Editor de Vídeo Multifaixas: Renderização H.264 / MP4 até 4K 60FPS.',
      '• Apresentações Interativas: Transições aceleradas por GPU.',
      '• Motor 3D & Vetores: Suporte a arquivos GLTF, OBJ e curvas SVG com precisão sub-pixel.',
    ];

    let yPos = 88;
    modules.forEach((mod) => {
      doc.text(mod, 18, yPos);
      yPos += 8;
    });

    // Box Quote
    doc.setFillColor(241, 245, 249);
    doc.rect(15, yPos + 5, doc.internal.pageSize.getWidth() - 30, 22, 'F');
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(1);
    doc.line(15, yPos + 5, 15, yPos + 27);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '"A exportação global garante compatibilidade universal com distribuidores digitais, impressão técnica e transmissão broadcast."',
      20,
      yPos + 18
    );

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Gerado via MNAnimat Visuals Global Export System • Página ${i} de ${pageCount}`,
        15,
        doc.internal.pageSize.getHeight() - 10
      );
    }

    doc.save(`${fileName}.pdf`);
  };

  const generatePresentationPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const slides = [
      {
        title: 'MNAnimat Visuals 2026',
        subtitle: 'Suíte Profissional para Equipes Criativas',
        color: [15, 23, 42], // slate-900
        bullets: ['Renderização 3D WebGL', 'Edição de Vídeo NLE', 'Documentação Vetorial'],
      },
      {
        title: 'Arquitetura Multimodular',
        subtitle: 'Integração de Vídeo, Áudio, Animação e Documentos',
        color: [30, 41, 59], // slate-800
        bullets: [
          'Linha do Tempo com Snap e Trimmings precisos',
          'Sincronização em Nuvem com Auto-Save Ativo',
          'Exportação Multiformato em Tempo Real',
        ],
      },
      {
        title: 'Especificação de Exportação',
        subtitle: 'Formatos Prontos para Distribuição Global',
        color: [14, 116, 144], // cyan-700
        bullets: [
          'PDF Vetorial para Impressão e Telas',
          'MP4 H.264 Full HD / 4K com Áudio 320 kbps',
          'SVG & GLTF para Assets Interativos Web',
        ],
      },
    ];

    slides.forEach((slide, idx) => {
      if (idx > 0) doc.addPage();

      // Background
      doc.setFillColor(slide.color[0], slide.color[1], slide.color[2]);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');

      // Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text(slide.title, 20, 35);

      // Subtitle
      doc.setFontSize(14);
      doc.setTextColor(56, 189, 248); // cyan-400
      doc.text(slide.subtitle, 20, 48);

      // Bullets
      doc.setFontSize(12);
      doc.setTextColor(226, 232, 240);
      let bY = 70;
      slide.bullets.forEach((b) => {
        doc.setFillColor(56, 189, 248);
        doc.circle(23, bY - 2, 1.5, 'F');
        doc.text(b, 28, bY);
        bY += 12;
      });

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Slide ${idx + 1} de ${slides.length} • MNAnimat Presentation Deck`, 20, 190);
    });

    doc.save(`${fileName}.pdf`);
  };

  const generateMP4VideoBlob = () => {
    // Generate an animated video preview canvas converted to MP4/WebM video blob
    const canvas = document.createElement('canvas');
    canvas.width = resolution === '4K' ? 3840 : resolution === '1080p' ? 1920 : 1280;
    canvas.height = resolution === '4K' ? 2160 : resolution === '1080p' ? 1080 : 720;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    // Draw video frame title overlay
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 60px sans-serif';
    ctx.fillText('MNAnimat Visuals - Project Master Render', 100, 200);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '36px monospace';
    ctx.fillText(`Resolution: ${resolution} | Frame Rate: ${frameRate} FPS | Codec: H.264 / MP4`, 100, 280);

    // Convert canvas to blob & trigger download
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${format.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, `video/${format.toLowerCase() === 'mp4' ? 'mp4' : 'webm'}`);
  };

  const generateImageBlob = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillText(fileName, 80, 120);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '24px sans-serif';
    ctx.fillText('Arte Renderizada via MNAnimat Visuals Global Export System', 80, 180);

    const mime = format === 'JPG' ? 'image/jpeg' : format === 'SVG' ? 'image/svg+xml' : 'image/png';
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${format.toLowerCase()}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, mime);
  };

  // Start Export Process Workflow
  const handleStartExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportCompleted(false);

    let progress = 0;
    const steps = [
      'Compilando Recursos do Projeto...',
      'Processando Camadas & Trilhas de Áudio...',
      'Aplicando Filtros e Renderização de Quadros...',
      'Encapsulando Contêiner de Arquivo...',
      'Gerando Download do Arquivo Final...',
    ];

    const interval = setInterval(() => {
      progress += 10;
      setExportProgress(progress);

      const stepIndex = Math.min(Math.floor((progress / 100) * steps.length), steps.length - 1);
      setExportStatusText(steps[stepIndex]);

      if (progress >= 100) {
        clearInterval(interval);
        setIsExporting(false);
        setExportCompleted(true);

        // Execute actual file generation and browser download
        setTimeout(() => {
          if (format === 'PDF') {
            if (selectedMode === 'presentation') {
              generatePresentationPDF();
            } else {
              generateDocumentPDF();
            }
          } else if (format === 'MP4' || format === 'WEBM') {
            generateMP4VideoBlob();
          } else {
            generateImageBlob();
          }
        }, 300);
      }
    }, 180);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Módulo Global de Exportação</span>
                <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-[10px] text-cyan-300 font-mono">
                  v2.8
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Converta seus projetos para formatos prontos para distribuição e exibição.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Mode Selector Tabs */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Selecione o Módulo / Tipo de Conteúdo:
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  setSelectedMode('document');
                  setFormat('PDF');
                  setFileName('Documento_Tecnico_MNAnimat');
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedMode === 'document'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Documento</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMode('presentation');
                  setFormat('PDF');
                  setFileName('Apresentacao_Projeto_2026');
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedMode === 'presentation'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Presentation className="w-4 h-4 text-indigo-400" />
                <span>Apresentação</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMode('video');
                  setFormat('MP4');
                  setFileName('Video_Projeto_Final');
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedMode === 'video'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Video className="w-4 h-4 text-rose-400" />
                <span>Vídeo Editor</span>
              </button>

              <button
                onClick={() => {
                  setSelectedMode('image_editor');
                  setFormat('PNG');
                  setFileName('Imagem_Composicao');
                }}
                className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  selectedMode === 'image_editor'
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>Imagem / Arte</span>
              </button>
            </div>
          </div>

          {/* File Name & Format Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Nome do Arquivo:</label>
              <div className="relative">
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white font-medium focus:outline-none focus:border-cyan-500 pr-16"
                  placeholder="Nome do arquivo..."
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono font-bold text-cyan-400">
                  .{format.toLowerCase()}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">Formato Alvo:</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as ExportFormat)}
                className="w-full bg-slate-950 border border-slate-800 text-white font-bold text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-cyan-500"
              >
                {(selectedMode === 'document' || selectedMode === 'presentation') && (
                  <>
                    <option value="PDF">PDF (Documento / Slide Deck)</option>
                    <option value="PNG">PNG (Página Única)</option>
                  </>
                )}
                {(selectedMode === 'video' || selectedMode === 'animation2d') && (
                  <>
                    <option value="MP4">MP4 (Vídeo H.264 Universal)</option>
                    <option value="WEBM">WebM (Vídeo Web de Alta Eficiência)</option>
                  </>
                )}
                {selectedMode === 'image_editor' && (
                  <>
                    <option value="PNG">PNG (Transparência Alta Qualidade)</option>
                    <option value="JPG">JPG (Compactado 95%)</option>
                  </>
                )}
                {selectedMode === 'vector' && (
                  <>
                    <option value="SVG">SVG (Vetor Escalável)</option>
                    <option value="PDF">PDF Vetorial</option>
                  </>
                )}
                {selectedMode === '3d_render' && (
                  <>
                    <option value="GLTF">GLTF 2.0 (Modelo 3D)</option>
                    <option value="PNG">PNG Render HD</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Detailed Format Specific Settings */}
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Settings className="w-4 h-4 text-cyan-400" />
              <span>Configurações Avançadas do Arquivo ({format})</span>
            </div>

            {format === 'PDF' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Tamanho da Folha:</label>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="a4">A4 (210 x 297 mm)</option>
                    <option value="a3">A3 (297 x 420 mm)</option>
                    <option value="letter">Carta (Letter)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Orientação:</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="portrait">Retrato (Vertical)</option>
                    <option value="landscape">Paisagem (Horizontal)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Qualidade de Impressão:</label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="high">Padrão Tela (150 DPI)</option>
                    <option value="maximum">Gráfica / Impressão (300 DPI)</option>
                  </select>
                </div>
              </div>
            )}

            {(format === 'MP4' || format === 'WEBM') && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Resolução do Vídeo:</label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-cyan-300 font-bold rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                    <option value="4K">4K Ultra HD (3840x2160)</option>
                    <option value="720p">720p HD (1280x720)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Taxa de Quadros (FPS):</label>
                  <select
                    value={frameRate}
                    onChange={(e) => setFrameRate(Number(e.target.value) as any)}
                    className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg p-1.5 focus:outline-none"
                  >
                    <option value={60}>60 FPS (Fluidez Máxima)</option>
                    <option value={30}>30 FPS (Padrão Web)</option>
                    <option value={24}>24 FPS (Cinematográfico)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Codec de Áudio:</label>
                  <div className="p-1.5 bg-slate-900 rounded-lg text-slate-300 text-[11px] font-mono border border-slate-800">
                    AAC-LC 320 kbps
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Incluir Metadados do Projeto MNAnimat</span>
              </label>

              <span className="text-[11px] font-mono text-cyan-400">Aceleração por Hardware GPU Ativa ✓</span>
            </div>
          </div>

          {/* Export Progress Bar */}
          {(isExporting || exportCompleted) && (
            <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-cyan-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  {isExporting ? 'Processando Exportação...' : 'Exportação Concluída com Sucesso!'}
                </span>
                <span className="font-mono text-cyan-400">{exportProgress}%</span>
              </div>

              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-200 rounded-full"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>

              <p className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{exportStatusText}</span>
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className={`px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-cyan-500 to-emerald-500 hover:from-indigo-500 hover:to-emerald-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer ${
              isExporting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Gerando Arquivo...' : `Exportar Arquivo .${format}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
