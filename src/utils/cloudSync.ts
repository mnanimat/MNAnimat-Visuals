import { CloudStorageConfig } from '../types';

const STORAGE_KEY_CONFIG = 'aether_cloud_config';
const STORAGE_KEY_PROJECTS = 'aether_saved_projects';

export function getInitialCloudConfig(): CloudStorageConfig {
  const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    provider: 'google_drive',
    connected: false,
    autoSync: true,
    userEmail: 'dev.creator@gmail.com',
    lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
}

export function saveCloudConfig(config: CloudStorageConfig) {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}

export interface SavedProject {
  id: string;
  name: string;
  type: string;
  updatedAt: string;
  sizeKb: number;
  syncedToCloud: boolean;
  cloudProvider?: string;
  data: any;
}

export function getLocalProjects(): SavedProject[] {
  const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  // Default sample projects
  return [
    {
      id: 'proj_1',
      name: 'Apresentação Corporativa Q3 2026',
      type: 'Apresentação',
      updatedAt: 'Hoje às 09:42',
      sizeKb: 2450,
      syncedToCloud: true,
      cloudProvider: 'Google Drive',
      data: {},
    },
    {
      id: 'proj_2',
      name: 'Pintura Digital - Ilustração Conceitual',
      type: 'Pintura Digital',
      updatedAt: 'Ontem às 18:15',
      sizeKb: 14800,
      syncedToCloud: true,
      cloudProvider: 'Cloudflare R2',
      data: {},
    },
    {
      id: 'proj_3',
      name: 'Planta Técnica Peça Mecânica v2.svg',
      type: 'Vetor de Precisão',
      updatedAt: '30/07/2026',
      sizeKb: 680,
      syncedToCloud: false,
      data: {},
    },
  ];
}

export function saveProjectLocal(project: SavedProject): SavedProject[] {
  const projects = getLocalProjects();
  const existingIndex = projects.findIndex((p) => p.id === project.id);
  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.unshift(project);
  }
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  return projects;
}
