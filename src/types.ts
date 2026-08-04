export type AppMode = 'painting' | 'vector' | '3d_render' | 'presentation' | 'document' | 'video';

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
  points?: { x: number; y: number }[];
  text?: string;
  unit: UnitType;
  label?: string;
}

export interface SlideElement {
  id: string;
  type: 'text' | 'image' | 'shape';
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

export interface ThreeObject {
  id: string;
  name: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'torus' | 'plane' | 'light_dir' | 'light_point';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  roughness: number;
  metalness: number;
  wireframe: boolean;
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
  category: 'Geral' | 'Pintura' | 'Vetores' | '3D Render' | 'Apresentação' | 'Documentos' | 'Vídeo';
}
