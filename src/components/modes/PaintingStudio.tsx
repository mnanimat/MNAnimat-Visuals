import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Paintbrush,
  Eraser,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Minus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Activity,
  Download,
  Pipette,
  Sliders,
  Sparkles,
  Layers as LayersIcon,
  History as HistoryIcon,
  RotateCcw,
  Undo2,
  Redo2,
  Check,
  HelpCircle,
} from 'lucide-react';
import { BrushConfig, BrushCategory, BrushType } from '../../types';
import { drawBrushStroke, Point } from '../../utils/brushEngine';

interface InternalLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

interface LayerSnapshot {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  imageData: ImageData;
}

interface FullHistoryItem {
  id: string;
  description: string;
  timestamp: string;
  layerSnapshots: LayerSnapshot[];
}

export interface PaintingStudioProps {
  onUndoStateChange?: (canUndo: boolean, canRedo: boolean, undoFn: () => void, redoFn: () => void) => void;
}

export interface BrushCategoryDef {
  id: BrushCategory;
  name: string;
  icon: string;
}

export const BRUSH_CATEGORIES: BrushCategoryDef[] = [
  { id: 'fundamentais', name: 'Fundamentais', icon: '🖌️' },
  { id: 'metal', name: 'Metal', icon: '🛡️' },
  { id: 'natureza', name: 'Natureza', icon: '🌿' },
  { id: 'cabelo', name: 'Cabelo & Pelagem', icon: '💇' },
  { id: 'madeira', name: 'Madeira', icon: '🪵' },
  { id: 'vidro', name: 'Vidro & Cristais', icon: '💎' },
  { id: 'pele', name: 'Pele Humana', icon: '🧬' },
  { id: 'cenario', name: 'Cenário & Ambientes', icon: '🏔️' },
];

export interface BrushPresetItem {
  type: BrushType;
  category: BrushCategory;
  name: string;
  icon: string;
  description: string;
  defaultSize: number;
  defaultOpacity: number;
  defaultFlow: number;
  defaultScatter: number;
  defaultGrain: number;
  usePressureSize: boolean;
  usePressureOpacity: boolean;
}

