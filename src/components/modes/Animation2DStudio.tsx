import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Trash2,
  Copy,
  Download,
  Layers as LayersIcon,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
  FolderPlus,
  Paintbrush,
  Eraser,
  Pipette,
  PaintBucket,
  Slash,
  Square,
  Circle as CircleIcon,
  SlidersHorizontal,
  Scissors,
  Lock,
  Unlock,
  Check,
  Edit2,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Sparkle,
  Image as ImageIcon,
  ChevronLeft,
} from 'lucide-react';
import { drawBrushStroke, Point } from '../../utils/brushEngine';
import { BrushConfig, BrushType, BrushCategory } from '../../types';
import { ALL_BRUSH_PRESETS, BRUSH_CATEGORIES, BrushPresetItem } from './PaintingStudio';

export interface AnimLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  blendMode: GlobalCompositeOperation;
  isMask?: boolean;
  groupId?: string;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export interface AnimGroup {
  id: string;
  name: string;
  collapsed: boolean;
  visible: boolean;
}

export interface AnimFrame {
  id: string;
  layers: AnimLayer[];
  groups: AnimGroup[];
  elements: Array<{ id: string; x: number; y: number; radius: number; color: string }>;
}

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;

// Helper function: Create blank layer canvas
const createNewLayerCanvas = (width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  return { canvas, ctx };
};

// Helper function: Duplicate existing layer canvas
const duplicateLayerCanvas = (sourceCanvas: HTMLCanvasElement): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
  const canvas = document.createElement('canvas');
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(sourceCanvas, 0, 0);
  return { canvas, ctx };
};

// Flood fill algorithm for Paint Bucket
const floodFill = (
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  fillColorHex: string,
  width: number,
  height: number
) => {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const startXInt = Math.floor(startX);
  const startYInt = Math.floor(startY);
  const startPos = (startYInt * width + startXInt) * 4;

  const startR = data[startPos];
  const startG = data[startPos + 1];
  const startB = data[startPos + 2];
  const startA = data[startPos + 3];

  let c = fillColorHex.replace('#', '');
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const fillR = parseInt(c.substring(0, 2), 16) || 0;
  const fillG = parseInt(c.substring(2, 4), 16) || 0;
  const fillB = parseInt(c.substring(4, 6), 16) || 0;

  if (startR === fillR && startG === fillG && startB === fillB && startA === 255) return;

  const pixelStack: [number, number][] = [[startXInt, startYInt]];

  const matchStartColor = (pos: number) => {
    return (
      Math.abs(data[pos] - startR) < 35 &&
      Math.abs(data[pos + 1] - startG) < 35 &&
      Math.abs(data[pos + 2] - startB) < 35 &&
      Math.abs(data[pos + 3] - startA) < 35
    );
  };

  const colorPixel = (pos: number) => {
    data[pos] = fillR;
    data[pos + 1] = fillG;
    data[pos + 2] = fillB;
    data[pos + 3] = 255;
  };

  while (pixelStack.length > 0) {
    const newPos = pixelStack.pop();
    if (!newPos) break;
    const [x, y] = newPos;
    let pixelPos = (y * width + x) * 4;

    let reachLeft = false;
    let reachRight = false;

    let currentY = y;
    while (currentY >= 0 && matchStartColor((currentY * width + x) * 4)) {
      currentY--;
    }
    currentY++;

    while (currentY < height && matchStartColor((currentY * width + x) * 4)) {
      pixelPos = (currentY * width + x) * 4;
      colorPixel(pixelPos);

      if (x > 0) {
        if (matchStartColor(pixelPos - 4)) {
          if (!reachLeft) {
            pixelStack.push([x - 1, currentY]);
            reachLeft = true;
          }
        } else if (reachLeft) {
          reachLeft = false;
        }
      }

      if (x < width - 1) {
        if (matchStartColor(pixelPos + 4)) {
          if (!reachRight) {
            pixelStack.push([x + 1, currentY]);
            reachRight = true;
          }
        } else if (reachRight) {
          reachRight = false;
        }
      }

      currentY++;
    }
  }

  ctx.putImageData(imgData, 0, 0);
};

