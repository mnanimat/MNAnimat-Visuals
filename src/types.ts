export type AppMode =
  | 'painting'
  | 'vector'
  | '3d_render'
  | 'animation2d'
  | 'image_editor'
  | 'presentation'
  | 'document'
  | 'spreadsheet'
  | 'video';

export interface FloatingWindow {
  id: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  content: 'tools' | 'layers' | 'color_picker' | 'inspector' | 'timeline' | 'preview';
}

export type UnitType = 'px' | 'mm' | 'cm' | 'in';

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
  blendMode: GlobalCompositeOperation;
  canvas: HTMLCanvasElement;
}

export interface HistoryItem {
  id: string;
  description: string;
  timestamp: string;
  thumbnailUrl?: string;
}

export type BrushCategory =
  | 'fundamentais'
  | 'metal'
  | 'natureza'
  | 'cabelo'
  | 'madeira'
  | 'vidro'
  | 'pele'
  | 'cenario';

export type BrushType =
  // Fundamentais
  | 'pencil'
  | 'ink'
  | 'watercolor'
  | 'airbrush'
  | 'oil'
  | 'chalk'
  | 'gouache'
  // Metal
  | 'metal_sheen'
  | 'metal_brushed'
  | 'metal_chrome'
  // Natureza
  | 'nature_foliage'
  | 'nature_moss'
  | 'nature_bark'
  | 'nature_grass'
  // Cabelo
  | 'hair_strands'
  | 'hair_fur'
  | 'hair_shine'
  // Madeira
  | 'wood_grain'
  | 'wood_weathered'
  // Vidro
  | 'glass_refract'
  | 'glass_caustics'
  | 'glass_glaze'
  // Pele Humana
  | 'skin_pores'
  | 'skin_subsurface'
  | 'skin_freckles'
  | 'skin_blender'
  // Cenário
  | 'environment_clouds'
  | 'environment_stone'
  | 'environment_water'
  | 'environment_dust';

export interface BrushConfig {
  type: BrushType;
  category: BrushCategory;
  name: string;
  size: number;
  minSizePercent: number;
  opacity: number;
  flow: number; // 0.05 to 1.0
  hardness: number; // 0 to 1
  scatter: number; // 0 to 1
  textureGrain: number; // 0 to 1
  usePressureSize: boolean;
  usePressureOpacity: boolean;
  usePressure?: boolean;
  color: string;
  texturePattern?: string;
}

export interface VectorShape {
  id: string;
  type: 'rect' | 'circle' | 'line' | 'pen' | 'dimension' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  points?: {
    x: number;
    y: number;
    curveType?: 'linear' | 'bezier';
    cp1x?: number;
    cp1y?: number;
    cp2x?: number;
    cp2y?: number;
  }[];
  text?: string;
  unit: UnitType;
  label?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'video';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  borderRadius?: number;
}

export interface Slide {
  id: string;
  title: string;
  background: string;
  elements: SlideElement[];
  notes?: string;
}

export interface VideoClip {
  id: string;
  name: string;
  start: number; // in seconds
  duration: number; // in seconds
  type: 'video' | 'audio' | 'text';
  color: string;
  content?: string;
}

export interface VideoTrack {
  id: string;
  name: string;
  type: 'video' | 'audio' | 'text';
  clips: VideoClip[];
}

export interface SceneLight {
  id: string;
  name: string;
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color: string;
  intensity: number;
  position: [number, number, number];
  enabled: boolean;
  castShadow?: boolean;
  distance?: number;
  decay?: number;
  angle?: number;
  penumbra?: number;
}

export interface ThreeObject {
  id: string;
  name: string;
  type:
    | 'cube'
    | 'sphere'
    | 'cylinder'
    | 'torus'
    | 'plane'
    | 'cone'
    | 'pyramid'
    | 'character_dummy'
    | 'character_head'
    | 'helmet'
    | 'tree'
    | 'rock'
    | 'pillar'
    | 'chest'
    | 'wall'
    | 'light_dir'
    | 'light_point';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  roughness: number;
  metalness: number;
  emissive?: string;
  emissiveIntensity?: number;
  wireframe: boolean;
  category?: 'basicos' | 'personagem' | 'cenario';
  visible?: boolean;
}

export interface CloudStorageConfig {
  provider: 'google_drive' | 'cloudflare_r2';
  connected: boolean;
  userEmail?: string;
  lastSyncTime?: string;
  autoSync: boolean;
  r2Bucket?: string;
  r2AccountId?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatar: string;
  role: string;
  currentMode: AppMode;
  activeTool: string;
  cursor?: { x: number; y: number };
}

export interface ShortcutItem {
  key: string;
  description: string;
  category: 'Geral' | 'Pintura' | 'Vetores' | '3D Render' | 'Animação 2D' | 'Imagem' | 'Apresentação' | 'Documentos' | 'Vídeo' | 'Planilhas';
}

export interface SpreadsheetCell {
  raw: string;
  formatted?: string;
  computed?: string | number;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  bg?: string;
  color?: string;
  format?: 'text' | 'currency' | 'percent' | 'number';
}

export interface SpreadsheetData {
  [cellId: string]: SpreadsheetCell; // e.g., 'A1', 'B2'
}

export interface DashboardChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  dataKeyX: string;
  dataKeyY: string;
  data: Array<Record<string, string | number>>;
}