export const ALL_BRUSH_PRESETS: BrushPresetItem[] = [
  // METAL
  {
    type: 'metal_sheen',
    category: 'metal',
    name: 'Especular Metálico',
    icon: '⚔️',
    description: 'Borda especular quente para armaduras de aço, cromo e metais polidos',
    defaultSize: 32,
    defaultOpacity: 0.9,
    defaultFlow: 0.85,
    defaultScatter: 0.05,
    defaultGrain: 0.2,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'metal_brushed',
    category: 'metal',
    name: 'Metal Escovado',
    icon: '⚙️',
    description: 'Micro-arranhões paralelos e textura para alumínio e titânio industrial',
    defaultSize: 40,
    defaultOpacity: 0.85,
    defaultFlow: 0.75,
    defaultScatter: 0.0,
    defaultGrain: 0.6,
    usePressureSize: true,
    usePressureOpacity: false,
  },
  {
    type: 'metal_chrome',
    category: 'metal',
    name: 'Cromo Polido Hot-Edge',
    icon: '🪞',
    description: 'Reflexos de alto contraste com hotspot branco e contorno queimado',
    defaultSize: 28,
    defaultOpacity: 0.95,
    defaultFlow: 0.9,
    defaultScatter: 0.0,
    defaultGrain: 0.1,
    usePressureSize: true,
    usePressureOpacity: true,
  },

  // NATUREZA
  {
    type: 'nature_foliage',
    category: 'natureza',
    name: 'Clusters de Folhagens',
    icon: '🍃',
    description: 'Pintura dinâmica de copas de árvores, arbustos e plantas com rotação viva',
    defaultSize: 48,
    defaultOpacity: 0.85,
    defaultFlow: 0.8,
    defaultScatter: 0.45,
    defaultGrain: 0.4,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'nature_moss',
    category: 'natureza',
    name: 'Musgo & Liquens',
    icon: '🪨',
    description: 'Pontilhado orgânico denso para troncos, rochas e vegetação rústica',
    defaultSize: 36,
    defaultOpacity: 0.8,
    defaultFlow: 0.7,
    defaultScatter: 0.5,
    defaultGrain: 0.7,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'nature_bark',
    category: 'natureza',
    name: 'Casca de Árvore',
    icon: '🪵',
    description: 'Fibras estriadas verticais para troncos e raízes de árvores',
    defaultSize: 42,
    defaultOpacity: 0.9,
    defaultFlow: 0.8,
    defaultScatter: 0.1,
    defaultGrain: 0.5,
    usePressureSize: true,
    usePressureOpacity: false,
  },
  {
    type: 'nature_grass',
    category: 'natureza',
    name: 'Grama & Agulhas',
    icon: '🌾',
    description: 'Lâminas direcionais afuniladas para relvados e pinheiros',
    defaultSize: 34,
    defaultOpacity: 0.85,
    defaultFlow: 0.85,
    defaultScatter: 0.3,
    defaultGrain: 0.3,
    usePressureSize: true,
    usePressureOpacity: true,
  },

  // CABELO & PELAGEM
  {
    type: 'hair_strands',
    category: 'cabelo',
    name: 'Fios Finos de Cabelo',
    icon: '💇‍♀️',
    description: 'Micro-mechas paralelas afuniladas com dinâmica de ponta fina',
    defaultSize: 24,
    defaultOpacity: 0.9,
    defaultFlow: 0.85,
    defaultScatter: 0.05,
    defaultGrain: 0.2,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'hair_fur',
    category: 'cabelo',
    name: 'Pelagem Densa (Fur)',
    icon: '🦊',
    description: 'Massa de pelos curtos e aveludados para animais e agasalhos',
    defaultSize: 38,
    defaultOpacity: 0.85,
    defaultFlow: 0.8,
    defaultScatter: 0.25,
    defaultGrain: 0.4,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'hair_shine',
    category: 'cabelo',
    name: 'Brilho Capilar Highlight',
    icon: '✨',
    description: 'Luz refletida volumétrica (catchlight) para dar volume ao cabelo',
    defaultSize: 45,
    defaultOpacity: 0.6,
    defaultFlow: 0.5,
    defaultScatter: 0.0,
    defaultGrain: 0.1,
    usePressureSize: true,
    usePressureOpacity: true,
  },

  // MADEIRA
  {
    type: 'wood_grain',
    category: 'madeira',
    name: 'Veios de Madeira',
    icon: '🪵',
    description: 'Veios orgânicos ondulados para móveis, pisos e estruturas de madeira',
    defaultSize: 38,
    defaultOpacity: 0.85,
    defaultFlow: 0.8,
    defaultScatter: 0.1,
    defaultGrain: 0.4,
    usePressureSize: true,
    usePressureOpacity: false,
  },
  {
    type: 'wood_weathered',
    category: 'madeira',
    name: 'Madeira Rústica Seca',
    icon: '📜',
    description: 'Arrasto seco rugoso simulando tábuas envelhecidas e nós de madeira',
    defaultSize: 44,
    defaultOpacity: 0.8,
    defaultFlow: 0.7,
    defaultScatter: 0.3,
    defaultGrain: 0.8,
    usePressureSize: true,
    usePressureOpacity: true,
  },

  // VIDRO & CRISTAIS
  {
    type: 'glass_refract',
    category: 'vidro',
    name: 'Bordo Refrativo de Vidro',
    icon: '🍷',
    description: 'Traço translúcido com friso branco de refração para cálices e lentes',
    defaultSize: 30,
    defaultOpacity: 0.75,
    defaultFlow: 0.7,
    defaultScatter: 0.0,
    defaultGrain: 0.1,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'glass_caustics',
    category: 'vidro',
    name: 'Cáusticas & Brilho Crystal',
    icon: '🔮',
    description: 'Estrelas de refração e dispersão de luz em cristais e vidrarias',
    defaultSize: 36,
    defaultOpacity: 0.9,
    defaultFlow: 0.85,
    defaultScatter: 0.4,
    defaultGrain: 0.2,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'glass_glaze',
    category: 'vidro',
    name: 'Superfície Glazurada',
    icon: '🥛',
    description: 'Camada suave semitranslúcida de esmalte e verniz brilhante',
    defaultSize: 50,
    defaultOpacity: 0.4,
    defaultFlow: 0.4,
    defaultScatter: 0.0,
    defaultGrain: 0.0,
    usePressureSize: true,
    usePressureOpacity: true,
  },

  // PELE HUMANA (SKIN & DERMIS)
  {
    type: 'skin_pores',
    category: 'pele',
    name: 'Poros de Pele Realista',
    icon: '🧬',
    description: 'Micro-textura tátil de poros da derme (Padrão ArtStation para retratos)',
    defaultSize: 32,
    defaultOpacity: 0.7,
    defaultFlow: 0.65,
    defaultScatter: 0.35,
    defaultGrain: 0.7,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'skin_subsurface',
    category: 'pele',
    name: 'Subsurface Scattering (SSS)',
    icon: '🌅',
    description: 'Glow dérmico translúcido quente para orelhas, bochechas e áreas de sombra',
    defaultSize: 55,
    defaultOpacity: 0.35,
    defaultFlow: 0.4,
    defaultScatter: 0.0,
    defaultGrain: 0.1,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'skin_freckles',
    category: 'pele',
    name: 'Efélides & Sardas',
    icon: '🌸',
    description: 'Dispersão natural e orgânica de manchas de melanina',
    defaultSize: 28,
    defaultOpacity: 0.75,
    defaultFlow: 0.7,
    defaultScatter: 0.6,
    defaultGrain: 0.5,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'skin_blender',
    category: 'pele',
    name: 'Misturador de Derme',
    icon: '🖐️',
    description: 'Suavizador de degradês e transições sutis entre tons de pele',
    defaultSize: 45,
    defaultOpacity: 0.3,
    defaultFlow: 0.3,
    defaultScatter: 0.0,
    defaultGrain: 0.0,
    usePressureSize: true,
    usePressureOpacity: true,
  },

  // CENÁRIO & AMBIENTES
  {
    type: 'environment_clouds',
    category: 'cenario',
    name: 'Nuvens Volumétricas',
    icon: '☁️',
    description: 'Densidade atmosférica volumétrica macia para céus e névoa',
    defaultSize: 64,
    defaultOpacity: 0.5,
    defaultFlow: 0.45,
    defaultScatter: 0.2,
    defaultGrain: 0.2,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'environment_stone',
    category: 'cenario',
    name: 'Rochas & Desfiladeiros',
    icon: '🏔️',
    description: 'Textura angular facetada para falésias, pedras e montanhas',
    defaultSize: 48,
    defaultOpacity: 0.85,
    defaultFlow: 0.8,
    defaultScatter: 0.3,
    defaultGrain: 0.6,
    usePressureSize: true,
    usePressureOpacity: false,
  },
  {
    type: 'environment_water',
    category: 'cenario',
    name: 'Superfície de Água',
    icon: '🌊',
    description: 'Lâminas horizontais de ondulação e reflexos em lagos e mares',
    defaultSize: 42,
    defaultOpacity: 0.75,
    defaultFlow: 0.7,
    defaultScatter: 0.1,
    defaultGrain: 0.2,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'environment_dust',
    category: 'cenario',
    name: 'Partículas / Dust Bokeh',
    icon: '✨',
    description: 'Motes luminosos flutuantes em raios de sol e cenários dramáticos',
    defaultSize: 36,
    defaultOpacity: 0.8,
    defaultFlow: 0.75,
    defaultScatter: 0.7,
    defaultGrain: 0.3,
    usePressureSize: true,
    usePressureOpacity: true,
  },

  // FUNDAMENTAIS
  {
    type: 'oil',
    category: 'fundamentais',
    name: 'Tinta a Óleo Canvas',
    icon: '🖌️',
    description: 'Pintura a óleo encorpada com empasto e grão de tela',
    defaultSize: 32,
    defaultOpacity: 0.9,
    defaultFlow: 0.85,
    defaultScatter: 0.0,
    defaultGrain: 0.5,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'watercolor',
    category: 'fundamentais',
    name: 'Aquarela Fluida',
    icon: '🎨',
    description: 'Lavagem de pigmento aguado com acumulação nas bordas',
    defaultSize: 40,
    defaultOpacity: 0.6,
    defaultFlow: 0.4,
    defaultScatter: 0.1,
    defaultGrain: 0.3,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'chalk',
    category: 'fundamentais',
    name: 'Giz & Carvão Seco',
    icon: '🖍️',
    description: 'Textura rugosa de carvão para sketches de concept art',
    defaultSize: 28,
    defaultOpacity: 0.8,
    defaultFlow: 0.75,
    defaultScatter: 0.25,
    defaultGrain: 0.7,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'airbrush',
    category: 'fundamentais',
    name: 'Aerógrafo Suave',
    icon: '💨',
    description: 'Gradação ultra-suave para luzes, sombras e efeitos de fumaça',
    defaultSize: 50,
    defaultOpacity: 0.5,
    defaultFlow: 0.4,
    defaultScatter: 0.0,
    defaultGrain: 0.1,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'ink',
    category: 'fundamentais',
    name: 'Caneta Nanquim HD',
    icon: '🖋️',
    description: 'Linhas nítidas e fluidas para arte-final e quadrinhos',
    defaultSize: 20,
    defaultOpacity: 1.0,
    defaultFlow: 1.0,
    defaultScatter: 0.0,
    defaultGrain: 0.0,
    usePressureSize: true,
    usePressureOpacity: false,
  },
  {
    type: 'pencil',
    category: 'fundamentais',
    name: 'Lápis Grafite 2B',
    icon: '✏️',
    description: 'Grafite clássico com micro-granulação e controle de peso',
    defaultSize: 12,
    defaultOpacity: 0.85,
    defaultFlow: 0.8,
    defaultScatter: 0.0,
    defaultGrain: 0.5,
    usePressureSize: true,
    usePressureOpacity: true,
  },
  {
    type: 'gouache',
    category: 'fundamentais',
    name: 'Gouache Opaco',
    icon: '🎨',
    description: 'Bloqueio de massas de cor opacas para desenvolvimento visual',
    defaultSize: 34,
    defaultOpacity: 0.95,
    defaultFlow: 0.9,
    defaultScatter: 0.0,
    defaultGrain: 0.2,
    usePressureSize: true,
    usePressureOpacity: false,
  },
];