export const Animation2DStudio: React.FC = () => {
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);

  // Default initial frame creation
  const createInitialFrame = (frameNum: number): AnimFrame => {
    const { canvas: bgCanvas, ctx: bgCtx } = createNewLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    bgCtx.fillStyle = '#ffffff';
    bgCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { canvas: drawCanvas, ctx: drawCtx } = createNewLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

    // Initial demo element for default frames
    const demoX = 150 + frameNum * 80;
    const demoY = 350 + Math.sin(frameNum) * 40;

    drawCtx.beginPath();
    drawCtx.arc(demoX, demoY, 35, 0, Math.PI * 2);
    drawCtx.fillStyle = '#3b82f6';
    drawCtx.fill();
    drawCtx.lineWidth = 4;
    drawCtx.strokeStyle = '#1e3a8a';
    drawCtx.stroke();

    return {
      id: `frame_${Date.now()}_${frameNum}`,
      layers: [
        {
          id: `layer_bg_${Date.now()}_${frameNum}`,
          name: 'Fundo Branco',
          visible: true,
          locked: true,
          opacity: 1,
          blendMode: 'source-over',
          canvas: bgCanvas,
          ctx: bgCtx,
        },
        {
          id: `layer_draw_${Date.now()}_${frameNum}`,
          name: 'Animação Principais',
          visible: true,
          locked: false,
          opacity: 1,
          blendMode: 'source-over',
          canvas: drawCanvas,
          ctx: drawCtx,
        },
      ],
      groups: [],
      elements: [{ id: `e_${frameNum}`, x: demoX, y: demoY, radius: 35, color: '#3b82f6' }],
    };
  };

  const [frames, setFrames] = useState<AnimFrame[]>(() => [
    createInitialFrame(0),
    createInitialFrame(1),
    createInitialFrame(2),
    createInitialFrame(3),
  ]);

  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);
  const [activeLayerId, setActiveLayerId] = useState<string>('');
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string>('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');

  // Animation Playback & Onion Skin state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(12);
  const [onionSkin, setOnionSkin] = useState<boolean>(true);
  const [showInBetweenGuide, setShowInBetweenGuide] = useState<boolean>(true);

  // Brush & Tools State
  const [activeTool, setActiveTool] = useState<'brush' | 'eraser' | 'pipette' | 'fill' | 'line' | 'rectangle' | 'circle'>('brush');
  const [activeCategory, setActiveCategory] = useState<BrushCategory>('fundamentais');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [brush, setBrush] = useState<BrushConfig>({
    type: 'ink',
    category: 'fundamentais',
    name: 'Tinta Nanquim 2D',
    size: 14,
    minSizePercent: 20,
    opacity: 1.0,
    flow: 1.0,
    hardness: 0.9,
    scatter: 0.0,
    textureGrain: 0.1,
    usePressureSize: true,
    usePressureOpacity: false,
    color: '#06b6d4',
  });

  // Pointer drawing states
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [startShapePoint, setStartShapePoint] = useState<Point | null>(null);

  // Toast notification trigger
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  }, []);

  // Ensure active layer is selected when frame changes
  useEffect(() => {
    const currentFrame = frames[activeFrameIndex];
    if (currentFrame && currentFrame.layers.length > 0) {
      const exists = currentFrame.layers.some((l) => l.id === activeLayerId);
      if (!exists) {
        // Pick top editable layer or first layer
        const editable = [...currentFrame.layers].reverse().find((l) => !l.locked) || currentFrame.layers[0];
        setActiveLayerId(editable.id);
      }
    }
  }, [activeFrameIndex, frames, activeLayerId]);

  // Composite Rendering Function for Active Frame & Onion Skinning
  const renderComposite = useCallback(() => {
    const displayCanvas = displayCanvasRef.current;
    if (!displayCanvas) return;
    const displayCtx = displayCanvas.getContext('2d');
    if (!displayCtx) return;

    displayCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    // 1. ONION SKINNING - PREVIOUS FRAME (RED / MAGENTA TINT)
    if (onionSkin && activeFrameIndex > 0) {
      const prevFrame = frames[activeFrameIndex - 1];
      if (prevFrame) {
        displayCtx.save();
        displayCtx.globalAlpha = 0.3;

        // Render previous frame layers to a temporary canvas for tinting
        const prevTemp = document.createElement('canvas');
        prevTemp.width = CANVAS_WIDTH;
        prevTemp.height = CANVAS_HEIGHT;
        const prevTempCtx = prevTemp.getContext('2d')!;

        prevFrame.layers.forEach((layer) => {
          if (layer.visible && layer.name !== 'Fundo Branco') {
            prevTempCtx.globalAlpha = layer.opacity;
            prevTempCtx.globalCompositeOperation = layer.blendMode;
            prevTempCtx.drawImage(layer.canvas, 0, 0);
          }
        });

        // Overlay Red/Magenta tint on previous frame drawings
        prevTempCtx.globalCompositeOperation = 'source-in';
        prevTempCtx.fillStyle = '#f43f5e';
        prevTempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        displayCtx.drawImage(prevTemp, 0, 0);
        displayCtx.restore();
      }
    }

    // 2. ONION SKINNING - NEXT FRAME (GREEN / CYAN TINT)
    if (onionSkin && activeFrameIndex < frames.length - 1) {
      const nextFrame = frames[activeFrameIndex + 1];
      if (nextFrame) {
        displayCtx.save();
        displayCtx.globalAlpha = 0.3;

        const nextTemp = document.createElement('canvas');
        nextTemp.width = CANVAS_WIDTH;
        nextTemp.height = CANVAS_HEIGHT;
        const nextTempCtx = nextTemp.getContext('2d')!;

        nextFrame.layers.forEach((layer) => {
          if (layer.visible && layer.name !== 'Fundo Branco') {
            nextTempCtx.globalAlpha = layer.opacity;
            nextTempCtx.globalCompositeOperation = layer.blendMode;
            nextTempCtx.drawImage(layer.canvas, 0, 0);
          }
        });

        nextTempCtx.globalCompositeOperation = 'source-in';
        nextTempCtx.fillStyle = '#10b981';
        nextTempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        displayCtx.drawImage(nextTemp, 0, 0);
        displayCtx.restore();
      }
    }

    // 3. CURRENT FRAME REAL-TIME LAYERS
    currentFrame.layers.forEach((layer, idx) => {
      if (!layer.visible) return;

      displayCtx.save();
      displayCtx.globalAlpha = layer.opacity;

      if (layer.isMask && idx > 0) {
        displayCtx.globalCompositeOperation = 'source-in';
      } else {
        displayCtx.globalCompositeOperation = layer.blendMode;
      }

      displayCtx.drawImage(layer.canvas, 0, 0);
      displayCtx.restore();
    });

    // 4. MOTION TRAJECTORY GUIDES
    if (showInBetweenGuide && activeFrameIndex > 0 && activeFrameIndex < frames.length - 1) {
      const prevFrame = frames[activeFrameIndex - 1];
      const nextFrame = frames[activeFrameIndex + 1];

      if (prevFrame.elements.length > 0 && nextFrame.elements.length > 0) {
        displayCtx.save();
        displayCtx.strokeStyle = '#fbbf24';
        displayCtx.lineWidth = 2;
        displayCtx.setLineDash([4, 4]);

        prevFrame.elements.forEach((pEl, i) => {
          const nEl = nextFrame.elements[i];
          if (nEl) {
            displayCtx.beginPath();
            displayCtx.moveTo(pEl.x, pEl.y);
            displayCtx.lineTo(nEl.x, nEl.y);
            displayCtx.stroke();

            // Midpoint target arc circle
            const midX = (pEl.x + nEl.x) / 2;
            const midY = (pEl.y + nEl.y) / 2;
            displayCtx.beginPath();
            displayCtx.arc(midX, midY, pEl.radius || 25, 0, Math.PI * 2);
            displayCtx.strokeStyle = '#f59e0b';
            displayCtx.stroke();
          }
        });
        displayCtx.restore();
      }
    }
  }, [activeFrameIndex, frames, onionSkin, showInBetweenGuide]);

  useEffect(() => {
    renderComposite();
  }, [renderComposite]);

  // Animation Playback Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveFrameIndex((prev) => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fps, frames.length]);

  // Coordinates helper for stylus / mouse
  const getCanvasCoordinates = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const pressure = e.pressure && e.pressure > 0 ? e.pressure : 0.6;

    return { x, y, pressure };
  };

  // Layer Operations for Active Frame
  const addLayer = useCallback(() => {
    setFrames((prevFrames) => {
      const updated = [...prevFrames];
      const frame = { ...updated[activeFrameIndex] };
      const { canvas, ctx } = createNewLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
      const newId = `layer_${Date.now()}`;
      const newLayer: AnimLayer = {
        id: newId,
        name: `Camada ${frame.layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'source-over',
        canvas,
        ctx,
      };

      frame.layers = [...frame.layers, newLayer];
      updated[activeFrameIndex] = frame;
      setActiveLayerId(newId);
      return updated;
    });
    showToast('Nova Camada Criada (Shift+N)');
  }, [activeFrameIndex, showToast]);

  const duplicateLayer = useCallback((idToDuplicate?: string) => {
    setFrames((prevFrames) => {
      const updated = [...prevFrames];
      const frame = { ...updated[activeFrameIndex] };
      const targetId = idToDuplicate || activeLayerId;
      const targetLayer = frame.layers.find((l) => l.id === targetId);
      if (!targetLayer) return prevFrames;

      const { canvas: newCanvas, ctx: newCtx } = duplicateLayerCanvas(targetLayer.canvas);
      const newId = `layer_${Date.now()}`;
      const newLayer: AnimLayer = {
        id: newId,
        name: `${targetLayer.name} (Cópia)`,
        visible: targetLayer.visible,
        locked: targetLayer.locked,
        opacity: targetLayer.opacity,
        blendMode: targetLayer.blendMode,
        isMask: targetLayer.isMask,
        groupId: targetLayer.groupId,
        canvas: newCanvas,
        ctx: newCtx,
      };

      const targetIndex = frame.layers.findIndex((l) => l.id === targetId);
      const updatedLayers = [...frame.layers];
      updatedLayers.splice(targetIndex + 1, 0, newLayer);

      frame.layers = updatedLayers;
      updated[activeFrameIndex] = frame;
      setActiveLayerId(newId);
      return updated;
    });
    showToast('Camada Duplicada! (Ctrl+J / Shift+D)');
  }, [activeFrameIndex, activeLayerId, showToast]);

  const createGroup = useCallback(() => {
    setFrames((prevFrames) => {
      const updated = [...prevFrames];
      const frame = { ...updated[activeFrameIndex] };
      const newGroupId = `group_${Date.now()}`;
      const newGroup: AnimGroup = {
        id: newGroupId,
        name: `Grupo ${frame.groups.length + 1}`,
        collapsed: false,
        visible: true,
      };

      frame.groups = [...frame.groups, newGroup];

      if (activeLayerId) {
        frame.layers = frame.layers.map((l) =>
          l.id === activeLayerId ? { ...l, groupId: newGroupId } : l
        );
      }

      updated[activeFrameIndex] = frame;
      return updated;
    });
    showToast('Novo Grupo Criado! (Ctrl+G / Shift+G)');
  }, [activeFrameIndex, activeLayerId, showToast]);

  const deleteActiveLayer = useCallback(() => {
    setFrames((prevFrames) => {
      const updated = [...prevFrames];
      const frame = { ...updated[activeFrameIndex] };
      if (frame.layers.length <= 1) return prevFrames;

      const filtered = frame.layers.filter((l) => l.id !== activeLayerId);
      frame.layers = filtered;
      updated[activeFrameIndex] = frame;
      if (filtered.length > 0) {
        setActiveLayerId(filtered[filtered.length - 1].id);
      }
      return updated;
    });
    showToast('Camada Excluída (Shift+Delete)');
  }, [activeFrameIndex, activeLayerId, showToast]);

  const toggleLayerMask = (id: string) => {
    setFrames((prev) => {
      const updated = [...prev];
      const frame = { ...updated[activeFrameIndex] };
      frame.layers = frame.layers.map((l) => (l.id === id ? { ...l, isMask: !l.isMask } : l));
      updated[activeFrameIndex] = frame;
      return updated;
    });
    showToast('Máscara de Recorte Alternada (Alt+M)');
  };

  const toggleLayerVisibility = (id: string) => {
    setFrames((prev) => {
      const updated = [...prev];
      const frame = { ...updated[activeFrameIndex] };
      frame.layers = frame.layers.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l));
      updated[activeFrameIndex] = frame;
      return updated;
    });
  };

  const toggleLayerLock = (id: string) => {
    setFrames((prev) => {
      const updated = [...prev];
      const frame = { ...updated[activeFrameIndex] };
      frame.layers = frame.layers.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l));
      updated[activeFrameIndex] = frame;
      return updated;
    });
  };

  const setLayerOpacity = (id: string, opacity: number) => {
    setFrames((prev) => {
      const updated = [...prev];
      const frame = { ...updated[activeFrameIndex] };
      frame.layers = frame.layers.map((l) => (l.id === id ? { ...l, opacity } : l));
      updated[activeFrameIndex] = frame;
      return updated;
    });
  };

  const setLayerBlendMode = (id: string, blendMode: GlobalCompositeOperation) => {
    setFrames((prev) => {
      const updated = [...prev];
      const frame = { ...updated[activeFrameIndex] };
      frame.layers = frame.layers.map((l) => (l.id === id ? { ...l, blendMode } : l));
      updated[activeFrameIndex] = frame;
      return updated;
    });
  };

  const setLayerGroup = (layerId: string, groupId?: string) => {
    setFrames((prev) => {
      const updated = [...prev];
      const frame = { ...updated[activeFrameIndex] };
      frame.layers = frame.layers.map((l) => (l.id === layerId ? { ...l, groupId } : l));
      updated[activeFrameIndex] = frame;
      return updated;
    });
  };

  // Keyboard Shortcuts Handler for Animation 2D Studio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === ',' || e.key === '<') {
        e.preventDefault();
        setActiveFrameIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === '.' || e.key === '>') {
        e.preventDefault();
        setActiveFrameIndex((prev) => Math.min(frames.length - 1, prev + 1));
      } else if (e.key.toLowerCase() === 'b') {
        setActiveTool('brush');
        showToast('Ferramenta: Pincel (B)');
      } else if (e.key.toLowerCase() === 'e') {
        setActiveTool('eraser');
        showToast('Ferramenta: Borracha (E)');
      } else if (e.key.toLowerCase() === 'i') {
        setActiveTool('pipette');
        showToast('Ferramenta: Conta-gotas (I)');
      } else if (e.key.toLowerCase() === 'f') {
        setActiveTool('fill');
        showToast('Ferramenta: Preenchimento (F)');
      } else if (e.key.toLowerCase() === 'l') {
        setActiveTool('line');
        showToast('Ferramenta: Linha Reta (L)');
      } else if (e.key.toLowerCase() === 'r') {
        setActiveTool('rectangle');
        showToast('Ferramenta: Retângulo (R)');
      } else if (e.key.toLowerCase() === 'o') {
        setOnionSkin((prev) => !prev);
        showToast('Papel Transparente (Onion Skin)');
      } else if ((isCtrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'n') || (e.shiftKey && e.key.toLowerCase() === 'n')) {
        e.preventDefault();
        addLayer();
      } else if (
        (isCtrlOrCmd && e.key.toLowerCase() === 'j') ||
        (e.shiftKey && e.key.toLowerCase() === 'd')
      ) {
        e.preventDefault();
        duplicateLayer();
      } else if (
        (isCtrlOrCmd && e.key.toLowerCase() === 'g') ||
        (e.shiftKey && e.key.toLowerCase() === 'g')
      ) {
        e.preventDefault();
        createGroup();
      } else if ((isCtrlOrCmd && e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) || (e.shiftKey && e.key === 'Delete')) {
        e.preventDefault();
        deleteActiveLayer();
      } else if ((isCtrlOrCmd && e.altKey && e.key.toLowerCase() === 'm') || (e.altKey && e.key.toLowerCase() === 'm')) {
        e.preventDefault();
        if (activeLayerId) {
          toggleLayerMask(activeLayerId);
        }
      } else if (e.key === '[' || e.key === '-') {
        e.preventDefault();
        setBrush((prev) => ({ ...prev, size: Math.max(1, prev.size - 2) }));
      } else if (e.key === ']' || e.key === '=' || e.key === '+') {
        e.preventDefault();
        setBrush((prev) => ({ ...prev, size: Math.min(200, prev.size + 2) }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addLayer, duplicateLayer, createGroup, deleteActiveLayer, activeLayerId, frames.length, showToast]);

  // Pointer Canvas Drawing Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    const activeLayer = currentFrame.layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) {
      if (activeLayer?.locked) showToast('Camada bloqueada para edição!');
      return;
    }

    const pt = getCanvasCoordinates(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setLastPoint(pt);
    setStartShapePoint(pt);

    if (activeTool === 'pipette') {
      const displayCanvas = displayCanvasRef.current;
      if (displayCanvas) {
        const displayCtx = displayCanvas.getContext('2d');
        if (displayCtx) {
          const pixel = displayCtx.getImageData(Math.floor(pt.x), Math.floor(pt.y), 1, 1).data;
          const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
          setBrush((prev) => ({ ...prev, color: hex }));
          showToast(`Cor capturada: ${hex}`);
          setActiveTool('brush');
        }
      }
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'fill') {
      floodFill(activeLayer.ctx, pt.x, pt.y, brush.color, CANVAS_WIDTH, CANVAS_HEIGHT);
      renderComposite();
      setIsDrawing(false);
      return;
    }

    if (activeTool === 'brush' || activeTool === 'eraser') {
      const effectiveBrush: BrushConfig =
        activeTool === 'eraser'
          ? { ...brush, color: '#ffffff', type: 'ink', opacity: 1.0, flow: 1.0 }
          : brush;

      drawBrushStroke(activeLayer.ctx, pt, pt, effectiveBrush);
      renderComposite();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPoint) return;

    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    const activeLayer = currentFrame.layers.find((l) => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) return;

    const pt = getCanvasCoordinates(e);

    if (activeTool === 'brush' || activeTool === 'eraser') {
      const effectiveBrush: BrushConfig =
        activeTool === 'eraser'
          ? { ...brush, color: '#ffffff', type: 'ink', opacity: 1.0, flow: 1.0 }
          : brush;

      drawBrushStroke(activeLayer.ctx, lastPoint, pt, effectiveBrush);
      setLastPoint(pt);
      renderComposite();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const currentFrame = frames[activeFrameIndex];
    const activeLayer = currentFrame?.layers.find((l) => l.id === activeLayerId);

    if (activeLayer && startShapePoint && activeLayer.visible && !activeLayer.locked) {
      const endPt = getCanvasCoordinates(e);
      const ctx = activeLayer.ctx;

      ctx.save();
      ctx.strokeStyle = brush.color;
      ctx.fillStyle = brush.color;
      ctx.lineWidth = brush.size;
      ctx.lineCap = 'round';

      if (activeTool === 'line') {
        ctx.beginPath();
        ctx.moveTo(startShapePoint.x, startShapePoint.y);
        ctx.lineTo(endPt.x, endPt.y);
        ctx.stroke();
      } else if (activeTool === 'rectangle') {
        const w = endPt.x - startShapePoint.x;
        const h = endPt.y - startShapePoint.y;
        ctx.strokeRect(startShapePoint.x, startShapePoint.y, w, h);
      } else if (activeTool === 'circle') {
        const radius = Math.hypot(endPt.x - startShapePoint.x, endPt.y - startShapePoint.y);
        ctx.beginPath();
        ctx.arc(startShapePoint.x, startShapePoint.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
      renderComposite();
    }

    setIsDrawing(false);
    setLastPoint(null);
    setStartShapePoint(null);
  };

  // Select brush preset
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
    showToast(`Pincel: ${preset.name}`);
  };

  // Timeline Keyframe Operations
  const handleAddFrame = () => {
    const newFrame = createInitialFrame(frames.length);
    const updated = [...frames];
    updated.splice(activeFrameIndex + 1, 0, newFrame);
    setFrames(updated);
    setActiveFrameIndex(activeFrameIndex + 1);
    showToast('Novo Quadro Adicionado na Timeline');
  };

  const handleDuplicateFrame = () => {
    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    // Deep duplicate all layers and canvases
    const duplicatedLayers: AnimLayer[] = currentFrame.layers.map((l) => {
      const { canvas, ctx } = duplicateLayerCanvas(l.canvas);
      return {
        ...l,
        id: `layer_dup_${Date.now()}_${Math.random()}`,
        canvas,
        ctx,
      };
    });

    const duplicatedGroups: AnimGroup[] = currentFrame.groups.map((g) => ({
      ...g,
      id: `group_dup_${Date.now()}_${Math.random()}`,
    }));

    const newFrame: AnimFrame = {
      id: `frame_dup_${Date.now()}`,
      layers: duplicatedLayers,
      groups: duplicatedGroups,
      elements: [...currentFrame.elements],
    };

    const updated = [...frames];
    updated.splice(activeFrameIndex + 1, 0, newFrame);
    setFrames(updated);
    setActiveFrameIndex(activeFrameIndex + 1);
    showToast('Quadro Inteiro Duplicado com Sucesso!');
  };

  const handleDeleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    const updated = frames.filter((_, i) => i !== index);
    setFrames(updated);
    if (activeFrameIndex >= updated.length) {
      setActiveFrameIndex(updated.length - 1);
    }
    showToast('Quadro Removido');
  };

  const handleClearFrameCanvas = () => {
    const currentFrame = frames[activeFrameIndex];
    if (!currentFrame) return;

    currentFrame.layers.forEach((layer) => {
      if (!layer.locked) {
        layer.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        if (layer.name === 'Fundo Branco') {
          layer.ctx.fillStyle = '#ffffff';
          layer.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        }
      }
    });
    renderComposite();
    showToast('Desenho do Quadro Limpo');
  };

  // In-between generator: interpolates between active frame and next frame
  const handleGenerateInBetweenFrame = () => {
    if (activeFrameIndex >= frames.length - 1) return;

    const currFrame = frames[activeFrameIndex];
    const nextFrame = frames[activeFrameIndex + 1];

    const newFrameLayers: AnimLayer[] = currFrame.layers.map((l, i) => {
      const nextL = nextFrame.layers[i] || l;
      const { canvas, ctx } = createNewLayerCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

      if (l.name === 'Fundo Branco') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      } else {
        // Blend half opacity from current and next
        ctx.globalAlpha = 0.5;
        ctx.drawImage(l.canvas, 0, 0);
        ctx.drawImage(nextL.canvas, 0, 0);
      }

      return {
        ...l,
        id: `layer_inbetween_${Date.now()}_${i}`,
        canvas,
        ctx,
      };
    });

    const newInBetweenFrame: AnimFrame = {
      id: `frame_inbetween_${Date.now()}`,
      layers: newFrameLayers,
      groups: [...currFrame.groups],
      elements: currFrame.elements.map((el, i) => {
        const nextEl = nextFrame.elements[i] || el;
        return {
          id: `e_inbetween_${Date.now()}_${i}`,
          x: (el.x + nextEl.x) / 2,
          y: (el.y + nextEl.y) / 2,
          radius: (el.radius + nextEl.radius) / 2,
          color: el.color,
        };
      }),
    };

    const updated = [...frames];
    updated.splice(activeFrameIndex + 1, 0, newInBetweenFrame);
    setFrames(updated);
    setActiveFrameIndex(activeFrameIndex + 1);
    showToast('Quadro Intermediário (In-Between) Gerado!');
  };

  // Export current frame image
  const handleExportPNG = () => {
    const canvas = displayCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `animacao_frame_${activeFrameIndex + 1}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Frame Exportado em PNG!');
  };

  const currentFrame = frames[activeFrameIndex];
  const activeLayer = currentFrame?.layers.find((l) => l.id === activeLayerId);

  return (
    <div className="flex-1 flex flex-col bg-[#0b0f19] text-slate-100 overflow-hidden select-none relative">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-full shadow-2xl border border-indigo-400 animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Animation Header Toolbar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              Estúdio de Animação 2D
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                Pincéis & Camadas
              </span>
            </h2>
            <p className="text-[10px] text-slate-400">Pintura Digital, Grupos de Camadas, Keyframes e Onion Skinning</p>
          </div>
        </div>

        {/* Primary Drawing Tool Selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTool('brush')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all ${
              activeTool === 'brush' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Pincel de Pintura (B)"
          >
            <Paintbrush className="w-4 h-4" />
            <span className="hidden sm:inline">Pincel</span>
          </button>

          <button
            onClick={() => setActiveTool('eraser')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all ${
              activeTool === 'eraser' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Borracha (E)"
          >
            <Eraser className="w-4 h-4" />
            <span className="hidden sm:inline">Borracha</span>
          </button>

          <button
            onClick={() => setActiveTool('fill')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all ${
              activeTool === 'fill' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Balde de Preenchimento (F)"
          >
            <PaintBucket className="w-4 h-4" />
            <span className="hidden sm:inline">Balde</span>
          </button>

          <button
            onClick={() => setActiveTool('line')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all ${
              activeTool === 'line' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Linha Reta (L)"
          >
            <Slash className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('rectangle')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all ${
              activeTool === 'rectangle' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Retângulo / Forma (R)"
          >
            <Square className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('circle')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all ${
              activeTool === 'circle' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Círculo"
          >
            <CircleIcon className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTool('pipette')}
            className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition-all ${
              activeTool === 'pipette' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Conta-gotas (I)"
          >
            <Pipette className="w-4 h-4" />
          </button>

          {/* Color Picker Swatch */}
          <div className="flex items-center gap-1 px-1 border-l border-slate-800 ml-1">
            <input
              type="color"
              value={brush.color}
              onChange={(e) => setBrush({ ...brush, color: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
              title="Cor do Pincel / Preenchimento"
            />
          </div>
        </div>

        {/* Playback & Onion Skinning Toolbar Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveFrameIndex(0)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Primeiro Frame"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold rounded-lg shadow flex items-center gap-1.5 text-xs transition-all"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pausar' : 'Reproduzir'}</span>
          </button>
          <button
            onClick={() => setActiveFrameIndex(frames.length - 1)}
            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
            title="Último Frame"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
            <span className="text-slate-400">FPS:</span>
            <select
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="bg-transparent text-cyan-400 font-bold focus:outline-none"
            >
              <option value="6">6 FPS</option>
              <option value="12">12 FPS (Padrão 2D)</option>
              <option value="24">24 FPS (Cinematográfico)</option>
              <option value="30">30 FPS</option>
            </select>
          </div>

          <button
            onClick={() => setOnionSkin(!onionSkin)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all ${
              onionSkin
                ? 'bg-cyan-950/60 border-cyan-800 text-cyan-300 shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Papel Transparente: Quadro anterior (Vermelho) e próximo (Verde)"
          >
            {onionSkin ? <Eye className="w-4 h-4 text-cyan-400" /> : <EyeOff className="w-4 h-4" />}
            <span className="hidden md:inline">Onion Skin (O)</span>
          </button>

          <button
            onClick={handleGenerateInBetweenFrame}
            disabled={activeFrameIndex >= frames.length - 1}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Gerar frame intermediário interpolado entre este e o próximo"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden md:inline">Intermediário</span>
          </button>

          <button
            onClick={handleExportPNG}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            title="Exportar Frame em PNG"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Studio Middle Layout (Canvas + Brush Presets + Layers Sidebar) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Brush Presets Panel */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col p-3 divide-y divide-slate-800 shrink-0 overflow-y-auto hidden lg:flex">
          <div className="pb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Pincéis & Texturas</span>
              <span className="text-[10px] text-cyan-400 font-mono">{brush.size}px</span>
            </h3>

            {/* Brush Size Slider */}
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Tamanho do Pincel:</span>
                <span className="font-mono text-cyan-400 font-bold">{brush.size}px</span>
              </div>
              <input
                type="range"
                min="1"
                max="150"
                value={brush.size}
                onChange={(e) => setBrush({ ...brush, size: Number(e.target.value) })}
                className="w-full accent-indigo-500"
              />
            </div>

            {/* Category Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 mb-3">
              {BRUSH_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-1.5 rounded text-center transition-all ${
                    activeCategory === cat.id
                      ? 'bg-indigo-600 text-white font-bold shadow'
                      : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                  }`}
                  title={cat.name}
                >
                  <span className="text-xs">{cat.icon}</span>
                </button>
              ))}
            </div>

            {/* Brush Presets List */}
            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {ALL_BRUSH_PRESETS.filter((p) => p.category === activeCategory).map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => selectPreset(preset)}
                  className={`w-full p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                    brush.name === preset.name
                      ? 'bg-indigo-950/80 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="text-base shrink-0">{preset.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate">{preset.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Drawing Canvas Workspace */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 bg-[#07090e] relative overflow-hidden">
          <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-white">
            <canvas
              ref={displayCanvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`w-[840px] h-[560px] max-w-full max-h-[60vh] object-contain touch-none cursor-crosshair ${
                activeTool === 'pipette' ? 'cursor-copy' : ''
              }`}
            />
          </div>
        </main>

        {/* Right Sidebar: Animated Layer & Group Management */}
        <aside className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col p-3 shrink-0 overflow-y-auto">
          {/* LAYER MANAGEMENT PANEL HEADER */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <LayersIcon className="w-4 h-4 text-cyan-400" />
              Camadas ({currentFrame?.layers.length || 0})
            </h3>

            {/* Quick Layer Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={addLayer}
                title="Nova Camada (Atalho: Shift + N)"
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg shadow transition-all flex items-center gap-1 text-[11px] font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova</span>
              </button>

              <button
                onClick={() => duplicateLayer()}
                title="Duplicar Camada Ativa (Atalho: Ctrl + J / Shift + D)"
                className="px-2 py-1 bg-slate-800 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 rounded-lg transition-all flex items-center gap-1 text-[11px] font-bold border border-slate-700"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicar</span>
              </button>

              <button
                onClick={createGroup}
                title="Criar Novo Grupo / Agrupar Camadas (Atalho: Ctrl + G / Shift + G)"
                className="p-1.5 bg-slate-800 hover:bg-indigo-950 hover:text-indigo-300 text-slate-300 rounded-lg transition-all border border-slate-700"
              >
                <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
              </button>

              <button
                onClick={deleteActiveLayer}
                title="Excluir Camada Ativa (Atalho: Shift + Delete)"
                className="p-1.5 bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 rounded-lg transition-all border border-slate-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Groups & Layers Hierarchy List */}
          <div className="flex-1 space-y-2 overflow-y-auto pr-1">
            {/* Render Groups First */}
            {currentFrame?.groups.map((group) => {
              const groupLayers = currentFrame.layers.filter((l) => l.groupId === group.id);
              return (
                <div key={group.id} className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-slate-900/80 p-2 flex items-center justify-between text-xs font-bold text-slate-200">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <button
                        onClick={() => {
                          setFrames((prev) => {
                            const updated = [...prev];
                            const frame = { ...updated[activeFrameIndex] };
                            frame.groups = frame.groups.map((g) =>
                              g.id === group.id ? { ...g, collapsed: !g.collapsed } : g
                            );
                            updated[activeFrameIndex] = frame;
                            return updated;
                          });
                        }}
                        className="p-0.5 text-slate-400 hover:text-white"
                      >
                        {group.collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                      <FolderPlus className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{group.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({groupLayers.length})</span>
                    </div>

                    <button
                      onClick={() => {
                        setFrames((prev) => {
                          const updated = [...prev];
                          const frame = { ...updated[activeFrameIndex] };
                          frame.groups = frame.groups.filter((g) => g.id !== group.id);
                          frame.layers = frame.layers.map((l) => (l.groupId === group.id ? { ...l, groupId: undefined } : l));
                          updated[activeFrameIndex] = frame;
                          return updated;
                        });
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Desagrupar Pasta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Grouped Nested Layers */}
                  {!group.collapsed && (
                    <div className="p-1.5 space-y-1 bg-slate-950/60">
                      {groupLayers.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic text-center py-1">Grupo vazio</p>
                      ) : (
                        groupLayers.map((layer) => {
                          const isActive = layer.id === activeLayerId;
                          return (
                            <div
                              key={layer.id}
                              onClick={() => setActiveLayerId(layer.id)}
                              className={`p-2 rounded-lg border text-xs flex flex-col gap-1 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-indigo-950/90 border-cyan-400 text-white shadow'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold truncate flex-1 mr-1">{layer.name}</span>
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      duplicateLayer(layer.id);
                                    }}
                                    title="Duplicar esta Camada (Ctrl+J / Shift+D)"
                                    className="p-1 text-slate-400 hover:text-cyan-300"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleLayerVisibility(layer.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-white"
                                  >
                                    {layer.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Render Ungrouped Layers */}
            {currentFrame?.layers
              .filter((l) => !l.groupId)
              .map((layer) => {
                const isActive = layer.id === activeLayerId;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setActiveLayerId(layer.id)}
                    className={`p-2.5 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-950/80 border-cyan-400 shadow-md ring-1 ring-cyan-400/20'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 mr-1">
                        <span className="text-xs font-bold text-slate-200 truncate">{layer.name}</span>
                        {layer.isMask && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold shrink-0">
                            Máscara
                          </span>
                        )}
                        {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateLayer(layer.id);
                          }}
                          title="Duplicar esta Camada (Ctrl+J / Shift+D)"
                          className="p-1 text-slate-400 hover:text-cyan-300 transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerMask(layer.id);
                          }}
                          title={layer.isMask ? 'Remover Máscara (Alt+M)' : 'Ativar Máscara (Alt+M)'}
                          className={`p-1 transition-colors ${layer.isMask ? 'text-purple-400 bg-purple-950/60 rounded' : 'text-slate-500 hover:text-purple-300'}`}
                        >
                          <Scissors className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerLock(layer.id);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title={layer.locked ? 'Desbloquear' : 'Bloquear'}
                        >
                          {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLayerVisibility(layer.id);
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          {layer.visible ? <Eye className="w-3.5 h-3.5 text-emerald-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                        </button>
                      </div>
                    </div>

                    {/* Active Layer Opacity & Options */}
                    {isActive && (
                      <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-800/80 text-[11px]">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Opacidade:</span>
                          <span className="font-mono text-cyan-400 font-bold">{Math.round(layer.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={layer.opacity}
                          onChange={(e) => setLayerOpacity(layer.id, Number(e.target.value))}
                          className="w-full accent-indigo-500 h-1 bg-slate-800 rounded"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </aside>
      </div>

      {/* Bottom Keyframe Timeline */}
      <footer className="h-32 bg-slate-900 border-t border-slate-800 p-3 flex flex-col gap-2 shrink-0">
        <div className="flex items-center justify-between text-xs font-bold text-slate-300">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-cyan-400" />
            <span>Timeline de Quadros / Keyframes ({frames.length} frames)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearFrameCanvas}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700"
              title="Limpar desenho do frame ativo"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Frame</span>
            </button>

            <button
              onClick={handleDuplicateFrame}
              className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-700 text-indigo-300 text-xs font-bold flex items-center gap-1 shadow"
              title="Duplicar todo o quadro com camadas"
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Duplicar Quadro</span>
            </button>

            <button
              onClick={handleAddFrame}
              className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Quadro</span>
            </button>
          </div>
        </div>

        {/* Keyframe Strips */}
        <div className="flex-1 flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
          {frames.map((frame, idx) => {
            const isActive = idx === activeFrameIndex;
            return (
              <div
                key={frame.id}
                onClick={() => setActiveFrameIndex(idx)}
                className={`relative flex flex-col items-center justify-between p-2 min-w-[90px] h-18 rounded-xl border-2 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-950/80 border-cyan-400 shadow-lg shadow-cyan-500/20 scale-105'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>#{idx + 1}</span>
                  {isActive && <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                </div>

                <div className="flex items-center justify-center gap-1 text-[10px] text-slate-400 font-mono">
                  <span>{frame.layers.length} cam</span>
                </div>

                {frames.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFrame(idx);
                    }}
                    className="absolute top-1 right-1 p-0.5 hover:bg-rose-600/80 text-slate-500 hover:text-white rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
