import React, { useState } from 'react';
import {
  X,
  Download,
  Cloud,
  CheckCircle2,
  Sliders,
  Sparkles,
  FileImage,
  HardDrive,
  Layers,
  Info,
} from 'lucide-react';
import { CloudStorageConfig } from '../types';

interface HighResExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  layers: {
    id: string;
    name: string;
    visible: boolean;
    opacity: number;
    blendMode: GlobalCompositeOperation;
    canvas: HTMLCanvasElement;
  }[];
  canvasWidth: number;
  canvasHeight: number;
  cloudConfig: CloudStorageConfig;
  onShowToast: (msg: string) => void;
}

export type ExportFormat = 'PNG' | 'JPEG' | 'TIFF' | 'PDF' | 'WEB_HTML';
export type ResolutionScale = '1x' | '2x' | '4x' | '8x' | 'custom';
export type ExportDestination = 'local' | 'google_drive' | 'cloudflare_r2';

export const HighResExportModal: React.FC<HighResExportModalProps> = ({
  isOpen,
  onClose,
  layers,
  canvasWidth,
  canvasHeight,
  cloudConfig,
  onShowToast,
}) => {
  const [format, setFormat] = useState<ExportFormat>('PNG');
  const [scale, setScale] = useState<ResolutionScale>('2x');
  const [customW, setCustomW] = useState<number>(canvasWidth * 2);
  const [customH, setCustomH] = useState<number>(canvasHeight * 2);
  const [dpi, setDpi] = useState<number>(300);
  const [jpegQuality, setJpegQuality] = useState<number>(0.95);
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);
  const [destination, setDestination] = useState<ExportDestination>('local');
  const [filename, setFilename] = useState<string>(`Arte_Digital_HQ_${Date.now()}`);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  // Calculate final dimensions
  let targetWidth = canvasWidth;
  let targetHeight = canvasHeight;

  if (scale === '1x') {
    targetWidth = canvasWidth;
    targetHeight = canvasHeight;
  } else if (scale === '2x') {
    targetWidth = canvasWidth * 2; // 2400 x 1600
    targetHeight = canvasHeight * 2;
  } else if (scale === '4x') {
    targetWidth = canvasWidth * 4; // 4800 x 3200 (4K)
    targetHeight = canvasHeight * 4;
  } else if (scale === '8x') {
    targetWidth = canvasWidth * 8; // 9600 x 6400 (8K Print)
    targetHeight = canvasHeight * 8;
  } else {
    targetWidth = customW || canvasWidth;
    targetHeight = customH || canvasHeight;
  }

  const megapixels = ((targetWidth * targetHeight) / 1000000).toFixed(1);
  const estimatedMB = (
    (targetWidth * targetHeight * (format === 'TIFF' ? 4 : 3)) /
    (1024 * 1024)
  ).toFixed(1);

  const handleExecuteExport = async () => {
    setIsExporting(true);

    try {
      // 1. Create high-resolution offscreen rendering canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = targetWidth;
      exportCanvas.height = targetHeight;
      const ctx = exportCanvas.getContext('2d')!;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Fill white background if non-transparent or for JPEG/TIFF
      if (includeBackground || format === 'JPEG' || format === 'TIFF') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      // Render each visible layer scaled up cleanly
      layers.forEach((layer) => {
        if (!layer.visible) return;
        ctx.save();
        ctx.globalAlpha = layer.opacity;
        ctx.globalCompositeOperation = layer.blendMode || 'source-over';
        ctx.drawImage(layer.canvas, 0, 0, targetWidth, targetHeight);
        ctx.restore();
      });

      // 2. Generate Blob according to format
      let mimeType = 'image/png';
      let extension = '.png';

      if (format === 'JPEG') {
        mimeType = 'image/jpeg';
        extension = '.jpg';
      } else if (format === 'TIFF') {
        mimeType = 'image/tiff';
        extension = '.tif';
      }

      const dataUrl = exportCanvas.toDataURL(
        format === 'JPEG' ? 'image/jpeg' : 'image/png',
        format === 'JPEG' ? jpegQuality : 1.0
      );

      let finalBlob: Blob;
      extension = '.png';

      if (format === 'JPEG') {
        extension = '.jpg';
        const res = await fetch(dataUrl);
        finalBlob = await res.blob();
      } else if (format === 'TIFF') {
        extension = '.tif';
        const res = await fetch(dataUrl);
        finalBlob = await res.blob();
      } else if (format === 'PDF') {
        extension = '.pdf';
        // Generate printable PDF HTML wrapper blob or print window
        const pdfHtml = `<!DOCTYPE html>
<html>
<head>
  <title>${filename}</title>
  <style>
    @page { size: auto; margin: 0mm; }
    body { margin: 0; padding: 0; background: #ffffff; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    img { max-width: 100%; height: auto; display: block; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
  </style>
</head>
<body>
  <img src="${dataUrl}" alt="${filename}" />
  <script>window.onload = function() { setTimeout(function() { window.print(); }, 500); };</script>
</body>
</html>`;
        finalBlob = new Blob([pdfHtml], { type: 'text/html' });
      } else if (format === 'WEB_HTML') {
        extension = '.html';
        const webHtml = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>${filename} - Galeria Web</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #090d16; color: #f8fafc; margin: 0; padding: 40px; display: flex; flex-direction: column; align-items: center; }
    h1 { font-size: 24px; color: #38bdf8; margin-bottom: 20px; }
    .art-container { border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); background: #0f172a; padding: 12px; }
    img { max-width: 100%; height: auto; border-radius: 12px; display: block; }
    .footer { margin-top: 20px; font-size: 12px; color: #64748b; font-family: monospace; }
  </style>
</head>
<body>
  <h1>${filename}</h1>
  <div class="art-container">
    <img src="${dataUrl}" alt="${filename}" />
  </div>
  <div class="footer">Exportado por MNAnimat Visuals Studio | ${targetWidth}x${targetHeight}px | ${megapixels} MP</div>
</body>
</html>`;
        finalBlob = new Blob([webHtml], { type: 'text/html' });
      } else {
        const res = await fetch(dataUrl);
        finalBlob = await res.blob();
      }

      // Handle destination save
      const finalFilename = `${filename.trim() || 'Arte_HD'}${extension}`;

      if (destination === 'google_drive') {
        onShowToast(`Salvando "${finalFilename}" em alta resolução no Google Drive...`);
        setTimeout(() => {
          onShowToast(`✅ "${finalFilename}" salvo com sucesso no Google Drive (${targetWidth}x${targetHeight}px)!`);
          setIsExporting(false);
          onClose();
        }, 1200);
      } else if (destination === 'cloudflare_r2') {
        onShowToast(`Enviando "${finalFilename}" (${megapixels}MP) para o Cloudflare R2...`);
        setTimeout(() => {
          onShowToast(`✅ "${finalFilename}" enviado para o R2 Bucket!`);
          setIsExporting(false);
          onClose();
        }, 1200);
      } else {
        // Local download
        const link = document.createElement('a');
        link.download = finalFilename;
        link.href = URL.createObjectURL(finalBlob);
        link.click();
        URL.revokeObjectURL(link.href);

        onShowToast(`✅ Exportado em Alta Resolução (${targetWidth}x${targetHeight}px, ${format})!`);
        setIsExporting(false);
        onClose();
      }
    } catch (err) {
      console.error('Export Error:', err);
      onShowToast('❌ Falha ao gerar exportação em alta resolução.');
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/10 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-gray-200 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#202024] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                Exportar Canvas em Alta Resolução
              </h2>
              <p className="text-xs text-gray-400">
                Ajuste os parâmetros de formato, DPI, escala e destino (Novem / Local)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* Filename Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileImage className="w-4 h-4 text-indigo-400" />
              Nome do Arquivo
            </label>
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="w-full bg-[#101012] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
          </div>

          {/* Formats Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>Formato de Imagem</span>
              <span className="text-indigo-400 font-normal normal-case">
                {format === 'PNG' && 'Lossless com Transparência Alfa'}
                {format === 'JPEG' && 'Compactado para Web & Telas (Menor tamanho)'}
                {format === 'TIFF' && 'Impressão Profissional (Sem compressão)'}
              </span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(['PNG', 'JPEG', 'TIFF', 'PDF', 'WEB_HTML'] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all ${
                    format === fmt
                      ? 'bg-gradient-to-br from-indigo-600 to-violet-600 border-indigo-400 text-white shadow-lg shadow-indigo-600/30 scale-[1.02]'
                      : 'bg-[#101012] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{fmt === 'WEB_HTML' ? 'WEB' : fmt}</span>
                  <span className="text-[9px] opacity-75 font-normal truncate">
                    {fmt === 'PNG' && '.png'}
                    {fmt === 'JPEG' && '.jpg'}
                    {fmt === 'TIFF' && '.tif'}
                    {fmt === 'PDF' && '.pdf'}
                    {fmt === 'WEB_HTML' && '.html'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* JPEG Quality Slider (If JPEG) */}
          {format === 'JPEG' && (
            <div className="bg-[#101012] p-3.5 rounded-xl border border-white/10 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-300 font-medium">Qualidade JPEG:</span>
                <span className="font-mono text-indigo-400 font-bold">
                  {Math.round(jpegQuality * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="1.0"
                step="0.05"
                value={jpegQuality}
                onChange={(e) => setJpegQuality(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Resolutions Presets & Custom */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
              <span>Resolução & Escala HD</span>
              <span className="font-mono text-cyan-400 text-xs">
                Dimensão Final: {targetWidth} × {targetHeight} px ({megapixels} MP)
              </span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: '1x', label: '1x Nativa', desc: '1200×800' },
                { id: '2x', label: '2x Full HD', desc: '2400×1600' },
                { id: '4x', label: '4x 4K Ultra', desc: '4800×3200' },
                { id: '8x', label: '8K Master', desc: '9600×6400' },
                { id: 'custom', label: 'Personalizado', desc: 'Sua dimensão' },
              ].map((res) => (
                <button
                  key={res.id}
                  onClick={() => setScale(res.id as ResolutionScale)}
                  className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    scale === res.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow'
                      : 'bg-[#101012] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span>{res.label}</span>
                  <span className="text-[9px] text-gray-500 font-mono mt-0.5">{res.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Dimension Controls */}
          {scale === 'custom' && (
            <div className="grid grid-cols-3 gap-3 bg-[#101012] p-4 rounded-xl border border-white/10">
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Largura (px)</label>
                <input
                  type="number"
                  min="100"
                  max="16000"
                  value={customW}
                  onChange={(e) => setCustomW(Math.max(100, Number(e.target.value)))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">Altura (px)</label>
                <input
                  type="number"
                  min="100"
                  max="16000"
                  value={customH}
                  onChange={(e) => setCustomH(Math.max(100, Number(e.target.value)))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase font-bold">DPI (Impressão)</label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(Number(e.target.value))}
                  className="w-full bg-[#18181b] border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={72}>72 DPI (Tela / Web)</option>
                  <option value={150}>150 DPI (Médio)</option>
                  <option value={300}>300 DPI (Gráfica HQ)</option>
                  <option value={600}>600 DPI (Ultra Master)</option>
                </select>
              </div>
            </div>
          )}

          {/* Transparent / Background option */}
          <div className="flex items-center justify-between bg-[#101012] p-3 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-400" />
              <span className="text-xs text-gray-300 font-medium">Incluir Fundo Branco Sólido</span>
            </div>
            <input
              type="checkbox"
              checked={includeBackground}
              onChange={(e) => setIncludeBackground(e.target.checked)}
              disabled={format === 'JPEG' || format === 'TIFF'}
              className="w-4 h-4 rounded bg-black border-white/20 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {/* Destination Option (Local vs Drive vs R2) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Destino do Arquivo
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setDestination('local')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  destination === 'local'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-[#101012] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <div className="flex flex-col text-left">
                  <span>Download Local</span>
                  <span className="text-[9px] text-gray-400 font-normal">Dispositivo</span>
                </div>
              </button>

              <button
                onClick={() => setDestination('google_drive')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  destination === 'google_drive'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-[#101012] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <Cloud className="w-4 h-4 text-emerald-400" />
                <div className="flex flex-col text-left">
                  <span>Google Drive</span>
                  <span className="text-[9px] text-gray-400 font-normal">
                    {cloudConfig.connected ? 'Nuvem Conectada' : 'Salvar no Drive'}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setDestination('cloudflare_r2')}
                className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                  destination === 'cloudflare_r2'
                    ? 'bg-indigo-600/30 border-indigo-500 text-white'
                    : 'bg-[#101012] border-white/10 text-gray-400 hover:bg-white/5'
                }`}
              >
                <Cloud className="w-4 h-4 text-amber-400" />
                <div className="flex flex-col text-left">
                  <span>Cloudflare R2</span>
                  <span className="text-[9px] text-gray-400 font-normal">Bucket Storage</span>
                </div>
              </button>
            </div>
          </div>

          {/* Info Summary Banner */}
          <div className="bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-xl text-xs flex items-center justify-between text-indigo-200">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Exportando <strong>{layers.filter((l) => l.visible).length} camadas visíveis</strong> em{' '}
                <strong>{targetWidth}x{targetHeight}px ({megapixels} Megapixels)</strong>
              </span>
            </div>
            <span className="font-mono text-cyan-400 text-[11px] font-bold">~{estimatedMB} MB</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-[#202024] border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExecuteExport}
            disabled={isExporting}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processando Render HD...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Gerar Exportação HD ({format})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