export const PaintingStudio: React.FC<PaintingStudioProps> = ({ onUndoStateChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState<BrushCategory>('metal');

  // Layers State
  const [layers, setLayers] = useState<InternalLayer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string>('');

  // History State with Canvas Pixel Snapshots
  const [fullHistory, setFullHistory] = useState<FullHistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Synchronized refs for fresh closure callbacks
  const layersRef = useRef<InternalLayer[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const fullHistoryRef = useRef<FullHistoryItem[]>([]);

  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    fullHistoryRef.current = fullHistory;
  }, [fullHistory]);

  // Tool Modes: 'brush' | 'eraser' | 'pipette'
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'pipette'>('brush');

  // Stylus Pressure State
  const [currentPressure, setCurrentPressure] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);

  // Active Brush Configuration State
  const [brush, setBrush] = useState<BrushConfig>({
    type: 'metal_sheen',
    category: 'metal',
    name: 'Especular Metálico',
    size: 32,
    minSizePercent: 15,
    opacity: 0.9,
    flow: 0.85,
    hardness: 0.8,
    scatter: 0.05,
    textureGrain: 0.2,
    usePressureSize: true,
    usePressureOpacity: true,
    color: '#3b82f6',
  });

  // Advanced Brush Settings Drawer Toggle
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // ArtStation Color Palette Swatches
  const colorSwatches = [
    '#3b82f6', // Steel Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Deep Purple
    '#ec4899', // Pink / Skin Tone Accent
    '#ef4444', // Hot Red
    '#f97316', // Metallic Copper / Warm Orange
    '#eab308', // Gold / Specular Yellow
    '#10b981', // Emerald Foliage
    '#06b6d4', // Glass Cyan
    '#d97706', // Warm Wood Ochre
    '#78350f', // Dark Bark Brown
    '#fde047', // Caustics Glare
    '#f8fafc', // Chrome Pure White
    '#94a3b8', // Brushed Metal Slate
    '#334155', // Shadow Slate
    '#09090b', // Deep Charcoal Black
  ];

  // Record Layer Pixel Snapshot to History
  const recordHistory = useCallback((actionName: string, customLayers?: InternalLayer[]) => {
    const targetLayers = customLayers || layersRef.current;
    if (!targetLayers || targetLayers.length === 0) return;

    const snapshots: LayerSnapshot[] = targetLayers.map((layer) => {
      const width = layer.canvas.width;
      const height = layer.canvas.height;
      const imgData = layer.ctx.getImageData(0, 0, width, height);
      return {
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        locked: layer.locked,
        opacity: layer.opacity,
        blendMode: layer.blendMode,
        imageData: new ImageData(new Uint8ClampedArray(imgData.data), width, height),
      };
    });

    const newHist: FullHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      description: actionName,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      layerSnapshots: snapshots,
    };

    setFullHistory((prev) => {
      const currentIdx = historyIndexRef.current;
      const sliced = prev.slice(0, currentIdx + 1);
      return [...sliced, newHist];
    });

    setHistoryIndex((prev) => prev + 1);
  }, []);

  // Restore Layer Pixel Snapshot from History Index
  const restoreSnapshot = useCallback((targetIdx: number) => {
    const currentHist = fullHistoryRef.current;
    if (targetIdx < 0 || targetIdx >= currentHist.length) return;

    const snapshotItem = currentHist[targetIdx];
    if (!snapshotItem || !snapshotItem.layerSnapshots) return;

    const restoredLayers: InternalLayer[] = snapshotItem.layerSnapshots.map((snap) => {
      const layerCanvas = document.createElement('canvas');
      layerCanvas.width = 1200;
      layerCanvas.height = 800;
      const layerCtx = layerCanvas.getContext('2d')!;
      layerCtx.putImageData(snap.imageData, 0, 0);

      return {
        id: snap.id,
        name: snap.name,
        visible: snap.visible,
        locked: snap.locked,
        opacity: snap.opacity,
        blendMode: snap.blendMode,
        canvas: layerCanvas,
        ctx: layerCtx,
      };
    });

    setLayers(restoredLayers);
    setHistoryIndex(targetIdx);
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < fullHistory.length - 1;

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      restoreSnapshot(historyIndexRef.current - 1);
    }
  }, [restoreSnapshot]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < fullHistoryRef.current.length - 1) {
      restoreSnapshot(historyIndexRef.current + 1);
    }
  }, [restoreSnapshot]);

  // Report Undo/Redo state up to HeaderBar
  useEffect(() => {
    if (onUndoStateChange) {
      onUndoStateChange(canUndo, canRedo, handleUndo, handleRedo);
    }
  }, [canUndo, canRedo, handleUndo, handleRedo, onUndoStateChange]);

  // Toast notification state for shortcut visual feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 1200);
  }, []);

  // Global Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Brush Sizing [, ], -, +, 1-0)
  useEffect(() => {
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

      if (isCtrlOrCmd && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if (isCtrlOrCmd && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.key === '[' || e.key === '-') {
        e.preventDefault();
        setBrush((prev) => {
          const newSize = Math.max(1, prev.size - (e.shiftKey ? 10 : 4));
          showToast(`Tamanho do Pincel: ${newSize}px`);
          return { ...prev, size: newSize };
        });
      } else if (e.key === ']' || e.key === '=' || e.key === '+') {
        e.preventDefault();
        setBrush((prev) => {
          const newSize = Math.min(200, prev.size + (e.shiftKey ? 10 : 4));
          showToast(`Tamanho do Pincel: ${newSize}px`);
          return { ...prev, size: newSize };
        });
      } else if (e.key >= '1' && e.key <= '9') {
        const opVal = Number(e.key) / 10;
        setBrush((prev) => ({ ...prev, opacity: opVal }));
        showToast(`Opacidade: ${Math.round(opVal * 100)}%`);
      } else if (e.key === '0') {
        setBrush((prev) => ({ ...prev, opacity: 1.0 }));
        showToast('Opacidade: 100%');
      } else if (e.key.toLowerCase() === 'b') {
        setActiveTool('brush');
        showToast('Ferramenta: Pincel (B)');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
        showToast('Ferramenta: Borracha (E)');
      } else if (e.key.toLowerCase() === 'i') {
        setActiveTool('pipette');
        showToast('Ferramenta: Conta-gotas (I)');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, showToast]);

  // Initialize Canvas & Base White Layer
  useEffect(() => {
    if (!containerRef.current) return;
    const width = 1200;
    const height = 800;

    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerCtx = layerCanvas.getContext('2d')!;

    // Fill base layer with clean canvas white
    layerCtx.fillStyle = '#ffffff';
    layerCtx.fillRect(0, 0, width, height);

    const baseLayer: InternalLayer = {
      id: 'layer_1',
      name: 'Fundo Branco (Canvas)',
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: layerCanvas,
      ctx: layerCtx,
    };

    setLayers([baseLayer]);
    setActiveLayerId('layer_1');
    recordHistory('Documento Criado (1200x800)', [baseLayer]);
  }, [recordHistory]);

  // Re-composite all visible layers to Display Canvas
  const renderComposite = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;
    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      if (!layer.visible) continue;

      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blendMode;
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }
  }, [layers]);

  useEffect(() => {
    renderComposite();
  }, [layers, renderComposite]);

  // Sample Color from Display Canvas (Eyedropper / Pipette)
  const sampleColor = (pt: Point) => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;
    const ctx = displayCanvas.getContext('2d');
    if (!ctx) return;
    const pixel = ctx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
      .toString(16)
      .slice(1)}`;
    setBrush((prev) => ({ ...prev, color: hex }));
    setActiveTool('brush');
  };

  // Convert Stylus Pointer Event to Canvas Coordinates
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let pressure = e.pressure;
    if (pressure === 0 || pressure === undefined) {
      pressure = 0.5;
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = getCanvasCoordinates(e);

    if (activeTool === 'pipette') {
      sampleColor(pt);
      return;
    }

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setLastPoint(pt);
    setCurrentPressure(pt.pressure);

    const effectiveBrush: BrushConfig =
      activeTool === 'eraser'
        ? { ...brush, color: '#ffffff', type: 'ink', opacity: 1.0, flow: 1.0 }
        : brush;

    drawBrushStroke(activeLayer.ctx, pt, pt, effectiveBrush);
    renderComposite();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const activeLayer = layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) return;

    const pt = getCanvasCoordinates(e);
    setCurrentPressure(pt.pressure);

    const effectiveBrush: BrushConfig =
      activeTool === 'eraser'
        ? { ...brush, color: '#ffffff', type: 'ink', opacity: 1.0, flow: 1.0 }
        : brush;

    drawBrushStroke(activeLayer.ctx, lastPoint, pt, effectiveBrush);
    setLastPoint(pt);
    renderComposite();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setLastPoint(null);
    setCurrentPressure(0);

    recordHistory(activeTool === 'eraser' ? 'Borracha' : `Pincel: ${brush.name}`);
  };

  // Select a preset item and update active brush config
  const selectPreset = (preset: BrushPresetItem) => {
    setBrush({
      type: preset.type,
      category: preset.category,
      name: preset.name,
      size: preset.defaultSize,
      minSizePercent: 15,
      opacity: preset.defaultOpacity,
      flow: preset.defaultFlow,
      hardness: 0.8,
      scatter: preset.defaultScatter,
      textureGrain: preset.defaultGrain,
      usePressureSize: preset.usePressureSize,
      usePressureOpacity: preset.usePressureOpacity,
      color: brush.color,
    });
    setActiveTool('brush');
  };

  // Layer Management Functions
  const addLayer = () => {
    const width = 1200;
    const height = 800;
    const layerCanvas = document.createElement('canvas');
    layerCanvas.width = width;
    layerCanvas.height = height;
    const layerCtx = layerCanvas.getContext('2d')!;

    const newId = `layer_${Date.now()}`;
    const newLayer: InternalLayer = {
      id: newId,
      name: `Camada ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1,
      blendMode: 'source-over',
      canvas: layerCanvas,
      ctx: layerCtx,
    };

    setLayers((prev) => [...prev, newLayer]);
    setActiveLayerId(newId);
    recordHistory(`Nova Camada (${newLayer.name})`);
  };

  const deleteActiveLayer = () => {
    if (layers.length <= 1) return;
    setLayers((prev) => prev.filter((l) => l.id !== activeLayerId));
    setActiveLayerId(layers[0].id);
    recordHistory('Excluir Camada');
  };

  const toggleLayerVisibility = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const toggleLayerLock = (id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  };

  const setLayerBlendMode = (id: string, blendMode: GlobalCompositeOperation) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, blendMode } : l))
    );
  };

  const moveLayer = (direction: 'up' | 'down') => {
    const idx = layers.findIndex((l) => l.id === activeLayerId);
    if (idx < 0) return;
    if (direction === 'up' && idx < layers.length - 1) {
      const copy = [...layers];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      setLayers(copy);
    } else if (direction === 'down' && idx > 0) {
      const copy = [...layers];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      setLayers(copy);
    }
  };

  const exportCanvasImage = () => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;
    const dataUrl = displayCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `ArtStation_Pintura_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Filter presets by active category
  const activeCategoryPresets = ALL_BRUSH_PRESETS.filter(
    (p) => p.category === activeCategory
  );

  return (
    <div className="flex-1 flex bg-[#0a0a0a] overflow-hidden text-gray-200 select-none">
      {/* Left Toolbar: Main Tools, Color Palette & Stylus Pressure */}
      <aside className="w-16 bg-[#161616] border-r border-white/10 flex flex-col items-center py-3 gap-3 shrink-0">
        {/* Tool Selector Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTool('brush')}
            title="Pincel de Pintura Digital (B)"
            className={`p-2.5 rounded hover:bg-white/10 transition-all ${
              activeTool === 'brush'
                ? 'bg-indigo-600 text-white shadow ring-1 ring-white/20'
                : 'text-gray-400'
            }`}
          >
            <Paintbrush className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            title="Borracha de Apagar (E)"
            className={`p-2.5 rounded hover:bg-white/10 transition-all ${
              activeTool === 'eraser'
                ? 'bg-rose-600 text-white shadow ring-1 ring-white/20'
                : 'text-gray-400'
            }`}
          >
            <Eraser className="w-5 h-5" />
          </button>

          <button
            onClick={() => setActiveTool('pipette')}
            title="Conta-gotas / Eyedropper (I)"
            className={`p-2.5 rounded hover:bg-white/10 transition-all ${
              activeTool === 'pipette'
                ? 'bg-amber-600 text-white shadow ring-1 ring-white/20'
                : 'text-gray-400'
            }`}
          >
            <Pipette className="w-5 h-5" />
          </button>
        </div>

        <div className="w-10 h-[1px] bg-white/10" />

        {/* Quick Brush Size Adjuster */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Tam.</span>
          <button
            onClick={() => {
              const newSize = Math.min(200, brush.size + 4);
              setBrush((prev) => ({ ...prev, size: newSize }));
              showToast(`Tamanho do Pincel: ${newSize}px`);
            }}
            title="Aumentar Tamanho do Pincel (Atalho: tecla ] ou +)"
            className="p-1.5 bg-[#222222] hover:bg-indigo-600 text-gray-300 hover:text-white rounded shadow transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono font-bold text-indigo-400">
            {brush.size}
          </span>
          <button
            onClick={() => {
              const newSize = Math.max(1, brush.size - 4);
              setBrush((prev) => ({ ...prev, size: newSize }));
              showToast(`Tamanho do Pincel: ${newSize}px`);
            }}
            title="Diminuir Tamanho do Pincel (Atalho: tecla [ ou -)"
            className="p-1.5 bg-[#222222] hover:bg-indigo-600 text-gray-300 hover:text-white rounded shadow transition-all cursor-pointer"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="w-10 h-[1px] bg-white/10" />

        {/* Undo & Redo Shortcuts Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            title="Desfazer Ação (Ctrl + Z / Cmd + Z)"
            className={`p-2.5 rounded transition-all flex items-center justify-center ${
              canUndo
                ? 'bg-[#222222] hover:bg-indigo-600 text-gray-200 hover:text-white shadow hover:scale-105 cursor-pointer'
                : 'bg-[#181818] text-gray-600 cursor-not-allowed opacity-40'
            }`}
          >
            <Undo2 className="w-5 h-5" />
          </button>

          <button
            onClick={handleRedo}
            disabled={!canRedo}
            title="Refazer Ação (Ctrl + Y / Ctrl + Shift + Z)"
            className={`p-2.5 rounded transition-all flex items-center justify-center ${
              canRedo
                ? 'bg-[#222222] hover:bg-indigo-600 text-gray-200 hover:text-white shadow hover:scale-105 cursor-pointer'
                : 'bg-[#181818] text-gray-600 cursor-not-allowed opacity-40'
            }`}
          >
            <Redo2 className="w-5 h-5" />
          </button>
        </div>

        <div className="w-10 h-[1px] bg-white/10" />

        {/* Color Picker & Swatches */}
        <div className="flex flex-col gap-1.5 items-center">
          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Cor</span>
          <input
            type="color"
            value={brush.color}
            onChange={(e) => setBrush({ ...brush, color: e.target.value })}
            className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10 p-0"
            title="Seletor de Cor HD"
          />

          <div className="grid grid-cols-2 gap-1 mt-1 max-h-36 overflow-y-auto pr-0.5 scrollbar-none">
            {colorSwatches.map((c) => (
              <button
                key={c}
                onClick={() => setBrush({ ...brush, color: c })}
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-125"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div className="w-10 h-[1px] bg-white/10" />

        {/* Real-Time Stylus Pressure Monitor Gauge */}
        <div
          title="Medidor de Pressão da Caneta Stylus (Wacom / Apple Pencil)"
          className="flex flex-col items-center gap-1 bg-black p-2 rounded border border-white/10"
        >
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[8px] font-mono font-bold text-indigo-300">
            {Math.round(currentPressure * 100)}%
          </span>
          <div className="w-2 h-10 bg-[#222222] rounded-full overflow-hidden flex flex-col justify-end p-0.5 border border-white/10">
            <div
              className="w-full bg-indigo-500 rounded-full transition-all duration-75"
              style={{ height: `${Math.round(currentPressure * 100)}%` }}
            />
          </div>
        </div>
      </aside>

      {/* Center Studio Area: Top Category & Preset Bar + Canvas Viewport */}
      <div className="flex-1 flex flex-col bg-[#111111] overflow-hidden relative">
        {/* Top Professional Bar: Brush Category Tabs & Presets */}
        <div className="bg-[#161616] border-b border-white/10 px-4 py-2 flex flex-col gap-2 shrink-0 shadow-md">
          {/* Top Row: Category Tabs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Categorias:
              </span>
              {BRUSH_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-black/40 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-black/50 p-0.5 rounded-md border border-white/10">
                <button
                  onClick={handleUndo}
                  disabled={!canUndo}
                  title="Desfazer Ação (Ctrl + Z / Cmd + Z)"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    canUndo
                      ? 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white shadow cursor-pointer'
                      : 'text-gray-600 cursor-not-allowed opacity-40'
                  }`}
                >
                  <Undo2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Desfazer</span>
                </button>

                <button
                  onClick={handleRedo}
                  disabled={!canRedo}
                  title="Refazer Ação (Ctrl + Y / Ctrl + Shift + Z)"
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${
                    canRedo
                      ? 'bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white shadow cursor-pointer'
                      : 'text-gray-600 cursor-not-allowed opacity-40'
                  }`}
                >
                  <Redo2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Refazer</span>
                </button>
              </div>

              <button
                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border border-white/10 transition-colors ${
                  showAdvancedSettings
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50'
                    : 'bg-black/40 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Ajustes Finos</span>
              </button>

              <button
                onClick={exportCanvasImage}
                className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded shadow transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar PNG</span>
              </button>
            </div>
          </div>

          {/* Second Row: Presets Grid for Active Category */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 border-t border-white/5 pt-2">
            {activeCategoryPresets.map((preset) => {
              const isSelected = brush.type === preset.type;
              return (
                <button
                  key={preset.type}
                  onClick={() => selectPreset(preset)}
                  title={preset.description}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-medium transition-all shrink-0 ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow ring-1 ring-indigo-500/30'
                      : 'bg-black/60 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{preset.icon}</span>
                  <div className="flex flex-col text-left">
                    <span className="font-semibold leading-tight">{preset.name}</span>
                    <span className="text-[9px] text-gray-400 truncate max-w-[140px]">
                      {preset.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Optional Drawer for Advanced Physics Controls (Pressão, Grão, Scatter, Flow) */}
          {showAdvancedSettings && (
            <div className="bg-black/80 border border-white/10 rounded p-3 grid grid-cols-4 gap-4 text-xs mt-1 animate-in fade-in duration-200">
              {/* Size Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Tamanho Máximo:</span>
                  <span className="font-mono text-indigo-400 font-bold">{brush.size}px</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="200"
                  value={brush.size}
                  onChange={(e) => setBrush({ ...brush, size: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Opacity Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Opacidade:</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {Math.round(brush.opacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={brush.opacity}
                  onChange={(e) => setBrush({ ...brush, opacity: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Flow Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Fluxo / Densidade:</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {Math.round((brush.flow ?? 0.8) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="1.0"
                  step="0.05"
                  value={brush.flow ?? 0.8}
                  onChange={(e) => setBrush({ ...brush, flow: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Scatter Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Espalhamento (Scatter):</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {Math.round((brush.scatter ?? 0) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={brush.scatter ?? 0}
                  onChange={(e) => setBrush({ ...brush, scatter: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Texture Grain Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Grão de Textura:</span>
                  <span className="font-mono text-indigo-400 font-bold">
                    {Math.round((brush.textureGrain ?? 0.3) * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={brush.textureGrain ?? 0.3}
                  onChange={(e) => setBrush({ ...brush, textureGrain: Number(e.target.value) })}
                  className="w-full accent-indigo-500"
                />
              </div>

              {/* Size Pressure Toggle */}
              <label className="flex items-center gap-2 text-gray-300 cursor-pointer self-center">
                <input
                  type="checkbox"
                  checked={brush.usePressureSize}
                  onChange={(e) => setBrush({ ...brush, usePressureSize: e.target.checked })}
                  className="rounded bg-black border-white/10 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pressão Controla Tamanho</span>
              </label>

              {/* Opacity Pressure Toggle */}
              <label className="flex items-center gap-2 text-gray-300 cursor-pointer self-center">
                <input
                  type="checkbox"
                  checked={brush.usePressureOpacity}
                  onChange={(e) => setBrush({ ...brush, usePressureOpacity: e.target.checked })}
                  className="rounded bg-black border-white/10 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Pressão Controla Opacidade</span>
              </label>
            </div>
          )}
        </div>

        {/* Main Canvas Container Viewport */}
        <div
          ref={containerRef}
          className="flex-1 bg-[#0f0f0f] relative flex items-center justify-center p-6 overflow-auto"
        >
          {/* Toast Notification Banner for Shortcut Feedback */}
          {toastMessage && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-indigo-600/90 text-white px-4 py-1.5 rounded-full shadow-lg border border-indigo-400 text-xs font-semibold backdrop-blur animate-in fade-in zoom-in-95 duration-150">
              {toastMessage}
            </div>
          )}

          {/* Active Tool Badge overlay */}
          <div className="absolute top-4 left-6 z-10 flex items-center gap-2 bg-black/80 backdrop-blur px-3 py-1 rounded-full border border-white/10 text-xs font-semibold text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {activeTool === 'eraser'
                ? 'Borracha Ativa'
                : activeTool === 'pipette'
                ? 'Conta-gotas (Clique na tela para capturar a cor)'
                : `Pincel: ${brush.name}`}
            </span>
          </div>

          <div className="bg-black p-2 rounded-lg shadow-2xl border border-white/10 my-4">
            <canvas
              ref={displayCanvasRef}
              width={1200}
              height={800}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`w-[960px] h-[640px] bg-white rounded cursor-crosshair touch-none shadow-inner ${
                activeTool === 'pipette' ? 'cursor-copy' : ''
              }`}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar: Dockable Layers & History Panels */}
      <aside className="w-72 bg-[#161616] border-l border-white/10 flex flex-col divide-y divide-white/10 shrink-0">
        {/* LAYERS PANEL */}
        <div className="flex-1 flex flex-col p-4 min-h-[300px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <LayersIcon className="w-4 h-4 text-indigo-400" />
              Camadas ({layers.length})
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={addLayer}
                title="Nova Camada"
                className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded shadow transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={deleteActiveLayer}
                title="Excluir Camada Ativa"
                className="p-1.5 bg-[#222222] hover:bg-rose-950 hover:text-rose-400 text-gray-400 rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Layers List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {layers.map((layer) => {
              const isActive = layer.id === activeLayerId;
              return (
                <div
                  key={layer.id}
                  onClick={() => setActiveLayerId(layer.id)}
                  className={`p-2.5 rounded border flex flex-col gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600/10 border-indigo-500/50 shadow'
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-200 flex items-center gap-1.5">
                      {layer.name}
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerVisibility(layer.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        {layer.visible ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-gray-600" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerLock(layer.id);
                        }}
                        className="p-1 text-gray-400 hover:text-white"
                      >
                        {layer.locked ? (
                          <Lock className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Unlock className="w-3.5 h-3.5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Blend Mode & Opacity */}
                  {isActive && (
                    <div className="flex flex-col gap-2 pt-1.5 border-t border-white/10">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-400">Modo Mesclagem:</span>
                        <select
                          value={layer.blendMode}
                          onChange={(e) =>
                            setLayerBlendMode(layer.id, e.target.value as GlobalCompositeOperation)
                          }
                          className="bg-black border border-white/10 rounded px-2 py-0.5 text-[10px] text-gray-200 focus:outline-none"
                        >
                          <option value="source-over">Normal</option>
                          <option value="multiply">Multiplicar (Multiply)</option>
                          <option value="screen">Tela (Screen)</option>
                          <option value="overlay">Sobrepor (Overlay)</option>
                          <option value="soft-light">Luz Suave (Soft Light)</option>
                          <option value="darken">Escurecer (Darken)</option>
                          <option value="lighten">Clarear (Lighten)</option>
                          <option value="color-burn">Color Burn</option>
                          <option value="difference">Diferença</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="text-gray-400">Opacidade:</span>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={layer.opacity}
                          onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                          className="w-24 accent-indigo-500"
                        />
                        <span className="font-mono text-indigo-400 font-bold">
                          {Math.round(layer.opacity * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <button
              onClick={() => moveLayer('up')}
              className="p-1.5 bg-[#222222] hover:bg-[#2a2a2a] rounded text-gray-300 text-xs flex items-center gap-1 font-medium"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Subir</span>
            </button>
            <button
              onClick={() => moveLayer('down')}
              className="p-1.5 bg-[#222222] hover:bg-[#2a2a2a] rounded text-gray-300 text-xs flex items-center gap-1 font-medium"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Descer</span>
            </button>
          </div>
        </div>

        {/* HISTORY PANEL */}
        <div className="h-48 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HistoryIcon className="w-4 h-4 text-violet-400" />
              Histórico ({fullHistory.length})
            </h3>

            <div className="flex items-center gap-1">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                title="Desfazer (Ctrl + Z)"
                className={`p-1 rounded transition-colors ${
                  canUndo ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                title="Refazer (Ctrl + Y)"
                className={`p-1 rounded transition-colors ${
                  canRedo ? 'text-gray-300 hover:text-white hover:bg-white/10' : 'text-gray-600 cursor-not-allowed'
                }`}
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {fullHistory.map((item, idx) => {
              const isCurrent = idx === historyIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => restoreSnapshot(idx)}
                  className={`px-2.5 py-1 rounded text-xs flex items-center justify-between cursor-pointer transition-colors ${
                    isCurrent
                      ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 font-bold'
                      : 'bg-black/40 text-gray-400 hover:bg-white/5'
                  }`}
                >
                  <span className="truncate max-w-[140px]">{item.description}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{item.timestamp}</span>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
};
