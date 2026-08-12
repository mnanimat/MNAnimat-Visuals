import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  Wand2,
  Scissors,
  Sliders,
  RotateCw,
  Crop,
  Download,
  Sparkles,
  Sun,
  Contrast,
  Aperture,
  Layers,
  Upload,
  Eye,
  Eraser,
  Undo2,
  Redo2,
  Layers as LayersIcon,
} from 'lucide-react';

export const ImageStudio: React.FC = () => {
  const [imageUrl, setImageUrl] = useState<string | null>(
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80'
  );

  // Image Filter Adjustments (Non-AI Advanced Filters)
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [temperature, setTemperature] = useState<number>(0); // -100 to 100
  const [hue, setHue] = useState<number>(0); // -180 to 180
  const [sharpness, setSharpness] = useState<number>(0); // 0 to 100
  const [exposure, setExposure] = useState<number>(100); // 50 to 200
  const [vignette, setVignette] = useState<number>(0); // 0 to 100
  const [blur, setBlur] = useState<number>(0);
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Manual Background Removal Tools (No AI)
  const [activeTool, setActiveTool] = useState<'bg_remove' | 'adjust' | 'filters'>('bg_remove');
  const [manualTool, setManualTool] = useState<'eraser' | 'magic_wand' | 'lasso'>('eraser');
  const [eraserSize, setEraserSize] = useState<number>(25);
  const [eraserHardness, setEraserHardness] = useState<number>(80);
  const [colorTolerance, setColorTolerance] = useState<number>(30);
  const [isErasing, setIsErasing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setTemperature(0);
    setHue(0);
    setSharpness(0);
    setExposure(100);
    setVignette(0);
    setBlur(0);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
  };

  return (
    <div className="flex-1 flex bg-[#0f1117] text-slate-100 overflow-hidden select-none">
      {/* Sidebar Tools */}
      <aside className="w-80 bg-slate-900 border-r border-slate-800 p-4 flex flex-col gap-5 overflow-y-auto shrink-0 shadow-2xl">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-white shadow-lg">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white">Editor de Imagem Pro</h2>
            <p className="text-[10px] text-slate-400">Remoção de Fundo, Ajustes & Filtros IA</p>
          </div>
        </div>

        {/* Upload Custom Image */}
        <label className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500 text-xs font-bold cursor-pointer transition-all">
          <Upload className="w-4 h-4 text-cyan-400" />
          <span>Carregar Nova Imagem</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>

        {/* Navigation Tools Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTool('bg_remove')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'bg_remove'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Remover Fundo</span>
          </button>
          <button
            onClick={() => setActiveTool('adjust')}
            className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeTool === 'adjust'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ajustes Finos</span>
          </button>
        </div>

        {/* Tool Details Panel */}
        {activeTool === 'bg_remove' && (
          <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Eraser className="w-4 h-4 text-cyan-400" />
              Remoção Manual de Precisão (Sem IA)
            </h3>

            {/* Manual Tool Selector */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-semibold">
              <button
                onClick={() => setManualTool('eraser')}
                className={`py-1.5 rounded-md transition-all ${
                  manualTool === 'eraser' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Borracha
              </button>
              <button
                onClick={() => setManualTool('magic_wand')}
                className={`py-1.5 rounded-md transition-all ${
                  manualTool === 'magic_wand' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Varinha Cor
              </button>
              <button
                onClick={() => setManualTool('lasso')}
                className={`py-1.5 rounded-md transition-all ${
                  manualTool === 'lasso' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
                }`}
              >
                Laço Polígono
              </button>
            </div>

            {/* Manual Tool Parameters */}
            {manualTool === 'eraser' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center text-slate-300 mb-1">
                    <span>Tamanho da Borracha</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={eraserSize}
                        onChange={(e) => setEraserSize(Math.max(1, Math.min(200, Number(e.target.value) || 5)))}
                        className="w-14 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">px</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={eraserSize}
                    onChange={(e) => setEraserSize(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-slate-300 mb-1">
                    <span>Dureza do Contorno</span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="10"
                        max="100"
                        value={eraserHardness}
                        onChange={(e) => setEraserHardness(Math.max(0, Math.min(100, Number(e.target.value) || 10)))}
                        className="w-14 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                      />
                      <span className="text-[10px] text-slate-400 font-mono">%</span>
                    </div>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={eraserHardness}
                    onChange={(e) => setEraserHardness(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            )}

            {manualTool === 'magic_wand' && (
              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex justify-between items-center text-slate-300 mb-1">
                    <span>Tolerância de Cor</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={colorTolerance}
                      onChange={(e) => setColorTolerance(Math.max(1, Math.min(100, Number(e.target.value) || 1)))}
                      className="w-14 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={colorTolerance}
                    onChange={(e) => setColorTolerance(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400">
                  Clique na cor do fundo para apagar pixels semelhantes no raio de tolerância.
                </p>
              </div>
            )}

            {manualTool === 'lasso' && (
              <div className="text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-200">Recorte por Laço Poligonal:</p>
                <p>Clique ao redor do objeto para definir os pontos de corte e isolar a figura com precisão.</p>
              </div>
            )}
          </div>
        )}

        {activeTool === 'adjust' && (
          <div className="space-y-4 bg-slate-950/70 p-4 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Melhoria & Filtros Profissionais
              </h3>
              <button onClick={handleResetFilters} className="text-[10px] text-cyan-400 hover:underline">
                Resetar
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Brilho */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-amber-400" /> Brilho</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Contraste */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1"><Contrast className="w-3.5 h-3.5 text-indigo-400" /> Contraste</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Saturação */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1"><Aperture className="w-3.5 h-3.5 text-rose-400" /> Saturação</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="300"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="200"
                  value={saturation}
                  onChange={(e) => setSaturation(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Temperatura */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span>Temperatura de Cor</span>
                  <input
                    type="number"
                    min="-100"
                    max="100"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                    className="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Matiz (Hue) */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span>Matiz / Tonalidade (Hue)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="-180"
                      max="180"
                      value={hue}
                      onChange={(e) => setHue(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">°</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={hue}
                  onChange={(e) => setHue(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Desfocagem (Blur) */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span>Desfocagem (Blur)</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={blur}
                      onChange={(e) => setBlur(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">px</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={blur}
                  onChange={(e) => setBlur(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Rotação */}
              <div>
                <div className="flex justify-between items-center text-slate-300 mb-1">
                  <span className="flex items-center gap-1"><RotateCw className="w-3.5 h-3.5 text-emerald-400" /> Rotação</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="-360"
                      max="360"
                      value={rotation}
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-16 bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs px-1.5 py-0.5 rounded text-right focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-400 font-mono">°</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => setFlipH(!flipH)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                    flipH ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Inverter Horiz.
                </button>
                <button
                  onClick={() => setFlipV(!flipV)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${
                    flipV ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Inverter Vert.
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Preview Workspace */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
        {imageUrl ? (
          <div
            className="relative max-w-3xl max-h-[75vh] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 bg-[url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAIAAADfe8LmAHAALklEQVR42mNkYPjPgAeYmJgY8ACmhoAAMDAwMDBARfExMDFACJAB8jEwMAAAAP//mY8D4Z5+tI8AAAAASUVORK5CYII=)]"
            style={{
              transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg) blur(${blur}px)`,
            }}
          >
            <img
              src={imageUrl}
              alt="Editor de Imagem Profissional"
              className="max-h-[70vh] object-contain transition-all"
            />
          </div>
        ) : (
          <div className="text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">Nenhuma imagem selecionada</p>
          </div>
        )}
      </main>
    </div>
  );
};
